import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Heart, MapPin, Eye } from 'lucide-react';

const FavorisInline = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('listing_id, listing:listing_id(id, title, price, images, location, listing_slug, views_count, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems((data || []).filter(f => f.listing?.status !== 'archived'));
      setLoading(false);
    };
    load();
  }, [user]);

  const removeFavorite = async (listingId) => {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
    setItems(prev => prev.filter(f => f.listing_id !== listingId));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-5">Mes favoris</h2>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Aucun favori pour l'instant</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map(({ listing_id, listing }) => listing && (
            <div key={listing_id} className="group relative border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/listings/${listing.listing_slug || listing.id}`}>
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {listing.images?.[0]
                    ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <Heart className="w-10 h-10 m-auto mt-8 text-gray-200" />}
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-bold text-gray-900 truncate">{listing.title}</p>
                  <p className="text-[14px] font-black text-custom-green-500 mt-0.5">{(listing.price || 0).toLocaleString('fr-FR')} FCFA</p>
                  {listing.location && (
                    <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                      <MapPin className="w-3 h-3" />{listing.location}
                    </p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => removeFavorite(listing_id)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavorisInline;
