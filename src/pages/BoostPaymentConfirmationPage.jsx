import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud, File as FileIcon, X, CheckCircle, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const BoostPaymentConfirmationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [proofFile, setProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [loadingNumber, setLoadingNumber] = useState(true);
  const fileInputRef = useRef(null);

  const { amount, description, boostRequestId } = state || {};

  useEffect(() => {
    const fetchPaymentNumber = async () => {
      setLoadingNumber(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('whatsapp_number')
        .eq('id', 1)
        .single();
      
      if (data && data.whatsapp_number) {
        setPaymentNumber(data.whatsapp_number);
      } else {
        toast({
          title: 'Erreur de configuration',
          description: 'Le numéro de paiement n\'est pas configuré. Veuillez contacter l\'administrateur.',
          variant: 'destructive'
        });
      }
      setLoadingNumber(false);
    };

    fetchPaymentNumber();
  }, [toast]);

  if (!amount || !description || !boostRequestId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-2xl font-bold mb-4">Oups ! Une erreur est survenue.</h1>
        <p className="text-gray-600 mb-8">Les informations de la demande sont manquantes. Veuillez réessayer.</p>
        <Button onClick={() => navigate('/profile')}>Retour au profil</Button>
      </div>
    );
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Fichier trop volumineux',
          description: 'Veuillez choisir une image de moins de 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setProofFile(file);
    }
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendWhatsApp = async () => {
    if (!proofFile) {
      toast({
        title: 'Preuve manquante',
        description: 'Veuillez téléverser une capture d\'écran du paiement.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}-${boostRequestId}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, proofFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);
      
      setIsUploading(false);

      const { error: updateError } = await supabase
        .from('boost_requests')
        .update({ payment_proof_url: publicUrl, status: 'pending_approval' })
        .eq('id', boostRequestId);

      if (updateError) throw updateError;

      const message = `Bonjour,
Je confirme avoir effectué le paiement de ${amount.toLocaleString()} FCFA pour le service suivant :
*${description}*

ID de la demande: ${boostRequestId}
Veuillez trouver ci-joint la preuve de paiement.
Merci de valider ma commande.`;

      const whatsappUrl = `https://wa.me/${paymentNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');

      toast({
        title: 'Demande envoyée !',
        description: "Votre demande de boost est en cours de validation. N'oubliez pas de joindre la capture d'écran sur WhatsApp.",
        className: "bg-green-100 text-green-800"
      });

      navigate('/boost-review'); // Redirect to the new review page

    } catch (error) {
      toast({
        title: 'Erreur lors de la soumission',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Confirmation de Paiement de Boost - Zando</title>
        <meta name="description" content="Envoyez votre preuve de paiement pour finaliser votre boost." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Card className="w-full shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                <CheckCircle className="w-8 h-8 text-custom-green-500" />
              </div>
              <CardTitle className="text-3xl font-bold gradient-text">Confirmez votre Paiement</CardTitle>
              <CardDescription className="text-lg text-gray-600 pt-2">
                Téléversez votre preuve de paiement pour valider votre boost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="file-upload" className="text-base font-semibold">
                  Preuve de paiement (Capture d'écran)
                </Label>
                <div
                  className={`mt-2 w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                    proofFile ? 'border-custom-green-300 bg-green-50' : 'border-gray-300 hover:border-custom-green-400'
                  }`}
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Téléversement...</span>
                    </div>
                  ) : proofFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-custom-green-600" />
                        <span className="text-sm font-medium text-gray-700 truncate">{proofFile.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-custom-green-600">Cliquez pour choisir une image</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                <strong>Important :</strong> Après avoir cliqué sur le bouton ci-dessous, vous serez redirigé vers WhatsApp. Vous devrez alors <strong className="underline">joindre manuellement la capture d'écran</strong> à la conversation avant d'envoyer le message.
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendWhatsApp} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6" disabled={isSubmitting || loadingNumber}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <MessageSquare className="w-5 h-5 mr-3" />}
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer via WhatsApp'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BoostPaymentConfirmationPage;