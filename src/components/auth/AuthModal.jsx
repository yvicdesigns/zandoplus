import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from 'react-router-dom';
import GoogleIcon from '@/components/auth/GoogleIcon';
import AuthFormInput from './AuthFormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { validateEmail, validatePhone, validatePasswordStrength, sanitizeInput } from '@/lib/validationUtils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, signInWithProvider, resetPassword } = useAuth();
  const { siteSettings } = useSiteSettings();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [activeTab, setActiveTab]         = useState('login');
  const [showPassword, setShowPassword]   = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '', location: '', honeypot: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '', name: '', phone: '', location: '', honeypot: '' });
    setTermsAccepted(false);
    setError('');
    setShowPassword(false);
    setShowEmailForm(false);
    setActiveTab('login');
  }, []);

  useEffect(() => {
    if (!isOpen) setTimeout(resetForm, 300);
  }, [isOpen, resetForm]);

  const handleTabChange = (tab) => {
    setError('');
    setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateLogin = () => {
    if (!validateEmail(formData.email)) { setError("Adresse e-mail invalide."); return false; }
    if (!formData.password)             { setError("Le mot de passe est requis."); return false; }
    return true;
  };

  const validateRegistration = () => {
    if (!validateEmail(formData.email))                  { setError("Adresse e-mail invalide."); return false; }
    if (!validatePhone(formData.phone))                  { setError("Numéro de téléphone invalide."); return false; }
    if (!validatePasswordStrength(formData.password))    { setError("Mot de passe trop faible (8+ car., maj., min., chiffre, symbole)."); return false; }
    if (formData.name.length < 2)                        { setError("Le nom est trop court."); return false; }
    if (formData.location.length < 2)                    { setError("La localisation est requise."); return false; }
    return true;
  };

  const handleSubmit = async (e, action, type) => {
    e.preventDefault();
    if (formData.honeypot) return;
    if (type === 'login'    && !validateLogin())        return;
    if (type === 'register' && !validateRegistration()) return;

    setLoading(true);
    setError('');
    const safeData = {
      ...formData,
      name:     sanitizeInput(formData.name),
      location: sanitizeInput(formData.location),
      phone:    sanitizeInput(formData.phone),
    };
    try {
      if (type === 'login') {
        await action(safeData.email, safeData.password);
      } else {
        await action(safeData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (email, password) => {
    await login(email, password);
    toast({ title: "Connexion réussie !", description: "Bienvenue sur Zando+ Congo.", className: "toast-success" });
    if (onClose) onClose();
  };

  const onRegister = async (data) => {
    await register(data);
    if (onClose) onClose();
  };

  const handlePasswordReset = async () => {
    if (!formData.email)              { setError("Entrez votre e-mail pour réinitialiser le mot de passe."); return; }
    if (!validateEmail(formData.email)) { setError("Adresse e-mail invalide."); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(formData.email);
      toast({ title: "E-mail envoyé", description: "Si un compte existe, vous recevrez les instructions." });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithProvider('google');
      // Sur web (PWA) : la page navigue vers Google → le finally s'exécute brièvement avant navigation
      // Sur Custom Tab / Capacitor : signInWithProvider retourne immédiatement après avoir lancé l'OAuth
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Toujours reset — évite le bouton bloqué sur "Connexion..." au retour
    }
  };

  const ErrorBox = ({ msg }) => msg ? (
    <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-red-50 p-3 rounded-lg flex items-center text-red-700 text-sm gap-2">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{msg}</span>
    </motion.div>
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 bg-white rounded-2xl shadow-2xl overflow-hidden border-0">
        <AnimatePresence mode="wait">

          {/* ── ÉCRAN PRINCIPAL : social + e-mail ── */}
          {!showEmailForm && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  {siteSettings?.logo_url ? (
                    <img src={siteSettings.logo_url} alt="Zando+" className="h-12 w-auto object-contain" />
                  ) : (
                    <span className="text-3xl font-bold gradient-text">Zando+</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Bienvenue sur Zando+</h2>
                <p className="text-sm text-gray-500 mt-1">Le marché en ligne du Congo</p>
              </div>

              {/* Google — bouton primaire */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-3 mb-3 cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                {loading ? 'Connexion...' : 'Continuer avec Google'}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* E-mail — bouton secondaire */}
              <Button
                type="button"
                onClick={() => setShowEmailForm(true)}
                disabled={loading}
                className="w-full h-12 gradient-bg rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-3 cursor-pointer"
              >
                <Mail className="w-5 h-5" />
                Continuer avec e-mail
              </Button>

              {error && <ErrorBox msg={error} />}

              {/* Terms */}
              <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
                En continuant, vous acceptez nos{' '}
                <Link to="/terms" target="_blank" className="underline text-gray-500 hover:text-gray-700">
                  Conditions d'utilisation
                </Link>{' '}
                et notre{' '}
                <Link to="/privacy" target="_blank" className="underline text-gray-500 hover:text-gray-700">
                  Politique de confidentialité
                </Link>.
              </p>
            </motion.div>
          )}

          {/* ── ÉCRAN E-MAIL : connexion / inscription ── */}
          {showEmailForm && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8"
            >
              {/* Back button */}
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setError(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6">
                  <TabsTrigger value="login"    className="data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-custom-green-600 rounded-lg font-semibold">Connexion</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-custom-green-600 rounded-lg font-semibold">S'inscrire</TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => handleSubmit(e, onLogin, 'login')} className="space-y-4">
                    <AuthFormInput type="email" name="email" placeholder="Adresse e-mail" value={formData.email} onChange={handleInputChange} icon={Mail} required />
                    <AuthFormInput type={showPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(p => !p)} required />
                    <div className="hidden"><Input name="honeypot" value={formData.honeypot} onChange={handleInputChange} tabIndex="-1" autoComplete="off" /></div>
                    <ErrorBox msg={error} />
                    <Button type="submit" className="w-full h-11 gradient-bg rounded-xl font-semibold" disabled={loading}>
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    <div className="text-center">
                      <button type="button" onClick={handlePasswordReset} className="text-xs text-custom-green-500 hover:text-custom-green-600" disabled={loading}>
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </motion.form>
                </TabsContent>

                {/* REGISTER */}
                <TabsContent value="register">
                  <motion.form key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => handleSubmit(e, onRegister, 'register')} className="space-y-3">
                    <AuthFormInput type="text"  name="name"     placeholder="Nom complet"           value={formData.name}     onChange={handleInputChange} icon={User}   required />
                    <AuthFormInput type="tel"   name="phone"    placeholder="Numéro de téléphone"   value={formData.phone}    onChange={handleInputChange} icon={Phone}  required />
                    <AuthFormInput type="text"  name="location" placeholder="Ville / Quartier"      value={formData.location} onChange={handleInputChange} icon={MapPin} required />
                    <AuthFormInput type="email" name="email"    placeholder="Adresse e-mail"        value={formData.email}    onChange={handleInputChange} icon={Mail}   required />
                    <div>
                      <AuthFormInput type={showPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(p => !p)} required />
                      <p className="text-[11px] text-gray-400 px-1 mt-1">8+ car. · majuscule · chiffre · symbole</p>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} className="mt-0.5" />
                      <Label htmlFor="terms" className="text-xs font-normal text-gray-600 leading-relaxed cursor-pointer">
                        J'accepte les{' '}
                        <Link to="/terms" target="_blank" className="underline font-semibold text-custom-green-600">Conditions</Link>
                        {' '}et la{' '}
                        <Link to="/privacy" target="_blank" className="underline font-semibold text-custom-green-600">Confidentialité</Link>
                      </Label>
                    </div>
                    <div className="hidden"><Input name="honeypot" value={formData.honeypot} onChange={handleInputChange} tabIndex="-1" autoComplete="off" /></div>
                    <ErrorBox msg={error} />
                    <Button type="submit" className="w-full h-11 gradient-bg rounded-xl font-semibold" disabled={loading || !termsAccepted}>
                      {loading ? 'Création...' : 'Créer mon compte'}
                    </Button>
                  </motion.form>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
