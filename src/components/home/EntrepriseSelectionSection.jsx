import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Building2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

// Annonces mises en avant via le boost mensuel inclus des vendeurs Entreprise
// (boost_type = 'entreprise_inclus'). Volontairement séparée du popup "Urgent"
// payant (is_urgent / UrgentPopup.jsx) pour ne jamais y mélanger du contenu
// gratuit avec ce que les vendeurs paient à l'unité pour y apparaître.
const EntrepriseSelectionSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('ad_boosts')
      .select('id, date_fin, annonce:annonce_id(id, title, price, currency, images, location, listing_slug)')
      .eq('boost_type', 'entreprise_inclus')
      .eq('statut', 'active')
      .gt('date_fin', new Date().toISOString())
      .order('date_fin', { ascending: true })
      .limit(12)
      .then(({ data }) => {
        setItems((data || []).filter(d => d.annonce));
        setLoading(false);
      });
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sélection Entreprise</h2>
            <p className="text-sm text-gray-500 mt-0.5">Mises en avant par nos vendeurs Entreprise ce mois-ci</p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {items.map((item, i) => {
            const listing = item.annonce;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 snap-start"
              >
                <Link
                  to={`/listings/${listing.listing_slug || listing.id}`}
                  className="w-[220px] sm:w-[260px] h-[150px] sm:h-[140px] flex rounded-xl overflow-hidden bg-category-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="relative w-[110px] sm:w-[130px] h-full flex-shrink-0 overflow-hidden bg-category-card">
                    {listing.images?.[0]
                      ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-200" /></div>}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                      <Building2 className="w-2 h-2" /> ENTREPRISE
                    </div>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[11px] sm:text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
                      {listing.location && (
                        <p className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-1">
                          <MapPin className="w-2.5 h-2.5" /> {listing.location}
                        </p>
                      )}
                    </div>
                    <p className="text-[14px] sm:text-[15px] font-black text-amber-600 leading-none">
                      {(listing.price || 0).toLocaleString('fr-FR')}
                      <span className="text-[10px] font-semibold text-gray-400 ml-1">{listing.currency || 'FCFA'}</span>
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EntrepriseSelectionSection;
