import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, ShieldCheck, BadgePercent, ArrowRight } from 'lucide-react';
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

  return (
    <>
      <Helmet>
        <title>Tarifs et Services - Zando+ Congo</title>
        <meta name="description" content="Publiez gratuitement et sans limite sur Zando+ Congo. Boostez votre visibilité dès 150 FCFA par jour. Découvrez tous nos services pour vendre plus vite." />
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
              Publication illimitée, aucun abonnement, aucune limite d'annonces. Vous payez uniquement si vous vendez.
            </motion.p>
          </div>
        </section>

        {/* Gratuit en avant */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              className="bg-gradient-to-br from-custom-green-50 to-emerald-50 border border-custom-green-200 rounded-2xl p-10 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-custom-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-9 h-9 text-custom-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Publication gratuite et illimitée</h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
                Publiez autant d'annonces que vous voulez, sans frais d'inscription, sans abonnement mensuel. Votre compte est gratuit pour toujours.
              </p>
              <ul className="inline-flex flex-col items-start gap-3 text-left mb-8">
                {[
                  'Annonces illimitées',
                  'Photos de vos produits',
                  'Messagerie avec les acheteurs',
                  'Suivi de vos transactions',
                  'Notifications en temps réel',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-custom-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="gradient-bg hover:opacity-90 rounded-full px-8 font-bold text-base"
                onClick={() => user ? navigate('/post-ad') : openAuthModal()}
              >
                Publier une annonce gratuite
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Services payants */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Allez plus loin</h2>
              <p className="text-gray-500 text-lg">Des options pour vendre plus vite et renforcer la confiance des acheteurs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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
                <ul className="space-y-2 mb-8">
                  {['Badge jaune visible', 'Mis en avant dans la catégorie', 'Durée flexible'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-custom-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
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
                <ul className="space-y-2 mb-8">
                  {['Badge rouge animé "URGENT"', 'Popup vu par tous les visiteurs', 'Tête de page d\'accueil', 'Durée flexible'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-red-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleBoost}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
                >
                  Booster en urgence
                </Button>
              </motion.div>

              {/* Vendeur Vérifié */}
              <motion.div
                className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Vendeur Vérifié</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">10 000 FCFA</span>
                  <span className="text-gray-400 font-medium"> unique</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 flex-grow">Un badge de confiance affiché sur votre profil et toutes vos annonces. Payez une seule fois, le badge reste à vie.</p>
                <ul className="space-y-2 mb-8">
                  {['Badge vérifié sur le profil', 'Badge sur chaque annonce', 'Délai de traitement 1 à 2 jours', 'Paiement unique'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleVerification}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
                >
                  Obtenir le badge
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
              <p className="text-gray-600 text-lg leading-relaxed">
                Lorsqu'un acheteur utilise l'Achat Sécurisé Zando, une commission de <strong>10%</strong> est déduite du montant reversé au vendeur. L'acheteur paie toujours le prix affiché sans surcoût. Cette commission couvre la protection des fonds, le service de livraison et le support en cas de litige.
              </p>
            </motion.div>
          </div>
        </section>

      </motion.div>
    </>
  );
};

export default PricingPage;
