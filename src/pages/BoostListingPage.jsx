import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Zap, Flame, ShieldCheck, CheckCircle, Loader2, Plus, Minus } from 'lucide-react';
import { fbTrack } from '@/components/analytics/MetaPixel';
import { ttqTrack } from '@/components/analytics/TikTokPixel';
import { Helmet } from 'react-helmet-async';

const TYPES = [
  {
    id: 'simple',
    label: 'Boost Simple',
    icon: Zap,
    ratePerDay: 150,
    color: 'amber',
    description: 'Votre annonce apparaît en tête des résultats.',
    perks: [
      'Affiché en premier dans les résultats',
      'Badge "Boosté ⚡" visible',
      'Mis en avant dans sa catégorie',
    ],
  },
  {
    id: 'urgent',
    label: 'Boost Urgent',
    icon: Flame,
    ratePerDay: 300,
    color: 'red',
    badge: 'Recommandé',
    description: 'Visibilité maximale — popup au chargement du site.',
    perks: [
      'Popup automatique pour tous les visiteurs',
      'Badge "Urgent 🔥" rouge animé',
      'Section "Offres Urgentes" sur l\'accueil',
    ],
  },
];

const QUICK_DURATIONS = [
  { days: 1,  label: '1 jour' },
  { days: 3,  label: '3 jours' },
  { days: 7,  label: '1 semaine' },
  { days: 14, label: '2 semaines' },
  { days: 30, label: '1 mois' },
  { days: 90, label: '3 mois' },
];

const formatDuration = (days) => {
  if (days === 1)  return '1 jour';
  if (days < 7)   return `${days} jours`;
  if (days === 7)  return '7 jours (1 semaine)';
  if (days === 14) return '14 jours (2 semaines)';
  if (days === 30) return '30 jours (1 mois)';
  if (days === 60) return '60 jours (2 mois)';
  if (days === 90) return '90 jours (3 mois)';
  if (days % 30 === 0) return `${days} jours (${days / 30} mois)`;
  if (days % 7 === 0)  return `${days} jours (${days / 7} sem.)`;
  return `${days} jours`;
};

const BoostListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedType, setSelectedType] = useState('urgent');
  const [days, setDays]               = useState(1);
  const [activeBoost, setActiveBoost] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: listingData, error } = await supabase
        .from('listings')
        .select('id, title, images, user_id')
        .eq('id', listingId)
        .single();

      if (error || !listingData) {
        toast({ title: 'Erreur', description: 'Annonce introuvable.', variant: 'destructive' });
        navigate('/profile');
        return;
      }
      if (listingData.user_id !== user.id) {
        toast({ title: 'Accès refusé', variant: 'destructive' });
        navigate('/');
        return;
      }
      setListing(listingData);

      const { data: boostData } = await supabase
        .from('ad_boosts')
        .select('id, date_fin, statut, boost_type')
        .eq('annonce_id', listingId)
        .eq('statut', 'active')
        .maybeSingle();
      setActiveBoost(boostData);
      setLoading(false);
    };
    fetchData();
  }, [listingId, user, navigate, toast]);

  const type = TYPES.find(t => t.id === selectedType);
  const totalPrice = type.ratePerDay * days;

  const adjustDays = (delta) => {
    setDays(d => Math.max(1, Math.min(365, d + delta)));
  };

  const handleDaysInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setDays(Math.max(1, Math.min(365, val)));
  };

  const handleBoost = async () => {
    setIsProcessing(true);
    try {
      const { data: boost, error } = await supabase
        .from('ad_boosts')
        .insert({
          annonce_id: listing.id,
          user_id:    user.id,
          montant:    totalPrice,
          statut:     'pending',
          boost_type: selectedType,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Pixels — InitiateCheckout
      fbTrack('InitiateCheckout', { value: totalPrice, currency: 'XAF', content_name: listing.title, num_items: 1 });
      ttqTrack('InitiateCheckout', { value: totalPrice, currency: 'XAF', content_name: listing.title });

      navigate('/boost-payment', {
        state: {
          boostId:      boost.id,
          listingId:    listing.id,
          listingTitle: listing.title,
          amount:       totalPrice,
          days,
          boostType:    selectedType,
        },
      });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  const isRed = type.color === 'red';
  const accentColor = isRed ? 'red' : 'amber';

  return (
    <>
      <Helmet><title>Booster l'annonce — Zando+</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          <h1 className="text-[22px] font-black text-gray-900 mb-1">Booster votre annonce</h1>
          <p className="text-[13px] text-gray-400 mb-3">Choisissez le type et la durée de votre boost.</p>

          {/* Prix d'entrée bien visible */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-[13px] font-black text-green-800">À partir de 150 FCFA seulement</p>
              <p className="text-[11px] text-green-700">Vous pouvez booster pour <strong>1 seul jour</strong> — testez et voyez la différence !</p>
            </div>
          </div>

          {/* Annonce */}
          <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl mb-6 shadow-sm">
            <img
              src={listing.images?.[0] || 'https://via.placeholder.com/80'}
              alt={listing.title}
              className="w-14 h-14 object-cover rounded-xl border"
            />
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Annonce sélectionnée</p>
              <p className="text-[14px] font-bold text-gray-900 line-clamp-1">{listing.title}</p>
            </div>
          </div>

          {/* Boost actif */}
          {activeBoost && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
              <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-amber-800">
                  {activeBoost.boost_type === 'urgent' ? 'Boost Urgent actif' : 'Boost Simple actif'}
                </p>
                <p className="text-[11px] text-amber-700">
                  Expire le {new Date(activeBoost.date_fin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 1 : Type de boost ── */}
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">1 — Type de boost</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {TYPES.map(t => {
              const Icon = t.icon;
              const isSelected = selectedType === t.id;
              const red = t.color === 'red';
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? red
                        ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                        : 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {t.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {t.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${red ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Icon className={`w-5 h-5 ${red ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <p className="text-[15px] font-black text-gray-900 mb-0.5">{t.label}</p>
                  <p className="text-[11px] text-gray-400 mb-3">{t.description}</p>
                  <p className={`text-[13px] font-bold mb-3 ${red ? 'text-red-500' : 'text-amber-500'}`}>
                    {t.ratePerDay.toLocaleString('fr-FR')} FCFA / jour
                  </p>
                  <ul className="space-y-1.5">
                    {t.perks.map(perk => (
                      <li key={perk} className="flex items-start gap-2 text-[11px] text-gray-600">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${red ? 'text-red-400' : 'text-amber-400'}`} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* ── ÉTAPE 2 : Durée ── */}
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">2 — Durée du boost</p>

          {/* Raccourcis rapides */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_DURATIONS.map(q => (
              <button
                key={q.days}
                onClick={() => setDays(q.days)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                  days === q.days
                    ? isRed
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-amber-400 text-white border-amber-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Stepper libre */}
          <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl mb-6">
            <button
              onClick={() => adjustDays(-1)}
              disabled={days <= 1}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={days}
                  onChange={handleDaysInput}
                  min={1}
                  max={365}
                  className="w-20 text-center text-[28px] font-black text-gray-900 bg-transparent border-none outline-none"
                />
                <span className="text-[14px] font-semibold text-gray-400">jour{days > 1 ? 's' : ''}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{formatDuration(days)}</p>
            </div>

            <button
              onClick={() => adjustDays(1)}
              disabled={days >= 365}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* ── Récapitulatif prix ── */}
          <div className={`p-4 rounded-2xl mb-6 border ${isRed ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-gray-600">
                {type.ratePerDay.toLocaleString('fr-FR')} FCFA × {days} jour{days > 1 ? 's' : ''}
              </span>
              <span className={`text-[24px] font-black ${isRed ? 'text-red-500' : 'text-amber-500'}`}>
                {totalPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {type.label} — {formatDuration(days)}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleBoost}
            disabled={isProcessing || !!activeBoost}
            className={`w-full h-14 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              isRed
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-amber-400 hover:bg-amber-500 shadow-lg shadow-amber-200'
            }`}
          >
            {isProcessing
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : isRed ? <Flame className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            {activeBoost
              ? 'Boost déjà actif'
              : `Continuer — ${totalPrice.toLocaleString('fr-FR')} FCFA`}
          </button>

          <div className="flex items-center justify-center text-[11px] text-gray-400 gap-1 mt-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Paiement via Airtel Money ou MTN Money
          </div>

        </div>
      </div>
    </>
  );
};

export default BoostListingPage;
