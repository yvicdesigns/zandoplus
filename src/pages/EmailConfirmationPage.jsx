import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const EmailConfirmationPage = () => {
  const location = useLocation();
  const email = location.state?.email || 'votre boîte de réception';

  return (
    <>
      <Helmet>
        <title>Confirmez votre e-mail - Zando+ Congo</title>
        <meta name="description" content="Vérifiez votre boîte de réception pour confirmer votre adresse e-mail et activer votre compte Zando+ Congo." />
      </Helmet>
      <div className="min-h-[calc(100vh-200px)] flex items-start sm:items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
        >
          <Card className="w-full max-w-lg text-center shadow-2xl border-t-4 border-custom-green-500">
            <CardHeader>
              <div className="mx-auto bg-custom-green-100 p-4 rounded-full mb-6">
                <MailCheck className="w-16 h-16 text-custom-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold gradient-text">Presque terminé !</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Un e-mail de confirmation a été envoyé à <br />
                <span className="font-semibold text-gray-800">{email}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Veuillez cliquer sur le lien dans cet e-mail pour activer votre compte. Si vous ne le voyez pas, n'oubliez pas de vérifier votre dossier de courrier indésirable (spam).
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default EmailConfirmationPage;