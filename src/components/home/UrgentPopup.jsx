import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { X, Flame, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'zando_urgent_popup_closed';

const CARD_W  = 220; // px
const GAP     = 12;  // px
const SLOT    = CARD_W + GAP;
const VISIBLE = 3;
const CONTAINER_W = VISIBLE * CARD_W + (VISIBLE - 1) * GAP; // 500px

/* ─── Popup ───────────────────────────────────────────────── */
const UrgentPopup = () => {
  const [listings,  setListings]  = useState([]);
  const [center,    setCenter]    = useState(0);
  const [visible,   setVisible]   = useState(false);
  const [closing,   setClosing]   = useState(false);
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
        .limit(12);
      if (data && data.length > 0) {
        // triple pour boucle infinie fluide
        const tripled = [...data, ...data, ...data];
        setListings(tripled);
        setCenter(data.length); // démarre au milieu de la triplication
        setTimeout(() => setVisible(true), 700);
      }
    };
    load();
  }, []);

  const baseLen = listings.length / 3;

  const slide = useCallback((dir) => {
    setCenter(c => {
      let next = c + dir;
      if (next >= baseLen * 2) next -= baseLen;
      if (next < baseLen)      next += baseLen;
      return next;
    });
  }, [baseLen]);

  const go = useCallback((dir) => {
    clearInterval(autoRef.current);
    slide(dir);
    autoRef.current = setInterval(() => slide(1), 4000);
  }, [slide]);

  useEffect(() => {
    if (!visible || baseLen <= 1) return;
    autoRef.current = setInterval(() => slide(1), 4000);
    return () => clearInterval(autoRef.current);
  }, [visible, baseLen, slide]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 300);
  }, []);

  if (!visible || listings.length === 0) return null;

  // offset du track pour que la carte 'center' soit au centre du container
  const trackX = CONTAINER_W / 2 - CARD_W / 2 - center * SLOT;

  // indices visibles + buffer pour le slide
  const renderFrom = center - 2;
  const renderTo   = center + 2;

  const currentDot = (center - baseLen) % baseLen; // dot actif (0 à baseLen-1)

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-4 py-6"
          onClick={close}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Close */}
          <button onClick={close}
            className="absolute top-4 right-4 z-30 w-9 h-9 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Tout le contenu — stopPropagation global pour éviter fermeture accidentelle */}
          <div className="relative z-10 flex flex-col items-center" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Ventes urgentes</p>
            <h2 className="text-white text-[18px] font-black">🔥 Offres à saisir rapidement</h2>
          </div>

          {/* Carousel */}
          <div
            className="relative"
            style={{ width: CONTAINER_W, overflow: 'hidden' }}
          >
            {/* Track qui slide */}
            <motion.div
              animate={{ x: trackX }}
              transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 0.8 }}
              style={{ display: 'flex', gap: GAP, position: 'relative' }}
            >
              {listings.map((listing, i) => {
                if (i < renderFrom || i > renderTo) return <div key={i} style={{ width: CARD_W, flexShrink: 0 }} />;
                const isCenter = i === center;
                return (
                  <motion.div
                    key={listing.id + '-' + i}
                    animate={{ scale: isCenter ? 1 : 0.88, filter: isCenter ? 'brightness(1)' : 'brightness(0.7)' }}
                    transition={{ duration: 0.3 }}
                    style={{ width: CARD_W, flexShrink: 0 }}
                    className="rounded-2xl overflow-hidden shadow-2xl bg-white"
                  >
                    {/* Image */}
                    <div className="relative" style={{ aspectRatio: '3/4' }}>
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <Flame className="w-10 h-10 text-red-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        <Flame className="w-2.5 h-2.5" /> URGENT
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight mb-1">{listing.title}</p>
                        <p className="text-white text-[14px] font-black leading-none">
                          {(listing.price || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-semibold">{listing.currency || 'FCFA'}</span>
                        </p>
                        {listing.location && (
                          <p className="flex items-center gap-0.5 text-white/60 text-[9px] mt-1">
                            <MapPin className="w-2.5 h-2.5" /> {listing.location}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* CTA — centre seulement */}
                    {isCenter && (
                      <div className="p-2.5 bg-white">
                        <Link
                          to={`/listings/${listing.listing_slug || listing.id}`}
                          onClick={close}
                          className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-black text-[11px] py-2 rounded-xl transition-colors"
                        >
                          Voir l'annonce →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Flèches */}
          {baseLen > 1 && (
            <div className="flex items-center gap-4 mt-5">
              <button onClick={() => go(-1)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: baseLen }).map((_, i) => (
                  <button key={i}
                    onClick={() => { clearInterval(autoRef.current); setCenter(baseLen + i); autoRef.current = setInterval(() => slide(1), 4000); }}
                    className={`rounded-full transition-all ${i === currentDot ? 'w-5 h-2 bg-red-400' : 'w-2 h-2 bg-white/25'}`}
                  />
                ))}
              </div>

              <button onClick={() => go(1)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          </div>{/* fin stopPropagation wrapper */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgentPopup;
