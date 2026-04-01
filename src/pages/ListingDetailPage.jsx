import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowLeft, Heart, Flag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ImageGallery from '@/components/listing/ImageGallery';
import SellerInfo from '@/components/listing/SellerInfo';
import ListingDescription from '@/components/listing/ListingDescription';
import SafetyTips from '@/components/listing/SafetyTips';
import RelatedListings from '@/components/listing/RelatedListings';
import ReportListingDialog from '@/components/listing/ReportListingDialog';
import DeliveryInfo from '@/components/listing/DeliveryInfo';
import ListingHeader from '@/components/listing/ListingHeader';
import ActionButtons from '@/components/listing/ActionButtons';
import { Helmet } from 'react-helmet-async';
import { useListings } from '@/contexts/ListingsContext';
import { sanitizeHtml, sanitizeInput } from '@/lib/validationUtils';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, favorites } = useListings();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);

  const isFavorite = listing ? favorites.has(listing.id) : false;

  const fetchListingDetails = useCallback(async () => {
    setLoading(true);
    setLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, seller:profiles(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new Error("Annonce non trouvée ou erreur de chargement.");
      }
      
      // XSS Protection: Sanitize dynamic content before component rendering
      const sanitizedListing = {
        ...data,
        title: sanitizeInput(data.title),
        description: sanitizeHtml(data.description)
      };

      setListing(sanitizedListing);

      if (user?.id !== data.user_id) {
        await supabase.rpc('increment_listing_view', { p_listing_id: id });
      }

      if (data.category) {
        const { data: relatedData, error: relatedError } = await supabase
          .from('listings')
          .select('*')
          .eq('category', data.category)
          .neq('id', data.id)
          .eq('status', 'active')
          .limit(4);
        
        if (relatedError) {
          console.error('Error fetching related listings:', relatedError);
        } else {
          setRelatedListings(relatedData.map(l => ({
            ...l,
            title: sanitizeInput(l.title),
            description: sanitizeHtml(l.description)
          })));
        }
      }

    } catch (error) {
      console.error('Error fetching listing details:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      navigate('/listings');
    } finally {
      setLoading(false);
      setLoadingRelated(false);
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    fetchListingDetails();
  }, [fetchListingDetails]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Découvrez cette annonce sur Zando+: ${listing.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Lien copié!", description: "Le lien de l'annonce a été copié dans votre presse-papiers." });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Annonce non trouvée</h2>
        <p className="text-gray-600 mb-6">Désolé, l'annonce que vous recherchez n'existe pas ou a été supprimée.</p>
        <Button onClick={() => navigate('/listings')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux annonces
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${listing.title} - Zando+`}</title>
        <meta name="description" content={listing.description.substring(0, 160)} />
      </Helmet>
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 hidden md:inline-flex">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ImageGallery listing={listing} isFavorite={isFavorite} toggleFavorite={() => toggleFavorite(listing.id)} />
            <ListingHeader listing={listing} seller={listing.seller} />
            <ListingDescription listing={listing} />
            <DeliveryInfo listing={listing} />
            <RelatedListings listings={relatedListings} loading={loadingRelated} />
          </div>
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
            
            <SellerInfo seller={listing.seller} />

            <ActionButtons listing={listing} />

            <div className="flex items-center justify-around p-2 border rounded-lg bg-white shadow-lg">
              <Button variant="ghost" onClick={() => toggleFavorite(listing.id)} className={`flex-col h-auto ${isFavorite ? 'text-pink-500' : ''}`}>
                <Heart className={`mb-1 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="text-xs">{isFavorite ? 'Favori' : 'Ajouter'}</span>
              </Button>
              <Button variant="ghost" onClick={handleShare} className="flex-col h-auto">
                <Share2 className="mb-1" />
                <span className="text-xs">Partager</span>
              </Button>
              <Button variant="ghost" onClick={() => setReportDialogOpen(true)} className="flex-col h-auto text-destructive hover:text-destructive/80">
                <Flag className="mb-1" />
                <span className="text-xs">Signaler</span>
              </Button>
            </div>
            <SafetyTips listingId={listing.id} listingTitle={listing.title} />
          </div>
        </div>
      </div>
      <ReportListingDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setReportDialogOpen}
        listingId={listing.id}
        listingTitle={listing.title}
      />
    </>
  );
};

export default ListingDetailPage;