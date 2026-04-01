import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const PricingPage = () => {
  const { user, loading: authLoading, openAuthModal, updateProfile } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const tiers = [
    {
      name: 'Gratuit',
      planKey: 'free',
      price: '0 FCFA',
      frequency: '/pour toujours',
      description: 'Idéal pour les vendeurs occasionnels qui débutent.',
      features: [
        'Jusqu\'à 5 annonces actives',
        'Support standard par e-mail',
        'Visibilité de base dans les recherches',
      ],
      cta: 'Continuer Gratuitement',
      mostPopular: false,
      color: 'gray',
    },
    {
      name: 'Boost',
      planKey: 'boost',
      price: '5,000 FCFA',
      frequency: '/mois',
      description: 'Parfait pour les vendeurs réguliers qui veulent plus de visibilité.',
      features: [
        'Jusqu\'à 20 annonces actives',
        'Annonces mises en avant sur la page d\'accueil (rotation)',
        'Badge "Vendeur Boost" sur le profil',
        'Support prioritaire par e-mail',
        'Statistiques de base des annonces',
      ],
      cta: 'Choisir le Plan Boost',
      mostPopular: true,
      color: 'green',
    },
    {
      name: 'Pro',
      planKey: 'pro',
      price: '15,000 FCFA',
      frequency: '/mois',
      description: 'La solution ultime pour les entreprises et les vendeurs sérieux.',
      features: [
        'Jusqu\'à 100 annonces actives',
        'Annonces premium en haut des résultats de recherche',
        'Badge "Vendeur Pro" vérifié',
        'Support dédié 24/7 par chat et téléphone',
        'Statistiques avancées et rapports de performance',
        'Accès anticipé aux nouvelles fonctionnalités',
      ],
      cta: 'Devenir Pro',
      mostPopular: false,
      color: 'purple',
    },
  ];

  const handleCtaClick = async (tier) => {
    if (authLoading || paymentLoading) return;
    if (!user) {
      openAuthModal();
      return;
    }

    if (tier.planKey === 'free') {
      try {
        if (user.plan !== 'free') {
          await updateProfile({ plan: 'free' });
          toast({ title: 'Plan Mis à Jour', description: 'Vous êtes maintenant sur le plan Gratuit.' });
        }
        navigate('/free-plan');
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de changer de plan.', variant: 'destructive' });
      }
    } else {
      setPaymentLoading(true);
      const amount = parseInt(tier.price.replace(/\D/g, ''), 10);
      const description = `Abonnement au plan ${tier.name}`;
      
      const paymentInfo = {
          amount,
          description,
          plan: tier.planKey,
          type: 'plan'
      };
      localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));
      navigate('/mobile-payment');
      setPaymentLoading(false);
    }
  };


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

  return (
    <>
      <Helmet>
        <title>Nos Offres - Zando+ Congo</title>
        <meta name="description" content="Choisissez le plan parfait pour vendre efficacement sur Zando+ Congo. Des options gratuites aux solutions professionnelles pour booster votre visibilité." />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <section className="relative py-20 lg:py-24 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              Nos <span className="gradient-text">Offres</span>
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Trouvez le plan parfait pour vos besoins. Que vous soyez un vendeur occasionnel ou une entreprise, nous avons une solution pour vous.
            </motion.p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  className={`rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                    tier.mostPopular ? 'border-custom-green-500 shadow-2xl scale-105 relative' : 'border-gray-200 shadow-lg'
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {tier.mostPopular && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-custom-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-2" /> Le plus populaire
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center mb-4">
                        {tier.name === 'Boost' && <Zap className="w-7 h-7 text-yellow-500 mr-2" />}
                        {tier.name === 'Pro' && <Sparkles className="w-7 h-7 text-purple-500 mr-2" />}
                        <h3 className={`text-2xl font-bold ${
                            tier.color === 'green' ? 'text-custom-green-600' :
                            tier.color === 'purple' ? 'text-purple-600' :
                            'text-gray-800'
                        }`}>{tier.name}</h3>
                    </div>
                    <p className="text-gray-500 mb-6">{tier.description}</p>
                    <div className="mb-8">
                      <span className="text-5xl font-extrabold">{tier.price}</span>
                      <span className="text-lg text-gray-500 font-medium">{tier.frequency}</span>
                    </div>
                    <ul className="space-y-4">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-custom-green-500 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    onClick={() => handleCtaClick(tier)}
                    disabled={paymentLoading || (user && user.plan === tier.planKey)}
                    size="lg"
                    className={`w-full mt-10 font-bold text-lg py-6 rounded-lg ${
                      tier.mostPopular
                        ? 'gradient-bg text-white hover:opacity-90'
                        : 'bg-custom-green-100 text-custom-green-700 hover:bg-custom-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {user && user.plan === tier.planKey ? 'Plan Actuel' : (paymentLoading ? 'Chargement...' : tier.cta)}
                    {(!user || (user && user.plan !== tier.planKey)) && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Prêt à Booster Vos <span className="gradient-text">Ventes ?</span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
                Rejoignez des milliers de vendeurs prospères qui ont augmenté leurs ventes avec nos fonctionnalités premium. Commencez dès maintenant !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="gradient-bg text-white hover:opacity-90 rounded-full px-8 py-4 text-base font-semibold" onClick={() => handleCtaClick(tiers.find(t => t.name === 'Boost'))}>
                    Passer au Plan Boost
                  </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </motion.div>
    </>
  );
};

export default PricingPage;