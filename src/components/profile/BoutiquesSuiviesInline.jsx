import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Store, MapPin, X, BadgeCheck } from 'lucide-react';

const BoutiquesSuiviesInline = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: follows } = await supabase
        .from('shop_follows')
        .select('seller_id, created_at, seller:seller_id(id, full_name, avatar_url, location, shop_slug, verified)')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      const list = (follows || []).filter(f => f.seller);
      const sellerIds = list.map(f => f.seller_id);

      let counts = {};
      if (sellerIds.length) {
        const { data: lst } = await supabase
          .from('listings')
          .select('user_id')
          .in('user_id', sellerIds)
          .eq('status', 'active');
        counts = (lst || []).reduce((acc, l) => { acc[l.user_id] = (acc[l.user_id] || 0) + 1; return acc; }, {});
      }

      setShops(list.map(f => ({ ...f.seller, productCount: counts[f.seller_id] || 0 })));
      setLoading(false);
    };
    load();
  }, [user]);

  const unfollow = async (sellerId) => {
    await supabase.from('shop_follows').delete().eq('follower_id', user.id).eq('seller_id', sellerId);
    setShops(prev => prev.filter(s => s.id !== sellerId));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-5">Boutiques suivies</h2>
      {shops.length === 0 ? (
        <div className="text-center py-16">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Vous ne suivez aucune boutique pour l'instant</p>
          <p className="text-[12px] text-gray-400 mt-1">Suivez une boutique pour être alerté de ses nouveaux produits.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shops.map(shop => (
            <div key={shop.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
              <Link to={`/seller/${shop.shop_slug || shop.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-custom-green-500 flex items-center justify-center">
                  {shop.avatar_url
                    ? <img src={shop.avatar_url} alt={shop.full_name} className="w-full h-full object-cover" />
                    : <span className="text-white font-black text-[16px]">{(shop.full_name || 'V').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{shop.full_name || 'Vendeur'}</p>
                    {shop.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2">
                    <span>{shop.productCount} produit{shop.productCount > 1 ? 's' : ''}</span>
                    {shop.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{shop.location}</span>}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => unfollow(shop.id)}
                className="flex-shrink-0 text-[11px] font-semibold text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Se désabonner
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoutiquesSuiviesInline;
