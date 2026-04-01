import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MobilePaymentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { siteSettings, loading: settingsLoading } = useSiteSettings();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    try {
      const storedInfo = localStorage.getItem('paymentInfo');
      if (storedInfo) {
        setPaymentInfo(JSON.parse(storedInfo));
      } else {
        toast({
          title: 'Erreur',
          description: 'Informations de paiement non trouvées.',
          variant: 'destructive'
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Erreur lors de la lecture des informations de paiement:", error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations de paiement.',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [navigate, toast]);

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    toast({
      title: 'Copié !',
      description: 'Le numéro de paiement a été copié dans le presse-papiers.',
      className: 'bg-green-100 text-green-800'
    });
  };

  const handleConfirmPayment = () => {
    if (!paymentInfo) {
        toast({ title: 'Erreur', description: 'Données de paiement introuvables. Veuillez réessayer.', variant: 'destructive' });
        return;
    }

    if (paymentInfo.type === 'boost') {
      navigate('/boost-payment', { state: { ...paymentInfo } });
    } else if (paymentInfo.type === 'plan') {
      navigate('/payment/confirmation', { state: { ...paymentInfo } });
    } else {
        toast({ title: 'Erreur de type de paiement', description: `Type de paiement non reconnu: ${paymentInfo.type}.`, variant: 'destructive' });
    }
  };

  if (!paymentInfo || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-1/2 mx-auto" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Instructions de Paiement Mobile - Zando</title>
        <meta name="description" content="Suivez les instructions pour finaliser votre paiement par Mobile Money." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Card className="w-full shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="mx-auto bg-custom-green-100 p-3 rounded-full w-fit mb-4">
                <CheckCircle className="w-8 h-8 text-custom-green-500" />
              </div>
              <CardTitle className="text-3xl font-bold gradient-text">Finalisez votre Paiement</CardTitle>
              <CardDescription className="text-lg text-gray-600 pt-2">
                Suivez ces étapes simples pour payer via Mobile Money.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-lg">Montant à payer :</p>
                <p className="text-4xl font-bold text-blue-600">
                  {paymentInfo.amount.toLocaleString()} {paymentInfo.currency || 'FCFA'}
                </p>
                <p className="text-sm text-gray-500 mt-1">{paymentInfo.description}</p>
              </div>

              <Alert>
                <AlertTitle className="font-bold text-lg">1. Envoyez le paiement</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>Veuillez envoyer le montant exact au numéro ci-dessous via votre service Mobile Money préféré (MTN, Airtel, etc.).</p>
                  {siteSettings?.whatsapp_number ? (
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                      <span className="font-mono text-lg text-gray-800">{siteSettings.whatsapp_number}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyNumber(siteSettings.whatsapp_number)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </Button>
                    </div>
                  ) : (
                    <p className="text-red-500">Numéro de paiement non configuré.</p>
                  )}
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="font-bold text-lg">2. Faites une capture d'écran</AlertTitle>
                <AlertDescription className="mt-2">
                  Une fois le paiement effectué, prenez une capture d'écran du message de confirmation de votre opérateur.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="font-bold text-lg">3. Confirmez votre paiement</AlertTitle>
                <AlertDescription className="mt-2">
                  Cliquez sur le bouton ci-dessous pour téléverser votre capture d'écran comme preuve de paiement.
                </AlertDescription>
              </Alert>

            </CardContent>
            <CardFooter>
              <Button onClick={handleConfirmPayment} size="lg" className="w-full gradient-bg hover:opacity-90 text-lg font-bold py-6">
                J'ai payé, envoyer la preuve
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MobilePaymentPage;