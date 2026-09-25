import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Heart, ShoppingCart } from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c.01-4.55 3.7-8.24 8.25-8.24M8.53 6.99c-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.8 2.87 4.45 3.91.62.27 1.1.42 1.48.54.62.2 1.19.17 1.63.1.5-.07 1.53-.62 1.75-1.23s.22-1.11.15-1.22c-.07-.11-.24-.17-.5-.3s-1.53-.75-1.77-.84-.41-.13-.59.13-.68.84-.83 1.02-.3.2-.56.07a7.1 7.1 0 0 1-2.09-1.29 7.83 7.83 0 0 1-1.45-1.8c-.15-.26-.02-.4.11-.53.12-.11.26-.3.4-.44.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46s-.59-1.43-.82-1.95c-.2-.5-.42-.44-.59-.44Z" />
  </svg>
);

import { supabase } from '@/lib/customSupabaseClient';
import { useListings } from '@/contexts/ListingsContext';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { toWhatsAppLink } from '@/lib/phone';

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
  const isRental = listing.listing_purpose === 'rent';
  const whatsappLink = toWhatsAppLink(listing.seller?.phone);

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
        {isRental ? (
          whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-auto w-full bg-accent-yellow hover:brightness-95 text-[#1a1200] font-bold text-[12px] py-2 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Contacter
            </a>
          ) : (
            <div className="mt-auto w-full bg-accent-yellow text-[#1a1200] font-bold text-[12px] py-2 rounded-lg flex items-center justify-center gap-2">
              À louer
            </div>
          )
        ) : (
          <button
            onClick={handleCart}
            className="mt-auto w-full bg-accent-yellow text-[#1a1200] font-bold text-[12px] py-2 rounded-lg hover:brightness-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {inCart ? 'Dans le panier' : 'Acheter maintenant'}
          </button>
        )}
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
        .select('*, seller:profiles(id, full_name, avatar_url, phone)')
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
        <div className="relative">
          <button
            onClick={() => scroll(-1)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-0 sm:px-10 pb-1"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {offres.map((listing) => (
              <div key={listing.id} className="snap-start flex-shrink-0">
                <OffreCard
                  listing={listing}
                  isFavorite={favorites.has(listing.id)}
                  toggleFavorite={toggleFavorite}
                />
              </div>
            ))}
            <div className="flex-shrink-0 w-2 sm:hidden" />
          </div>

          <button
            onClick={() => scroll(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default OffresSection;
