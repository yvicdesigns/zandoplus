import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-accent-yellow text-accent-yellow' : 'text-gray-200'}`} />
    ))}
  </div>
);

const AvisInline = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, seller:seller_id(id, full_name, avatar_url, shop_slug), listing:listing_id(id, title, listing_slug)')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-5">Mes avis</h2>
      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Vous n'avez pas encore laissé d'avis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {r.seller?.avatar_url
                      ? <img src={r.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-[14px] font-bold text-gray-400">{r.seller?.full_name?.[0]}</span>}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{r.seller?.full_name || 'Vendeur'}</p>
                    <p className="text-[11px] text-gray-400">{format(new Date(r.created_at), 'd MMM yyyy', { locale: fr })}</p>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>
              {r.listing && (
                <Link to={`/listings/${r.listing.listing_slug || r.listing.id}`} className="inline-block text-[11px] font-semibold text-custom-green-500 hover:underline mb-2">
                  {r.listing.title}
                </Link>
              )}
              {r.comment && <p className="text-[13px] text-gray-600 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvisInline;
