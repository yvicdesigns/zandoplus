import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Calendar, Zap, ShoppingCart, CheckCircle } from 'lucide-react';
import ListingBadges from '@/components/common/ListingBadges';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

const ListingItem = ({ listing, viewMode, isFavorite, toggleFavorite }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem, isInCart } = useCart();
  const [ratingInfo, setRatingInfo] = useState({ average_rating: 0, review_count: 0 });
  const isProduct = listing.delivery_method !== 'none';
  const inCart = isInCart(listing.id);

  useEffect(() => {
    const fetchSellerRating = async () => {
      if (!listing.user_id) return;

      const { data, error } = await supabase
        .from('seller_ratings')
        .select('average_rating, review_count')
        .eq('seller_id', listing.user_id)
        .maybeSingle();
      
      if (data) {
        setRatingInfo(data);
      } else if (error) {
        console.error('Error fetching seller rating:', error);
      }
    };

    fetchSellerRating();
  }, [listing.user_id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return "Aujourd'hui";
    if (days < 2) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  
  if (viewMode === 'grid') {
    return (
      <Card className="listing-card overflow-hidden cursor-pointer border-0 shadow-lg h-full flex flex-col">
        <div className="relative bg-gray-100 aspect-w-16 aspect-h-9 h-48"> {/* Fixed height for image container */}
          <Link to={`/listings/${listing.id}`}>
            <img   
              className="w-full h-full object-cover object-center"
              alt={listing.title}
              src={listing.images?.[0] || '/placeholder-image.png'}
              onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Indisponible'; }} />
          </Link>
          <button
            onClick={() => toggleFavorite(listing.id)}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite 
                ? 'text-red-500 fill-current' 
                : 'text-gray-400'
              }`} 
            />
          </button>
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {listing.is_boosted && (
              <span className="flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <Zap className="w-3 h-3" /> Boosté
              </span>
            )}
            <ListingBadges listing={listing} seller={listing.seller} />
          </div>
        </div>
        <CardContent className="p-4 flex-grow flex-col justify-between">
          <div>
            <Link to={`/listings/${listing.id}`}>
              <h3 className="text-base font-bold mb-2 line-clamp-2 hover:text-custom-green-600 transition-colors">
                {listing.title}
              </h3>
            </Link>
            <p className="text-base md:text-lg font-bold text-custom-green-600 mb-2">
              {(listing.price || 0).toLocaleString()} {listing.currency || 'FCFA'}
            </p>
          </div>
          <div>
            {ratingInfo.review_count > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <StarRating rating={ratingInfo.average_rating} size={16} />
                <span className="font-semibold">({ratingInfo.review_count})</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.location || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Publiée {formatDate(listing.created_at)}</span>
            </div>
            {isProduct && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); navigate(`/listings/${listing.id}`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-custom-green-600 hover:bg-custom-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  Acheter
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); addItem(listing, (title) => toast({ title: 'Ajouté au panier ✅', description: title, className: 'bg-green-100 text-green-800' })); }}
                  className={`p-2 rounded-lg border transition-colors ${inCart ? 'bg-green-100 border-green-400 text-green-700' : 'border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-500'}`}
                  title={inCart ? 'Dans le panier' : 'Ajouter au panier'}
                >
                  {inCart ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="listing-card overflow-hidden cursor-pointer border-0 shadow-lg">
      <div className="flex">
        <div className="relative w-48 h-48 flex-shrink-0 bg-gray-100"> {/* Fixed height for image container */}
          <Link to={`/listings/${listing.id}`}>
            <img   
              className="w-full h-full object-cover object-center"
              alt={listing.title}
              src={listing.images?.[0] || '/placeholder-image.png'}
              onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Indisponible'; }} />
          </Link>
          <div className="absolute top-2 left-2 z-10">
             <ListingBadges listing={listing} seller={listing.seller} />
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link to={`/listings/${listing.id}`}>
                <h3 className="text-base md:text-lg font-bold line-clamp-1 hover:text-custom-green-600 transition-colors">
                  {listing.title}
                </h3>
              </Link>
              <button
                onClick={() => toggleFavorite(listing.id)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorite
                    ? 'text-red-500 fill-current' 
                    : 'text-gray-400'
                  }`} 
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description || 'Aucune description.'}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2 flex-wrap gap-2">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.location || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {ratingInfo.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <StarRating rating={ratingInfo.average_rating} size={16} />
                    <span>({ratingInfo.review_count})</span>
                  </div>
                )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{formatDate(listing.created_at)}</span>
              </div>
              {isProduct && (
                <button
                  onClick={(e) => { e.preventDefault(); navigate(`/listings/${listing.id}`); }}
                  className="flex items-center gap-1.5 bg-custom-green-600 hover:bg-custom-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Acheter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListingItem;