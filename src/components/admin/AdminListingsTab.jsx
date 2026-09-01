import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, Eye, Trash2, Star, StarOff, CheckCircle, MessageSquare, Flame } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, listingId: null, reason: '' });
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
    const listingId = dialogState.listingId;
    setLoadingAction(listingId);
    closeDeleteDialog();
    try {
      const listing = listings.find(l => l.id === listingId);
      if (listing?.images?.length > 0) {
        const filePaths = listing.images.map(url => {
          try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/');
            const bucketIndex = parts.indexOf('listing_images');
            return bucketIndex !== -1 ? parts.slice(bucketIndex + 1).join('/') : null;
          } catch { return null; }
        }).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('listing_images').remove(filePaths);
        }
      }
      const { error } = await supabase.rpc('admin_delete_listing', { p_listing_id: listingId });
      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== listingId));
      toast({ title: 'Succès', description: 'Annonce supprimée avec succès.', className: 'bg-green-100 text-green-800' });
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
      fetchListings();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveListing = async (listingId) => {
    setLoadingAction(listingId);
    try {
      const { error } = await supabase.rpc('admin_approve_listing', { p_listing_id: listingId });
      if (error) throw error;
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active', moderation_flags: [], moderation_reason: null } : l));
      toast({ title: 'Annonce approuvée', description: 'L\'annonce est maintenant visible.', className: 'bg-green-100 text-green-800' });
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectDialog.listingId) return;
    setLoadingAction(rejectDialog.listingId);
    try {
      const { error } = await supabase.rpc('admin_request_changes', { p_listing_id: rejectDialog.listingId, p_reason: rejectDialog.reason });
      if (error) throw error;
      toast({ title: 'Demande envoyée', description: 'Le vendeur sera informé des modifications à apporter.', className: 'bg-amber-100 text-amber-800' });
      setRejectDialog({ isOpen: false, listingId: null, reason: '' });
      fetchListings();
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
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

  const handleToggleDailyOffer = async (listingId, currentStatus) => {
    setLoadingAction(listingId);
    try {
      // RPC sécurisée (comme set_featured_status_as_admin) : un simple .update() client est
      // bloqué en silence par la RLS "Users can update their own listings" quand l'admin
      // n'est pas le propriétaire — pas d'erreur renvoyée, le toggle ne persiste juste jamais.
      const { error } = await supabase.rpc('set_daily_offer_status_as_admin', {
        p_listing_id: listingId,
        p_daily_offer: !currentStatus,
      });
      if (error) throw error;
      toast({ title: 'Succès', description: `Offre du jour ${currentStatus ? 'retirée' : 'activée'}.`, className: 'bg-green-100 text-green-800' });
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
    return listings.filter(l => {
      const matchesSearch = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.seller_full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'zero_stock' ? (l.quantity === 0 || l.status === 'inactive') :
        statusFilter === 'daily_offer' ? l.is_daily_offer === true :
        statusFilter === 'featured' ? l.featured === true :
        l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listings, searchQuery, statusFilter]);

  const pendingCount = useMemo(() => listings.filter(l => l.status === 'pending_review' || l.status === 'needs_changes').length, [listings]);
  const zeroStockCount = useMemo(() => listings.filter(l => l.quantity === 0 || l.status === 'inactive').length, [listings]);
  const dailyOfferCount = useMemo(() => listings.filter(l => l.is_daily_offer === true).length, [listings]);
  const featuredCount = useMemo(() => listings.filter(l => l.featured === true).length, [listings]);

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
      {/* Request changes dialog */}
      <Dialog open={rejectDialog.isOpen} onOpenChange={(open) => !open && setRejectDialog({ isOpen: false, listingId: null, reason: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demander des modifications</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Expliquez au vendeur ce qu'il doit corriger :</p>
          <Textarea
            placeholder="Ex: Les photos sont floues. Veuillez ajouter une description plus détaillée et un prix correct."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ isOpen: false, listingId: null, reason: '' })}>Annuler</Button>
            <Button onClick={handleRequestChanges} disabled={!rejectDialog.reason.trim() || loadingAction === rejectDialog.listingId} className="bg-amber-500 hover:bg-amber-600 text-white">
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-4 sm:p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher par titre ou vendeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'active', label: 'Actives' },
              { value: 'pending_review', label: `En attente${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
              { value: 'needs_changes', label: 'Modif. requises' },
              { value: 'inactive', label: 'Inactives' },
              { value: 'zero_stock', label: `Stock = 0${zeroStockCount > 0 ? ` (${zeroStockCount})` : ''}` },
              { value: 'daily_offer', label: `🔥 Offres du jour${dailyOfferCount > 0 ? ` (${dailyOfferCount})` : ''}` },
              { value: 'featured', label: `⭐ Vedette${featuredCount > 0 ? ` (${featuredCount})` : ''}` },
            ].map(f => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(f.value)}
                className={statusFilter === f.value ? 'gradient-bg' : ''}
              >
                {f.label}
              </Button>
            ))}
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
                      {(statusFilter === 'zero_stock' || listing.quantity === 0) && (
                        <p className="text-xs font-semibold text-red-600">⚠ Stock mis à 0 par le vendeur</p>
                      )}
                      <p className="flex items-center gap-1 flex-wrap">
                        Statut: <Badge variant={listing.status === 'active' ? 'default' : 'outline'} className={listing.status === 'active' ? 'bg-green-100 text-green-800' : listing.status === 'pending_review' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}>{listing.status}</Badge>
                        {listing.moderation_flags?.length > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[10px]" title={listing.moderation_reason}>
                            🚨 IA: {listing.moderation_flags[0]}
                          </Badge>
                        )}
                        {listing.featured && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                            ⭐ Vedette
                          </Badge>
                        )}
                        {listing.is_daily_offer && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[10px]">
                            🔥 Offre du jour
                          </Badge>
                        )}
                      </p>
                      <p>Posté le: {formatDate(listing.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 justify-self-start md:justify-self-end flex-wrap">
                      {(listing.status === 'pending_review' || listing.status === 'needs_changes') && (
                        <Button size="sm" onClick={() => handleApproveListing(listing.id)} disabled={loadingAction === listing.id} className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Approuver
                        </Button>
                      )}
                      {listing.status === 'pending_review' && (
                        <Button size="sm" variant="outline" onClick={() => setRejectDialog({ isOpen: true, listingId: listing.id, reason: '' })} disabled={loadingAction === listing.id} className="border-amber-400 text-amber-700 hover:bg-amber-50 h-8 px-3 text-xs gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Modif.
                        </Button>
                      )}
                      <Button asChild size="icon" variant="ghost"><Link to={`/listings/${listing.id}`}><Eye className="w-4 h-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleToggleFeatured(listing.id, listing.featured)} disabled={loadingAction === listing.id} title="Mettre en vedette">
                        {listing.featured ? <Star className="w-4 h-4 text-amber-500 fill-current" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleToggleDailyOffer(listing.id, listing.is_daily_offer)} disabled={loadingAction === listing.id} title="Offre du jour">
                        <Flame className={`w-4 h-4 ${listing.is_daily_offer ? 'text-red-500 fill-current' : 'text-gray-300'}`} />
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