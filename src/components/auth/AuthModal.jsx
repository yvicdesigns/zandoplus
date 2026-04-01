import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from 'react-router-dom';
import SocialLoginButtons from './SocialLoginButtons';
import AuthFormInput from './AuthFormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { validateEmail, validatePhone, validatePasswordStrength, sanitizeInput } from '@/lib/validationUtils';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, signInWithProvider, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '', location: '', honeypot: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '', name: '', phone: '', location: '', honeypot: '' });
    setTermsAccepted(false);
    setError('');
    setShowPassword(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  }, [isOpen, resetForm]);
  
  const handleTabChange = (newTab) => {
      resetForm();
      setActiveTab(newTab);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if(error) setError('');
  };

  const validateLogin = () => {
    if (!validateEmail(formData.email)) {
      setError("Adresse e-mail invalide.");
      return false;
    }
    if (!formData.password) {
      setError("Le mot de passe est requis.");
      return false;
    }
    return true;
  };

  const validateRegistration = () => {
    if (!validateEmail(formData.email)) {
      setError("Adresse e-mail invalide.");
      return false;
    }
    if (!validatePhone(formData.phone)) {
      setError("Numéro de téléphone invalide.");
      return false;
    }
    if (!validatePasswordStrength(formData.password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, dont majuscule, minuscule, chiffre et caractère spécial.");
      return false;
    }
    if (formData.name.length < 2) {
      setError("Le nom est trop court.");
      return false;
    }
    if (formData.location.length < 2) {
      setError("La localisation est requise.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e, action, type) => {
    e.preventDefault();
    if (formData.honeypot) return;
    
    if (type === 'login' && !validateLogin()) return;
    if (type === 'register' && !validateRegistration()) return;

    setLoading(true);
    setError('');
    
    // Sanitize before sending
    const safeData = {
        ...formData,
        name: sanitizeInput(formData.name),
        location: sanitizeInput(formData.location),
        phone: sanitizeInput(formData.phone)
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
    toast({ title: "Connexion réussie !", description: "Bienvenue de retour sur Zando+ Congo.", className: "toast-success" });
    if (onClose) onClose();
  };

  const onRegister = async (data) => {
    await register(data);
    if (onClose) onClose();
  };
  
  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError("Veuillez entrer votre adresse e-mail pour réinitialiser le mot de passe.");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(formData.email);
      toast({ title: "Email de réinitialisation envoyé", description: "Si un compte existe, vous recevrez des instructions." });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 bg-white rounded-xl shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-center text-3xl font-bold gradient-text">Bienvenue sur Zando+</DialogTitle>
          <DialogDescription className="text-center text-gray-500">Connectez-vous ou créez un compte.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-custom-green-50 p-1">
            <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-custom-green-600 data-[state=active]:shadow-md rounded-md">Connexion</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-custom-green-600 data-[state=active]:shadow-md rounded-md">S'inscrire</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => handleSubmit(e, onLogin, 'login')} className="space-y-5 mt-6">
              <AuthFormInput type="email" name="email" placeholder="Adresse e-mail" value={formData.email} onChange={handleInputChange} icon={Mail} required />
              <AuthFormInput type={showPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} required />
              <div className="hidden"><Input name="honeypot" value={formData.honeypot} onChange={handleInputChange} tabIndex="-1" autoComplete="off" /></div>
              {error && <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="bg-red-50 p-3 rounded-lg flex items-center text-red-700 text-sm"><AlertTriangle className="w-5 h-5 mr-2" /><span>{error}</span></motion.div>}
              <Button type="submit" className="w-full gradient-bg" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</Button>
              <div className="text-center"><button type="button" onClick={handlePasswordReset} className="text-sm text-custom-green-500 hover:text-custom-green-600" disabled={loading}>{loading ? "Envoi..." : "Mot de passe oublié ?"}</button></div>
              <SocialLoginButtons onSocialLogin={signInWithProvider} loading={loading} />
            </motion.form>
          </TabsContent>
          
          <TabsContent value="register">
            <motion.form key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => handleSubmit(e, onRegister, 'register')} className="space-y-5 mt-6">
              <AuthFormInput type="text" name="name" placeholder="Nom complet" value={formData.name} onChange={handleInputChange} icon={User} required />
              <AuthFormInput type="tel" name="phone" placeholder="Numéro de téléphone" value={formData.phone} onChange={handleInputChange} icon={Phone} required />
              <AuthFormInput type="text" name="location" placeholder="Localisation" value={formData.location} onChange={handleInputChange} icon={MapPin} required />
              <AuthFormInput type="email" name="email" placeholder="Adresse e-mail" value={formData.email} onChange={handleInputChange} icon={Mail} required />
              <div>
                <AuthFormInput type={showPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} required />
                <p className="text-xs text-gray-500 px-2 mt-1.5">Doit contenir des majuscules, minuscules, chiffres et symboles.</p>
              </div>
              <div className="items-top flex space-x-2">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal text-gray-600"
                  >
                    J'ai lu et j'accepte les{" "}
                    <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-custom-green-600 hover:text-custom-green-700">
                      Termes et Conditions
                    </Link>
                    .
                  </Label>
                </div>
              </div>
              <div className="hidden"><Input name="honeypot" value={formData.honeypot} onChange={handleInputChange} tabIndex="-1" autoComplete="off" /></div>
              {error && <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="bg-red-50 p-3 rounded-lg flex items-center text-red-700 text-sm"><AlertTriangle className="w-5 h-5 mr-2" /><span>{error}</span></motion.div>}
              <Button type="submit" className="w-full gradient-bg" disabled={loading || !termsAccepted}>{loading ? 'Création...' : 'Créer un compte'}</Button>
              <SocialLoginButtons onSocialLogin={signInWithProvider} loading={loading} />
            </motion.form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;