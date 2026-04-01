import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PartyPopper, ArrowRight, CheckCircle } from 'lucide-react';

const FreePlanPage = () => {
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
    'Jusqu\'à 5 annonces actives',
    'Support standard par e-mail',
    'Visibilité de base dans les recherches',
  ];

  return (
    <>
      <Helmet>
        <title>Bienvenue sur le Plan Gratuit - Zando+ Congo</title>
        <meta name="description" content="Félicitations ! Vous êtes prêt à commencer à vendre gratuitement sur Zando+ Congo. Publiez votre première annonce dès maintenant." />
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
          className="inline-block p-4 bg-green-100 rounded-full mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}
        >
          <PartyPopper className="w-16 h-16 text-custom-green-500" />
        </motion.div>

        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }}
        >
          Félicitations ! Vous êtes prêt.
        </motion.h1>

        <motion.p 
          className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } }}
        >
          Vous avez choisi le plan Gratuit. C'est le moyen idéal pour commencer à vendre sur Zando+ Congo sans aucun frais. Voici ce que vous obtenez :
        </motion.p>

        <motion.div 
          className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mb-10 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } }}
        >
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6 } }}
        >
          <Button asChild size="lg" className="gradient-bg text-white hover:opacity-90 rounded-full px-8 py-4 text-lg font-semibold">
            <Link to="/post-ad">
              Publier votre première annonce
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default FreePlanPage;