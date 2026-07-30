import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ShieldCheck, Store, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Helmet } from 'react-helmet-async';

const ShopCard = ({ seller, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Link
      to={`/seller/${seller.shop_slug || seller.id}`}
      className="group flex flex-col items-center gap-3 p-5 bg-card-bg border border-gray-100 rounded-2xl hover:border-custom-green-300 hover:shadow-md transition-all duration-200 text-center"
    >
      <div className="relative">
        <img
          src={seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name || 'B')}&background=005023&color=fff&size=96`}
          alt={seller.full_name}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-custom-green-300 transition-all"
        />
        <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <ShieldCheck className="w-2.5 h-2.5" /> Vérifié
        </span>
      </div>
      <div className="min-w-0 w-full">
        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-custom-green-600 transition-colors">
          {seller.full_name || 'Boutique'}
        </p>
        {seller.bio && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{seller.bio}</p>
        )}
        {seller.location && (
          <p className="text-[11px] text-gray-400 mt-1">{seller.location}</p>
        )}
      </div>
    </Link>
  </motion.div>
);

const BoutiquesOfficiellesPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, location, shop_slug, verified')
      .eq('verified', true)
      .eq('is_seller', true)
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        setSellers(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = sellers.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Boutiques Officielles - Zando+</title>
        <meta name="description" content="Découvrez les boutiques vérifiées sur Zando+ Congo. Achetez en toute confiance auprès de vendeurs certifiés." />
      </Helmet>

      <div className="min-h-screen bg-page-bg py-10">
        <div className="max-w-[1280px] mx-auto px-6">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Boutiques Officielles</h1>
                <p className="text-sm text-gray-500">Vendeurs vérifiés par Zando+</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5 max-w-lg">
              <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-blue-700">
                Ces boutiques ont été vérifiées par notre équipe. Vous pouvez acheter en toute confiance.
              </p>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une boutique..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Grille */}
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-600">Aucune boutique trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Essayez un autre terme.' : 'Aucune boutique vérifiée pour le moment.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{filtered.length} boutique{filtered.length > 1 ? 's' : ''} vérifiée{filtered.length > 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((seller, i) => (
                  <ShopCard key={seller.id} seller={seller} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BoutiquesOfficiellesPage;
