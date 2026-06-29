import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { translateSupabaseError } from '@/lib/authUtils';
import { useAuthService } from '@/hooks/useAuthService';
import { logAuditAction } from '@/lib/adminUtils';
import { logError } from '@/lib/errorLogger';
import { withTimeout, withRetry } from '@/lib/promiseUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const authService = useAuthService(user, toast);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  
  const setUserSafe = useCallback((newUser) => {
    setUser(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newUser)) return prev;
      return newUser;
    });
  }, []);

  const logout = useCallback(async (options = {}) => {
    const { showToast = false, title, description } = options;
    
    if (user?.id) {
       logAuditAction(user.id, 'LOGOUT', 'auth', null, { reason: title || 'User initiated' }).catch(console.error);
    }

    setIsLoading(true);
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Erreur de déconnexion Supabase:', error);
        logError(error, { context: 'Logout' });
    }
    
    setUser(null);
    setSession(null);
    setIsLoading(false);

    if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
    }
    
    if (showToast) {
        toast({
            title: title || "Session Expirée",
            description: description || "Veuillez vous reconnecter pour continuer.",
        });
    }
  }, [navigate, toast, user]);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
        let attempts = 0;
        let profile = null;
        let profileError = null;

        while (attempts < 3 && !profile) {
             const result = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
             
             if (!result.error) {
                 profile = result.data;
             } else if (result.error.code === 'PGRST116') {
                 break;
             } else {
                 profileError = result.error;
                 attempts++;
                 await new Promise(r => setTimeout(r, 500 * attempts));
             }
        }

        // Profil inexistant (nouvel utilisateur Google/OAuth) → créer automatiquement
        if (!profile) {
            const meta = authUser.user_metadata || {};
            const newProfile = {
                id: authUser.id,
                full_name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Utilisateur',
                avatar_url: meta.avatar_url || meta.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.full_name || 'U')}&background=2EB565&color=fff&size=150`,
                role: 'viewer',
            };
            const { data: created, error: createError } = await supabase
                .from('profiles')
                .upsert(newProfile, { onConflict: 'id' })
                .select('*')
                .single();
            if (!createError && created) profile = created;
        }

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erreur de récupération du profil:', profileError);
            logError(profileError, { context: 'fetchUserProfile', userId: authUser.id });
        }

        return {
            ...authUser,
            ...profile,
            role: profile?.role || 'viewer'
        };
    } catch (e) {
        console.error("Exception fetching profile:", e);
        logError(e, { context: 'fetchUserProfile Exception', userId: authUser.id });
        return authUser;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety valve: never spin forever — force-unlock after 12 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 12000);

    const updateUserSession = async (newSession) => {
        if (!mounted) return;
        clearTimeout(safetyTimer);
        setSession(newSession);
        if (newSession?.user) {
            const fullUser = await fetchUserProfile(newSession.user);
            if (mounted) {
                setUserSafe(fullUser);
            }
        } else {
            if (mounted) setUser(null);
        }
        if (mounted) setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
        if (error) {
             console.error("Error getting initial session:", error);
             logError(error, { context: 'getSession' });
        }
        if (initialSession) {
             updateUserSession(initialSession);
        } else {
            // OAuth callback: tokens are in the URL — wait for onAuthStateChange
            const oauthInUrl = window.location.hash.includes('access_token') ||
                               window.location.search.includes('code=');
            if (!oauthInUrl && mounted) setIsLoading(false);
        }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log(`[Auth Context] onAuthStateChange event: ${event}`, newSession?.user?.id);

        if (event === 'SIGNED_IN' && newSession === null) return;

        if (event === 'TOKEN_REFRESHED') {
          if (newSession === null) {
            // Vérifier si une session existe quand même avant de déconnecter
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession) {
              await logout({ showToast: false });
            }
            // Si session existe, on laisse continuer normalement
            return;
          }
        }

        if (event === 'SIGNED_OUT') {
          setIsLoading(true);
        }
        if (event === 'SIGNED_IN') {
          setIsLoading(true);
        }
        
        await updateUserSession(newSession);

        if (event === 'SIGNED_IN') {
            closeAuthModal();
        }
        
        // Critical: Handle password recovery event triggered by hash in URL
        if (event === 'PASSWORD_RECOVERY') {
          console.log('[Auth Context] Password recovery session established, navigating to reset form');
          closeAuthModal();
          navigate('/reset-password');
        }
        
        if (event === 'USER_DELETED') {
            setUser(null);
            setSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserProfile, navigate, logout, setUserSafe]);

  useEffect(() => {
    let presenceInterval;
    if (user?.id) {
      const updatePresence = async () => {
        if (document.visibilityState === 'visible') {
          try {
            await supabase.rpc('update_user_presence');
          } catch (e) {
             // Silently fail
          }
        }
      };
      
      updatePresence();
      presenceInterval = setInterval(updatePresence, 60000); 
    }
    
    return () => {
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, [user?.id]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                navigate('/confirmation-required', { state: { email } });
                throw new Error(translateSupabaseError({message: 'Email not confirmed'}));
            }
            throw new Error(translateSupabaseError(error));
        }
        return data;
    } catch(err) {
        logError(err, { context: 'login', email });
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    const { email, password, name, phone, location } = userData;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
            location: location,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2EB565&color=fff&size=150`,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw new Error(translateSupabaseError(error, 'inscription'));

      if (data.user && !data.user.email_confirmed_at) {
         toast({
            title: "Compte créé avec succès !",
            description: "Un e-mail de confirmation a été envoyé à votre adresse.",
            className: "toast-success",
          });
      }

      closeAuthModal();
      navigate('/confirmation-required', { state: { email } });
      return data;
      
    } catch (err) {
      logError(err, { context: 'register', email });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    setIsLoading(true);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            setIsLoading(false);
            throw new Error(translateSupabaseError(error));
        }
        // No setIsLoading(false) here — page is navigating to Google
    } catch(err) {
        setIsLoading(false);
        logError(err, { context: 'signInWithProvider', provider });
        throw err;
    }
  };

  const resetPassword = async (email) => {
    console.log(`[Auth Context] Initiating password reset for: ${email}`);
    const redirectUrl = `${window.location.origin}/reset-password`;
    console.log(`[Auth Context] Reset redirect URL: ${redirectUrl}`);
    
    try {
        // Use withRetry and withTimeout to handle network flakiness and rate limits
        const resetAction = async () => {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            if (error) throw error;
            return data;
        };

        const data = await withRetry(() => withTimeout(resetAction(), 30000), 2, 2000);
        console.log(`[Auth Context] Password reset email sent successfully`);
        return data;
        
    } catch(err) {
        console.error(`[Auth Context] Password reset failed:`, err);
        logError(err, { context: 'resetPassword', email, redirectUrl });
        throw new Error(translateSupabaseError(err, 'réinitialisation du mot de passe'));
    }
  };

  const updatePassword = async (newPassword) => {
      console.log(`[Auth Context] Attempting to update password`);
      setIsLoading(true);
      try {
          const updateAction = async () => {
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
          };

          await withRetry(() => withTimeout(updateAction(), 30000), 2, 2000);
          console.log(`[Auth Context] Password successfully updated`);
          
      } catch (err) {
          console.error(`[Auth Context] Update password failed:`, err);
          logError(err, { context: 'updatePassword' });
          throw new Error(translateSupabaseError(err, 'mise à jour du mot de passe'));
      } finally {
          setIsLoading(false);
      }
  };

  const deleteAccount = async () => {
    try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw new Error("Une erreur s'est produite lors de la suppression de votre compte.");
        await logout();
    } catch(err) {
        logError(err, { context: 'deleteAccount', userId: user?.id });
        throw err;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    signInWithProvider,
    deleteAccount,
    ...authService,
    isAuthenticated: !!user,
    isAdmin: !!user?.user_metadata?.is_admin || user?.role === 'admin',
    userRole: user?.role || 'viewer',
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};