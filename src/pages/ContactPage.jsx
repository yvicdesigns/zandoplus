import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { sanitizeInput, validateEmail } from '@/lib/validationUtils';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '', honeypot: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -30 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8,
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    if (validationError) setValidationError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setValidationError('Tous les champs sont requis.');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setValidationError('Adresse e-mail invalide.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.honeypot) return;
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Sanitize
    const safeData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message)
    };

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: safeData,
      });

      if (error) throw error;
      if(data.error) throw new Error(data.error);

      toast({
        title: 'Message Envoyé !',
        description: "Merci de nous avoir contactés. Nous vous répondrons dès que possible.",
      });
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur s'est produite lors de l'envoi de votre message.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contactez-nous - Zando+ Congo</title>
        <meta name="description" content="Contactez l'équipe de Zando+ Congo pour toute question, suggestion ou partenariat. Nous sommes là pour vous aider." />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <section className="relative py-20 lg:py-32 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              Entrez en <span className="gradient-text">Contact</span>
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Une question, une suggestion ou un partenariat ? Nous sommes à votre écoute.
            </motion.p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-12">
              <motion.div 
                className="lg:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-8 shadow-lg border-0">
                  <CardContent className="p-0">
                    <h2 className="text-2xl font-bold mb-2">Envoyez-nous un message</h2>
                    <p className="text-gray-500 mb-8">Remplissez le formulaire et nous vous recontacterons sous peu.</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                          <Input id="name" type="text" placeholder="Votre nom" value={formData.name} onChange={handleChange} disabled={isSubmitting} />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Adresse e-mail</label>
                          <Input id="email" type="email" placeholder="Votre e-mail" value={formData.email} onChange={handleChange} disabled={isSubmitting} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                        <Input id="subject" type="text" placeholder="Sujet de votre message" value={formData.subject} onChange={handleChange} disabled={isSubmitting} />
                      </div>
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <Textarea id="message" placeholder="Écrivez votre message ici..." rows={6} value={formData.message} onChange={handleChange} disabled={isSubmitting} />
                      </div>
                      <div className="hidden">
                        <label htmlFor="honeypot">Ne pas remplir</label>
                        <Input id="honeypot" type="text" value={formData.honeypot} onChange={handleChange} tabIndex="-1" autoComplete="off" />
                      </div>
                      
                      {validationError && (
                        <div className="bg-red-50 p-3 rounded-lg flex items-center text-red-700 text-sm">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <span>{validationError}</span>
                        </div>
                      )}

                      <div>
                        <Button type="submit" size="lg" className="w-full gradient-bg hover:opacity-90 flex items-center gap-2" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
                          ) : (
                            <><Send className="w-5 h-5" /> Envoyer le Message</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold">Nos Coordonnées</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-custom-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-custom-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">E-mail</h3>
                      <p className="text-gray-600">Pour toute question générale ou support.</p>
                      <a href="mailto:webmaster@zandopluscg.com" className="text-custom-green-600 hover:underline font-medium">webmaster@zandopluscg.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-custom-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-custom-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Téléphone</h3>
                      <p className="text-gray-600">Nous sommes disponibles du Lundi au Vendredi.</p>
                      <a href="tel:+242064623778" className="text-custom-green-600 hover:underline font-medium">+242 06 462 3778</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-custom-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-custom-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Adresse</h3>
                      <p className="text-gray-600">Notre siège social.</p>
                      <p className="font-medium text-gray-800">Brazzaville, République du Congo</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </motion.div>
    </>
  );
};

export default ContactPage;