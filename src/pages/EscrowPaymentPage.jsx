import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { ShieldCheck, UploadCloud, CheckCircle, ArrowLeft, Loader2, Copy, AlertTriangle, Truck, Store, Package, Banknote } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { extractCity, fetchCityDeliveryConfig } from '@/lib/deliveryUtils';

const COMMISSION_RATE = 0.07;
const ZANDO_DELIVERY_FEE = 1500; // FCFA — modifiable

const DELIVERY_OPTIONS = [
  { value: 'zando', label: 'Zando Delivery', description: 'Zando envoie un livreur chez vous', icon: Truck, fee: ZANDO_DELIVERY_FEE },
  { value: 'seller', label: 'Livraison du vendeur', description: 'Le vendeur assure la livraison', icon: Package, fee: null },
  { value: 'pickup', label: 'Retrait en boutique', description: 'Je vais chercher moi-même', icon: Store, fee: 0 },
];

const EscrowPaymentPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [cityConfig, setCityConfig] = useState(null);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryChoice, setDeliveryChoice] = useState('zando');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    const fetchData = async () => {
      const [{ data: listingData }, { data: settings }] = await Promise.all([
        supabase.from('listings').select('id, title, price, currency, images, user_id, delivery_method, delivery_fee, accepts_cash_on_delivery, location, seller:profiles(full_name, phone)').eq('id', listingId).single(),
        supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single(),
      ]);
      if (!listingData) { navigate('/listings'); return; }
      if (listingData.user_id === user.id) {
        toast({ title: 'Action impossible', description: 'Vous ne pouvez pas acheter votre propre annonce.', variant: 'destructive' });
        navigate(`/listings/${listingId}`);
        return;
      }

      const city = extractCity(listingData.location);
      const cityConf = await fetchCityDeliveryConfig(supabase, city);
      setCityConfig(cityConf);

      setListing(listingData);
      if (settings) setPaymentNumber(settings.whatsapp_number);

      // Déterminer le choix de livraison initial
      if (listingData.delivery_method === 'pickup') {
        setDeliveryChoice('pickup');
      } else if (cityConf && !cityConf.zando_delivery_enabled) {
        setDeliveryChoice('pickup');
      }
      setLoading(false);
    };
    fetchData();
  }, [listingId, user, navigate, openAuthModal, toast]);

  const getDeliveryFee = () => {
    if (deliveryChoice === 'zando') return ZANDO_DELIVERY_FEE;
    if (deliveryChoice === 'seller') return listing?.delivery_fee || 0;
    return 0;
  };

  const deliveryFee = listing ? getDeliveryFee() : 0;
  const totalAmount = listing ? listing.price + deliveryFee : 0;
  const commission = listing ? Math.round(listing.price * COMMISSION_RATE) : 0;

  // Options de livraison disponibles selon le vendeur et la config ville
  const availableOptions = () => {
    if (!listing) return [];
    if (listing.delivery_method === 'pickup') return [DELIVERY_OPTIONS[2]];
    const opts = [];
    if (!cityConfig || cityConfig.zando_delivery_enabled) {
      opts.push(DELIVERY_OPTIONS[0]);
    }
    if (listing.delivery_method === 'seller_delivery' && (!cityConfig || cityConfig.seller_delivery_enabled)) {
      opts.push({ ...DELIVERY_OPTIONS[1], fee: listing.delivery_fee || 0 });
    }
    opts.push(DELIVERY_OPTIONS[2]); // retrait toujours disponible
    return opts;
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setProofFile(file);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    toast({ title: 'Numéro copié !' });
  };

  const handleSubmit = async () => {
    if (!proofFile) { toast({ title: 'Capture requise', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      // Prix validés côté serveur via RPC (résistant à la manipulation client)
      const { data: txId, error: txError } = await supabase.rpc('create_escrow_transaction', {
        p_annonce_id: listing.id,
        p_delivery_choice: deliveryChoice,
      });
      if (txError) throw txError;

      const ext = proofFile.name.split('.').pop().toLowerCase();
      const path = `escrow/${txId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('payment_proofs').upload(path, proofFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment_proofs').getPublicUrl(path);
      const { error: proofError } = await supabase.rpc('buyer_submit_payment_proof', {
        p_transaction_id: txId,
        p_proof_url: publicUrl,
      });
      if (proofError) throw proofError;

      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-custom-green-500" /></div>;

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Paiement reçu !</h2>
        <p className="text-gray-600 mb-2">Votre paiement est <strong>sécurisé</strong> chez Zando+.</p>
        <p className="text-gray-500 text-sm mb-6">
          {deliveryChoice === 'pickup'
            ? 'Contactez le vendeur pour organiser le retrait.'
            : 'Le vendeur va être notifié pour préparer la livraison. Vous aurez 72h pour confirmer la réception.'}
        </p>
        <Button onClick={() => navigate('/transactions')} className="gradient-bg w-full mb-3">Suivre ma transaction</Button>
        <Button variant="outline" onClick={() => navigate('/listings')} className="w-full">Retour aux annonces</Button>
      </div>
    </div>
  );

  const options = availableOptions();

  return (
    <>
      <Helmet><title>Achat Sécurisé - {listing?.title} - Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          <Card className="shadow-lg border-0">
            <CardHeader><CardTitle className="text-lg">Récapitulatif</CardTitle></CardHeader>
            <CardContent className="space-y-5">

              {/* Annonce */}
              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl">
                <img src={listing.images?.[0] || 'https://via.placeholder.com/60'} alt={listing.title} className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{listing.title}</p>
                  <p className="text-sm text-gray-500">Vendeur : {listing.seller?.full_name}</p>
                </div>
              </div>

              {/* Choix livraison / paiement */}
              <div className="space-y-2">
                <p className="font-semibold text-gray-800">Mode de livraison</p>
                {listing.delivery_method === 'pickup' && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Ce vendeur propose uniquement le retrait en boutique.
                  </div>
                )}

                {/* Options escrow (mobile money) */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Payer par Mobile Money
                  </p>
                  {options.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = deliveryChoice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDeliveryChoice(opt.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.description}</p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                          {opt.fee === 0 ? 'Gratuit' : `+${(opt.fee ?? 0).toLocaleString()} FCFA`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Option COD */}
                {listing.accepts_cash_on_delivery && (!cityConfig || cityConfig.cod_enabled) && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
                      <Banknote className="w-3 h-3" /> Ou payer en cash
                    </p>
                    <button
                      onClick={() => navigate(`/cod/${listing.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 text-left transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Banknote className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-orange-800">Payer à la livraison 💵</p>
                        <p className="text-xs text-gray-500">Zando livre et collecte le cash sur place</p>
                      </div>
                      <span className="text-sm font-bold text-orange-700">+1 500 FCFA</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Détail financier */}
              <div className="border rounded-xl overflow-hidden">
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-gray-600">Prix de l'article</span>
                  <span className="font-semibold">{listing.price?.toLocaleString()} {listing.currency || 'FCFA'}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between px-4 py-3 text-sm text-gray-600 border-t">
                    <span>Frais de livraison ({deliveryChoice === 'zando' ? 'Zando' : 'vendeur'})</span>
                    <span>+{deliveryFee.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-green-50 border-t border-green-100">
                  <span className="font-bold text-gray-800">Vous payez</span>
                  <span className="font-bold text-custom-green-600 text-lg">{totalAmount.toLocaleString()} {listing.currency || 'FCFA'}</span>
                </div>
              </div>

              {/* Instructions paiement */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-blue-800">Étapes du paiement</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Ouvrez <strong>Airtel Money</strong> ou <strong>MTN Money</strong></li>
                  <li>Envoyez <strong>{totalAmount.toLocaleString()} {listing.currency || 'FCFA'}</strong> au numéro Zando+ :</li>
                  <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-blue-900 flex-1">{paymentNumber || 'Chargement...'}</span>
                    <Button size="sm" variant="ghost" onClick={copyNumber}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <li>Notez votre <strong>ID de transaction</strong> (dans le SMS)</li>
                  <li>Uploadez la capture d'écran ci-dessous</li>
                </ol>
              </div>

              {/* Upload */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Preuve de paiement</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-custom-green-400 hover:bg-green-50 transition-colors"
                >
                  {proofFile ? (
                    <div className="flex items-center justify-center gap-2 text-custom-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium text-sm">{proofFile.name}</span>
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
                <ShieldCheck className="w-4 h-4 mr-2" />
                Confirmer mon paiement — {totalAmount.toLocaleString()} FCFA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default EscrowPaymentPage;
