import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { helpCategories } from '@/lib/helpContent';
import HelpSupportBanner from '@/components/help/HelpSupportBanner';
import HelpContactBlock from '@/components/help/HelpContactBlock';

const HelpCenterPage = () => {
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
        <title>Centre d'Aide - Zando+ Congo</title>
        <meta name="description" content="Trouvez des réponses à vos questions sur l'achat, la vente, la livraison et le paiement sur Zando+ Congo. Notre centre d'aide est là pour vous accompagner." />
        <link rel="canonical" href="https://www.zandopluscg.com/help" />
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
              Centre <span className="gradient-text">d'Aide</span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Choisissez un sujet ci-dessous pour trouver directement les réponses qui vous concernent.
            </motion.p>
          </div>
        </section>

        <HelpSupportBanner />

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {helpCategories.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link
                    to={`/help/${category.slug}`}
                    className="flex items-start gap-4 p-6 h-full bg-white rounded-2xl border border-gray-200 hover:border-custom-green-300 hover:shadow-lg transition-all group"
                  >
                    <div className="w-12 h-12 bg-custom-green-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-custom-green-500 transition-colors">
                      {React.createElement(category.icon, { className: "w-6 h-6 text-custom-green-600 group-hover:text-white transition-colors" })}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-800 group-hover:text-custom-green-600 transition-colors">{category.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{category.questions.length} question{category.questions.length > 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1 group-hover:text-custom-green-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </div>

            <HelpContactBlock />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default HelpCenterPage;
