import React, { useState, useRef, useEffect } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { UploadCloud, File as FileIcon, X, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/AuthContext';
    import { Input } from '@/components/ui/input';

    const PaymentConfirmationPage = () => {
      const { state } = useLocation();
      const navigate = useNavigate();
      const { toast } = useToast();
      const { user } = useAuth();
      const [proofFile, setProofFile] = useState(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [transactionId, setTransactionId] = useState('');
      const fileInputRef = useRef(null);

      useEffect(() => {
        if (state && state.type === 'boost') {
          navigate('/boost-payment', { state, replace: true });
        }
      }, [state, navigate]);

      const { amount, description, plan } = state || {};

      if (state?.type === 'boost') {
        return null;
      }
      
      if (!amount || !description || !plan) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <h1 className="text-2xl font-bold mb-4">Oups ! Une erreur est survenue.</h1>
            <p className="text-gray-600 mb-8">Les informations de paiement sont manquantes ou incorrectes. Veuillez réessayer.</p>
            <Button onClick={() => navigate('/pricing')}>Retour aux abonnements</Button>
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

      const handleSubmit = async () => {
        if (!proofFile) {
          toast({
            title: 'Preuve manquante',
            description: 'Veuillez téléverser une capture d\'écran du paiement.',
            variant: 'destructive',
          });
          return;
        }

        if (!transactionId) {
          toast({
            title: 'ID de transaction manquant',
            description: 'Veuillez saisir l\'ID de la transaction de votre paiement.',
            variant: 'destructive',
          });
          return;
        }

        setIsSubmitting(true);

        try {
          const fileExt = proofFile.name.split('.').pop();
          const fileName = `${user.id}-${plan.type}-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('payment_proofs')
            .upload(filePath, proofFile, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('payment_proofs')
            .getPublicUrl(filePath);

          if (plan.type === 'verification') {
            const storedVerificationData = localStorage.getItem('verificationData');
            if (!storedVerificationData) {
              throw new Error("Données de vérification non trouvées. Veuillez recommencer le processus.");
            }
            const verificationData = JSON.parse(storedVerificationData);

            const { error: dbError } = await supabase
              .from('verification_requests')
              .upsert({
                user_id: user.id,
                status: 'pending_approval',
                ...verificationData,
                payment_proof_url: publicUrl,
                payment_transaction_id: transactionId,
              }, { onConflict: 'user_id' });

            if (dbError) throw dbError;
            
            localStorage.removeItem('verificationData');
            toast({
              title: 'Demande envoyée !',
              description: "Votre demande de vérification a été envoyée pour validation. Vous recevrez une notification bientôt.",
              className: "bg-green-100 text-green-800"
            });
          } else { // Handle plan payment
            const { error } = await supabase.functions.invoke('send-plan-payment-email', {
              body: {
                userEmail: user.email,
                userName: user.user_metadata?.full_name,
                plan: plan,
                amount: amount,
                transactionId: transactionId,
                proofUrl: publicUrl
              }
            });
            if (error) throw error;
            toast({
              title: 'Demande envoyée !',
              description: "Votre demande d'abonnement a été envoyée pour validation. Vous recevrez une notification bientôt.",
              className: "bg-green-100 text-green-800"
            });
          }

          navigate('/profile');

        } catch (error) {
          toast({
            title: 'Erreur lors de la soumission',
            description: error.message,
            variant: 'destructive',
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <>
          <Helmet>
            <title>Confirmation de Paiement - Zando</title>
            <meta name="description" content="Envoyez votre preuve de paiement pour finaliser votre achat." />
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
                  <CardTitle className="text-3xl font-bold gradient-text">Confirmez votre Paiement</CardTitle>
                  <CardDescription className="text-lg text-gray-600 pt-2">
                    Téléversez votre preuve pour valider votre achat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="transaction-id" className="text-base font-semibold">
                      ID de la transaction
                    </Label>
                    <Input 
                      id="transaction-id"
                      placeholder="Ex: MP240815.1234.C56789"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

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
                      {isSubmitting ? (
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
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmit} size="lg" className="w-full gradient-bg hover:opacity-90 text-lg font-bold py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : null}
                    {isSubmitting ? 'Soumission en cours...' : 'Soumettre pour validation'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      );
    };

    export default PaymentConfirmationPage;