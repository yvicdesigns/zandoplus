import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, CheckCircle, MessageCircle, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

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

  const handleWhatsApp = () => {
    if (!siteSettings?.whatsapp_number || !paymentInfo) return;
    const number = siteSettings.whatsapp_number.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Bonjour, je viens d'effectuer un paiement sur Zando+.\n\nMontant : ${paymentInfo.amount?.toLocaleString()} ${paymentInfo.currency || 'FCFA'}\nObjet : ${paymentInfo.description}\n\nJe vous envoie ma preuve de paiement.`
    );
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
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

              {/* Opérateurs acceptés */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Opérateurs acceptés :</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-yellow-400 text-yellow-900 text-sm px-3 py-1">MTN Money</Badge>
                  <Badge className="bg-red-500 text-white text-sm px-3 py-1">Airtel Money</Badge>
                </div>
              </div>

              <Alert>
                <AlertTitle className="font-bold text-lg">1. Envoyez le paiement</AlertTitle>
                <AlertDescription className="space-y-3 mt-2">
                  <p>Envoyez le montant exact au numéro ci-dessous via <strong>MTN Money</strong> ou <strong>Airtel Money</strong>.</p>
                  {siteSettings?.whatsapp_number ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Numéro de réception</p>
                          <span className="font-mono text-xl font-bold text-gray-800">{siteSettings.whatsapp_number}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleCopyNumber(siteSettings.whatsapp_number)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full border-green-500 text-green-600 hover:bg-green-50" onClick={handleWhatsApp}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contacter via WhatsApp après paiement
                      </Button>
                    </>
                  ) : (
                    <p className="text-red-500">Numéro de paiement non configuré. Contactez l'administrateur.</p>
                  )}
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="font-bold text-lg">2. Notez l'ID de transaction</AlertTitle>
                <AlertDescription className="mt-2">
                  Après le paiement, votre opérateur vous envoie un SMS de confirmation avec un ID de transaction (ex: <code className="bg-gray-100 px-1 rounded">MP240815.1234.C56789</code>). Notez-le.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="font-bold text-lg">3. Confirmez votre paiement</AlertTitle>
                <AlertDescription className="mt-2">
                  Cliquez sur le bouton ci-dessous pour téléverser votre capture d'écran et saisir l'ID de transaction.
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