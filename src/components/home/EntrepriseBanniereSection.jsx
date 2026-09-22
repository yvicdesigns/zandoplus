import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';

// Bannières des vendeurs Entreprise — défilement horizontal natif (scroll-snap,
// même principe que PromoSections.jsx), pas de librairie de carousel. Plusieurs
// bannières visibles à la fois, le reste accessible en scroll : contrairement à
// un carousel à 1 slide affiché, la visibilité de chaque Entreprise ne s'écrase
// pas quand le nombre d'Entreprise grandit.
const EntrepriseBanniereSection = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, shop_slug, entreprise_banner_url')
      .eq('is_business', true)
      .not('entreprise_banner_url', 'is', null)
      .order('business_expires_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        setEntreprises(data || []);
        setLoading(false);
      });
  }, []);

  if (loading || entreprises.length === 0) return null;

  return (
    <section className="py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nos Entreprises</h2>
            <p className="text-sm text-gray-500 mt-0.5">Boutiques certifiées Entreprise sur Zando+</p>
          </div>
          <Link to="/boutiques-officielles" className="text-xs text-custom-green-600 hover:underline font-medium whitespace-nowrap">
            Voir toutes nos Entreprises →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {entreprises.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex-shrink-0 snap-start"
            >
              <Link
                to={`/seller/${e.shop_slug || e.id}`}
                className="group block w-[300px] sm:w-[340px] rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                style={{ aspectRatio: '3 / 1' }}
              >
                <img
                  src={e.entreprise_banner_url}
                  alt={e.full_name || 'Entreprise'}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EntrepriseBanniereSection;
