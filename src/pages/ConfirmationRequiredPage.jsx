import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MailCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';

const ConfirmationRequiredPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();
  const email = location.state?.email;

  const handleLoginClick = () => {
    openAuthModal();
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Confirmation Requise - Zando+ Congo</title>
        <meta name="description" content="Vérifiez votre boîte de réception pour confirmer votre compte Zando+ Congo." />
      </Helmet>
      <div className="min-h-[calc(100vh-200px)] flex items-start sm:items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-12">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg w-full text-center border-t-4 border-custom-green-500">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-custom-green-100 mb-6">
            <MailCheck className="h-12 w-12 text-custom-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Vérifiez votre boîte mail !</h1>
          <p className="text-gray-600 mb-6">
            Nous avons envoyé un lien de confirmation à
            <strong className="block font-semibold text-custom-green-700 my-2 break-words">{email || "votre adresse e-mail"}</strong>.
            Veuillez cliquer sur ce lien pour activer votre compte.
          </p>
          <div className="text-left bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-8">
            <p className="font-semibold text-blue-800">Vous ne recevez rien ?</p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>Vérifiez votre dossier de courrier indésirable (spam).</li>
              <li>Patientez quelques minutes, l'e-mail peut prendre du temps à arriver.</li>
              <li>
                Essayez de vous <button onClick={handleLoginClick} className="font-bold underline hover:text-blue-800">connecter</button> à nouveau. Cela renverra automatiquement un nouvel e-mail de confirmation.
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gradient-bg w-full sm:w-auto">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button variant="outline" onClick={handleLoginClick} className="w-full sm:w-auto">
              <LogIn className="mr-2 h-4 w-4" />
              Tenter de se connecter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationRequiredPage;