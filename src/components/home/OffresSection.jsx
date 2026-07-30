import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useListings } from '@/contexts/ListingsContext';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/* ── Countdown jusqu'à minuit ── */
const useCountdown = () => {
  const getLeft = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const diff = Math.max(0, end - now);
    return {
      h: String(Math.floor(diff / 3_600_000)).padStart(2, '0'),
      m: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0'),
      s: String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0'),
    };
  };
  const [time, setTime] = useState(getLeft);
  useEffect(() => {
    const id = setInterval(() => setTime(getLeft()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
};

/* ── Card offre ── */
const OffreCard = ({ listing, isFavorite, toggleFavorite }) => {
  const { addItem, isInCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const inCart = isInCart(listing.id);

  const handleCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Connectez-vous pour ajouter au panier', variant: 'destructive' });
      return;
    }
    addItem(listing);
    toast({ title: 'Ajouté au panier !' });
  };

  const formatPrice = (p) =>
    p != null ? Number(p).toLocaleString('fr-FR') + ' FCFA' : null;

  return (
    <Link
      to={`/listings/${listing.listing_slug || listing.id}`}
      className="flex-shrink-0 w-[200px] bg-card-bg border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full h-[160px] bg-category-card">
        <img
          src={listing.images?.[0] || '/placeholder-image.png'}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/f8f4ed/9ca3af?text=Image'; }}
        />
        {listing.is_boosted && (
          <span className="absolute top-2 left-2 bg-custom-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
            -20%
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite?.(listing.id); }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Corps */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1">{listing.title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 mb-2">{listing.city || listing.location || 'Congo'}</p>
        <p className="text-[14px] font-extrabold text-custom-green-500 font-[tabular-nums] mb-3">
          {formatPrice(listing.price)}
        </p>
        <button
          onClick={handleCart}
          className="mt-auto w-full bg-accent-yellow text-[#1a1200] font-bold text-[12px] py-2 rounded-lg hover:brightness-95 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {inCart ? 'Dans le panier' : 'Acheter maintenant'}
        </button>
      </div>
    </Link>
  );
};

/* ── Section principale ── */
const OffresSection = () => {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite } = useListings();
  const scrollRef = useRef(null);
  const { h, m, s } = useCountdown();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('listings')
        .select('*, seller:profiles(id, full_name, avatar_url)')
        .eq('status', 'active')
        .eq('is_daily_offer', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setOffres(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  if (loading || offres.length === 0) return null;

  return (
    <section className="py-6 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[19px] font-extrabold text-gray-900">Offres du jour 🔥</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/listings"
              className="text-[13px] text-gray-500 hover:text-custom-green-500 hidden sm:block"
            >
              Voir toutes les offres du jour
            </Link>
            {/* Countdown */}
            <div className="flex items-center gap-1">
              {[{ val: h, lbl: 'Hrs' }, { val: m, lbl: 'Min' }, { val: s, lbl: 'Sec' }].map(({ val, lbl }, i) => (
                <React.Fragment key={lbl}>
                  <div className="text-center">
                    <span className="bg-custom-green-500 text-white text-[16px] font-black px-2.5 py-1 rounded-md block min-w-[36px] text-center tabular-nums">
                      {val}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">{lbl}</span>
                  </div>
                  {i < 2 && <span className="text-custom-green-500 font-black text-lg mb-3">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Cards avec flèches */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide flex-1">
            {offres.map((listing) => (
              <OffreCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.has(listing.id)}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 flex-shrink-0 bg-card-bg border border-gray-200 rounded-full flex items-center justify-center hover:border-custom-green-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default OffresSection;
