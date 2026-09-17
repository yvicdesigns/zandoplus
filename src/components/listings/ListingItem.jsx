import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Calendar, Zap, ShoppingCart, CheckCircle, Eye, MessageSquare } from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c.01-4.55 3.7-8.24 8.25-8.24M8.53 6.99c-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.8 2.87 4.45 3.91.62.27 1.1.42 1.48.54.62.2 1.19.17 1.63.1.5-.07 1.53-.62 1.75-1.23s.22-1.11.15-1.22c-.07-.11-.24-.17-.5-.3s-1.53-.75-1.77-.84-.41-.13-.59.13-.68.84-.83 1.02-.3.2-.56.07a7.1 7.1 0 0 1-2.09-1.29 7.83 7.83 0 0 1-1.45-1.8c-.15-.26-.02-.4.11-.53.12-.11.26-.3.4-.44.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46s-.59-1.43-.82-1.95c-.2-.5-.42-.44-.59-.44Z" />
  </svg>
);
import ListingBadges from '@/components/common/ListingBadges';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

// Sous ce seuil, on n'affiche rien plutôt qu'un petit chiffre décourageant
// ("2 vues") — l'absence de pastille ne dit rien de négatif.
const VIEWS_DISPLAY_THRESHOLD = 15;
// Les favoris sont naturellement plus rares que les vues (action plus
// engageante), seuil plus bas pour que la pastille ait une chance d'être
// visible sans pour autant afficher "1 favori".
const FAVORITES_DISPLAY_THRESHOLD = 5;

const toWhatsAppLink = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (!digits.startsWith('242')) {
    digits = digits.replace(/^0/, '');
    digits = `242${digits}`;
  }
  return `https://wa.me/${digits}`;
};

const ListingItem = ({ listing, viewMode, isFavorite, toggleFavorite }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem, isInCart } = useCart();
  const [ratingInfo, setRatingInfo] = useState({ average_rating: 0, review_count: 0 });
  const isRental = listing.listing_purpose === 'rent';
  const isProduct = listing.delivery_method !== 'none' && !isRental;
  const inCart = isInCart(listing.id);
  const whatsappLink = toWhatsAppLink(listing.seller?.phone);

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

  // Format compact façon réseaux sociaux : 1200 -> "1,2k"
  const formatCount = (n) => {
    if (n < 1000) return `${n}`;
    return `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k`;
  };

  if (viewMode === 'grid') {
    return (
      <Card className="listing-card overflow-hidden cursor-pointer border-0 shadow-lg h-full flex flex-col">
        <div className="relative bg-gray-100 h-32 sm:h-48">
          <Link to={`/listings/${listing.listing_slug || listing.id}`}>
            <img   
              className="w-full h-full object-cover object-center"
              alt={listing.title}
              src={listing.images?.[0] || '/placeholder-image.png'}
              onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Indisponible'; }} />
          </Link>
          <button
            onClick={() => toggleFavorite(listing.id)}
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-2 sm:p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isFavorite
                ? 'text-red-500 fill-current'
                : 'text-gray-400'
              }`}
            />
          </button>
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10 flex flex-col gap-1">
            {listing.is_boosted && (
              <>
                {/* Badge Boosté mobile : icône seule */}
                <span className="sm:hidden flex items-center justify-center bg-amber-400 text-white w-5 h-5 rounded-full shadow">
                  <Zap className="w-3 h-3" />
                </span>
                {/* Badge Boosté desktop : icône + texte */}
                <span className="hidden sm:flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  <Zap className="w-3 h-3" /> Boosté
                </span>
              </>
            )}
            {listing.listing_purpose === 'rent' && (
              <span className="flex items-center bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                À louer
              </span>
            )}
            <ListingBadges listing={listing} seller={listing.seller} />
          </div>
          {(listing.views_count >= VIEWS_DISPLAY_THRESHOLD || listing.favorites_count >= FAVORITES_DISPLAY_THRESHOLD) && (
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 z-10 flex items-center gap-1">
              {listing.views_count >= VIEWS_DISPLAY_THRESHOLD && (
                <span className="flex items-center gap-1 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-full">
                  <Eye className="w-3 h-3 flex-shrink-0" /> {formatCount(listing.views_count)}
                </span>
              )}
              {listing.favorites_count >= FAVORITES_DISPLAY_THRESHOLD && (
                <span className="flex items-center gap-1 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-full">
                  <Heart className="w-3 h-3 flex-shrink-0 text-red-400 fill-current" /> {formatCount(listing.favorites_count)}
                </span>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-1.5 sm:p-4 flex-grow flex-col justify-between">
          <div>
            <Link to={`/listings/${listing.listing_slug || listing.id}`}>
              <h3 className="text-[12px] sm:text-base font-bold mb-0.5 sm:mb-2 line-clamp-2 hover:text-custom-green-600 transition-colors leading-tight">
                {listing.title}
              </h3>
            </Link>
            {listing.negotiated_price ? (
              <div className="mb-0.5 sm:mb-2 leading-tight">
                <p className="text-[11px] sm:text-sm text-gray-400 line-through leading-none">
                  {(listing.price || 0).toLocaleString()} {listing.currency || 'FCFA'}
                </p>
                <p className="text-[12px] sm:text-lg font-bold text-custom-green-600 leading-tight">
                  {listing.negotiated_price.toLocaleString()} <span className="text-[11px] sm:text-xs font-semibold">{listing.currency || 'FCFA'}</span>
                  <span className="ml-1 text-[10px] sm:text-[10px] bg-green-100 text-green-700 font-bold px-1 py-0.5 rounded">Meilleur prix</span>
                </p>
              </div>
            ) : (
              <p className="text-[12px] sm:text-lg font-bold text-custom-green-600 mb-0.5 sm:mb-2 leading-tight">
                {(listing.price || 0).toLocaleString()} <span className="text-[11px] sm:text-xs font-semibold">{listing.currency || 'FCFA'}</span>
              </p>
            )}
          </div>
          <div>
            {ratingInfo.review_count > 0 && (
              <>
                {/* Rating desktop */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <StarRating rating={ratingInfo.average_rating} size={13} />
                  <span className="font-semibold">({ratingInfo.review_count})</span>
                </div>
                {/* Rating mobile compact */}
                <div className="sm:hidden flex items-center gap-0.5 mb-0.5">
                  <StarRating rating={ratingInfo.average_rating} size={10} />
                  <span className="text-[9px] text-gray-500">({ratingInfo.review_count})</span>
                </div>
              </>
            )}
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.location || 'N/A'}</span>
            </div>
            <div className="hidden sm:flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Publiée {formatDate(listing.created_at)}</span>
            </div>
            {/* Boutons — desktop uniquement, trop chargé en 3 col mobile */}
            {isProduct && (
              <div className="hidden sm:flex mt-3 flex-col gap-1.5">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); if (!inCart) addItem(listing, () => {}); navigate('/cart/checkout'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-custom-green-600 hover:bg-custom-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    Acheter
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); addItem(listing, (title) => toast({ title: 'Ajouté au panier ✅', description: title, className: 'bg-green-100 text-green-800' })); }}
                    className={`p-2 rounded-lg border transition-colors ${inCart ? 'bg-custom-green-100 border-custom-green-400 text-custom-green-700' : 'border-gray-300 hover:border-custom-green-400 hover:bg-custom-green-50 text-gray-500'}`}
                    title={inCart ? 'Dans le panier' : 'Ajouter au panier'}
                  >
                    {inCart ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            {isRental && (
              <div className="hidden sm:flex mt-3">
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-accent-yellow hover:brightness-95 text-[#1a1200] text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" /> Contacter
                  </a>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); navigate(`/listings/${listing.listing_slug || listing.id}`); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-accent-yellow hover:brightness-95 text-[#1a1200] text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    À louer
                  </button>
                )}
              </div>
            )}
            {/* Mobile : bouton panier vert — icône seule */}
            {isProduct && (
              <div className="sm:hidden mt-1.5">
                <button
                  onClick={(e) => { e.preventDefault(); addItem(listing, (title) => toast({ title: 'Ajouté ✅', description: title, className: 'bg-green-100 text-green-800' })); }}
                  className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-colors ${inCart ? 'bg-custom-green-700 text-white' : 'bg-custom-green-600 text-white hover:bg-custom-green-700'}`}
                >
                  {inCart ? <CheckCircle className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            {isRental && (
              <div className="sm:hidden mt-1.5">
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg bg-accent-yellow text-[#1a1200] transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); navigate(`/listings/${listing.listing_slug || listing.id}`); }}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg bg-accent-yellow text-[#1a1200] hover:brightness-95 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
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
          <Link to={`/listings/${listing.listing_slug || listing.id}`}>
            <img   
              className="w-full h-full object-cover object-center"
              alt={listing.title}
              src={listing.images?.[0] || '/placeholder-image.png'}
              onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Indisponible'; }} />
          </Link>
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
             {listing.listing_purpose === 'rent' && (
               <span className="flex items-center w-fit bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                 À louer
               </span>
             )}
             <ListingBadges listing={listing} seller={listing.seller} />
          </div>
          {(listing.views_count >= VIEWS_DISPLAY_THRESHOLD || listing.favorites_count >= FAVORITES_DISPLAY_THRESHOLD) && (
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
              {listing.views_count >= VIEWS_DISPLAY_THRESHOLD && (
                <span className="flex items-center gap-1 bg-gray-900/60 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  <Eye className="w-3 h-3 flex-shrink-0" /> {formatCount(listing.views_count)}
                </span>
              )}
              {listing.favorites_count >= FAVORITES_DISPLAY_THRESHOLD && (
                <span className="flex items-center gap-1 bg-gray-900/60 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  <Heart className="w-3 h-3 flex-shrink-0 text-red-400 fill-current" /> {formatCount(listing.favorites_count)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link to={`/listings/${listing.listing_slug || listing.id}`}>
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
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => { e.preventDefault(); if (!inCart) addItem(listing, () => {}); navigate('/cart/checkout'); }}
                    className="flex items-center gap-1.5 bg-custom-green-600 hover:bg-custom-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Acheter
                  </button>
                </div>
              )}
              {isRental && (
                <div className="flex gap-1.5">
                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-accent-yellow hover:brightness-95 text-[#1a1200] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" /> Contacter
                    </a>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); navigate(`/listings/${listing.listing_slug || listing.id}`); }}
                      className="flex items-center gap-1.5 bg-accent-yellow hover:brightness-95 text-[#1a1200] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> À louer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListingItem;