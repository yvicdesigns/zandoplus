import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Flame, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'zando_urgent_popup_closed';

const UrgentPopup = () => {
  const [listings, setListings] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, currency, images, location, listing_slug, category')
        .eq('is_urgent', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data && data.length > 0) {
        setListings(data);
        setTimeout(() => setVisible(true), 600);
      }
    };
    fetch();
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  const prev = () => {
    setDirection(-1);
    setIndex(i => (i - 1 + listings.length) % listings.length);
  };

  const next = useCallback(() => {
    setDirection(1);
    setIndex(i => (i + 1) % listings.length);
  }, [listings.length]);

  useEffect(() => {
    if (!visible || listings.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [visible, listings.length, next]);

  if (!visible || listings.length === 0) return null;

  const listing = listings[index];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              OFFRE URGENTE
            </div>

            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={listing.id}
                custom={direction}
                initial={{ x: direction * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -60, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative aspect-[4/3] bg-gray-100 overflow-hidden"
              >
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Flame className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {/* Gradient overlay bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div key={listing.id + '-info'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-[17px] font-black text-gray-900 leading-snug line-clamp-2 mb-1">
                    {listing.title}
                  </h3>
                  {listing.location && (
                    <p className="flex items-center gap-1 text-[12px] text-gray-400 mb-3">
                      <MapPin className="w-3.5 h-3.5" /> {listing.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[22px] font-black text-custom-green-500">
                      {(listing.price || 0).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
                    </p>
                    <Link
                      to={`/listings/${listing.listing_slug || listing.id}`}
                      onClick={close}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold px-5 h-10 rounded-xl transition-colors"
                    >
                      Voir l'annonce
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            {listings.length > 1 && (
              <div className="px-5 pb-4 flex items-center justify-between">
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {listings.map((_, i) => (
                    <button key={i} onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                      className={`rounded-full transition-all ${i === index ? 'w-5 h-2 bg-red-500' : 'w-2 h-2 bg-gray-200'}`}
                    />
                  ))}
                </div>
                {/* Arrows */}
                <div className="flex items-center gap-2">
                  <button onClick={prev}
                    className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={next}
                    className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgentPopup;
