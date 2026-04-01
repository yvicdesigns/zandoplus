import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const CtaSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Commencer à <span className="gradient-text">Vendre ?</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
            Rejoignez des milliers de vendeurs prospères sur Le Marché Congo.
            Publiez votre première annonce gratuitement et atteignez des millions d'acheteurs potentiels !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/post-ad">
              <Button size="lg" className="gradient-bg hover:opacity-90 rounded-full px-8 py-4 text-base font-semibold">
                Publier Votre Première Annonce
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-4 text-base font-semibold border-2 border-custom-green-300 hover:bg-custom-green-50 text-custom-green-600 hover:text-custom-green-700">
                Voir les Plans Tarifaires
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;