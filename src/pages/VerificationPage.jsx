import React, { useState, useEffect, useCallback } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, CheckCircle2, Clock } from 'lucide-react';
    import VerificationStep from '@/components/verification/VerificationStep';
    import FileUpload from '@/components/verification/FileUpload';
    import { usePayment } from '@/contexts/PaymentContext';

    const VerificationPage = () => {
      const { user, getVerificationStatus, uploadVerificationDocument, isLoading: authLoading } = useAuth();
      const { initiateMobilePayment, loading: paymentLoading } = usePayment();
      const navigate = useNavigate();
      const { toast } = useToast();

      const [loading, setLoading] = useState(true);
      const [verificationStatus, setVerificationStatus] = useState(null);

      const [idFile, setIdFile] = useState(null);
      const [selfieFile, setSelfieFile] = useState(null);
      const [addressFile, setAddressFile] = useState(null);

      const fetchStatus = useCallback(async () => {
        setLoading(true);
        const status = await getVerificationStatus();
        setVerificationStatus(status);
        setLoading(false);
      }, [getVerificationStatus]);

      useEffect(() => {
        if (!authLoading && user) {
          fetchStatus();
        }
      }, [user, authLoading, fetchStatus]);

      const handleFileSelect = (file, type) => {
        if (type === 'id') setIdFile(file);
        if (type === 'selfie') setSelfieFile(file);
        if (type === 'address') setAddressFile(file);
      };
      
      const handleFileRemove = (type) => {
        if (type === 'id') setIdFile(null);
        if (type === 'selfie') setSelfieFile(null);
        if (type === 'address') setAddressFile(null);
      };

      const handlePayment = async () => {
        if (!idFile || !selfieFile) {
          toast({
            title: "Champs requis manquants",
            description: "Veuillez fournir une pièce d'identité et un selfie.",
            variant: 'destructive',
          });
          return;
        }
        
        try {
          const id_document_url = await uploadVerificationDocument(idFile, 'id-document');
          const selfie_url = await uploadVerificationDocument(selfieFile, 'selfie');
          let proof_of_address_url = null;
          if (addressFile) {
            proof_of_address_url = await uploadVerificationDocument(addressFile, 'proof-of-address');
          }

          const verificationData = {
            id_document_url,
            selfie_url,
            proof_of_address_url
          };

          // Store data to be used after payment
          localStorage.setItem('verificationData', JSON.stringify(verificationData));

          await initiateMobilePayment(
            5000,
            'Frais de vérification de compte',
            { type: 'verification' }
          );

        } catch (error) {
          console.error("Erreur lors de la préparation du paiement de vérification:", error);
          toast({
            title: "Erreur",
            description: "Impossible de préparer le paiement. Veuillez réessayer.",
            variant: 'destructive',
          });
        }
      };

      if (loading || authLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
          </div>
        );
      }

      if (!user) {
        navigate('/');
        return null;
      }
      
      if (user.verified) {
        return (
          <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
            <CheckCircle2 className="w-20 h-20 text-custom-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Vous êtes déjà un vendeur vérifié !</h1>
            <p className="text-gray-600 mb-6">Félicitations ! Le badge de confiance est affiché sur votre profil et vos annonces.</p>
            <Link to="/profile">
              <Button>Retour au profil</Button>
            </Link>
          </div>
        );
      }

      if (verificationStatus?.status === 'pending_payment' || verificationStatus?.status === 'pending_approval') {
        return (
          <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
            <Clock className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Votre demande est en cours de traitement</h1>
            <p className="text-gray-600 mb-6">
              {verificationStatus.status === 'pending_payment' 
                ? "En attente de la confirmation de votre paiement."
                : "Nous examinons vos documents. Vous recevrez une notification une fois le processus terminé. (Généralement 1-2 jours ouvrables)"
              }
            </p>
            <Link to="/profile">
              <Button variant="outline">Retour au profil</Button>
            </Link>
          </div>
        );
      }

      const isResubmitting = verificationStatus?.status === 'rejected';

      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-3xl">Devenir un Vendeur Vérifié</CardTitle>
              <CardDescription>
                Augmentez la confiance des acheteurs en faisant vérifier votre identité. C'est simple et sécurisé.
                {isResubmitting && (
                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800">
                        <p className="font-bold">Votre précédente demande a été rejetée.</p>
                        <p>Raison : {verificationStatus.rejection_reason || "Aucune raison spécifiée."}</p>
                        <p className="mt-2">Veuillez corriger les informations et soumettre à nouveau.</p>
                    </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <VerificationStep 
                title="Étape 1: Vérification de l'E-mail"
                description="Votre adresse e-mail est utilisée pour la communication et la sécurité du compte."
                status={user.email_confirmed_at ? 'completed' : 'action_required'}
              >
                {!user.email_confirmed_at && (
                  <p className="text-sm text-amber-600">Un lien de vérification a été envoyé à votre adresse e-mail. Veuillez le consulter.</p>
                )}
              </VerificationStep>
              
              <VerificationStep
                title="Étape 2: Vérification du Téléphone"
                description="La vérification par téléphone ajoute une couche de sécurité supplémentaire à votre compte."
                status="action_required"
              >
                 <div className="flex items-center gap-4">
                    <Input placeholder="Votre numéro de téléphone" className="max-w-xs" />
                    <Button onClick={() => toast({ title: "Bientôt disponible", description: "La vérification par téléphone sera bientôt ajoutée." })}>
                        Envoyer le code
                    </Button>
                </div>
              </VerificationStep>

              <VerificationStep
                title="Étape 3: Vérification de l'Identité"
                description="Téléversez vos documents pour prouver votre identité. Vos données sont cryptées et stockées en toute sécurité."
                status={isResubmitting ? 'rejected' : 'action_required'}
                rejectionReason={verificationStatus?.rejection_reason}
              >
                <div className="space-y-4">
                  <FileUpload
                    label="Pièce d'identité officielle"
                    onFileSelect={(file) => handleFileSelect(file, 'id')}
                    onFileRemove={() => handleFileRemove('id')}
                    acceptedFileTypes="image/jpeg, image/png, application/pdf"
                    required
                    disabled={paymentLoading}
                    previouslyUploadedUrl={verificationStatus?.id_document_url}
                  />
                  <FileUpload
                    label="Selfie avec votre pièce d'identité"
                    onFileSelect={(file) => handleFileSelect(file, 'selfie')}
                    onFileRemove={() => handleFileRemove('selfie')}
                    acceptedFileTypes="image/jpeg, image/png"
                    required
                    disabled={paymentLoading}
                    previouslyUploadedUrl={verificationStatus?.selfie_url}
                  />
                  <FileUpload
                    label="Justificatif de domicile (facultatif)"
                    onFileSelect={(file) => handleFileSelect(file, 'address')}
                    onFileRemove={() => handleFileRemove('address')}
                    acceptedFileTypes="image/jpeg, image/png, application/pdf"
                    disabled={paymentLoading}
                    previouslyUploadedUrl={verificationStatus?.proof_of_address_url}
                  />
                </div>
              </VerificationStep>

              <div className="flex justify-end pt-6 border-t">
                  <Button onClick={handlePayment} disabled={paymentLoading || !idFile || !selfieFile} size="lg" className="gradient-bg hover:opacity-90">
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Préparation...
                      </>
                    ) : (
                      "Payer 5000 FCFA pour vérifier"
                    )}
                  </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      );
    };

    export default VerificationPage;