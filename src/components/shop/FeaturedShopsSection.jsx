import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ShieldCheck, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const PLAN_BADGE = {
  premium: { label: 'Premium', color: 'bg-amber-500', icon: Star },
  starter: { label: 'Vedette', color: 'bg-custom-green-500', icon: Zap },
};

const ShopCard = ({ boost, index }) => {
  const seller = boost.seller;
  if (!seller) return null;
  const badge = PLAN_BADGE[boost.plan] || PLAN_BADGE.starter;
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Link
        to={`/seller/${seller.id}`}
        className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-custom-green-300 hover:shadow-md transition-all duration-200 text-center"
      >
        <div className="relative">
          <img
            src={seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name || 'S')}&background=2EB565&color=fff&size=96`}
            alt={seller.full_name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-custom-green-300 transition-all"
          />
          <span className={`absolute -bottom-1 -right-1 ${badge.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}>
            <BadgeIcon className="w-2.5 h-2.5" />
            {badge.label}
          </span>
        </div>

        <div className="min-w-0 w-full">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-custom-green-600 transition-colors">
            {seller.full_name || 'Boutique'}
          </p>
          {seller.verified && (
            <p className="flex items-center justify-center gap-1 text-[11px] text-blue-600 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Vérifié
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const FeaturedShopsSection = () => {
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('shop_boosts')
      .select('id, plan, seller:profiles(id, full_name, avatar_url, verified)')
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .order('plan', { ascending: false }) // premium first
      .limit(8)
      .then(({ data }) => {
        setBoosts(data || []);
        setLoading(false);
      });
  }, []);

  if (loading || boosts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Boutiques Vedettes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vendeurs mis en avant sur Zando+</p>
        </div>
        <Link to="/boost-shop" className="text-xs text-custom-green-600 hover:underline font-medium">
          Mettre ma boutique en avant →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {boosts.map((boost, i) => (
          <ShopCard key={boost.id} boost={boost} index={i} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedShopsSection;
