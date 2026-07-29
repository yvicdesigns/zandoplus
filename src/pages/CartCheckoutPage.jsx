import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, CheckCircle, Loader2, Truck,
  Copy, UploadCloud, Headphones, RotateCcw, Lock,
} from 'lucide-react';

const COMMISSION_RATE = 0.07;
const fmt = (n) => (n ?? 0).toLocaleString('fr-FR');

const DELIVERY_MODES = [
  { id: 'standard', label: 'Livraison standard', sub: '2 à 3 jours ouvrés',  fee: 0     },
  { id: 'express',  label: 'Livraison express',  sub: '24h à 48h',            fee: 3000  },
  { id: 'relay',    label: 'Retrait en point relais', sub: 'Disponible en 24h', fee: 0   },
];

/* Logos paiement inline */
const LogoVisa = () => (
  <div className="flex items-center gap-1">
    <span className="font-black text-[13px] italic text-blue-700">VISA</span>
    <div className="flex">
      <div className="w-5 h-5 rounded-full bg-red-500 opacity-80" />
      <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-80 -ml-2" />
    </div>
  </div>
);

const LogoMTN = () => (
  <div className="bg-yellow-400 rounded px-2 py-0.5 flex items-center">
    <span className="font-black text-[10px] text-black leading-none">MTN<br/>Money</span>
  </div>
);

const LogoAirtel = () => (
  <div className="bg-red-600 rounded px-2 py-0.5 flex items-center">
    <span className="font-black text-[10px] text-white leading-none">airtel<br/>money</span>
  </div>
);

const LogoCOD = () => (
  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
    <span className="text-[18px]">💵</span>
  </div>
);

const PAYMENT_METHODS = [
  { id: 'visa',   label: 'Carte bancaire',          sub: 'Visa, MasterCard et autres',    Logo: LogoVisa,   disabled: true  },
  { id: 'mtn',    label: 'Mobile Money (MTN)',       sub: 'Payez avec votre compte MTN',   Logo: LogoMTN,    disabled: false },
  { id: 'airtel', label: 'Mobile Money (Airtel)',    sub: 'Payez avec votre compte Airtel', Logo: LogoAirtel, disabled: false },
  { id: 'cod',    label: 'Paiement à la livraison', sub: 'Payez en espèces à la réception', Logo: LogoCOD,   disabled: false },
];

/* Stepper */
const Step = ({ n, label, status }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${
      status === 'done'   ? 'bg-custom-green-500 text-white' :
      status === 'active' ? 'bg-custom-green-500 text-white' :
                            'border-2 border-gray-300 text-gray-400'
    }`}>
      {status === 'done' ? <CheckCircle className="w-4 h-4" /> : n}
    </div>
    <span className={`text-[13px] font-semibold whitespace-nowrap ${
      status === 'active' ? 'text-gray-900' : status === 'done' ? 'text-custom-green-600' : 'text-gray-400'
    }`}>{label}</span>
  </div>
);

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const { items, itemsBySeller, subtotal, clearCart, ZANDO_DELIVERY_FEE } = useCart();
  const fileInputRef = useRef(null);

  const [paymentNumber, setPaymentNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const [promoCode, setPromoCode] = useState('');
  const [address, setAddress] = useState({ name: '', phone: '', street: '', city: 'Brazzaville' });

  const sellerGroups = Object.values(itemsBySeller);
  const extraDelivery = DELIVERY_MODES.find(d => d.id === deliveryMode)?.fee || 0;
  const deliveryTotal = sellerGroups.length * ZANDO_DELIVERY_FEE + extraDelivery;
  const total = subtotal + deliveryTotal;

  /* Savings from original prices */
  const totalSavings = items.reduce((acc, item) => {
    if (item.original_price > item.price) return acc + (item.original_price - item.price);
    return acc;
  }, 0);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    if (items.length === 0) { navigate('/cart'); return; }
    supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single()
      .then(({ data }) => { if (data?.whatsapp_number) setPaymentNumber(data.whatsapp_number); });
    if (user?.user_metadata?.full_name) setAddress(a => ({ ...a, name: user.user_metadata.full_name }));
  }, [user, items, navigate, openAuthModal]);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setProofFile(file);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    toast({ title: 'Numéro copié !' });
  };

  const handleSubmit = async () => {
    if (['mtn', 'airtel'].includes(paymentMethod) && !proofFile) {
      toast({ title: 'Capture requise', description: 'Veuillez uploader la preuve de paiement.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: payment, error: payError } = await supabase
        .from('cart_payments')
        .insert({ user_id: user.id, total_amount: total, items_count: items.length, statut: 'pending' })
        .select('id').single();
      if (payError) throw payError;

      let publicUrl = null;
      if (proofFile) {
        const ext = proofFile.name.split('.').pop();
        const path = `cart/${payment.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('payment_proofs').upload(path, proofFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl: url } } = supabase.storage.from('payment_proofs').getPublicUrl(path);
        publicUrl = url;
      }

      await supabase.from('cart_payments').update({
        proof_url: publicUrl,
        statut: paymentMethod === 'cod' ? 'cod_pending' : 'proof_submitted',
      }).eq('id', payment.id);

      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() + 72);

      for (const group of sellerGroups) {
        const sellerTotal = group.items.reduce((s, i) => s + i.price, 0) + ZANDO_DELIVERY_FEE;
        await supabase.from('transactions_escrow').insert({
          annonce_id: group.items[0].id,
          acheteur_id: user.id,
          vendeur_id: group.seller_id,
          montant: sellerTotal,
          commission_amount: Math.round(group.items.reduce((s, i) => s + i.price, 0) * COMMISSION_RATE),
          delivery_choice: deliveryMode,
          delivery_fee_paid: ZANDO_DELIVERY_FEE,
          statut: paymentMethod === 'cod' ? 'cod_pending' : 'fonds_bloques',
          preuve_paiement_url: publicUrl,
          date_limite_confirmation: dateLimit.toISOString(),
          cart_payment_id: payment.id,
        });
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Page confirmation ── */
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-page-bg">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Commande confirmée !</h2>
        <p className="text-gray-600 mb-2">Votre paiement de <strong>{fmt(total)} FCFA</strong> est sécurisé chez Zando+.</p>
        <p className="text-gray-500 text-sm mb-6">Chaque vendeur sera notifié pour préparer sa livraison.</p>
        <button onClick={() => navigate('/transactions')} className="w-full h-12 bg-custom-green-500 text-white rounded-xl font-bold mb-3">
          Suivre mes transactions
        </button>
        <button onClick={() => navigate('/listings')} className="w-full h-12 border border-gray-200 text-gray-700 rounded-xl font-semibold">
          Continuer les achats
        </button>
      </div>
    </div>
  );

  const selectedPayment = PAYMENT_METHODS.find(p => p.id === paymentMethod);
  const needsProof = ['mtn', 'airtel'].includes(paymentMethod);

  return (
    <>
      <Helmet><title>Passer commande — Zando+</title></Helmet>
      <div className="bg-page-bg min-h-screen py-8">
        <div className="max-w-[1280px] mx-auto px-6">

          {/* Titre */}
          <h1 className="text-[24px] font-black text-gray-900 mb-6">Passer commande</h1>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            <Step n={1} label="Panier"       status="done"   />
            <div className="flex-1 h-px bg-custom-green-500" />
            <Step n={2} label="Livraison"    status="active" />
            <div className="flex-1 h-px bg-gray-200" />
            <Step n={3} label="Paiement"     status="pending" />
            <div className="flex-1 h-px bg-gray-200" />
            <Step n={4} label="Confirmation" status="pending" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── GAUCHE ── */}
            <div className="lg:col-span-8 space-y-5">

              {/* Adresse de livraison */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[15px] font-black text-gray-900 mb-4">Adresse de livraison</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={address.name}
                      onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                      placeholder="+242 06 000 00 00"
                      className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Adresse complète</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                    placeholder="123, Avenue de la Paix, Centre-ville"
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ville</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                    placeholder="Brazzaville"
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500"
                  />
                </div>
              </div>

              {/* Mode de livraison */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[15px] font-black text-gray-900 mb-4">Mode de livraison</h2>
                <div className="space-y-3">
                  {DELIVERY_MODES.map(mode => (
                    <label
                      key={mode.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMode === mode.id
                          ? 'border-custom-green-500 bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={deliveryMode === mode.id}
                          onChange={() => setDeliveryMode(mode.id)}
                          className="accent-custom-green-500 w-4 h-4"
                        />
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{mode.label}</p>
                          <p className="text-[11px] text-gray-500">{mode.sub}</p>
                        </div>
                      </div>
                      <span className={`text-[13px] font-bold ${mode.fee === 0 ? 'text-custom-green-500' : 'text-gray-900'}`}>
                        {mode.fee === 0 ? 'Gratuite' : `${fmt(mode.fee)} FCFA`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Méthode de paiement */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[15px] font-black text-gray-900 mb-4">Méthode de paiement</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(({ id, label, sub, Logo, disabled }) => (
                    <label
                      key={id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        disabled
                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          : paymentMethod === id
                            ? 'border-custom-green-500 bg-green-50 cursor-pointer'
                            : 'border-gray-100 hover:border-gray-200 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={!disabled && paymentMethod === id}
                          onChange={() => { if (!disabled) setPaymentMethod(id); }}
                          disabled={disabled}
                          className="accent-custom-green-500 w-4 h-4"
                        />
                        <Logo />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                          <p className="text-[11px] text-gray-500">{sub}</p>
                        </div>
                      </div>
                      {disabled ? (
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          Bientôt disponible
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Sécurisé
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {/* Instructions paiement mobile money */}
                {needsProof && (
                  <div className="mt-5 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="font-semibold text-blue-800 text-[13px] mb-3">Étapes du paiement</p>
                      <ol className="list-decimal list-inside space-y-2 text-[12px] text-blue-700">
                        <li>Ouvrez <strong>{paymentMethod === 'mtn' ? 'MTN Money' : 'Airtel Money'}</strong></li>
                        <li>Envoyez <strong>{fmt(total)} FCFA</strong> au numéro Zando+ :</li>
                      </ol>
                      <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 mt-2">
                        <span className="font-mono font-bold text-blue-900 flex-1 text-[14px]">{paymentNumber || 'Chargement...'}</span>
                        <button onClick={copyNumber} className="p-1 hover:bg-blue-50 rounded">
                          <Copy className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </div>

                    {/* Upload preuve */}
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700 mb-2">Preuve de paiement <span className="text-red-500">*</span></p>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                          proofFile
                            ? 'border-custom-green-400 bg-green-50'
                            : 'border-gray-200 hover:border-custom-green-400 hover:bg-green-50'
                        }`}
                      >
                        {proofFile ? (
                          <div className="flex items-center justify-center gap-2 text-custom-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium text-[13px]">{proofFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                            <p className="text-[12px] text-gray-500">Cliquez pour uploader votre capture d'écran</p>
                          </>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="mt-5 bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <p className="text-[13px] font-semibold text-orange-700 mb-1">Paiement à la livraison</p>
                    <p className="text-[12px] text-orange-600">
                      Vous payerez <strong>{fmt(total)} FCFA</strong> en espèces directement au livreur lors de la réception de votre commande.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── DROITE — Résumé ── */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-black text-gray-900">Résumé de la commande</h2>
                  <span className="text-[12px] text-gray-400">{items.length} article{items.length > 1 ? 's' : ''}</span>
                </div>

                {/* Produits */}
                <div className="space-y-3 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.image || item.images?.[0] || 'https://via.placeholder.com/48'}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{item.title}</p>
                        {item.selectedColor && <p className="text-[11px] text-gray-400">{item.selectedColor}</p>}
                        <p className="text-[11px] text-gray-400">x{item.quantity || 1}</p>
                      </div>
                      <span className="text-[13px] font-bold text-gray-900 flex-shrink-0">
                        {fmt(item.price)} FCFA
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2.5">
                  <div className="flex justify-between text-[13px] text-gray-600">
                    <span>Sous-total</span>
                    <span className="font-semibold">{fmt(subtotal)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-600">
                    <span>Livraison</span>
                    <span className={`font-semibold ${deliveryTotal === 0 ? 'text-custom-green-500' : ''}`}>
                      {deliveryTotal === 0 ? 'Gratuite' : `${fmt(deliveryTotal)} FCFA`}
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-[13px] text-red-500">
                      <span>Réduction</span>
                      <span className="font-semibold">-{fmt(totalSavings)} FCFA</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 mt-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[14px] font-black text-gray-900">Total à payer</span>
                    <span className="text-[22px] font-black text-custom-green-500 tabular-nums">{fmt(total)} FCFA</span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-[11px] text-custom-green-500 font-semibold mt-0.5 text-right">
                      Économisez {fmt(totalSavings)} FCFA
                    </p>
                  )}
                </div>

                {/* Code promo */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    placeholder="Code promo"
                    className="flex-1 h-10 border border-gray-200 rounded-lg px-3 text-[12px] focus:outline-none focus:border-custom-green-500"
                  />
                  <button className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-[12px] font-semibold hover:bg-gray-200 transition-colors">
                    Appliquer
                  </button>
                </div>

                {/* Badge sécurité */}
                <div className="flex items-start gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-custom-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-gray-800">Paiements 100% sécurisés</p>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Vos informations sont protégées et vos paiements sont sécurisés.
                    </p>
                  </div>
                </div>

                {/* Bouton */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (needsProof && !proofFile)}
                  className="w-full h-[52px] bg-custom-green-500 hover:bg-custom-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors mt-4"
                >
                  {isSubmitting
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Lock className="w-5 h-5" />
                  }
                  Passer au paiement
                </button>

                <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
                  En passant commande, vous acceptez nos{' '}
                  <button onClick={() => navigate('/terms')} className="text-custom-green-500 underline">Conditions générales de vente</button>
                  {' '}et{' '}
                  <button onClick={() => navigate('/privacy')} className="text-custom-green-500 underline">Politique de confidentialité</button>
                </p>
              </div>
            </div>
          </div>

          {/* Barre de confiance basse */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 py-6 border-t border-gray-100">
            {[
              { icon: Truck,       title: 'Livraison rapide',   sub: 'Partout à Brazzaville et au Congo' },
              { icon: ShieldCheck, title: 'Paiements sécurisés', sub: 'Payez en toute confiance par mobile money ou carte' },
              { icon: RotateCcw,  title: 'Retour facile',       sub: 'Retour gratuit sous 7 jours' },
              { icon: Headphones, title: 'Besoin d\'aide ?',    sub: 'Notre service client est là pour vous accompagner' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-800 leading-tight">{title}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default CartCheckoutPage;
