import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── Carte urgente landscape ─────────────────────────────── */
const UrgentCard = ({ listing }) => (
  <motion.div
    animate={{ rotate: [0, -2, 2, -2, 2, -1, 1, 0] }}
    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
    className="flex-shrink-0 snap-start"
    style={{ transformOrigin: 'center bottom' }}
  >
    <Link
      to={`/listings/${listing.listing_slug || listing.id}`}
      className="w-[220px] sm:w-[260px] h-[150px] sm:h-[140px] flex rounded-xl overflow-hidden bg-category-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="relative w-[110px] sm:w-[130px] h-full flex-shrink-0 overflow-hidden bg-category-card">
        {listing.images?.[0]
          ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><Flame className="w-8 h-8 text-gray-200" /></div>}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
          <Flame className="w-2 h-2" /> URGENT
        </div>
      </div>
      <div className="flex-1 p-3 sm:p-3 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
          {listing.location && (
            <p className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-1">
              <MapPin className="w-2.5 h-2.5" /> {listing.location}
            </p>
          )}
        </div>
        <div>
          <p className="text-[14px] sm:text-[15px] font-black text-custom-green-500 leading-none">
            {(listing.price || 0).toLocaleString('fr-FR')}
            <span className="text-[10px] font-semibold text-gray-400 ml-1">{listing.currency || 'FCFA'}</span>
          </p>
          <span className="inline-block mt-1.5 text-[9px] font-bold text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded-full">
            Vente urgente
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ─── Carte boostée landscape ─────────────────────────────── */
const BoostedCard = ({ listing }) => (
  <motion.div
    animate={{ rotate: [0, -2, 2, -2, 2, -1, 1, 0] }}
    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
    className="flex-shrink-0 snap-start"
    style={{ transformOrigin: 'center bottom' }}
  >
    <Link
      to={`/listings/${listing.listing_slug || listing.id}`}
      className="w-[220px] sm:w-[260px] h-[150px] sm:h-[140px] flex rounded-xl overflow-hidden bg-category-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="relative w-[110px] sm:w-[130px] h-full flex-shrink-0 overflow-hidden bg-category-card">
        {listing.images?.[0]
          ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><Zap className="w-8 h-8 text-gray-200" /></div>}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-accent-yellow text-gray-900 text-[8px] font-black px-1.5 py-0.5 rounded-full">
          <Zap className="w-2 h-2" /> BOOSTÉ
        </div>
      </div>
      <div className="flex-1 p-3 sm:p-3 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
          {listing.location && (
            <p className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-1">
              <MapPin className="w-2.5 h-2.5" /> {listing.location}
            </p>
          )}
        </div>
        <div>
          <p className="text-[14px] sm:text-[15px] font-black text-custom-green-500 leading-none">
            {(listing.price || 0).toLocaleString('fr-FR')}
            <span className="text-[10px] font-semibold text-gray-400 ml-1">{listing.currency || 'FCFA'}</span>
          </p>
          <span className="inline-block mt-1.5 text-[9px] font-bold text-amber-600 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded-full">
            Annonce boostée
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ─── Hook scroll desktop ──────────────────────────────────── */
const useScroll = () => {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  return { ref, scroll };
};

/* ─── Section générique avec carousel mobile ───────────────── */
const PromoSection = ({ title, badge, listings, CardComponent, viewAllHref }) => {
  const { ref, scroll } = useScroll();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-5 sm:py-6 bg-page-bg"
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] sm:text-[19px] font-extrabold text-gray-900">{title}</h2>
            {badge}
          </div>
          <Link to={viewAllHref} className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Boutons desktop uniquement */}
          <button
            onClick={() => scroll(-1)}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Scroll container — swipe natif mobile, scroll desktop */}
          <div
            ref={ref}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-10 pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {listings.map(l => <CardComponent key={l.id} listing={l} />)}
            {/* Spacer pour voir le bord de la dernière carte */}
            <div className="flex-shrink-0 w-2 sm:hidden" />
          </div>

          <button
            onClick={() => scroll(1)}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.section>
  );
};

/* ─── Section Urgentes ──────────────────────────────────────── */
export const UrgentSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('listings')
      .select('*, seller:profiles(id, full_name, avatar_url)')
      .eq('is_urgent', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        setListings((data || []).map(l => ({
          ...l,
          createdAt: l.created_at,
          seller: l.seller ? { ...l.seller, name: l.seller.full_name, avatar: l.seller.avatar_url } : null,
        })));
        setLoading(false);
      });
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <PromoSection
      title="Ventes Urgentes"
      badge={
        <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
          <Flame className="w-3 h-3" /> {listings.length} offres
        </span>
      }
      listings={listings}
      CardComponent={UrgentCard}
      viewAllHref="/listings?urgent=true"
    />
  );
};

/* ─── Section Boostées ──────────────────────────────────────── */
export const BoostedSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('listings')
      .select('*, seller:profiles(id, full_name, avatar_url)')
      .eq('is_boosted', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        setListings((data || []).map(l => ({
          ...l,
          createdAt: l.created_at,
          seller: l.seller ? { ...l.seller, name: l.seller.full_name, avatar: l.seller.avatar_url } : null,
        })));
        setLoading(false);
      });
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <PromoSection
      title="Annonces Boostées"
      badge={
        <span className="flex items-center gap-1 bg-accent-yellow text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3" /> {listings.length} annonces
        </span>
      }
      listings={listings}
      CardComponent={BoostedCard}
      viewAllHref="/listings?boosted=true"
    />
  );
};
