import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { X, Flame, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'zando_urgent_popup_closed';

/* ─── Un groupe de 3 cartes ───────────────────────────────── */
const CardGroup = ({ listings, startIndex, onClose }) => {
  const group = [0, 1, 2].map(i => listings[(startIndex + i) % listings.length]);

  const cardStyle = (pos) => {
    // pos 0 = left, 1 = center, 2 = right
    if (pos === 0) return { rotateY: 28, x: '-8%', scale: 0.82, z: -60, brightness: 0.75 };
    if (pos === 1) return { rotateY: 0,  x: '0%',  scale: 1,    z: 0,   brightness: 1    };
    if (pos === 2) return { rotateY: -28,x: '8%',  scale: 0.82, z: -60, brightness: 0.75 };
  };

  return (
    <div className="flex items-center justify-center gap-0 w-full" style={{ perspective: '900px' }}>
      {group.map((listing, pos) => {
        const s = cardStyle(pos);
        const isCenter = pos === 1;
        return (
          <motion.div
            key={listing.id + '-' + pos}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: s.scale, rotateY: s.rotateY, x: s.x, z: s.z, filter: `brightness(${s.brightness})` }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: pos * 0.04 }}
            style={{ transformStyle: 'preserve-3d', zIndex: isCenter ? 10 : 5, flexShrink: 0, width: '38%' }}
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
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {/* Badge urgent */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                <Flame className="w-2.5 h-2.5" /> URGENT
              </div>
              {/* Text on image */}
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
            {/* CTA — center card only */}
            {isCenter && (
              <div className="p-3 bg-white">
                <Link
                  to={`/listings/${listing.listing_slug || listing.id}`}
                  onClick={onClose}
                  className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-black text-[12px] py-2.5 rounded-xl transition-colors"
                >
                  Voir l'annonce →
                </Link>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

/* ─── Popup ───────────────────────────────────────────────── */
const UrgentPopup = () => {
  const [listings, setListings] = useState([]);
  const [groupStart, setGroupStart] = useState(0);
  const [direction, setDirection]   = useState(1);
  const [visible, setVisible]       = useState(false);
  const [key, setKey]               = useState(0);
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
        // Pad to at least 3 by repeating if needed
        let padded = data;
        while (padded.length < 3) padded = [...padded, ...data];
        setListings(padded);
        setTimeout(() => setVisible(true), 700);
      }
    };
    load();
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
    clearInterval(autoRef.current);
  }, []);

  const navigate = useCallback((dir) => {
    clearInterval(autoRef.current);
    setDirection(dir);
    setGroupStart(s => (s + dir * 3 + listings.length * 3) % listings.length);
    setKey(k => k + 1);
  }, [listings.length]);

  useEffect(() => {
    if (!visible || listings.length <= 3) return;
    autoRef.current = setInterval(() => {
      setDirection(1);
      setGroupStart(s => (s + 3) % listings.length);
      setKey(k => k + 1);
    }, 4500);
    return () => clearInterval(autoRef.current);
  }, [visible, listings.length]);

  if (!visible || listings.length === 0) return null;

  const totalGroups = Math.ceil(listings.length / 3);
  const currentGroup = Math.floor(groupStart / 3);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-20 text-center mb-5">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Ventes urgentes</p>
            <h2 className="text-white text-[18px] font-black">🔥 Offres à saisir rapidement</h2>
          </motion.div>

          {/* Cover flow */}
          <div className="relative z-10 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={key}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <CardGroup
                  listings={listings}
                  startIndex={groupStart}
                  onClose={close}
                />
              </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            {listings.length > 3 && (
              <>
                <button onClick={() => navigate(-1)}
                  className="absolute left-[-44px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => navigate(1)}
                  className="absolute right-[-44px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {totalGroups > 1 && (
            <div className="relative z-20 flex items-center gap-2 mt-5">
              {Array.from({ length: totalGroups }).map((_, i) => (
                <button key={i}
                  onClick={(e) => { e.stopPropagation(); setDirection(i > currentGroup ? 1 : -1); setGroupStart(i * 3); setKey(k => k + 1); }}
                  className={`rounded-full transition-all ${i === currentGroup ? 'w-5 h-2 bg-red-400' : 'w-2 h-2 bg-white/25'}`}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          <p className="relative z-20 text-white/25 text-[10px] mt-2">
            {currentGroup + 1} / {totalGroups || 1}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgentPopup;
