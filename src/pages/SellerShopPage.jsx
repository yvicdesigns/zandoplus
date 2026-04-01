import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ShoppingBag as LoadingIcon, ArrowLeft, Calendar, MapPin, Shield, Star, Phone, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ListingItem from '@/components/listings/ListingItem';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

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

      const sellerPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();
        
      const listingsPromise = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('user_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const ratingPromise = supabase
        .from('seller_ratings')
        .select('average_rating, review_count')
        .eq('seller_id', sellerId)
        .maybeSingle();
      
      const [{ data: sellerData, error: sellerError }, { data: listingsData, error: listingsError }, { data: ratingData, error: ratingError }] = await Promise.all([sellerPromise, listingsPromise, ratingPromise]);

      if (sellerError || !sellerData) {
        console.error("Erreur de récupération du vendeur:", sellerError);
        navigate('/');
        return;
      }
      
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

      if (ratingData) {
        setRatingInfo({ average_rating: ratingData.average_rating || 0, review_count: ratingData.review_count || 0 });
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
              <div className="mt-4 md:mt-2 md:ml-auto flex-shrink-0">
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