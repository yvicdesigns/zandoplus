import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { X, Flame, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'zando_urgent_popup_closed';

/* ─── Cover Flow card ─────────────────────────────────────── */
const CoverCard = ({ listing, offset, onClick }) => {
  // offset: -2..2 (0 = center, ±1 = adjacent, ±2 = far)
  const absOffset = Math.abs(offset);
  const isCenter  = offset === 0;

  const rotateY  = offset * -40;          // degrees
  const translateX = offset * 55;          // % of container
  const scale    = isCenter ? 1 : absOffset === 1 ? 0.78 : 0.58;
  const zIndex   = 10 - absOffset * 3;
  const opacity  = absOffset >= 2 ? 0 : 1;
  const blur     = absOffset === 0 ? 0 : absOffset === 1 ? 1 : 3;

  return (
    <motion.div
      onClick={isCenter ? undefined : onClick}
      animate={{
        rotateY,
        x: `${translateX}%`,
        scale,
        zIndex,
        opacity,
        filter: `blur(${blur}px)`,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        width: '100%',
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        cursor: isCenter ? 'default' : 'pointer',
      }}
      className="select-none"
    >
      <div className={`rounded-2xl overflow-hidden shadow-2xl bg-white transition-shadow ${isCenter ? 'shadow-black/40' : 'shadow-black/20'}`}
        style={{ transform: 'translateX(-50%)' }}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Flame className="w-16 h-16 text-gray-200" />
            </div>
          )}
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Badge */}
          {isCenter && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-lg">
              <Flame className="w-3 h-3" /> URGENT
            </div>
          )}
          {/* Price over image */}
          {isCenter && (
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-[13px] font-bold line-clamp-1 drop-shadow">{listing.title}</p>
              <p className="text-white text-[18px] font-black leading-tight drop-shadow">
                {(listing.price || 0).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
              </p>
            </div>
          )}
        </div>

        {/* Info — center only */}
        {isCenter && (
          <div className="p-4">
            {listing.location && (
              <p className="flex items-center gap-1 text-[11px] text-gray-400 mb-3">
                <MapPin className="w-3 h-3" /> {listing.location}
              </p>
            )}
            <Link
              to={`/listings/${listing.listing_slug || listing.id}`}
              className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-black text-[13px] py-3 rounded-xl transition-colors"
            >
              Voir l'annonce →
            </Link>
          </div>
        )}
      </div>

      {/* Reflection */}
      {isCenter && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-full mt-1 rounded-2xl overflow-hidden opacity-20"
          style={{ transform: 'scaleY(-1) translateX(-50%)', left: '50%', height: '40%', width: '100%' }}
        >
          {listing.images?.[0] && (
            <img src={listing.images[0]} alt="" className="w-full h-full object-cover object-top" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main popup ──────────────────────────────────────────── */
const UrgentPopup = () => {
  const [listings, setListings] = useState([]);
  const [index,    setIndex]    = useState(0);
  const [visible,  setVisible]  = useState(false);
  const autoRef = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, currency, images, location, listing_slug')
        .eq('is_urgent', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data && data.length > 0) {
        setListings(data);
        setTimeout(() => setVisible(true), 700);
      }
    };
    load();
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  const go = useCallback((dir) => {
    setIndex(i => (i + dir + listings.length) % listings.length);
    clearInterval(autoRef.current);
  }, [listings.length]);

  useEffect(() => {
    if (!visible || listings.length < 2) return;
    autoRef.current = setInterval(() => setIndex(i => (i + 1) % listings.length), 4000);
    return () => clearInterval(autoRef.current);
  }, [visible, listings.length]);

  if (!visible || listings.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          onClick={close}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-30 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-20 text-center mb-6 mt-2"
          >
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Offres urgentes</p>
            <h2 className="text-white text-[20px] font-black">🔥 Ventes rapides</h2>
          </motion.div>

          {/* Cover Flow stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 w-full max-w-xs"
            style={{ perspective: '900px', perspectiveOrigin: 'center center' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative" style={{ height: listings[index] ? (listings[index].images?.[0] ? 380 : 280) : 350 }}>
              {listings.map((listing, i) => {
                const offset = i - index;
                // normalise offset for wrap-around (max ±2 visible)
                let adj = offset;
                if (adj > listings.length / 2)  adj -= listings.length;
                if (adj < -listings.length / 2) adj += listings.length;
                if (Math.abs(adj) > 2) return null;
                return (
                  <CoverCard
                    key={listing.id}
                    listing={listing}
                    offset={adj}
                    onClick={() => setIndex(i)}
                  />
                );
              })}
            </div>

            {/* Dots + arrows */}
            {listings.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16 relative z-20">
                <button onClick={() => go(-1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {listings.map((_, i) => (
                    <button key={i} onClick={() => { setIndex(i); clearInterval(autoRef.current); }}
                      className={`rounded-full transition-all ${i === index ? 'w-5 h-2 bg-red-400' : 'w-2 h-2 bg-white/30'}`}
                    />
                  ))}
                </div>
                <button onClick={() => go(1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Counter */}
          {listings.length > 1 && (
            <p className="relative z-20 text-white/30 text-[11px] mt-4">
              {index + 1} / {listings.length}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgentPopup;
