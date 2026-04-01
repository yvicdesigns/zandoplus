import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  RefreshCw, 
  MessageCircle, 
  Info,
  Settings,
  ArrowLeft
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const RESEND_COOLDOWN = 30; // 30 seconds cooldown

const ResetPasswordPage = () => {
  const { updatePassword, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewState, setViewState] = useState('checking'); 
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      try {
        if (!location.hash) {
            setViewState('request');
            return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!session) {
          setViewState('request');
          toast({ 
            title: "Lien invalide", 
            description: "Le lien est invalide ou expiré. Veuillez demander un nouveau lien.", 
            variant: "destructive" 
          });
        } else {
          setViewState('update');
        }
      } catch (err) {
        setViewState('request');
      }
    };

    verifySession();
  }, [location.hash, toast]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestReset = async (e, isRetry = false) => {
    if (e) e.preventDefault();
    if (!email) {
        setRequestError("Veuillez entrer une adresse e-mail.");
        return;
    }

    if (!isRetry && countdown > 0) {
        toast({ title: "Veuillez patienter", description: `Vous pourrez réessayer dans ${countdown} secondes.` });
        return;
    }

    setIsSending(true);
    setRequestError(null);

    try {
        // Call the new dedicated Edge Function which connects to Resend directly
        const { data, error } = await supabase.functions.invoke('send-password-recovery-email', {
          body: { 
            email, 
            redirectTo: `${window.location.origin}/reset-password`
          }
        });

        if (error) {
           throw new Error(error.message || "Erreur de connexion au serveur");
        }

        if (!data?.success) {
           throw new Error(data?.error || "Une erreur est survenue lors de l'envoi de l'e-mail.");
        }

        setViewState('sent');
        setCountdown(RESEND_COOLDOWN);
        toast({
            title: "Check your email for password recovery instructions",
            description: "Un lien de réinitialisation sécurisé vous a été envoyé.",
            className: "bg-custom-green-500 text-white"
        });

    } catch (err) {
        console.error("Reset request failed:", err);
        setRequestError(err.message || "Impossible d'envoyer l'e-mail de réinitialisation.");
        setCountdown(RESEND_COOLDOWN); 
    } finally {
        setIsSending(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdateError('');

    if (newPassword.length < 8) {
      setUpdateError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setUpdateError("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setIsUpdating(true);
    try {
      await updatePassword(newPassword);
      setUpdateSuccess(true);
      toast({
        title: "Mot de passe réinitialisé !",
        description: "Votre mot de passe a été changé avec succès.",
        className: "bg-custom-green-500 text-white"
      });

      setTimeout(async () => {
         await logout({ showToast: false });
         navigate('/', { replace: true });
      }, 3000);

    } catch (err) {
      setUpdateError(err.message || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (viewState === 'checking') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500 mb-4" />
        <p className="text-gray-600">Vérification sécurisée...</p>
      </div>
    );
  }

  if (viewState === 'request' || viewState === 'sent') {
      return (
        <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-t-4 border-custom-green-500">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-custom-green-100 p-4 rounded-full w-fit mb-4">
                        {viewState === 'sent' ? <CheckCircle2 className="w-10 h-10 text-custom-green-600" /> : <Mail className="w-10 h-10 text-custom-green-600" />}
                    </div>
                    <CardTitle className="text-2xl font-bold">Réinitialiser le mot de passe</CardTitle>
                    <CardDescription>
                        {viewState === 'sent' 
                            ? "Statut de livraison : En attente. Veuillez consulter votre boîte de réception." 
                            : "Entrez votre adresse e-mail pour recevoir un lien sécurisé."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {viewState === 'request' && (
                        <form onSubmit={(e) => handleRequestReset(e, false)} className="space-y-4">
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-medium">Adresse e-mail</label>
                                <Input 
                                    id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="vous@exemple.com" required disabled={isSending}
                                    className="text-gray-900 bg-white"
                                />
                            </div>
                            
                            {requestError && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start text-red-800 text-sm">
                                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
                                    <span>{requestError}</span>
                                </motion.div>
                            )}

                            <Button type="submit" className="w-full gradient-bg hover:opacity-90" disabled={isSending || countdown > 0}>
                                {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</> : (countdown > 0 ? `Réessayer dans ${formatTime(countdown)}` : 'Envoyer le lien')}
                            </Button>
                            
                            <div className="mt-4 text-center">
                                <Link to="/" className="inline-flex items-center text-sm font-medium text-custom-green-600 hover:text-custom-green-700">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la page de connexion
                                </Link>
                            </div>
                        </form>
                    )}

                    {viewState === 'sent' && (
                        <div className="space-y-6 text-center">
                            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-gray-700">
                                <p className="mb-2">Le lien expire dans <strong>24 heures</strong>.</p>
                                <p>Temps estimé de réception : ~1-3 minutes.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => handleRequestReset(null, true)} 
                                    disabled={countdown > 0 || isSending}
                                    className="w-full"
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    {countdown > 0 ? `Renvoyer l'e-mail (${formatTime(countdown)})` : 'Renvoyer l\'e-mail'}
                                </Button>
                                
                                <Link to="/">
                                  <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
                                      <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
                                  </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
          </motion.div>
        </div>
      );
  }

  if (updateSuccess) {
     return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
         <Card className="w-full max-w-md shadow-lg border-t-4 border-custom-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto bg-custom-green-100 p-4 rounded-full w-fit mb-4">
                  <CheckCircle2 className="w-10 h-10 text-custom-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-custom-green-700">Succès !</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-6">
                 Votre mot de passe a été mis à jour de manière sécurisée. Vous allez être redirigé...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-custom-green-500 mx-auto" />
            </CardContent>
         </Card>
      </div>
     )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-t-4 border-custom-green-500">
          <form onSubmit={handleUpdatePassword}>
            <CardHeader className="text-center">
                <div className="mx-auto bg-custom-green-100 p-4 rounded-full w-fit mb-4">
                    <KeyRound className="w-10 h-10 text-custom-green-600" />
                </div>
              <CardTitle className="text-2xl font-bold">Nouveau mot de passe</CardTitle>
              <CardDescription>Choisissez un mot de passe fort pour sécuriser votre compte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="newPassword" className="text-sm font-medium">Nouveau mot de passe</label>
                <Input 
                  id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••" disabled={isUpdating} required className="text-gray-900 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</label>
                <Input 
                  id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" disabled={isUpdating} required className="text-gray-900 bg-white"
                />
              </div>
              {updateError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start text-red-700 text-sm"
                >
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{updateError}</span>
                </motion.div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gradient-bg hover:opacity-90" disabled={isUpdating || !newPassword || !confirmPassword}>
                {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mise à jour...</> : 'Mettre à jour le mot de passe'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;