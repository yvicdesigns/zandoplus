import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useListings } from '@/contexts/ListingsContext';
import DeleteListingDialog from './DeleteListingDialog';
import ListingBadges from '@/components/common/ListingBadges';

const UserListingCard = memo(({ listing, isFavoriteView = false }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { deleteListing, loading: listingsLoading } = useListings();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const handleDelete = async () => {
    try {
      await deleteListing(listing.id);
      toast({
        title: "Annonce supprimée",
        description: "Votre annonce a été supprimée avec succès.",
        className: "bg-custom-green-500 text-white"
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer l'annonce.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="listing-card overflow-hidden border shadow-sm flex flex-col group">
        <div className="relative bg-gray-100">
          <Link to={`/listings/${listing.id}`}>
            <img
              className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
              alt={listing.title}
              src={listing.images?.[0] || 'https://via.placeholder.com/300x200?text=Image+Indisponible'}
              loading="lazy"
            />
          </Link>
          <div className="absolute top-3 left-3 z-10">
             <ListingBadges listing={listing} seller={listing.seller} />
          </div>
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <Link to={`/listings/${listing.id}`} className="flex-grow">
            <h3 className="font-bold mb-2 line-clamp-2 hover:text-custom-green-600 transition-colors">
              {listing.title}
            </h3>
          </Link>
          <p className="text-2xl font-bold text-custom-green-600 mb-2">
            {listing.currency || 'FCFA'} {(listing.price || 0).toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
            <span>{formatDate(listing.created_at)}</span>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {listing.views_count || 0}
            </div>
          </div>
          {!isFavoriteView && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/edit-ad/${listing.id}`)}
                  className="flex-1 border-custom-green-600 text-custom-green-600 hover:bg-custom-green-50 hover:text-custom-green-700"
                >
                  <Edit className="mr-2 h-4 w-4" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive-outline"
                  className="flex-1"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </div>
              {!listing.featured && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/boost/${listing.id}`)}
                  className="mt-2 w-full gradient-bg hover:opacity-90"
                >
                  <Zap className="mr-2 h-4 w-4" /> Booster l'annonce
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <DeleteListingDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={listingsLoading}
      />
    </>
  );
});

export default UserListingCard;