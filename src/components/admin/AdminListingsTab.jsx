import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, Eye, Trash2, Star, StarOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ConfirmActionDialog from '@/components/admin/ConfirmActionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchListingsAdmin } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';

const AdminListingsTab = memo(() => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState({ isOpen: false, listingId: null });
  const [loadingAction, setLoadingAction] = useState(null);
  const { toast } = useToast();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchListingsAdmin();
    
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else {
      setListings(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const openDeleteDialog = (listingId) => {
    setDialogState({ isOpen: true, listingId });
  };
  
  const closeDeleteDialog = () => {
    setDialogState({ isOpen: false, listingId: null });
  };

  const handleDeleteListing = async () => {
    if (!dialogState.listingId) return;
    setLoadingAction(dialogState.listingId);
    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: { type: 'listing', payload: { action: 'delete', listingId: dialogState.listingId } },
      });
      if (error) throw error;
      toast({ title: 'Succès', description: 'Annonce supprimée avec succès.', className: 'bg-green-100 text-green-800' });
      fetchListings(); 
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
      closeDeleteDialog();
    }
  };

  const handleToggleFeatured = async (listingId, currentStatus) => {
    setLoadingAction(listingId);
    try {
       const { error } = await supabase.rpc('set_featured_status_as_admin', {
         p_listing_id: listingId,
         p_featured: !currentStatus
       });
      if (error) throw error;
      toast({ title: 'Succès', description: `Annonce ${currentStatus ? 'retirée de' : 'mise en'} vedette.`, className: 'bg-green-100 text-green-800' });
      fetchListings(); 
    } catch (error) {
       toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
        setLoadingAction(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter(l => 
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.seller_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [listings, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <ConfirmActionDialog
        open={dialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteListing}
        title="Supprimer l'annonce ?"
        description="Cette action est irréversible et supprimera l'annonce de manière permanente."
        variant="destructive"
        isLoading={loadingAction === dialogState.listingId}
      />
      <div className="p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher par titre ou vendeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <div className="md:col-span-2 flex items-center space-x-4">
                      <img  src={listing.images?.[0] || 'https://via.placeholder.com/80'} alt={listing.title} className="w-20 h-20 object-cover rounded-lg"  />
                      <div>
                        <Link to={`/listings/${listing.id}`} className="font-semibold text-gray-800 hover:text-custom-green-600 transition-colors">{listing.title}</Link>
                        <p className="text-sm text-custom-green-700 font-bold">{listing.price?.toLocaleString() || 'N/A'} {listing.currency}</p>
                        <p className="text-xs text-gray-500">Vendeur: {listing.seller_full_name || 'Inconnu'}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Catégorie: <Badge variant="secondary">{listing.category}</Badge></p>
                      <p>Statut: <Badge variant={listing.status === 'active' ? 'default' : 'outline'} className={listing.status === 'active' ? 'bg-green-100 text-green-800' : ''}>{listing.status}</Badge></p>
                      <p>Posté le: {formatDate(listing.created_at)}</p>
                    </div>
                    <div className="flex items-center space-x-2 justify-self-start md:justify-self-end">
                      <Button asChild size="icon" variant="ghost"><Link to={`/listings/${listing.id}`}><Eye className="w-4 h-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleToggleFeatured(listing.id, listing.featured)} disabled={loadingAction === listing.id}>
                        {listing.featured ? <Star className="w-4 h-4 text-amber-500 fill-current" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(listing.id)} disabled={loadingAction === listing.id} className="text-red-500 hover:text-red-700 bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredListings.length === 0 && !loading && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune annonce trouvée</h3>
            <p className="text-gray-500">Essayez d'ajuster votre recherche.</p>
          </div>
        )}
      </div>
    </>
  );
});

export default AdminListingsTab;