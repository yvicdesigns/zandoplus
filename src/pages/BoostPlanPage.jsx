import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Rocket, ArrowRight, CheckCircle, Zap } from 'lucide-react';

const BoostPlanPage = () => {
  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.95 },
  };

  const pageTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  };

  const features = [
    'Jusqu\'à 20 annonces actives',
    'Annonces mises en avant sur la page d\'accueil',
    'Badge "Vendeur Boost" sur votre profil',
    'Support prioritaire par e-mail',
    'Statistiques de base des annonces',
  ];

  return (
    <>
      <Helmet>
        <title>Plan Boost Activé - Zando+ Congo</title>
        <meta name="description" content="Félicitations ! Votre plan Boost est activé. Profitez de fonctionnalités premium pour booster vos ventes sur Zando+ Congo." />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-20 lg:py-24 text-center"
      >
        <motion.div
          className="inline-block p-4 bg-yellow-100 rounded-full mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}
        >
          <Rocket className="w-16 h-16 text-yellow-500" />
        </motion.div>

        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }}
        >
          Votre compte est <span className="gradient-text">Boosté !</span>
        </motion.h1>

        <motion.p 
          className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } }}
        >
          Félicitations et bienvenue dans le programme Boost ! Vous avez débloqué des outils puissants pour augmenter votre visibilité et vos ventes.
        </motion.p>

        <motion.div 
          className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-10 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } }}
        >
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-xl font-bold text-gray-800">Vos avantages Boost :</h3>
          </div>
          <ul className="space-y-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-custom-green-500 mt-1 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6 } }}
        >
          <Button asChild size="lg" className="gradient-bg text-white hover:opacity-90 rounded-full px-8 py-4 text-lg font-semibold">
            <Link to="/post-ad">
              Publier une annonce
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-4 text-lg font-semibold border-2 border-custom-green-300 hover:bg-custom-green-50 text-custom-green-600 hover:text-custom-green-700">
            <Link to="/profile">
              Voir mon profil
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default BoostPlanPage;