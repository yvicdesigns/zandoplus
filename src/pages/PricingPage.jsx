import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, ShieldCheck, BadgePercent, ArrowRight, Store, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PricingPage = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -30 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8,
  };

  const handleBoost = () => {
    if (!user) { openAuthModal(); return; }
    navigate('/profile?tab=listings');
  };

  const handleVerification = () => {
    if (!user) { openAuthModal(); return; }
    navigate('/verification');
  };

  const sellerTiers = [
    {
      key: 'libre',
      icon: CheckCircle,
      iconBg: 'bg-custom-green-100',
      iconColor: 'text-custom-green-600',
      name: 'Zando Libre',
      price: 'Gratuit',
      priceSub: 'pour toujours',
      desc: "Le compte par défaut de tout vendeur sur Zando+. Aucun frais, aucun engagement.",
      features: [
        "Jusqu'à 15 annonces actives",
        'Messagerie avec les acheteurs',
        'Suivi de vos commandes',
        'Accès à l\'Achat Sécurisé Zando',
      ],
      cta: 'Publier une annonce gratuite',
      onClick: () => (user ? navigate('/post-ad') : openAuthModal()),
      highlight: false,
    },
    {
      key: 'boutique',
      icon: Store,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      name: 'Boutique',
      price: '12 000 FCFA',
      priceSub: '/an',
      desc: 'Pour les vendeurs réguliers qui veulent vendre plus et rassurer davantage leurs acheteurs.',
      features: [
        "Jusqu'à 100 annonces actives",
        'Badge "Boutique Vérifiée" sur le profil et les annonces',
        'Page boutique visible dans "Nos Boutiques"',
        'Vérification d\'identité incluse',
      ],
      cta: 'Passer Boutique',
      onClick: handleVerification,
      highlight: false,
    },
    {
      key: 'entreprise',
      icon: Building2,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      name: 'Entreprise',
      price: '20 000 FCFA',
      priceSub: '/an',
      desc: "Pour les agences, sociétés et gros vendeurs (immobilier, véhicules, boutiques multi-produits).",
      features: [
        "Jusqu'à 500 annonces actives",
        'Badge "Entreprise Vérifiée"',
        'Bannière sur la page d\'accueil',
        '1 boost de 7 jours inclus chaque mois',
        'Vérification d\'identité incluse',
      ],
      cta: 'Passer Entreprise',
      onClick: handleVerification,
      highlight: true,
    },
  ];

  const commissionTiers = [
    { range: 'Moins de 10 000 FCFA', rate: '8%' },
    { range: 'De 10 000 à 200 000 FCFA', rate: '5%' },
    { range: 'Au-delà de 200 000 FCFA', rate: 'Plafonnée à 10 000 FCFA' },
  ];

  return (
    <>
      <Helmet>
        <title>Tarifs et Services - Zando+ Congo</title>
        <meta name="description" content="Publiez gratuitement sur Zando+ Congo jusqu'à 15 annonces. Passez Boutique ou Entreprise pour vendre plus. Boostez votre visibilité dès 150 FCFA par jour." />
        <link rel="canonical" href="https://www.zandopluscg.com/pricing" />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {/* Hero */}
        <section className="relative py-20 lg:py-24 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              Vendre sur Zando+ <span className="gradient-text">c'est gratuit</span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Publiez jusqu'à 15 annonces sans rien payer. Passez Boutique ou Entreprise si vous vendez davantage.
            </motion.p>
          </div>
        </section>

        {/* 3 paliers vendeurs */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Choisissez votre palier</h2>
              <p className="text-gray-500 text-lg">Commencez gratuitement, évoluez quand vous en avez besoin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sellerTiers.map((tier, i) => (
                <motion.div
                  key={tier.key}
                  className={`rounded-2xl p-8 flex flex-col shadow-sm ${tier.highlight ? 'bg-white border-2 border-amber-400 shadow-lg relative' : 'bg-white border border-gray-200'}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {tier.highlight && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Le plus complet
                    </div>
                  )}
                  <div className={`w-12 h-12 ${tier.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                    <tier.icon className={`w-6 h-6 ${tier.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                    <span className="text-gray-400 font-medium"> {tier.priceSub}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 flex-grow">{tier.desc}</p>
                  <ul className="space-y-2 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-custom-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={tier.onClick}
                    className={`w-full font-bold rounded-xl ${tier.highlight ? 'bg-amber-500 hover:bg-amber-600 text-white' : tier.key === 'libre' ? 'gradient-bg hover:opacity-90 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    {tier.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Boosts */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Boostez une annonce</h2>
              <p className="text-gray-500 text-lg">Disponible pour tous les vendeurs, quel que soit votre palier. Un numéro WhatsApp valide est requis avant tout achat de boost.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Boost Simple */}
              <motion.div
                className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Boost Simple</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">150 FCFA</span>
                  <span className="text-gray-400 font-medium"> /jour</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 flex-grow">Votre annonce passe devant les autres dans sa catégorie avec un badge jaune "Boosté". Durée au choix : 1 à 365 jours.</p>
                <Button
                  onClick={handleBoost}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl"
                >
                  Booster une annonce
                </Button>
              </motion.div>

              {/* Boost Urgent */}
              <motion.div
                className="bg-white rounded-2xl border-2 border-red-400 p-8 flex flex-col shadow-lg relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Le plus visible
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Boost Urgent</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">300 FCFA</span>
                  <span className="text-gray-400 font-medium"> /jour</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 flex-grow">Votre annonce apparaît tout en haut de la page d'accueil et dans un popup visible par tous les visiteurs. Badge rouge animé "URGENT".</p>
                <Button
                  onClick={handleBoost}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
                >
                  Booster en urgence
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Commission transparente */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-14 h-14 bg-custom-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <BadgePercent className="w-7 h-7 text-custom-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Commission sur les ventes sécurisées</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Lorsqu'un acheteur utilise l'Achat Sécurisé Zando, une commission est déduite du montant reversé au vendeur — jamais ajoutée au prix payé par l'acheteur. Elle couvre la protection des fonds, la vérification anti-fraude et le support en cas de litige.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden text-left max-w-lg mx-auto">
                {commissionTiers.map((t, i) => (
                  <div key={t.range} className={`flex items-center justify-between px-5 py-3.5 ${i !== commissionTiers.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <span className="text-sm text-gray-700">{t.range}</span>
                    <span className="text-sm font-bold text-custom-green-700">{t.rate}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Vérification simple */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Juste le badge "Vérifié" ?</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Si vous ne voulez ni Boutique ni Entreprise mais simplement rassurer les acheteurs avec un badge de confiance, la vérification simple est disponible pour <strong>10 000 FCFA</strong> (paiement unique, badge à vie).
              </p>
              <Button
                onClick={handleVerification}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 font-bold rounded-xl"
              >
                Obtenir le badge Vérifié
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

      </motion.div>
    </>
  );
};

export default PricingPage;
