import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronLeft, ChevronRight, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── Card urgente ──────────────────────────────────────────── */
const UrgentCard = ({ listing }) => (
  <Link to={`/listings/${listing.listing_slug || listing.id}`}
    className="flex-shrink-0 w-[180px] group block">
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4] shadow-md group-hover:shadow-xl transition-shadow">
      {listing.images?.[0]
        ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Flame className="w-10 h-10 text-gray-300" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      {/* Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
        <Flame className="w-2.5 h-2.5" /> URGENT
      </div>
      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{listing.title}</p>
        <p className="text-white text-[14px] font-black mt-0.5">{(listing.price || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-semibold">{listing.currency || 'FCFA'}</span></p>
        {listing.location && <p className="text-white/60 text-[9px] flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{listing.location}</p>}
      </div>
    </div>
  </Link>
);

/* ─── Card boostée ──────────────────────────────────────────── */
const BoostedCard = ({ listing }) => (
  <Link to={`/listings/${listing.listing_slug || listing.id}`}
    className="flex-shrink-0 w-[180px] group block">
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4] shadow-md group-hover:shadow-xl transition-shadow">
      {listing.images?.[0]
        ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Zap className="w-10 h-10 text-gray-300" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
      {/* Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full">
        <Zap className="w-2.5 h-2.5" /> BOOSTÉ
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{listing.title}</p>
        <p className="text-white text-[14px] font-black mt-0.5">{(listing.price || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-semibold">{listing.currency || 'FCFA'}</span></p>
        {listing.location && <p className="text-white/60 text-[9px] flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{listing.location}</p>}
      </div>
    </div>
  </Link>
);

/* ─── Section scroll horizontal générique ──────────────────── */
const ScrollSection = ({ children, onScrollLeft, onScrollRight, scrollRef }) => (
  <div className="flex items-center gap-3">
    <button onClick={onScrollLeft}
      className="w-9 h-9 flex-shrink-0 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
      <ChevronLeft className="w-5 h-5 text-white" />
    </button>
    <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 pb-1">
      {children}
    </div>
    <button onClick={onScrollRight}
      className="w-9 h-9 flex-shrink-0 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
      <ChevronRight className="w-5 h-5 text-white" />
    </button>
  </div>
);

/* ─── Section Urgentes ──────────────────────────────────────── */
export const UrgentSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.from('listings')
      .select('id, title, price, currency, images, location, listing_slug')
      .eq('is_urgent', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, []);

  if (loading || listings.length === 0) return null;

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #b91c1c 100%)' }}
    >
      {/* Texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-[1280px] mx-auto px-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-red-200 text-[10px] font-bold uppercase tracking-widest">À saisir rapidement</p>
              <h2 className="text-white text-[20px] font-black leading-tight">Ventes Urgentes 🔥</h2>
            </div>
            <span className="bg-white text-red-600 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
              {listings.length} offres
            </span>
          </div>
          <Link to="/listings?urgent=true"
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold px-4 h-9 rounded-xl transition-colors backdrop-blur-sm">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ScrollSection scrollRef={scrollRef} onScrollLeft={() => scroll(-1)} onScrollRight={() => scroll(1)}>
          {listings.map(l => <UrgentCard key={l.id} listing={l} />)}
        </ScrollSection>
      </div>
    </motion.section>
  );
};

/* ─── Section Boostées ──────────────────────────────────────── */
export const BoostedSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.from('listings')
      .select('id, title, price, currency, images, location, listing_slug')
      .eq('is_boosted', true).eq('status', 'active').eq('is_urgent', false)
      .order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, []);

  if (loading || listings.length === 0) return null;

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #b45309 100%)' }}
    >
      {/* Texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-[1280px] mx-auto px-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest">Mises en avant</p>
              <h2 className="text-white text-[20px] font-black leading-tight">Annonces Boostées ⚡</h2>
            </div>
            <span className="bg-white text-amber-600 text-[10px] font-black px-2.5 py-1 rounded-full">
              {listings.length} annonces
            </span>
          </div>
          <Link to="/listings?boosted=true"
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold px-4 h-9 rounded-xl transition-colors backdrop-blur-sm">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ScrollSection scrollRef={scrollRef} onScrollLeft={() => scroll(-1)} onScrollRight={() => scroll(1)}>
          {listings.map(l => <BoostedCard key={l.id} listing={l} />)}
        </ScrollSection>
      </div>
    </motion.section>
  );
};
