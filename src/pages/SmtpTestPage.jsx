import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, ServerCrash, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SmtpTestPage = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const { session } = useAuth();

  const handleSendTestEmail = async () => {
    if (!email) {
      setResult({ type: 'error', message: "Veuillez entrer une adresse e-mail." });
      return;
    }
    setIsSending(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: { email },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        // This will catch network errors or function invocation errors
        throw error;
      }
      
      if (data.error) {
        // This catches errors returned from within the function logic
        setResult({ type: 'error', message: data.error });
      } else {
        setResult({ type: 'success', message: `E-mail de test envoyé avec succès à ${email}. Veuillez vérifier la boîte de réception.` });
      }

    } catch (error) {
      let errorMessage = "Une erreur inattendue est survenue.";
      if (error.context) {
        // Supabase Edge Function error with context
        const errorJson = await error.context.json().catch(() => null);
        errorMessage = errorJson?.error || error.message;
      } else {
        errorMessage = error.message;
      }
      setResult({ type: 'error', message: errorMessage });
    }

    setIsSending(false);
  };

  return (
    <>
      <Helmet>
        <title>Test SMTP - Admin - Zando+</title>
        <meta name="description" content="Page de test de la configuration SMTP pour les administrateurs." />
        <link rel="canonical" href="https://zandopluscg.com/smtp-test" />
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Mail className="w-6 h-6 text-custom-green-600" />
                Test de Configuration SMTP
              </CardTitle>
              <CardDescription>
                Utilisez cet outil pour vérifier si votre fournisseur SMTP personnalisé est correctement configuré dans Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="font-medium">Adresse E-mail de Destination</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@domaine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                />
              </div>

              <Button onClick={handleSendTestEmail} disabled={isSending || !session} className="w-full gradient-bg hover:opacity-90">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer l'E-mail de Test"
                )}
              </Button>

              {result && (
                <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className={result.type === 'success' ? 'bg-green-50 border-green-300' : ''}>
                  {result.type === 'error' ? (
                     <ServerCrash className="h-4 w-4" />
                  ) : (
                     <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.type === 'error' ? 'Erreur de Test SMTP' : 'Test Réussi'}</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm break-words">{result.message}</p>
                    {result.type === 'error' && (
                        <p className="mt-4 text-sm">
                            Cette erreur provient directement de votre serveur SMTP. Veuillez vérifier vos identifiants, hôte, port et paramètres de sécurité dans les <a href="https://supabase.com/dashboard/project/_/auth/providers" target="_blank" rel="noopener noreferrer" className="font-bold text-destructive underline">paramètres d'authentification de Supabase</a>.
                        </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
               <div className="text-center mt-4">
                    <Link to="/admin" className="text-sm text-custom-green-600 hover:underline">
                        &larr; Retour au tableau de bord
                    </Link>
                </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SmtpTestPage;