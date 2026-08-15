import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
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
  const [profileReady, setProfileReady] = useState(false);
  // True while a PKCE/OAuth exchange is in progress (?code= or #access_token= was in the URL).
  // Prevents the header from flashing "Se connecter" if the safety timer fires before the exchange
  // completes. Clears when getSession() resolves (exchange done, success or failure).
  const [isOAuthPending, setIsOAuthPending] = useState(
    () => window.location.hash.includes('access_token') || window.location.search.includes('code=')
  );
  const userRef = useRef(null); // ref pour accéder à user courant dans les closures d'effets
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const authService = useAuthService(user, toast);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  
  const setUserSafe = useCallback((newUser) => {
    userRef.current = newUser;
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

    // Safety valve: sliding 8s window — resets on each updateUserSession call.
    // Clears BOTH isLoading and isOAuthPending so AuthCallbackPage can navigate
    // even if getSession() hangs (e.g. Supabase API timeout on slow networks).
    let safetyTimer = setTimeout(() => { if (mounted) { setIsLoading(false); setIsOAuthPending(false); } }, 8000);
    const resetSafety = () => {
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => { if (mounted) { setIsLoading(false); setIsOAuthPending(false); } }, 8000);
    };

    const updateUserSession = async (newSession) => {
        if (!mounted) return;
        resetSafety();
        setSession(newSession);
        if (newSession?.user) {
            // Same user already in memory — clear loading flags immediately but still
            // re-fetch the profile in background to pick up role/profile changes.
            if (userRef.current?.id === newSession.user.id) {
                if (mounted) { setIsLoading(false); clearTimeout(safetyTimer); }
                fetchUserProfile(newSession.user).then(fullUser => {
                    if (mounted) { setUserSafe(fullUser); setProfileReady(true); }
                }).catch(() => { if (mounted) setProfileReady(true); });
                return;
            }
            // Timeout guard: if fetchUserProfile hangs (Supabase reinitialization post-OAuth),
            // fall back to base auth user after 5s so isLoading clears and UI unblocks.
            // The profile fetch continues in background and updates state when it resolves.
            const profileFetch = fetchUserProfile(newSession.user);
            const fullUser = await Promise.race([
                profileFetch,
                new Promise(resolve => setTimeout(() => resolve(newSession.user), 5000))
            ]);
            if (mounted) { setUserSafe(fullUser); setIsLoading(false); setProfileReady(true); clearTimeout(safetyTimer); }
            profileFetch.then(fullProfile => {
                if (mounted && fullProfile?.id) setUserSafe(fullProfile);
            }).catch(() => {});
        } else {
            if (mounted) setUserSafe(null); // resets userRef so re-login re-fetches profile
            if (mounted) { setIsLoading(false); setProfileReady(true); clearTimeout(safetyTimer); }
        }
    };

    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (mounted) setIsOAuthPending(false); // Exchange completed (success or failure)
        if (error) {
          console.error("Error getting initial session:", error);
          logError(error, { context: 'getSession' });
          if (mounted) setIsLoading(false);
          return;
        }
        if (initialSession) {
          updateUserSession(initialSession);
        } else {
          // No session (exchange failed or user not logged in) — unblock immediately.
          // isOAuthPending is already cleared above; clearing isLoading lets
          // AuthCallbackPage navigate home without waiting for the 8s safety timer.
          if (mounted) setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("getSession rejection:", err);
        if (mounted) { setIsOAuthPending(false); setIsLoading(false); }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log(`[Auth Context] onAuthStateChange event: ${event}`, newSession?.user?.id);

        if (event === 'SIGNED_IN' && newSession === null) return;

        // TOKEN_REFRESHED with null is transient (network blip) — never force-logout here.
        // Supabase will retry automatically; let SIGNED_OUT handle intentional logouts.
        if (event === 'TOKEN_REFRESHED' && newSession === null) return;

        // Ne pas remettre isLoading à true pour SIGNED_IN — la page vient de recharger
        // (OAuth redirige toujours vers un rechargement complet, isLoading démarre à true)
        // Pour SIGNED_OUT seulement, on réinitialise proprement
        if (event === 'SIGNED_OUT') {
          setUserSafe(null); // also resets userRef.current so visibilitychange can re-check
          setSession(null);
          setIsLoading(false);
          clearTimeout(safetyTimer);
          return;
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

    // Quand l'app revient au premier plan (Custom Tab OAuth, onglet PWA, Capacitor),
    // on vérifie si une session est apparue pendant qu'on était en arrière-plan.
    // On ne refetch le profil que si l'utilisateur n'est pas encore reconnu.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !mounted) return;
      if (userRef.current) return; // Déjà connecté — pas besoin de re-vérifier
      const { data: { session: latestSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (latestSession && mounted) await updateUserSession(latestSession);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sur mobile, le navigateur peut restaurer la page depuis le bfcache (back-forward cache)
    // au lieu de la recharger après OAuth. Dans ce cas, React ne se réinitialise pas,
    // mais on peut détecter le retour via pageshow et refetch la session.
    const handlePageShow = async (event) => {
      if (!event.persisted || !mounted) return;
      if (userRef.current) return;
      const { data: { session: latestSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (latestSession && mounted) await updateUserSession(latestSession);
    };
    window.addEventListener('pageshow', handlePageShow);

    // iOS Capacitor native: OAuth redirects to com.zando.app://login?code=...
    // (PKCE flow — see customSupabaseClient.js flowType: 'pkce'). iOS routes the
    // custom scheme back to the app, firing appUrlOpen; the code_verifier saved
    // before leaving the app is still in storage since the app never reloaded,
    // so exchangeCodeForSession can complete the flow using just the auth code.
    let appUrlOpenHandle = null;
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('com.zando.app://') || !mounted) return;
        const code = new URL(url).searchParams.get('code');
        if (!code || !mounted) return;
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.session && mounted) await updateUserSession(data.session);
        else if (error) logError(error, { context: 'appUrlOpen exchangeCodeForSession' });
      }).then(handle => { appUrlOpenHandle = handle; });
    }

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      appUrlOpenHandle?.remove();
    };
  // NOTE: `logout` intentionally omitted from deps — it's not used inside this effect.
  // Including it caused the effect to re-run on every user change (logout depends on user),
  // which set mounted=false mid-flight and silently skipped setIsOAuthPending(false).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfile, navigate, setUserSafe]);

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw new Error(translateSupabaseError(error, 'inscription'));

      // Supabase retourne succès avec identities vides si l'email existe déjà (non confirmé)
      if (!data.user?.identities?.length) {
        throw new Error("Un compte existe déjà avec cet e-mail. Vérifiez votre boîte mail ou connectez-vous.");
      }

      toast({
        title: "Compte créé avec succès !",
        description: "Un e-mail de confirmation a été envoyé à votre adresse.",
        className: "toast-success",
      });

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
    // iOS native Capacitor: redirect to custom URL scheme so iOS routes it back to the app.
    // Web/PWA: dedicated /auth/callback page handles the PKCE code exchange explicitly,
    //   which is more reliable than relying on Supabase's auto-detection on mobile browsers.
    const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    const redirectTo = isIOSNative
      ? 'com.zando.app://login'
      : `${window.location.origin}/auth/callback`;
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo },
        });
        if (error) throw new Error(translateSupabaseError(error));
    } catch(err) {
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

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const fullUser = await fetchUserProfile(session.user);
    setUserSafe(fullUser);
  }, [session, fetchUserProfile]);

  const value = {
    user,
    session,
    isLoading,
    isOAuthPending,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    signInWithProvider,
    deleteAccount,
    refreshProfile,
    ...authService,
    isAuthenticated: !!user,
    profileReady,
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