import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Loader2, ChevronRight, Truck, Shield, RotateCcw,
  ShoppingCart, Lock, Banknote, MessageSquare, Minus, Plus,
  CheckCircle, Eye, Store, MapPin, BadgeCheck, Flag, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ImageGallery from '@/components/listing/ImageGallery';
import RelatedListings from '@/components/listing/RelatedListings';
import ReportListingDialog from '@/components/listing/ReportListingDialog';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import SendMessageDialog from '@/components/listing/SendMessageDialog';
import { Helmet } from 'react-helmet-async';
import { useListings } from '@/contexts/ListingsContext';
import { sanitizeHtml, sanitizeInput } from '@/lib/validationUtils';
import { useCart } from '@/hooks/useCart';
import { useCategories } from '@/hooks/useCategories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { categories as CATEGORY_DEFS } from '@/components/post-ad/postAdConstants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = ['Description', 'Avis', 'Livraison & retours'];

const Stars = ({ rating, count }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}
          fill="currentColor"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
    {count > 0 && <span className="text-[12px] text-gray-500">({count} avis)</span>}
  </div>
);

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, favorites } = useListings();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const { addItem, isInCart } = useCart();
  const { categoriesMap } = useCategories();

  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [isMessageDialogOpen, setMessageDialogOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');

  const isFavorite = listing ? favorites.has(listing.id) : false;
  const inCart = listing ? isInCart(listing.id) : false;

  const fetchListingDetails = useCallback(async () => {
    setLoading(true);
    setLoadingRelated(true);
    try {
      const isUUID = UUID_REGEX.test(id);
      const query = supabase.from('listings').select('*, seller:profiles(*)');
      const { data, error } = await (isUUID ? query.eq('id', id) : query.eq('listing_slug', id)).single();
      if (error || !data) throw new Error('Annonce non trouvée ou erreur de chargement.');
      if (isUUID && data.listing_slug) {
        navigate(`/listings/${data.listing_slug}`, { replace: true });
        return;
      }
      const sanitizedListing = {
        ...data,
        title: sanitizeInput(data.title),
        description: sanitizeHtml(data.description),
      };
      setListing(sanitizedListing);
      if (user?.id !== data.user_id) {
        await supabase.rpc('increment_listing_view', { p_listing_id: data.id });
      }
      if (data.category) {
        const { data: relatedData } = await supabase
          .from('listings')
          .select('*')
          .eq('category', data.category)
          .neq('id', data.id)
          .eq('status', 'active')
          .limit(4);
        if (relatedData) {
          setRelatedListings(relatedData.map(l => ({
            ...l,
            title: sanitizeInput(l.title),
            description: sanitizeHtml(l.description),
          })));
        }
      }
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      navigate('/listings');
    } finally {
      setLoading(false);
      setLoadingRelated(false);
    }
  }, [id, user, navigate, toast]);

  useEffect(() => { fetchListingDetails(); }, [fetchListingDetails]);

  const fetchReviews = useCallback(async (listingId) => {
    if (!listingId) return;
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setReviews(data);
      const avg = data.length > 0 ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
      setAverageRating(avg);
    }
  }, []);

  useEffect(() => { if (listing?.id) fetchReviews(listing.id); }, [listing?.id, fetchReviews]);

  const handleReviewSubmit = async (reviewData) => {
    const { error } = await supabase.from('reviews').insert([{ ...reviewData, verified_purchase: true }]);
    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de soumettre votre avis.', variant: 'destructive' });
      throw error;
    }
    toast({ title: 'Avis envoyé !', description: 'Merci pour votre commentaire.' });
    fetchReviews(listing.id);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-2xl font-bold mb-4">Annonce non trouvée</h2>
      <Button onClick={() => navigate('/listings')}><ChevronRight className="mr-2 h-4 w-4" /> Retour aux annonces</Button>
    </div>
  );

  const isOwner = user && listing && user.id === listing.user_id;
  const categoryType = CATEGORY_DEFS[listing.category]?.type ?? 'product';
  const isProduct = !['job', 'service'].includes(categoryType);
  const categoryName = categoriesMap[listing.category]?.name || listing.category || '';

  const handleAddToCart = () => {
    if (!user) { openAuthModal(); return; }
    addItem(listing, (title) => toast({
      title: inCart ? 'Déjà dans le panier' : 'Ajouté au panier ✅',
      description: title,
      className: 'bg-custom-green-500 text-white',
    }));
  };
  const handleEscrow = () => {
    if (!user) { openAuthModal(); return; }
    navigate(`/escrow/${listing.id}`);
  };
  const handleCod = () => {
    if (!user) { openAuthModal(); return; }
    navigate(`/cod/${listing.id}`);
  };
  const handleMessage = () => {
    if (!user) { openAuthModal(); return; }
    setMessageDialogOpen(true);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description.replace(/<[^>]*>/g, '').substring(0, 500),
    image: listing.images?.[0] || '',
    url: `https://www.zandopluscg.com/listings/${listing.listing_slug || listing.id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency || 'XAF',
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Person', name: listing.seller?.full_name || 'Vendeur' },
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${listing.title} - Zando+`}</title>
        <meta name="description" content={listing.description.replace(/<[^>]*>/g, '').substring(0, 160)} />
        <meta property="og:title" content={`${listing.title} - Zando+`} />
        <meta property="og:description" content={listing.description.replace(/<[^>]*>/g, '').substring(0, 160)} />
        <meta property="og:image" content={listing.images?.[0] || 'https://www.zandopluscg.com/og-image.jpg'} />
        <link rel="canonical" href={`https://www.zandopluscg.com/listings/${listing.listing_slug || listing.id}`} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="bg-page-bg min-h-screen py-6">
        <div className="max-w-[1280px] mx-auto px-6">

          {/* ── Fil d'Ariane ── */}
          <nav className="flex items-center gap-1 text-[12px] text-gray-500 mb-5 flex-wrap">
            <Link to="/" className="hover:text-custom-green-500 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link to={`/listings?category=${listing.category}`} className="hover:text-custom-green-500 transition-colors">{categoryName}</Link>
            {listing.subcategory && (
              <>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <Link to={`/listings?category=${listing.category}&subcategory=${listing.subcategory}`} className="hover:text-custom-green-500 transition-colors">{listing.subcategory}</Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="text-gray-800 font-medium truncate max-w-[240px]">{listing.title}</span>
          </nav>

          {/* ── Grille principale ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* GAUCHE — Galerie */}
            <div className="lg:col-span-7">
              <ImageGallery
                listing={listing}
                isFavorite={isFavorite}
                toggleFavorite={() => toggleFavorite(listing.id)}
              />
            </div>

            {/* DROITE — Infos produit */}
            <div className="lg:col-span-5 space-y-4">

              {/* Badges */}
              {(() => {
                const discountPct = listing.original_price > listing.price
                  ? Math.round((1 - listing.price / listing.original_price) * 100)
                  : null;
                const isBestSeller = (listing.views_count || 0) >= 100;
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    {discountPct && (
                      <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                        -{discountPct}%
                      </span>
                    )}
                    {isBestSeller && (
                      <span className="bg-accent-yellow text-gray-900 text-[11px] font-black px-2.5 py-1 rounded-full">
                        Meilleure vente
                      </span>
                    )}
                    {listing.negotiable && (
                      <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                        Négociable
                      </span>
                    )}
                    {listing.seller?.verified && (
                      <span className="flex items-center gap-1 bg-green-50 text-custom-green-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-custom-green-200">
                        <BadgeCheck className="w-3.5 h-3.5" /> Produit certifié
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Titre */}
              <h1 className="text-[22px] font-black text-gray-900 leading-tight">{listing.title}</h1>

              {/* Étoiles */}
              {reviews.length > 0 && <Stars rating={averageRating} count={reviews.length} />}

              {/* Localisation + vues */}
              <div className="flex items-center gap-3 text-[12px] text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>
                {listing.views_count > 0 && (
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.views_count} vues</span>
                )}
                <span>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: fr })}</span>
              </div>

              {/* Prix */}
              <div className="py-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[36px] font-black text-custom-green-500 leading-none tabular-nums">
                    {(listing.price || 0).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
                  </span>
                  {listing.original_price > listing.price && (
                    <span className="text-[16px] text-gray-400 line-through tabular-nums">
                      {listing.original_price.toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
                    </span>
                  )}
                </div>
                {listing.original_price > listing.price && (
                  <p className="text-[12px] text-custom-green-500 font-semibold mt-0.5">
                    Économisez {(listing.original_price - listing.price).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}
                  </p>
                )}
              </div>

              {/* Mini badges de confiance */}
              <div className="flex items-start gap-5 py-3 border-y border-gray-100">
                {[
                  { icon: Truck,     title: 'Livraison rapide',    sub: 'à Brazzaville' },
                  { icon: Shield,    title: 'Paiement sécurisé',   sub: 'Mobile money ou carte' },
                  { icon: RotateCcw, title: 'Retour facile',       sub: 'Sous 7 jours' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-center gap-1.5 text-[11px] text-gray-600 flex-1 min-w-0">
                    <Icon className="w-4 h-4 text-custom-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{title}</p>
                      <p className="text-gray-400 leading-tight truncate">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Couleurs */}
              {listing.colors?.length > 0 && (() => {
                const COLOR_MAP = {
                  'Noir': '#1a1a1a', 'Gris': '#6b7280', 'Blanc': '#f5f5f5',
                  'Rose': '#f9a8d4', 'Rouge': '#ef4444', 'Beige': '#d4b896',
                  'Bleu': '#3b82f6', 'Vert': '#22c55e', 'Jaune': '#eab308',
                  'Orange': '#f97316', 'Violet': '#a855f7', 'Marron': '#92400e',
                  'Or': '#d97706', 'Argent': '#9ca3af',
                };
                return (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700 mb-2">
                      Couleur : <span className="font-bold">{listing.colors[0]}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {listing.colors.map(color => (
                        <button
                          key={color}
                          title={color}
                          className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-transparent hover:ring-custom-green-500 transition-all"
                          style={{ backgroundColor: COLOR_MAP[color] || '#ccc', boxShadow: '0 0 0 1px #e5e7eb' }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Quantité */}
              {isProduct && !isOwner && (
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-semibold text-gray-700">Quantité :</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-[14px] font-bold text-gray-900">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[12px] text-custom-green-500 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-custom-green-500 rounded-full inline-block" />
                    En stock
                  </span>
                </div>
              )}

              {/* Boutons d'action */}
              {isOwner ? (
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center text-[13px] text-gray-500">
                  C'est votre annonce. Les options d'achat ne sont pas disponibles pour vous.
                </div>
              ) : isProduct ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      className={`flex-1 h-[52px] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-colors ${
                        inCart
                          ? 'bg-green-50 text-custom-green-600 border-2 border-custom-green-500'
                          : 'bg-custom-green-500 text-white hover:bg-custom-green-600'
                      }`}
                    >
                      {inCart ? <CheckCircle className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                      {inCart ? 'Dans le panier' : 'Ajouter au panier'}
                    </button>
                    <button
                      onClick={handleEscrow}
                      className="flex-1 h-[52px] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 border-2 border-custom-green-500 text-custom-green-500 hover:bg-green-50 transition-colors"
                    >
                      <Lock className="w-5 h-5" />
                      Acheter maintenant
                    </button>
                  </div>
                  {listing.accepts_cash_on_delivery && (
                    <button
                      onClick={handleCod}
                      className="w-full h-[46px] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                    >
                      <Banknote className="w-5 h-5" />
                      Payer à la livraison
                    </button>
                  )}
                  <button
                    onClick={handleMessage}
                    className="w-full h-[42px] rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Envoyer un message
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMessage}
                  className="w-full h-[52px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 bg-custom-green-500 text-white hover:bg-custom-green-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contacter
                </button>
              )}

              {/* Preuve sociale */}
              {listing.views_count > 10 && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-xl text-[12px] text-custom-green-700">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span><strong>{listing.views_count}</strong> personnes ont consulté cette annonce</span>
                </div>
              )}

              {/* Favori + Signaler */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => toggleFavorite(listing.id)}
                  className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg transition-colors ${
                    isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                  {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
                </button>
                <button
                  onClick={() => setReportDialogOpen(true)}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
                >
                  <Flag className="w-4 h-4" />
                  Signaler
                </button>
              </div>
            </div>
          </div>

          {/* ── Section basse : Onglets + Vendeur ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">

            {/* Onglets */}
            <div className="lg:col-span-8">
              <div className="flex border-b border-gray-200 mb-6">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'border-custom-green-500 text-custom-green-500'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab === 'Avis' && reviews.length > 0 ? `Avis (${reviews.length})` : tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Description' && (
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[14px]"
                    dangerouslySetInnerHTML={{ __html: listing.description }}
                  />
                </div>
              )}

              {activeTab === 'Avis' && (
                <ReviewsSection
                  listingId={listing.id}
                  sellerId={listing.user_id}
                  reviews={reviews}
                  averageRating={averageRating}
                  onReviewSubmitted={handleReviewSubmit}
                />
              )}

              {activeTab === 'Livraison & retours' && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-5">
                  {[
                    {
                      icon: Truck,
                      title: 'Livraison à domicile',
                      desc: 'Livraison disponible à Brazzaville. Les délais et frais sont définis par le vendeur au moment de l\'achat.',
                    },
                    {
                      icon: Shield,
                      title: 'Achat protégé — Escrow Zando+',
                      desc: 'Vos fonds sont bloqués jusqu\'à confirmation de réception. Le paiement est libéré uniquement après validation de votre commande.',
                    },
                    {
                      icon: RotateCcw,
                      title: 'Politique de retour',
                      desc: 'Retour sous 7 jours si l\'article ne correspond pas à la description. Contactez le vendeur ou notre support en cas de litige.',
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-custom-green-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">{title}</p>
                        <p className="text-[12px] text-gray-600 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Carte vendeur */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vendu par</p>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12 border border-gray-100">
                    <AvatarImage src={listing.seller?.avatar_url} />
                    <AvatarFallback className="bg-custom-green-100 text-custom-green-600 font-black text-lg">
                      {listing.seller?.full_name?.charAt(0)?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[15px] font-black text-gray-900 truncate">{listing.seller?.full_name}</p>
                    {listing.seller?.verified && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-custom-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-custom-green-200 mt-0.5">
                        <BadgeCheck className="w-3 h-3" /> Boutique officielle
                      </span>
                    )}
                  </div>
                </div>

                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Stars rating={averageRating} count={reviews.length} />
                  </div>
                )}

                {listing.seller?.created_at && (
                  <p className="text-[11px] text-gray-400 mb-4">
                    Membre depuis {formatDistanceToNow(new Date(listing.seller.created_at), { addSuffix: false, locale: fr })}
                  </p>
                )}

                {user?.id !== listing.seller?.id && (
                  <Button
                    variant="outline"
                    className="w-full border-custom-green-500 text-custom-green-600 hover:bg-green-50 font-semibold"
                    onClick={() => navigate(`/seller/${listing.seller?.shop_slug || listing.seller?.id}`)}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Visiter la boutique
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Annonces similaires ── */}
          <div className="mt-10">
            <RelatedListings listings={relatedListings} loading={loadingRelated} />
          </div>

        </div>
      </div>

      <ReportListingDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setReportDialogOpen}
        listingId={listing.id}
        listingTitle={listing.title}
      />
      <SendMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        listing={listing}
      />
    </>
  );
};

export default ListingDetailPage;
