import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchCityDeliveryConfig } from '@/lib/deliveryUtils';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, CheckCircle, Loader2, Truck,
  Copy, UploadCloud, Headphones, RotateCcw, Lock,
  Plus, MapPin, Pencil, Home, Building2,
} from 'lucide-react';

const COMMISSION_RATE = 0.10;
const fmt = (n) => (n ?? 0).toLocaleString('fr-FR');

/* ── Logos paiement ── */
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
  <div className="bg-yellow-400 rounded px-2 py-0.5">
    <span className="font-black text-[10px] text-black leading-none block">MTN<br />Money</span>
  </div>
);
const LogoAirtel = () => (
  <div className="bg-red-600 rounded px-2 py-0.5">
    <span className="font-black text-[10px] text-white leading-none block">airtel<br />money</span>
  </div>
);
const LogoCOD = () => (
  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-[18px]">💵</div>
);

const PAYMENT_METHODS = [
  { id: 'visa',   label: 'Carte bancaire',          sub: 'Visa, MasterCard et autres',     Logo: LogoVisa,   disabled: true  },
  { id: 'mtn',    label: 'Mobile Money (MTN)',       sub: 'Payez avec votre compte MTN',    Logo: LogoMTN,    disabled: false },
  { id: 'airtel', label: 'Mobile Money (Airtel)',    sub: 'Payez avec votre compte Airtel', Logo: LogoAirtel, disabled: false },
  { id: 'cod',    label: 'Paiement à la livraison', sub: 'Payez en espèces à la réception', Logo: LogoCOD,   disabled: false },
];

const LABEL_ICONS = { 'Maison': Home, 'Bureau': Building2, 'Autre': MapPin };

/* ── Stepper ── */
const Step = ({ n, label, status }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${
      status === 'done'   ? 'bg-custom-green-500 text-white' :
      status === 'active' ? 'bg-custom-green-500 text-white' :
                            'border-2 border-gray-200 text-gray-400'
    }`}>
      {status === 'done' ? <CheckCircle className="w-4 h-4" /> : n}
    </div>
    <span className={`text-[13px] font-semibold whitespace-nowrap ${
      status === 'active' ? 'text-gray-900' :
      status === 'done'   ? 'text-custom-green-600' : 'text-gray-400'
    }`}>{label}</span>
  </div>
);

/* ── Formulaire adresse ── */
const AddressForm = ({ initial = {}, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    label: initial.label || 'Maison',
    full_name: initial.full_name || '',
    phone: initial.phone || '',
    street: initial.street || '',
    city: initial.city || 'Brazzaville',
    is_default: initial.is_default || false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50 mt-3">
      {/* Label */}
      <div className="flex gap-2">
        {['Maison', 'Bureau', 'Autre'].map(l => (
          <button
            key={l}
            type="button"
            onClick={() => set('label', l)}
            className={`flex-1 h-9 rounded-lg text-[12px] font-semibold border-2 transition-colors ${
              form.label === l
                ? 'border-custom-green-500 bg-green-50 text-custom-green-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text" placeholder="Nom complet" value={form.full_name}
          onChange={e => set('full_name', e.target.value)}
          className="h-10 border border-gray-200 rounded-lg px-3 text-[12px] focus:outline-none focus:border-custom-green-500 bg-white"
        />
        <input
          type="tel" placeholder="+242 06 000 00 00" value={form.phone}
          onChange={e => set('phone', e.target.value)}
          className="h-10 border border-gray-200 rounded-lg px-3 text-[12px] focus:outline-none focus:border-custom-green-500 bg-white"
        />
      </div>
      <input
        type="text" placeholder="Adresse complète (avenue, quartier...)" value={form.street}
        onChange={e => set('street', e.target.value)}
        className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[12px] focus:outline-none focus:border-custom-green-500 bg-white"
      />
      <input
        type="text" placeholder="Ville" value={form.city}
        onChange={e => set('city', e.target.value)}
        className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[12px] focus:outline-none focus:border-custom-green-500 bg-white"
      />
      <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
        <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)}
          className="accent-custom-green-500" />
        Définir comme adresse par défaut
      </label>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={loading || !form.full_name || !form.street}
          className="flex-1 h-10 bg-custom-green-500 text-white rounded-lg text-[13px] font-bold hover:bg-custom-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
        </button>
        {onCancel && (
          <button onClick={onCancel}
            className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const { items, itemsBySeller, subtotal, clearCart, ZANDO_DELIVERY_FEE } = useCart();
  const fileInputRef = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentNumber, setPaymentNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const [promoCode, setPromoCode] = useState('');
  const [cityConfig, setCityConfig] = useState(null);

  const sellerGroups = Object.values(itemsBySeller);
  const deliveryTotal = sellerGroups.length * ZANDO_DELIVERY_FEE;
  const total = subtotal + deliveryTotal;

  const totalSavings = items.reduce((acc, item) =>
    item.original_price > item.price ? acc + (item.original_price - item.price) : acc, 0);

  /* Chargement */
  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    if (items.length === 0) { navigate('/cart'); return; }

    supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single()
      .then(({ data }) => { if (data?.whatsapp_number) setPaymentNumber(data.whatsapp_number); });

    loadAddresses();
  }, [user, items]);

  const loadAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    if (data) {
      setAddresses(data);
      const def = data.find(a => a.is_default) || data[0];
      if (def) {
        setSelectedAddressId(def.id);
        const conf = await fetchCityDeliveryConfig(supabase, def.city);
        setCityConfig(conf);
      }
      if (data.length === 0) setShowAddForm(true);
    }
  };

  const handleSaveAddress = async (form) => {
    setSavingAddress(true);
    try {
      if (form.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { data, error } = await supabase.from('user_addresses')
        .insert({ ...form, user_id: user.id })
        .select('*').single();
      if (error) throw error;
      setShowAddForm(false);
      await loadAddresses();
      setSelectedAddressId(data.id);
      toast({ title: 'Adresse ajoutée !' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSavingAddress(false);
    }
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
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (!selectedAddressId && addresses.length > 0) {
      toast({ title: 'Adresse requise', description: 'Veuillez sélectionner une adresse de livraison.', variant: 'destructive' });
      submittingRef.current = false;
      return;
    }
    if (['mtn', 'airtel'].includes(paymentMethod) && !proofFile) {
      toast({ title: 'Capture requise', description: 'Veuillez uploader la preuve de paiement.', variant: 'destructive' });
      submittingRef.current = false;
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);

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
        const itemsTotal  = group.items.reduce((s, i) => s + i.price, 0);
        const sellerTotal = itemsTotal + ZANDO_DELIVERY_FEE;
        const firstItem   = group.items[0];

        const { data: tx, error: txError } = await supabase.from('transactions_escrow').insert({
          annonce_id: firstItem.id,
          acheteur_id: user.id,
          vendeur_id: group.seller_id,
          montant: sellerTotal,
          commission_amount: Math.round(itemsTotal * COMMISSION_RATE),
          delivery_choice: 'zando',
          delivery_fee_paid: ZANDO_DELIVERY_FEE,
          statut: paymentMethod === 'cod' ? 'cod_pending' : 'fonds_bloques',
          preuve_paiement_url: publicUrl,
          date_limite_confirmation: dateLimit.toISOString(),
          cart_payment_id: payment.id,
          delivery_address: selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : null,
        }).select('id').single();
        if (txError) throw txError;

        // Email vendeur
        supabase.functions.invoke('notify-purchase', {
          body: {
            buyer_id: user.id,
            seller_id: group.seller_id,
            listing_title: firstItem.title,
            listing_price: sellerTotal,
            currency: firstItem.currency || 'FCFA',
            transaction_id: tx.id,
          },
        }).catch(() => {});
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  /* ── Confirmation ── */
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-page-bg">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Commande confirmée !</h2>
        <p className="text-gray-600 mb-2">Votre paiement de <strong>{fmt(total)} FCFA</strong> est sécurisé chez Zando+.</p>
        <p className="text-gray-500 text-sm mb-6">Chaque vendeur sera notifié pour préparer sa livraison.</p>
        <button onClick={() => navigate('/transactions')}
          className="w-full h-12 bg-custom-green-500 text-white rounded-xl font-bold mb-3">
          Suivre mes transactions
        </button>
        <button onClick={() => navigate('/listings')}
          className="w-full h-12 border border-gray-200 text-gray-700 rounded-xl font-semibold">
          Continuer les achats
        </button>
      </div>
    </div>
  );

  const needsProof = ['mtn', 'airtel'].includes(paymentMethod);

  return (
    <>
      <Helmet><title>Passer commande — Zando+</title></Helmet>
      <div className="bg-page-bg min-h-screen py-8">
        <div className="max-w-[1280px] mx-auto px-6">

          <h1 className="text-[24px] font-black text-gray-900 mb-6">Passer commande</h1>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            <Step n={1} label="Panier"       status="done"    />
            <div className="flex-1 h-px bg-custom-green-500" />
            <Step n={2} label="Livraison"    status="active"  />
            <div className="flex-1 h-px bg-gray-200" />
            <Step n={3} label="Paiement"     status="pending" />
            <div className="flex-1 h-px bg-gray-200" />
            <Step n={4} label="Confirmation" status="pending" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ══ GAUCHE ══ */}
            <div className="lg:col-span-8 space-y-5">

              {/* ── Adresse + Mode de livraison côte à côte ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Colonne 1 — Adresse de livraison */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h2 className="text-[15px] font-black text-gray-900 mb-4">Adresse de livraison</h2>

                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {addresses.map(addr => {
                        const Icon = LABEL_ICONS[addr.label] || MapPin;
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-custom-green-500 bg-green-50'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="radio" name="address" checked={isSelected}
                              onChange={async () => { setSelectedAddressId(addr.id); const conf = await fetchCityDeliveryConfig(supabase, addr.city); setCityConfig(conf); }}
                              className="accent-custom-green-500 w-4 h-4 mt-0.5 flex-shrink-0"
                            />
                            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[12px] font-bold text-gray-900">{addr.label}</p>
                                {addr.is_default && (
                                  <span className="text-[9px] font-bold text-custom-green-600 bg-green-50 border border-custom-green-200 px-1.5 py-0.5 rounded-full">
                                    Par défaut
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">{addr.street}</p>
                              <p className="text-[11px] text-gray-500">{addr.city}</p>
                              {addr.phone && <p className="text-[11px] text-gray-400">{addr.phone}</p>}
                            </div>
                            <button
                              onClick={e => { e.preventDefault(); }}
                              className="text-[11px] text-gray-400 hover:text-custom-green-500 flex items-center gap-0.5 flex-shrink-0"
                            >
                              <Pencil className="w-3 h-3" /> Modifier
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {!showAddForm ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center justify-center gap-2 h-10 border-2 border-dashed border-gray-200 rounded-xl text-[12px] font-semibold text-custom-green-600 hover:border-custom-green-400 hover:bg-green-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter une nouvelle adresse
                    </button>
                  ) : (
                    <AddressForm
                      onSave={handleSaveAddress}
                      onCancel={addresses.length > 0 ? () => setShowAddForm(false) : null}
                      loading={savingAddress}
                    />
                  )}
                </div>

                {/* Colonne 2 — Mode de livraison */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h2 className="text-[15px] font-black text-gray-900 mb-4">Mode de livraison</h2>
                  <label className="flex items-center justify-between p-3 rounded-xl border-2 border-custom-green-500 bg-green-50 cursor-default">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked readOnly className="accent-custom-green-500 w-4 h-4" />
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-4 h-4 text-custom-green-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">Livraison Zando+</p>
                        <p className="text-[11px] text-gray-500">Livraison à domicile dans votre ville</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-gray-900 text-right leading-tight">
                      {fmt(ZANDO_DELIVERY_FEE)}<br/>
                      <span className="text-[10px] font-normal text-gray-400">FCFA/vendeur</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* ── Méthode de paiement ── */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[15px] font-black text-gray-900 mb-4">Méthode de paiement</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.filter(m => m.id !== 'cod' || !cityConfig || cityConfig.cod_enabled).map(({ id, label, sub, Logo, disabled }) => (
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
                          type="radio" name="payment"
                          checked={!disabled && paymentMethod === id}
                          onChange={() => { if (!disabled) { setPaymentMethod(id); setProofFile(null); } }}
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

                {/* Instructions Mobile Money */}
                {needsProof && (
                  <div className="mt-5 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="font-semibold text-blue-800 text-[13px] mb-3">Étapes du paiement</p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[12px] text-blue-700">
                        <li>Ouvrez <strong>{paymentMethod === 'mtn' ? 'MTN Money' : 'Airtel Money'}</strong></li>
                        <li>Envoyez <strong>{fmt(total)} FCFA</strong> au numéro Zando+ :</li>
                      </ol>
                      <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 mt-2">
                        <span className="font-mono font-bold text-blue-900 flex-1 text-[14px]">
                          {paymentNumber || 'Chargement...'}
                        </span>
                        <button onClick={copyNumber} className="p-1 hover:bg-blue-50 rounded">
                          <Copy className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700 mb-2">
                        Preuve de paiement <span className="text-red-500">*</span>
                      </p>
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
                      Vous payerez <strong>{fmt(total)} FCFA</strong> en espèces directement au livreur lors de la réception.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ══ DROITE — Résumé ══ */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-black text-gray-900">Résumé de la commande</h2>
                  <span className="text-[12px] text-gray-400">{items.length} article{items.length > 1 ? 's' : ''}</span>
                </div>

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
                      <span className="text-[13px] font-bold text-gray-900 flex-shrink-0">{fmt(item.price)} FCFA</span>
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
                    <span className="font-semibold">{fmt(deliveryTotal)} FCFA</span>
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
                    type="text" value={promoCode}
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

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (needsProof && !proofFile)}
                  className="w-full h-[52px] bg-custom-green-500 hover:bg-custom-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Passer au paiement
                </button>

                <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
                  En passant commande, vous acceptez nos{' '}
                  <button onClick={() => navigate('/terms')} className="text-custom-green-500 underline">Conditions générales</button>
                  {' '}et{' '}
                  <button onClick={() => navigate('/privacy')} className="text-custom-green-500 underline">Politique de confidentialité</button>
                </p>
              </div>
            </div>
          </div>

          {/* Barre de confiance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 py-6 border-t border-gray-100">
            {[
              { icon: Truck,       title: 'Livraison rapide',    sub: 'Partout à Brazzaville et au Congo' },
              { icon: ShieldCheck, title: 'Paiements sécurisés', sub: 'Payez en toute confiance par mobile money' },
              { icon: RotateCcw,   title: 'Retour facile',       sub: 'Retour gratuit sous 7 jours' },
              { icon: Headphones,  title: 'Besoin d\'aide ?',    sub: 'Notre service client est là pour vous' },
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
