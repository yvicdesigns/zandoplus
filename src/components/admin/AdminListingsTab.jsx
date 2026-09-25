import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, Eye, Trash2, Star, StarOff, CheckCircle, MessageSquare, Flame, BadgeCheck } from 'lucide-react';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { toWhatsAppLink } from '@/lib/phone';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ConfirmActionDialog from '@/components/admin/ConfirmActionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchListingsAdmin } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';

// Une annonce "prix suspect" = active, en FCFA, avec un prix positif sous le seuil
// choisi par l'admin, et que l'admin n'a pas déjà validée ("prix_confirme").
// Les prix en USD sont ignorés : le seuil est en FCFA.
const isSuspectPrice = (l, threshold) =>
  l.status === 'active' &&
  (!l.currency || ['FCFA', 'XAF'].includes(l.currency.toUpperCase())) &&
  Number(l.price) > 0 && Number(l.price) < threshold &&
  !(l.moderation_flags || []).includes('prix_confirme');

const AdminListingsTab = memo(() => {
  const [priceThreshold, setPriceThreshold] = useState(1000);
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

  // Prix vérifié par l'admin (ex: vraiment vendu à ce prix) : on l'enlève de la
  // liste des prix suspects pour ne pas le revoir à chaque fois.
  const handleConfirmPrice = async (listingId) => {
    setLoadingAction(listingId);
    try {
      const { error } = await supabase.rpc('admin_confirm_price', { p_listing_id: listingId });
      if (error) throw error;
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, moderation_flags: [...(l.moderation_flags || []), 'prix_confirme'] } : l));
      toast({ title: 'Prix confirmé', description: 'Cette annonce n\'apparaît plus dans les prix suspects.', className: 'bg-green-100 text-green-800' });
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Message WhatsApp pré-rempli pour demander au vendeur de vérifier son prix.
  const priceCheckMessage = (l) =>
    `Bonjour ${l.seller_full_name || ''}, ici l'équipe Zando+. Votre annonce "${l.title}" est affichée à ${Number(l.price).toLocaleString('fr-FR')} FCFA. ` +
    `Est-ce bien le bon prix ? Si c'est une erreur, vous pouvez le corriger ici : https://zandopluscg.com/edit-ad/${l.id}\n\nMerci !`;

  const openPriceCorrection = (l) => setRejectDialog({
    isOpen: true,
    listingId: l.id,
    reason: `Le prix affiché (${Number(l.price).toLocaleString('fr-FR')} FCFA) semble incorrect pour cet article. Merci de le corriger.`,
  });

  const handleRequestChanges = async () => {
    if (!rejectDialog.listingId) return;
    setLoadingAction(rejectDialog.listingId);
    try {
      const { error } = await supabase.rpc('admin_request_changes', { p_listing_id: rejectDialog.listingId, p_reason: rejectDialog.reason });
      if (error) throw error;

      // Le RPC ne prévient pas le vendeur : sans ça il ne saurait pas pourquoi son
      // annonce a disparu. Notification dans l'app (+ push) avec lien vers l'édition.
      const target = listings.find(l => l.id === rejectDialog.listingId);
      if (target?.seller_id) {
        await supabase.from('notifications').insert({
          user_id: target.seller_id,
          type: 'listing_pending_review',
          content: { message: `Votre annonce "${target.title}" est masquée pour le moment : ${rejectDialog.reason.trim()} Modifiez-la pour qu'elle soit de nouveau visible.` },
          link: `/edit-ad/${target.id}`,
        });
      }

      toast({ title: 'Demande envoyée', description: 'Le vendeur est prévenu dans l\'app et l\'annonce est masquée en attendant.', className: 'bg-amber-100 text-amber-800' });
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
    const filtered = listings.filter(l => {
      const matchesSearch = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.seller_full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'zero_stock' ? (l.quantity === 0 || l.status === 'inactive') :
        statusFilter === 'daily_offer' ? l.is_daily_offer === true :
        statusFilter === 'featured' ? l.featured === true :
        statusFilter === 'suspect_price' ? isSuspectPrice(l, priceThreshold) :
        l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    // Prix suspects : les plus bas d'abord (les cas les plus flagrants en haut).
    return statusFilter === 'suspect_price' ? filtered.sort((a, b) => Number(a.price) - Number(b.price)) : filtered;
  }, [listings, searchQuery, statusFilter, priceThreshold]);

  const suspectCount = useMemo(() => listings.filter(l => isSuspectPrice(l, priceThreshold)).length, [listings, priceThreshold]);
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
              { value: 'suspect_price', label: `💰 Prix suspects${suspectCount > 0 ? ` (${suspectCount})` : ''}` },
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

        {statusFilter === 'suspect_price' && (
          <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Annonces actives à moins de</span>
              <Input
                type="number"
                min={1}
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(Math.max(1, Number(e.target.value) || 1))}
                className="w-28 h-8 bg-white"
              />
              <span>FCFA (les plus basses d'abord)</span>
            </div>
            <p className="mt-2 text-xs text-amber-800">
              « Contacter » ouvre WhatsApp avec un message prêt. « Demander correction » masque l'annonce et prévient le vendeur dans l'app.
              « Prix correct » la retire de cette liste (par exemple un article vraiment vendu à ce prix).
            </p>
          </div>
        )}

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
                      {statusFilter === 'suspect_price' && (
                        <>
                          {toWhatsAppLink(listing.seller_phone) ? (
                            <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#1ebe5a] text-white h-8 px-3 text-xs gap-1">
                              <a href={toWhatsAppLink(listing.seller_phone, priceCheckMessage(listing))} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon /> Contacter
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-orange-500">Pas de numéro</span>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openPriceCorrection(listing)} disabled={loadingAction === listing.id} className="border-amber-400 text-amber-700 hover:bg-amber-50 h-8 px-3 text-xs gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> Demander correction
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleConfirmPrice(listing.id)} disabled={loadingAction === listing.id} className="border-green-400 text-green-700 hover:bg-green-50 h-8 px-3 text-xs gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" /> Prix correct
                          </Button>
                        </>
                      )}
                      {toWhatsAppLink(listing.seller_phone) && (
                        <Button asChild size="icon" variant="ghost" title={`Contacter ${listing.seller_full_name || 'le vendeur'} sur WhatsApp`} className="text-[#25D366] hover:bg-green-50">
                          <a href={toWhatsAppLink(listing.seller_phone)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /></a>
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