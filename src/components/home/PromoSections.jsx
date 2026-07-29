import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ListingItem from '@/components/listings/ListingItem';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/contexts/ListingsContext';

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
