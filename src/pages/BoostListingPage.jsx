import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Zap, Flame, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PLANS = [
  {
    id: 'simple',
    label: 'Boost Simple',
    icon: Zap,
    price: 500,
    days: 7,
    color: 'amber',
    description: 'Votre annonce apparaît en tête des résultats.',
    perks: [
      'Affiché en premier dans les résultats',
      'Badge "Boosté ⚡" visible',
      'Mis en avant dans sa catégorie',
      'Durée : 7 jours',
    ],
  },
  {
    id: 'urgent',
    label: 'Boost Urgent',
    icon: Flame,
    price: 2000,
    days: 7,
    color: 'red',
    badge: 'Recommandé',
    description: 'Visibilité maximale — popup au chargement du site.',
    perks: [
      'Popup automatique pour tous les visiteurs',
      'Badge "Urgent 🔥" rouge animé',
      'Affiché en premier dans les résultats',
      'Section "Offres Urgentes" sur l\'accueil',
      'Durée : 7 jours',
    ],
  },
];

const BoostListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('urgent');
  const [activeBoost, setActiveBoost]   = useState(null);
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

  const handleBoost = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    setIsProcessing(true);
    try {
      const { data: boost, error } = await supabase
        .from('ad_boosts')
        .insert({
          annonce_id: listing.id,
          user_id:    user.id,
          montant:    plan.price,
          statut:     'pending',
          boost_type: plan.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      navigate('/boost-payment', {
        state: {
          boostId:      boost.id,
          listingId:    listing.id,
          listingTitle: listing.title,
          amount:       plan.price,
          days:         plan.days,
          boostType:    plan.id,
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

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <>
      <Helmet><title>Booster l'annonce — Zando+</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          <h1 className="text-[22px] font-black text-gray-900 mb-1">Booster votre annonce</h1>
          <p className="text-[13px] text-gray-400 mb-6">Choisissez un plan pour augmenter la visibilité de votre annonce.</p>

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

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {PLANS.map(p => {
              const Icon = p.icon;
              const isSelected = selectedPlan === p.id;
              const isRed = p.color === 'red';
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? isRed
                        ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                        : 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isRed ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isRed ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <p className="text-[15px] font-black text-gray-900 mb-0.5">{p.label}</p>
                  <p className="text-[11px] text-gray-400 mb-3">{p.description}</p>
                  <p className={`text-[22px] font-black mb-3 ${isRed ? 'text-red-500' : 'text-amber-500'}`}>
                    {p.price.toLocaleString('fr-FR')} FCFA
                    <span className="text-[11px] font-semibold text-gray-400 ml-1">/ {p.days} jours</span>
                  </p>
                  <ul className="space-y-1.5">
                    {p.perks.map(perk => (
                      <li key={perk} className="flex items-start gap-2 text-[11px] text-gray-600">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isRed ? 'text-red-400' : 'text-amber-400'}`} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={handleBoost}
            disabled={isProcessing || !!activeBoost}
            className={`w-full h-14 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              plan.color === 'red'
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-amber-400 hover:bg-amber-500 shadow-lg shadow-amber-200'
            }`}
          >
            {isProcessing
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : plan.color === 'red' ? <Flame className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            {activeBoost
              ? 'Boost déjà actif'
              : `Continuer avec ${plan.label} — ${plan.price.toLocaleString()} FCFA`}
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
