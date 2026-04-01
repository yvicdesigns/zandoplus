import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Calendar } from 'lucide-react';
import ListingBadges from '@/components/common/ListingBadges';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const ListingItem = ({ listing, viewMode, isFavorite, toggleFavorite }) => {
  const [ratingInfo, setRatingInfo] = useState({ average_rating: 0, review_count: 0 });

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
              src={listing.images?.[0] || 'https://via.placeholder.com/300x200?text=Image+Indisponible'} />
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
          <div className="absolute top-3 left-3 z-10">
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
              src={listing.images?.[0] || 'https://via.placeholder.com/300x200?text=Image+Indisponible'} />
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
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.location || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListingItem;