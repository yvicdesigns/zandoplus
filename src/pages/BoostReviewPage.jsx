import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Hourglass } from 'lucide-react';

const BoostReviewPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Demande de Boost en Cours de Révision - Zando</title>
        <meta name="description" content="Votre demande de boost est en cours de révision. Nous vous contacterons bientôt." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-0 text-center">
          <CardHeader>
            <div className="mx-auto bg-custom-green-100 p-3 rounded-full w-fit mb-4">
              <CheckCircle className="w-8 h-8 text-custom-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold gradient-text">Demande Envoyée !</CardTitle>
            <CardDescription className="text-lg text-gray-600 pt-2">
              Votre demande de boost a été soumise avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <Hourglass className="w-8 h-8 text-amber-600 mb-3" />
              <p className="text-base text-gray-700 font-semibold">
                Votre article est maintenant en cours de révision.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Nous vérifierons votre paiement et activerons le boost de votre annonce dans les plus brefs délais. Vous recevrez une notification une fois que ce sera fait !
              </p>
            </div>
            <Button onClick={() => navigate('/profile')} size="lg" className="w-full gradient-bg hover:opacity-90 text-lg">
              Retour au profil
            </Button>
            <Button variant="outline" onClick={() => navigate('/listings')} size="lg" className="w-full text-custom-green-600 border-custom-green-600 hover:bg-custom-green-50">
              Explorer les annonces
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BoostReviewPage;