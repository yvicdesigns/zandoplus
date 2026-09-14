import React, { useState, useEffect, useCallback } from 'react';
    import { Link, useNavigate, useSearchParams } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, CheckCircle2, Clock, ShieldCheck, Building2 } from 'lucide-react';
    import { format } from 'date-fns';
    import { fr } from 'date-fns/locale';
    import VerificationStep from '@/components/verification/VerificationStep';
    import FileUpload from '@/components/verification/FileUpload';
    import { usePayment } from '@/contexts/PaymentContext';

    const PLANS = {
      individual: { price: 10000, label: 'Vendeur Vérifié', description: 'Frais de vérification de compte' },
      business:   { price: 20000, label: 'Entreprise', description: 'Frais de vérification Entreprise (1 an)' },
    };

    const VerificationPage = () => {
      const { user, getVerificationStatus, uploadVerificationDocument, isLoading: authLoading } = useAuth();
      const { initiateMobilePayment, loading: paymentLoading } = usePayment();
      const navigate = useNavigate();
      const { toast } = useToast();
      const [searchParams] = useSearchParams();

      const [requestType, setRequestType] = useState(searchParams.get('type') === 'business' ? 'business' : 'individual');
      const [loading, setLoading] = useState(true);
      const [verificationStatus, setVerificationStatus] = useState(null);

      const [businessName, setBusinessName] = useState('');
      const [idFile, setIdFile] = useState(null);
      const [selfieFile, setSelfieFile] = useState(null);
      const [addressFile, setAddressFile] = useState(null);

      const fetchStatus = useCallback(async () => {
        setLoading(true);
        const status = await getVerificationStatus(requestType);
        setVerificationStatus(status);
        setLoading(false);
      }, [getVerificationStatus, requestType]);

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
        if (requestType === 'business' && !businessName.trim()) {
          toast({
            title: 'Nom manquant',
            description: "Indiquez le nom de votre entreprise ou boutique.",
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
            request_type: requestType,
            business_name: requestType === 'business' ? businessName.trim() : null,
            id_document_url,
            selfie_url,
            proof_of_address_url,
          };

          // Stocké pour être repris après le paiement (voir PaymentConfirmationPage)
          localStorage.setItem('verificationData', JSON.stringify(verificationData));

          const plan = PLANS[requestType];
          await initiateMobilePayment(plan.price, plan.description, { type: 'verification' });

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

      // Déjà Entreprise : rien à faire tant que ça n'a pas expiré.
      if (requestType === 'business' && user.is_business) {
        return (
          <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
            <Building2 className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Votre boutique est Entreprise !</h1>
            <p className="text-gray-600 mb-6">
              Le badge Entreprise est actif{user.business_expires_at && (
                <> jusqu'au <strong>{format(new Date(user.business_expires_at), 'dd MMMM yyyy', { locale: fr })}</strong></>
              )}.
            </p>
            <Link to="/profile"><Button>Retour au profil</Button></Link>
          </div>
        );
      }

      // Déjà Vérifié (et on regarde la vue "individuel") : proposer l'upsell Entreprise.
      if (requestType === 'individual' && user.verified) {
        return (
          <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
            <CheckCircle2 className="w-20 h-20 text-custom-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Vous êtes déjà un vendeur vérifié !</h1>
            <p className="text-gray-600 mb-6">Félicitations ! Le badge de confiance est affiché sur votre profil et vos annonces.</p>
            {!user.is_business && (
              <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="font-semibold text-amber-900 flex items-center gap-2"><Building2 className="w-5 h-5" /> Vous représentez une entreprise ?</p>
                <p className="text-sm text-amber-800 mt-1 mb-3">Passez au badge Entreprise (20 000 FCFA/an) : priorité renforcée, bannière personnalisée, et plus.</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setRequestType('business')}>
                  Devenir Entreprise
                </Button>
              </div>
            )}
            <Link to="/profile"><Button variant="outline">Retour au profil</Button></Link>
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
      const plan = PLANS[requestType];

      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="shadow-lg border-0">
            <CardHeader>
              {/* Sélecteur Vérifié / Entreprise */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRequestType('individual')}
                  className={`flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${requestType === 'individual' ? 'border-custom-green-500 bg-custom-green-50 text-custom-green-700' : 'border-gray-200 text-gray-500'}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Vendeur Vérifié — 10 000 FCFA
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('business')}
                  className={`flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${requestType === 'business' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500'}`}
                >
                  <Building2 className="w-4 h-4" /> Entreprise — 20 000 FCFA/an
                </button>
              </div>

              <CardTitle className="text-3xl">
                {requestType === 'business' ? 'Devenir une Boutique Entreprise' : 'Devenir un Vendeur Vérifié'}
              </CardTitle>
              <CardDescription>
                {requestType === 'business'
                  ? "Le badge Entreprise inclut le badge Vérifié, et renforce la confiance des acheteurs. Aucun RCCM n'est exigé — votre pièce d'identité suffit."
                  : "Augmentez la confiance des acheteurs en faisant vérifier votre identité. C'est simple et sécurisé."}
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

              {requestType === 'business' && (
                <VerificationStep
                  title="Étape 2: Votre entreprise"
                  description="Le nom affiché sur votre boutique Zando+."
                  status={businessName.trim() ? 'completed' : 'action_required'}
                >
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Nom de l'entreprise / boutique</Label>
                    <Input
                      id="business-name"
                      placeholder="Ex : Établissements Mavoungou"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      disabled={paymentLoading}
                    />
                    <p className="text-xs text-gray-400">Le RCCM/NIU n'est pas obligatoire — vous pourrez l'ajouter plus tard si vous en avez un.</p>
                  </div>
                </VerificationStep>
              )}

              <VerificationStep
                title={`Étape ${requestType === 'business' ? '3' : '2'}: Vérification de l'Identité`}
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
                  <Button
                    onClick={handlePayment}
                    disabled={paymentLoading || !idFile || !selfieFile || (requestType === 'business' && !businessName.trim())}
                    size="lg"
                    className={requestType === 'business' ? 'bg-amber-500 hover:bg-amber-600' : 'gradient-bg hover:opacity-90'}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Préparation...
                      </>
                    ) : (
                      `Payer ${plan.price.toLocaleString('fr-FR')} FCFA`
                    )}
                  </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      );
    };

    export default VerificationPage;
