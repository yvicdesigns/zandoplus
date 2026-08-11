import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShoppingBag, MessageCircle, Truck, Shield, ChevronRight, BadgeCheck, User, Phone, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BENEFITS = [
  { icon: ShoppingBag, title: 'Publication gratuite et illimitée', desc: 'Publiez autant d\'annonces que vous voulez, sans frais ni abonnement.' },
  { icon: MessageCircle, title: 'Messagerie intégrée', desc: 'Discutez directement avec vos acheteurs depuis l\'application.' },
  { icon: Truck, title: 'Livraison Zando+', desc: 'Proposez la livraison à Brazzaville — Zando+ s\'occupe du reste.' },
  { icon: Shield, title: 'Paiement sécurisé', desc: 'Recevez vos paiements via MoMo ou via l\'Achat Sécurisé Zando+.' },
];

const BecomeSellerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ full_name: '', phone: '', location: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Le nom complet est requis.';
    if (!form.phone.trim()) e.phone = 'Le numéro de téléphone est requis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleActivate = async () => {
    if (!user) { navigate('/'); return; }
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          is_seller: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Espace vendeur activé !', description: 'Vous pouvez maintenant publier vos annonces.', className: 'toast-success' });
      setTimeout(() => { window.location.href = '/espace-vendeur'; }, 800);
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'activer le mode vendeur.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Devenir vendeur — Zando+ Congo</title>
        <meta name="description" content="Vendez vos articles sur Zando+ Congo gratuitement. Publication illimitée, paiement sécurisé, livraison à Brazzaville." />
      </Helmet>

      <div className="min-h-screen bg-page-bg py-10 px-4">
        <div className="max-w-lg mx-auto">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
              <ShoppingBag className="w-8 h-8 text-green-700" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Devenez vendeur sur Zando+</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Complétez vos informations pour activer votre espace vendeur. Gratuit, sans abonnement.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vos informations</p>

            {/* Nom complet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Ex : Jean-Pierre Mavoungou"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-gray-200'} outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors`}
                />
              </div>
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ex : +242 06 000 0000"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'} outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ville <span className="text-gray-400 font-normal">(recommandé)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Ex : Brazzaville"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-base transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            {loading ? 'Activation...' : 'Activer mon espace vendeur'}
          </button>

          {/* Link to certification */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <BadgeCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">Vous voulez le badge Vendeur Certifié ?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                La certification est optionnelle — elle ajoute un badge de confiance sur vos annonces.{' '}
                <button
                  onClick={() => navigate('/verification')}
                  className="underline font-semibold"
                >
                  En savoir plus
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BecomeSellerPage;
