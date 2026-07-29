import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ListingItem from '@/components/listings/ListingItem';
import ReviewItem from '@/components/reviews/ReviewItem';
import {
  Loader2, Star, Heart, MessageSquare, MapPin, Calendar,
  Package, Users, Clock, ThumbsUp, ChevronRight, BadgeCheck,
  Truck, Shield, Headphones, CheckCircle, SlidersHorizontal,
  ShoppingBag, Store, LayoutDashboard,
} from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Stars = ({ rating, small }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={small ? 12 : 14} height={small ? 12 : 14} viewBox="0 0 24 24"
        className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'} fill="currentColor">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

const SellerShopPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [seller, setSeller]           = useState(null);
  const [listings, setListings]       = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [ratingInfo, setRatingInfo]   = useState({ average: 0, count: 0 });
  const [txCount, setTxCount]         = useState(0);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('boutique');
  const [showAllCats, setShowAllCats] = useState(false);
  const [sortBy, setSortBy]           = useState('recent');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const isUUID = UUID_REGEX.test(sellerId);
      const q = supabase.from('profiles').select('*');
      const { data: s, error } = await (isUUID ? q.eq('id', sellerId) : q.eq('shop_slug', sellerId)).single();
      if (error || !s) { navigate('/'); return; }
      if (isUUID && s.shop_slug) { navigate(`/seller/${s.shop_slug}`, { replace: true }); return; }

      const [{ data: listData }, { data: revData }, { count: tx }] = await Promise.all([
        supabase.from('listings').select('*').eq('user_id', s.id).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)').eq('seller_id', s.id).order('created_at', { ascending: false }),
        supabase.from('transactions_escrow').select('id', { count: 'exact', head: true }).eq('vendeur_id', s.id).eq('statut', 'fonds_liberes'),
      ]);

      setSeller({ ...s, name: s.full_name || 'Vendeur' });
      setListings(listData || []);

      if (revData?.length) {
        const avg = revData.reduce((sum, r) => sum + r.rating, 0) / revData.length;
        setRatingInfo({ average: avg, count: revData.length });
        setReviews(revData);
      }
      setTxCount(tx || 0);
      setLoading(false);
    };
    if (sellerId) load();
  }, [sellerId, navigate]);

  /* Catégories dérivées des annonces */
  const categories = useMemo(() => {
    const map = {};
    listings.forEach(l => {
      if (l.category) map[l.category] = (map[l.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [listings]);

  /* Produits phares (top 4 par vues) */
  const featuredListings = useMemo(() =>
    [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 4),
  [listings]);

  /* Meilleures ventes (top 3) */
  const topListings = useMemo(() => featuredListings.slice(0, 3), [featuredListings]);

  /* Tous produits triés */
  const sortedListings = useMemo(() => {
    if (sortBy === 'price_asc') return [...listings].sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') return [...listings].sort((a, b) => b.price - a.price);
    if (sortBy === 'popular') return [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    return listings;
  }, [listings, sortBy]);

  /* Taux de satisfaction */
  const satisfactionRate = reviews.length
    ? Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100)
    : null;

  const handleContact = () => {
    if (!user) { openAuthModal(); return; }
    navigate(`/messages?seller=${seller.id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  if (!seller) return null;

  const memberSince = format(new Date(seller.created_at), 'MMM yyyy', { locale: fr });
  const displayCats = showAllCats ? categories : categories.slice(0, 5);

  const TRUST = [
    { icon: CheckCircle, title: 'Produits authentiques',  sub: '100% garantis' },
    { icon: Truck,       title: 'Livraison rapide',       sub: 'Partout au Congo' },
    { icon: Shield,      title: 'Paiement sécurisé',      sub: 'Transactions protégées' },
    { icon: Headphones,  title: 'Service client dédié',   sub: 'Réponse rapide' },
  ];

  const TABS = [
    { id: 'boutique',  label: 'Boutique' },
    { id: 'produits',  label: `Tous les produits` },
    { id: 'avis',      label: `Avis (${ratingInfo.count})` },
    { id: 'apropos',   label: 'À propos' },
  ];

  return (
    <>
      <Helmet>
        <title>Boutique {seller.name} — Zando+</title>
        <meta name="description" content={`Explorez la boutique de ${seller.name} sur Zando+ Congo.`} />
      </Helmet>

      {/* Bannière "tu regardes ta propre boutique" */}
      {user?.id === seller.id && (
        <div className="bg-accent-yellow border-b border-yellow-300 sticky top-0 z-40">
          <div className="max-w-[1280px] mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-800">
              <Store className="w-4 h-4" />
              <span>Vous prévisualisez votre boutique telle qu'elle apparaît aux clients</span>
            </div>
            <Link
              to="/espace-vendeur"
              className="flex items-center gap-1.5 bg-custom-green-500 text-white text-[12px] font-bold px-4 py-1.5 rounded-lg hover:bg-custom-green-600 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Mon espace vendeur
            </Link>
          </div>
        </div>
      )}

      <div className="bg-page-bg min-h-screen">

        {/* ══ HERO ══ */}
        <div className="relative bg-[#0d1f12] overflow-hidden">
          {/* Background décoratif */}
          {seller.banner_url ? (
            <img src={seller.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          ) : (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-custom-green-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 right-24 w-64 h-64 bg-green-400 rounded-full blur-2xl translate-y-1/4" />
            </div>
          )}

          {/* Images produits décoratives à droite */}
          <div className="absolute right-0 top-0 bottom-16 w-[45%] overflow-hidden hidden lg:block">
            <div className="grid grid-cols-2 gap-3 p-6 h-full content-center opacity-60">
              {listings.slice(0, 4).map((l, i) => (
                <div key={l.id} className={`rounded-2xl overflow-hidden ${i === 0 ? 'row-span-2' : ''}`}>
                  {l.images?.[0] && (
                    <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative max-w-[1280px] mx-auto px-6 py-8">
            <div className="flex gap-6 items-start">
              {/* Carte vendeur */}
              <div className="bg-white rounded-2xl p-6 w-72 flex-shrink-0 shadow-xl">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-custom-green-500 flex items-center justify-center shadow">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt={seller.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-[22px]">{seller.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[15px] font-black text-gray-900 truncate">{seller.name}</p>
                      {seller.verified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {seller.verified ? 'Boutique officielle' : 'Vendeur particulier'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  {seller.verified && (
                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                      <BadgeCheck className="w-4 h-4 text-custom-green-500 flex-shrink-0" />
                      <span className="font-medium">Entreprise vérifiée</span>
                    </div>
                  )}
                  {ratingInfo.count > 0 && (
                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span><strong>{ratingInfo.average.toFixed(1)}/5</strong> ({ratingInfo.count} avis)</span>
                    </div>
                  )}
                  {seller.location && (
                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{seller.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Membre depuis {memberSince}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    className="w-full h-9 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                    onClick={() => toast({ title: 'Bientôt disponible !' })}
                  >
                    <Heart className="w-4 h-4" /> Suivre la boutique
                  </button>
                  <button
                    onClick={handleContact}
                    className="w-full h-9 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Contacter le vendeur
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="relative bg-white/95 backdrop-blur-sm border-t border-gray-100">
            <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-around gap-4">
              {TRUST.map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-custom-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-gray-900 leading-tight">{title}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-custom-green-500 text-custom-green-500'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CONTENU ══ */}
        <div className="max-w-[1280px] mx-auto px-6 py-6">

          {/* ── Boutique ── */}
          {activeTab === 'boutique' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Sidebar */}
              <div className="lg:col-span-3 space-y-5">

                {/* Catégories */}
                {categories.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-[13px] font-black text-gray-900 mb-3">Catégories</h3>
                    <div className="space-y-2">
                      {displayCats.map(([cat, count]) => (
                        <button
                          key={cat}
                          onClick={() => { setActiveTab('produits'); }}
                          className="w-full flex items-center justify-between text-[12px] text-gray-600 hover:text-custom-green-600 py-1 transition-colors"
                        >
                          <span className="capitalize">{cat}</span>
                          <span className="text-gray-400">({count})</span>
                        </button>
                      ))}
                    </div>
                    {categories.length > 5 && (
                      <button onClick={() => setShowAllCats(v => !v)}
                        className="mt-3 text-[12px] text-custom-green-500 font-semibold hover:underline">
                        {showAllCats ? 'Voir moins' : 'Voir toutes les catégories'}
                      </button>
                    )}
                  </div>
                )}

                {/* Infos boutique */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-[13px] font-black text-gray-900 mb-4">Informations de la boutique</h3>
                  <div className="space-y-3 text-[12px]">
                    {[
                      { label: 'Nom de la boutique', value: seller.name },
                      { label: 'Type de vendeur', value: seller.verified ? 'Boutique officielle' : 'Vendeur particulier' },
                      seller.location && { label: 'Adresse', value: seller.location },
                      satisfactionRate != null && { label: 'Taux de satisfaction', value: `${satisfactionRate}%` },
                    ].filter(Boolean).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-gray-400">{label}</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('produits')}
                    className="mt-4 w-full h-9 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Voir la boutique
                  </button>
                </div>

                {/* Meilleures ventes */}
                {topListings.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-[13px] font-black text-gray-900 mb-3">Meilleures ventes</h3>
                    <div className="space-y-3">
                      {topListings.map(l => (
                        <Link key={l.id} to={`/listings/${l.listing_slug || l.id}`}
                          className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors">
                          <img src={l.images?.[0]} alt={l.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-gray-900 truncate">{l.title}</p>
                            <p className="text-[12px] text-custom-green-500 font-bold">{(l.price || 0).toLocaleString('fr-FR')} FCFA</p>
                            {l.views_count > 0 && (
                              <Stars rating={Math.min(5, 3.5 + l.views_count / 100)} small />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('produits')}
                      className="mt-3 text-[12px] text-custom-green-500 font-semibold hover:underline">
                      Voir plus
                    </button>
                  </div>
                )}
              </div>

              {/* Main */}
              <div className="lg:col-span-9 space-y-6">

                {/* À propos + stats */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-[14px] font-black text-gray-900 mb-2">À propos de {seller.name}</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {seller.bio || `Bienvenue sur la boutique de ${seller.name}. Retrouvez ici tous nos produits disponibles sur Zando+.`}
                    </p>
                    {seller.bio?.length > 150 && (
                      <button className="mt-2 text-[12px] text-custom-green-500 font-semibold hover:underline">Voir plus</button>
                    )}
                  </div>
                  <div className="border-l border-gray-100 pl-6">
                    <div className="space-y-3">
                      {[
                        { icon: Package,   label: 'Produits',            value: listings.length },
                        { icon: ShoppingBag, label: 'Commandes réussies', value: txCount },
                        { icon: ThumbsUp,  label: 'Taux de satisfaction', value: satisfactionRate != null ? `${satisfactionRate}%` : 'N/A' },
                        { icon: Calendar,  label: 'Membre depuis',        value: memberSince },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{label}</span>
                          </div>
                          <span className="font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Produits phares */}
                {featuredListings.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[15px] font-black text-gray-900">Produits phares</h3>
                      <button onClick={() => setActiveTab('produits')}
                        className="text-[12px] text-custom-green-500 font-semibold flex items-center gap-1 hover:underline">
                        Voir toute la boutique <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {featuredListings.map(l => (
                        <Link key={l.id} to={`/listings/${l.listing_slug || l.id}`}
                          className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-50 overflow-hidden">
                            <img src={l.images?.[0]} alt={l.title}
                              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="p-3">
                            <p className="text-[11px] font-semibold text-gray-900 truncate mb-1">{l.title}</p>
                            <Stars rating={ratingInfo.average || 4} small />
                            <p className="text-[13px] font-black text-gray-900 mt-1.5">{(l.price || 0).toLocaleString('fr-FR')} FCFA</p>
                            <button className="mt-2 w-full h-7 bg-custom-green-500 text-white rounded-lg text-[11px] font-bold hover:bg-custom-green-600 transition-colors">
                              Voir le produit
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tous les produits */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-black text-gray-900">Tous les produits</h3>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 h-9 px-3 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrer
                      </button>
                      <div className="flex items-center gap-2 text-[12px] text-gray-500">
                        <span>Trier par :</span>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 h-9 text-[12px] font-semibold text-gray-700 focus:outline-none focus:border-custom-green-500">
                          <option value="recent">Récent</option>
                          <option value="popular">Popularité</option>
                          <option value="price_asc">Prix croissant</option>
                          <option value="price_desc">Prix décroissant</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {sortedListings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sortedListings.map(l => <ListingItem key={l.id} listing={l} viewMode="grid" />)}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-[14px]">Aucun produit disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tous les produits ── */}
          {activeTab === 'produits' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-black text-gray-900">
                  Tous les produits ({listings.length})
                </h3>
                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                  <span>Trier par :</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 h-9 text-[12px] font-semibold text-gray-700 focus:outline-none focus:border-custom-green-500">
                    <option value="recent">Récent</option>
                    <option value="popular">Popularité</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                </div>
              </div>
              {sortedListings.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedListings.map(l => <ListingItem key={l.id} listing={l} viewMode="grid" />)}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                  <Package className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500">Aucun produit disponible</p>
                </div>
              )}
            </div>
          )}

          {/* ── Avis ── */}
          {activeTab === 'avis' && (
            <div className="max-w-3xl">
              {reviews.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5 flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[40px] font-black text-gray-900">{ratingInfo.average.toFixed(1)}</p>
                      <Stars rating={ratingInfo.average} />
                      <p className="text-[11px] text-gray-400 mt-1">{ratingInfo.count} avis</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviews.map(r => <ReviewItem key={r.id} review={r} />)}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                  <Star className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500">Aucun avis pour l'instant</p>
                </div>
              )}
            </div>
          )}

          {/* ── À propos ── */}
          {activeTab === 'apropos' && (
            <div className="max-w-2xl bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <h3 className="text-[16px] font-black text-gray-900">À propos de {seller.name}</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                {seller.bio || `Bienvenue sur la boutique de ${seller.name}. Retrouvez ici tous les produits disponibles sur Zando+.`}
              </p>
              <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-4">
                {[
                  { icon: Package,   label: 'Produits actifs',    value: listings.length     },
                  { icon: ShoppingBag, label: 'Commandes réussies', value: txCount            },
                  { icon: Star,      label: 'Note moyenne',       value: ratingInfo.count > 0 ? `${ratingInfo.average.toFixed(1)}/5` : 'N/A' },
                  { icon: Calendar,  label: 'Membre depuis',      value: memberSince          },
                  seller.location && { icon: MapPin, label: 'Localisation', value: seller.location },
                ].filter(Boolean).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">{label}</p>
                      <p className="text-[13px] font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default SellerShopPage;
