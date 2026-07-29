import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import ListingItem from '@/components/listings/ListingItem';
import { useListings } from '@/contexts/ListingsContext';

/* ─── Carte urgente landscape ─────────────────────────────── */
const UrgentCard = ({ listing }) => (
  <Link
    to={`/listings/${listing.listing_slug || listing.id}`}
    className="flex-shrink-0 w-[260px] h-[130px] flex rounded-xl overflow-hidden bg-category-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
  >
    {/* Image carrée à gauche */}
    <div className="relative w-[130px] h-full flex-shrink-0 overflow-hidden bg-category-card">
      {listing.images?.[0]
        ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full flex items-center justify-center"><Flame className="w-8 h-8 text-gray-200" /></div>}
      {/* Badge */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
        <Flame className="w-2 h-2" /> URGENT
      </div>
    </div>
    {/* Contenu à droite */}
    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
      <div>
        <p className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
        {listing.location && (
          <p className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-1">
            <MapPin className="w-2.5 h-2.5" /> {listing.location}
          </p>
        )}
      </div>
      <div>
        <p className="text-[15px] font-black text-custom-green-500 leading-none">
          {(listing.price || 0).toLocaleString('fr-FR')}
          <span className="text-[10px] font-semibold text-gray-400 ml-1">{listing.currency || 'FCFA'}</span>
        </p>
        <span className="inline-block mt-1.5 text-[9px] font-bold text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded-full">
          Vente urgente
        </span>
      </div>
    </div>
  </Link>
);

const useScroll = () => {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 440, behavior: 'smooth' });
  return { ref, scroll };
};

/* ─── Section Urgentes ──────────────────────────────────────── */
export const UrgentSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { ref, scroll } = useScroll();
  const { favorites, toggleFavorite } = useListings();

  useEffect(() => {
    supabase.from('listings')
      .select('*, seller:profiles(id, full_name, avatar_url)')
      .eq('is_urgent', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        setListings((data || []).map(l => ({ ...l, createdAt: l.created_at, seller: l.seller ? { ...l.seller, name: l.seller.full_name, avatar: l.seller.avatar_url } : null })));
        setLoading(false);
      });
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-6 bg-page-bg"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[19px] font-extrabold text-gray-900">Ventes Urgentes</h2>
            <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
              <Flame className="w-3 h-3" /> {listings.length} offres
            </span>
          </div>
          <Link to="/listings?urgent=true" className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => scroll(-1)} className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide flex-1">
            {listings.map(l => <UrgentCard key={l.id} listing={l} />)}
          </div>
          <button onClick={() => scroll(1)} className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.section>
  );
};

/* ─── Section Boostées ──────────────────────────────────────── */
export const BoostedSection = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { ref, scroll } = useScroll();
  const { favorites, toggleFavorite } = useListings();

  useEffect(() => {
    supabase.from('listings')
      .select('*, seller:profiles(id, full_name, avatar_url)')
      .eq('is_boosted', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        setListings((data || []).map(l => ({ ...l, createdAt: l.created_at, seller: l.seller ? { ...l.seller, name: l.seller.full_name, avatar: l.seller.avatar_url } : null })));
        setLoading(false);
      });
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-6 bg-page-bg"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[19px] font-extrabold text-gray-900">Annonces Boostées</h2>
            <span className="flex items-center gap-1 bg-accent-yellow text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" /> {listings.length} annonces
            </span>
          </div>
          <Link to="/listings?boosted=true" className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => scroll(-1)} className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide flex-1">
            {listings.map(l => (
              <div key={l.id} className="flex-shrink-0 w-[200px]">
                <ListingItem listing={l} viewMode="grid" isFavorite={favorites.has(l.id)} toggleFavorite={toggleFavorite} />
              </div>
            ))}
          </div>
          <button onClick={() => scroll(1)} className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.section>
  );
};
