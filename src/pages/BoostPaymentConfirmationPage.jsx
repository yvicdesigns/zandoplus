import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud, CheckCircle, ArrowLeft, Loader2, Copy } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet-async';
import { fbTrack } from '@/components/analytics/MetaPixel';
import { ttqTrack } from '@/components/analytics/TikTokPixel';

const BoostPaymentConfirmationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const { boostId, listingTitle, amount, days } = state || {};

  useEffect(() => {
    supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single()
      .then(({ data }) => { if (data) setPaymentNumber(data.whatsapp_number); });
  }, []);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setProofFile(file);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    toast({ title: 'Numéro copié !' });
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      toast({ title: 'Capture requise', description: 'Veuillez uploader la preuve de paiement.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const ext = proofFile.name.split('.').pop();
      const path = `boosts/${boostId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(path, proofFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment_proofs').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('ad_boosts')
        .update({ preuve_paiement_url: publicUrl })
        .eq('id', boostId);
      if (updateError) throw updateError;

      // Pixels — Purchase / CompletePayment
      fbTrack('Purchase', { value: amount, currency: 'XAF', content_name: listingTitle, num_items: 1 });
      ttqTrack('CompletePayment', { value: amount, currency: 'XAF', content_name: listingTitle });

      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!boostId) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <p className="text-gray-600 mb-6">Informations manquantes. Veuillez réessayer.</p>
      <Button onClick={() => navigate('/profile')}>Retour au profil</Button>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Preuve envoyée !</h2>
        <p className="text-gray-600 mb-6">L'équipe Zando+ va valider votre paiement. Votre boost sera activé sous 24h.</p>
        <Button onClick={() => navigate('/profile')} className="gradient-bg">Retour au profil</Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Confirmation boost - Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">Finaliser le paiement du boost</CardTitle>
              <CardDescription>
                Envoyez <strong>{amount?.toLocaleString()} FCFA</strong> pour booster <strong>"{listingTitle}"</strong> pendant {days} jours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-blue-800">Instructions de paiement</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Ouvrez <strong>Airtel Money</strong> ou <strong>MTN Money</strong></li>
                  <li>Envoyez exactement <strong>{amount?.toLocaleString()} FCFA</strong> au :</li>
                  <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-blue-900 flex-1">{paymentNumber || 'Chargement...'}</span>
                    <Button size="sm" variant="ghost" onClick={copyNumber}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <li>Prenez une capture d'écran du SMS de confirmation</li>
                  <li>Uploadez-la ci-dessous</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-2">Preuve de paiement</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-custom-green-400 hover:bg-green-50 transition-colors"
                >
                  {proofFile ? (
                    <div className="flex items-center justify-center gap-2 text-custom-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{proofFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Cliquez pour uploader votre capture d'écran</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting || !proofFile} size="lg" className="w-full gradient-bg">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Envoyer la preuve
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BoostPaymentConfirmationPage;
