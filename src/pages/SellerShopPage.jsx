import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ShoppingBag as LoadingIcon, ArrowLeft, Calendar, MapPin, Shield, Star, Phone, Loader2, Share2, Copy, Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ListingItem from '@/components/listings/ListingItem';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ShareShopButton = ({ seller }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const shopUrl  = `${window.location.origin}/seller/${seller.shop_slug || seller.id}`;
  const shopText = `Découvrez la boutique de ${seller.name} sur Zando+ Congo 🛍️`;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleShare = async () => {
    // Use native Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: seller.name, text: shopText, url: shopUrl });
      } catch {}
      return;
    }
    setOpen(o => !o);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const PLATFORMS = [
    {
      label: 'WhatsApp',
      color: 'text-green-600',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L.054 23.423a.75.75 0 00.918.983l5.741-1.505A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.964-1.356l-.355-.212-3.686.967.984-3.595-.231-.371A9.725 9.725 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
      ),
      href: `https://wa.me/?text=${encodeURIComponent(shopText + '\n' + shopUrl)}`,
    },
    {
      label: 'Facebook',
      color: 'text-blue-600',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}`,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="lg"
        onClick={handleShare}
        className="border-custom-green-300 text-custom-green-700 hover:bg-custom-green-50"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Partager
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 z-50"
          >
            {PLATFORMS.map(p => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className={p.color}>{p.icon}</span>
                <span className="text-sm font-medium text-gray-700">{p.label}</span>
              </a>
            ))}
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied
                ? <Check className="w-4 h-4 text-green-500" />
                : <Copy className="w-4 h-4 text-gray-500" />
              }
              <span className="text-sm font-medium text-gray-700">
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SellerShopPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingInfo, setRatingInfo] = useState({ average_rating: 0, review_count: 0 });
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);

      const isUUID = UUID_REGEX.test(sellerId);

      // Fetch by id (UUID) or by shop_slug
      const sellerPromise = isUUID
        ? supabase.from('profiles').select('*').eq('id', sellerId).single()
        : supabase.from('profiles').select('*').eq('shop_slug', sellerId).single();

      const { data: sellerData, error: sellerError } = await sellerPromise;

      if (sellerError || !sellerData) {
        console.error("Erreur de récupération du vendeur:", sellerError);
        navigate('/');
        return;
      }

      // Redirect UUID links to the canonical slug URL
      if (isUUID && sellerData.shop_slug) {
        navigate(`/seller/${sellerData.shop_slug}`, { replace: true });
        return;
      }

      const profileId = sellerData.id;

      const [{ data: listingsData, error: listingsError }, { data: ratingData }] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact' })
          .eq('user_id', profileId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('rating')
          .eq('seller_id', profileId),
      ]);

      const formattedSeller = {
          ...sellerData,
          name: sellerData.full_name || 'Vendeur Anonyme',
          avatar: sellerData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerData.full_name || 'A')}&background=2EB565&color=fff&size=128`,
          banner: sellerData.banner_url,
      };
      setSeller(formattedSeller);
      
      if (listingsError) {
        console.error("Erreur de récupération des annonces:", listingsError);
      } else {
        setListings(listingsData);
      }

      if (ratingData && ratingData.length > 0) {
        const avg = ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
        setRatingInfo({ average_rating: avg, review_count: ratingData.length });
      }

      setLoading(false);
    };

    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId, navigate]);

  const handleCallSeller = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    if (user.id === sellerId) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous appeler vous-même.",
        variant: "destructive",
      });
      return;
    }

    if (!seller.phone) {
      toast({
        title: "Numéro non disponible",
        description: "Le vendeur n'a pas fourni de numéro de téléphone.",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    window.location.href = `tel:${seller.phone}`;
    setTimeout(() => setIsCalling(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingIcon className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
         <Helmet>
          <title>Vendeur non trouvé - Zando+ Congo</title>
        </Helmet>
        <h1 className="text-2xl font-bold mb-4">Vendeur non trouvé</h1>
        <p className="text-gray-600 mb-6">Le vendeur que vous cherchez n'existe pas ou n'est plus disponible.</p>
        <Button onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Boutique de {seller.name} - Zando+ Congo</title>
        <meta name="description" content={`Explorez la boutique et découvrez toutes les annonces de ${seller.name} sur Zando+ Congo.`} />
        <link rel="canonical" href={`https://www.zandopluscg.com/seller/${seller.shop_slug || seller.id}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://www.zandopluscg.com/seller/${seller.shop_slug || seller.id}`} />
        <meta property="og:title" content={`Boutique de ${seller.name} - Zando+ Congo`} />
        <meta property="og:description" content={`Explorez la boutique et découvrez toutes les annonces de ${seller.name} sur Zando+ Congo.`} />
        <meta property="og:image" content={seller.banner || seller.avatar || 'https://www.zandopluscg.com/og-image.jpg'} />
        <meta property="og:site_name" content="Zando+ Congo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Boutique de ${seller.name} - Zando+ Congo`} />
        <meta name="twitter:description" content={`Explorez la boutique et découvrez toutes les annonces de ${seller.name} sur Zando+ Congo.`} />
        <meta name="twitter:image" content={seller.banner || seller.avatar || 'https://www.zandopluscg.com/og-image.jpg'} />
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 md:h-64"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-custom-green-600 to-custom-green-400"></div>
          {seller.banner ? (
             <img
                src={seller.banner}
                alt={`Bannière de la boutique de ${seller.name}`}
                className="w-full h-full object-cover opacity-20"
              />
          ) : (
             <div className="w-full h-full hero-pattern opacity-50"></div>
          )}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 left-4 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative bg-white rounded-2xl shadow-xl p-4 md:p-6 -mt-20 md:-mt-24"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white shadow-lg -mt-16 md:-mt-20 flex-shrink-0">
                <AvatarImage src={seller.avatar} alt={seller.name} />
                <AvatarFallback>{seller.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="mt-4 md:mt-2 md:ml-6 flex-grow text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{seller.name}</h1>
                  {seller.verified && <Shield className="w-7 h-7 text-green-500" title="Vendeur vérifié" />}
                </div>
                {seller.location && (
                  <div className="flex items-center justify-center md:justify-start text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    <span>{seller.location}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{ratingInfo.average_rating.toFixed(1)} ({ratingInfo.review_count} avis)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Membre depuis {format(new Date(seller.created_at), 'MMMM yyyy', { locale: fr })}</span>
                    </div>
                </div>
              </div>
              <div className="mt-4 md:mt-2 md:ml-auto flex-shrink-0 flex items-center gap-2">
                <ShareShopButton seller={seller} />
                <Button size="lg" className="gradient-bg hover:opacity-90 shadow-lg" onClick={handleCallSeller} disabled={isCalling}>
                    {isCalling ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Phone className="w-5 h-5 mr-2" />
                    )}
                    Appeler
                </Button>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 my-8">Annonces de {seller.name} ({listings.length})</h2>
            
            {listings.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {listings.map((listing, index) => (
                    <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                    >
                        <ListingItem listing={listing} viewMode="grid" />
                    </motion.div>
                  ))}
                </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg shadow-md border border-gray-100">
                <LoadingIcon className="w-12 h-12 mx-auto text-gray-300 mb-4"/>
                <h3 className="text-lg font-semibold text-gray-700">Aucune annonce pour le moment</h3>
                <p className="text-gray-500 mt-1">Ce vendeur n'a pas encore publié d'annonce active.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SellerShopPage;