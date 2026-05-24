import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Zap, Star, CheckCircle2, Loader2, ShieldCheck, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';

const PLANS = [
  {
    id: 'starter',
    name: 'Vedette',
    price: '5 000',
    duration: '7 jours',
    color: 'border-custom-green-400',
    badge: 'bg-custom-green-500',
    icon: Zap,
    features: [
      'Apparaît dans "Boutiques Vedettes" sur la page d\'accueil',
      'Badge "Vedette" sur votre profil',
      'Visibilité pendant 7 jours',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '15 000',
    duration: '30 jours',
    color: 'border-amber-400',
    badge: 'bg-amber-500',
    icon: Star,
    popular: true,
    features: [
      'Position prioritaire dans "Boutiques Vedettes"',
      'Badge "Premium" doré sur votre profil',
      'Visibilité pendant 30 jours',
      'Mise en avant sur la page des annonces',
    ],
  },
];

const BENEFITS = [
  { icon: Eye, label: 'Plus de visibilité', desc: 'Votre boutique affichée en tête de page' },
  { icon: TrendingUp, label: 'Plus de ventes', desc: 'Les boutiques vedettes reçoivent 3× plus de visites' },
  { icon: ShieldCheck, label: 'Confiance', desc: 'Badge officiel qui rassure les acheteurs' },
];

const ShopBoostPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('premium');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('shop_boosts').insert({
        seller_id: user.id,
        plan:      selected,
        status:    'pending',
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-gray-600 mb-6">
            Notre équipe examinera votre demande dans les prochaines 24h.
            Une fois approuvée, votre boutique sera mise en avant sur Zando+.
          </p>
          <Button onClick={() => navigate('/profile')} className="gradient-bg text-white hover:opacity-90">
            Retour au profil
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mettre ma boutique en avant — Zando+ Congo</title>
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5" /> Boutiques Vedettes
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Donnez de la <span className="gradient-text">visibilité</span> à votre boutique
          </h1>
          <p className="text-gray-600">
            Apparaissez en section "Boutiques Vedettes" sur la page d'accueil de Zando+ et touchez des milliers d'acheteurs congolais.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3">
          {BENEFITS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-custom-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-800">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Choisissez votre formule</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const active = selected === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                    active ? plan.color + ' shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                      RECOMMANDÉ
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 ${plan.badge} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.duration}</p>
                    </div>
                    <p className="ml-auto text-lg font-bold text-gray-900">{plan.price} <span className="text-xs font-normal text-gray-500">FCFA</span></p>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-custom-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Comment ça marche :</strong> soumettez votre demande → notre équipe l'examine et vous contacte pour le paiement → votre boutique est mise en avant dès validation.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading || !user}
            className="w-full gradient-bg hover:opacity-90 text-white font-semibold py-5"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi…</>
              : <>Soumettre ma demande — Formule {PLANS.find(p => p.id === selected)?.name}</>
            }
          </Button>
          {!user && <p className="text-xs text-center text-red-500">Connectez-vous pour soumettre une demande.</p>}
        </div>
      </div>
    </>
  );
};

export default ShopBoostPage;
