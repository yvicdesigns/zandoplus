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

const SellerReviewsInline = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:reviewer_id(id, full_name, avatar_url), listing:listing_id(id, title, listing_slug)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const satisfaction = reviews.length ? Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100) : null;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-4">Avis clients</h2>

      {reviews.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center gap-8">
          <div className="text-center">
            <p className="text-[36px] font-black text-gray-900 leading-none">{avg}</p>
            <Stars rating={Math.round(parseFloat(avg))} />
            <p className="text-[11px] text-gray-400 mt-1">{reviews.length} avis</p>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-[28px] font-black text-custom-green-500 leading-none">{satisfaction}%</p>
            <p className="text-[11px] text-gray-500 mt-1">Taux de satisfaction</p>
          </div>
          {[5,4,3,2,1].map(s => {
            const count = reviews.filter(r => r.rating === s).length;
            const pct = Math.round(count / reviews.length * 100);
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <span className="text-[11px] text-gray-500 w-4 text-right">{s}</span>
                <Star className="w-3 h-3 text-accent-yellow fill-accent-yellow flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-yellow rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-6">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Aucun avis reçu pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {r.reviewer?.avatar_url
                      ? <img src={r.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-[14px] font-bold text-gray-400">{r.reviewer?.full_name?.[0]}</span>}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{r.reviewer?.full_name || 'Client'}</p>
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

export default SellerReviewsInline;
