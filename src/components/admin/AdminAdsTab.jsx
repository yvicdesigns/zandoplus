import React, { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminAdsTab = memo(() => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState(null);
  
  // Rejection Dialog State
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adToReject, setAdToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const { toast } = useToast();

  const fetchAdvertisements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_advertisements');
      if (error) throw error;
      setAdvertisements(data);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les publicités." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  const handleUpdateStatus = async (adId, status, reason = null) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase.rpc('admin_update_ad_status', {
        p_ad_id: adId,
        p_status: status,
        p_reason: reason
      });
      if (error) throw error;
      toast({ title: "Succès", description: `Statut de la publicité mis à jour.` });
      fetchAdvertisements();
    } catch (error) {
      console.error("Error updating ad status:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le statut." });
    } finally {
      setProcessingAction(false);
      setIsRejectDialogOpen(false);
      setAdToReject(null);
      setRejectionReason('');
    }
  };

  const openRejectDialog = (ad) => {
    setAdToReject(ad);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const openDeleteConfirm = (ad) => {
    setAdToDelete(ad);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!adToDelete) return;
    try {
      const { error } = await supabase.from('advertisements').delete().eq('id', adToDelete.id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'La publicité a été supprimée.' });
      fetchAdvertisements();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer la publicité.' });
    } finally {
      setIsAlertOpen(false);
      setAdToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Actif</Badge>;
      case 'pending_approval': return <Badge variant="secondary">En attente</Badge>;
      case 'pending_payment': return <Badge variant="outline">Paiement en attente</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      case 'expired': return <Badge className="bg-gray-400">Expiré</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Publicités</CardTitle>
          <CardDescription>Gérez les bannières publicitaires et les publicités des utilisateurs.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aperçu</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                        <a href={ad.image_url} target="_blank" rel="noopener noreferrer">
                            <img src={ad.image_url} alt="ad" className="h-8 w-16 object-cover rounded hover:opacity-80 transition-opacity" />
                        </a>
                    </TableCell>
                    <TableCell>{ad.user?.full_name || ad.user_full_name || "Externe"}</TableCell>
                    <TableCell>{getStatusBadge(ad.status)}</TableCell>
                    <TableCell>{ad.expires_at ? format(new Date(ad.expires_at), 'd MMM yyyy', { locale: fr }) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ad.status === 'pending_approval' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ad.id, 'active')}>
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRejectDialog(ad)}>
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => window.open(ad.image_url, '_blank')}>
                            Voir l'image
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteConfirm(ad)} className="text-red-600">
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {!loading && advertisements.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                <p>Aucune publicité trouvée.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Alert */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette publicité ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la publicité</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet pour l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="mb-2 block">Raison du rejet</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Ex: Image floue, contenu inapproprié..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)} disabled={processingAction}>Annuler</Button>
            <Button 
                variant="destructive" 
                onClick={() => handleUpdateStatus(adToReject.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim() || processingAction}
            >
              {processingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Rejeter la Publicité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminAdsTab;