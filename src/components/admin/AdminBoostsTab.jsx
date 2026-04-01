import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Search, Link as LinkIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { fetchBoostRequestsAdmin } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';

const AdminBoostsTab = memo(() => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [generatingUrls, setGeneratingUrls] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await fetchBoostRequestsAdmin();
    
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else {
      const transformedData = (data || []).map(item => ({
        ...item,
        listing_title: item.listing?.title,
        listing_images: item.listing?.images,
        listing_id: item.listing?.id,
        user_full_name: item.user?.full_name
      }));
      setRequests(transformedData);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!requests || requests.length === 0) return;

      setGeneratingUrls(true);
      const urlPromises = requests
        .filter(r => r.payment_proof_url)
        .map(async (request) => {
          try {
            const url = new URL(request.payment_proof_url);
            const pathParts = url.pathname.split('/');
            
            const bucketIndex = pathParts.findIndex(part => part === 'payment_proofs' || part === 'payment_proof');
            if (bucketIndex === -1) {
              return { id: request.id, url: null, error: 'Invalid bucket' };
            }
            
            const bucketName = pathParts[bucketIndex];
            const path = pathParts.slice(bucketIndex + 1).join('/');

            if (!path) return { id: request.id, url: null, error: 'Invalid path' };

            const { data, error } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(path, 3600); 

            if (error) throw error;
            return { id: request.id, url: data.signedUrl };
          } catch (e) {
            return { id: request.id, url: null, error: e.message };
          }
        });

      const results = await Promise.all(urlPromises);
      const urlMap = results.reduce((acc, result) => {
        if (result.url) {
          acc[result.id] = result.url;
        }
        return acc;
      }, {});
      
      setSignedUrls(urlMap);
      setGeneratingUrls(false);
    };

    generateSignedUrls();
  }, [requests]);

  const handleToggleBoost = async (request) => {
    setLoadingAction({ id: request.id, type: 'toggle' });
    const isActivating = request.status !== 'active';
    const rpc_function = isActivating ? 'activate_boost' : 'deactivate_boost';
    
    try {
      const { error } = await supabase.rpc(rpc_function, { p_boost_request_id: request.id });
      if (error) throw error;
      toast({
        title: 'Succès',
        description: `Boost ${isActivating ? 'activé' : 'désactivé'} avec succès.`,
        className: 'bg-green-100 text-green-800'
      });
      fetchRequests();
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteBoost = async () => {
    if (!selectedRequest) return;
    setLoadingAction({ id: selectedRequest.id, type: 'delete' });
    
    try {
      const { error } = await supabase.from('boost_requests').delete().eq('id', selectedRequest.id);
      if (error) throw error;
      
      toast({ title: 'Succès', description: 'La demande de boost a été supprimée.', className: 'bg-green-100 text-green-800' });
      fetchRequests();
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setLoadingAction(null);
      setIsDeleteModalOpen(false);
      setSelectedRequest(null);
    }
  };

  const openDeleteModal = (request) => {
    setSelectedRequest(request);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_approval': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'active': return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'expired': return <Badge variant="outline">Expiré</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r =>
      r.listing_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher par annonce ou vendeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                    <div className="md:col-span-2 flex items-center space-x-4">
                      <img src={request.listing_images?.[0] || 'https://via.placeholder.com/80'} alt={request.listing_title} className="w-20 h-20 object-cover rounded-lg" />
                      <div>
                        <Link to={`/listings/${request.listing_id}`} className="font-semibold text-gray-800 hover:text-custom-green-600 transition-colors">{request.listing_title || 'Annonce supprimée'}</Link>
                        <p className="text-sm text-gray-500">Vendeur: {request.user_full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Demandé le: {formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Durée: <span className="font-semibold">{request.duration_days} jours</span></p>
                      <p>Montant: <span className="font-semibold text-custom-green-700">{request.total_amount?.toLocaleString() || 'N/A'} FCFA</span></p>
                      <p>Expire: <span className="font-semibold">{formatDate(request.expires_at)}</span></p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center gap-2">Statut: {getStatusBadge(request.status)}</p>
                      {request.payment_proof_url && (
                          signedUrls[request.id] ? (
                            <a href={signedUrls[request.id]} target="_blank" rel="noopener noreferrer" className="text-custom-green-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                              <LinkIcon className="w-3 h-3" /> Preuve de paiement
                            </a>
                          ) : (
                            <span className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                              {generatingUrls ? <Loader2 className="w-3 h-3 animate-spin"/> : null} Chargement du lien...
                            </span>
                          )
                      )}
                    </div>
                    <div className="flex items-center space-x-4 justify-self-start md:justify-self-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border">
                              <Switch
                                checked={request.status === 'active'}
                                onCheckedChange={() => handleToggleBoost(request)}
                                disabled={loadingAction?.id === request.id || request.status === 'rejected'}
                                id={`boost-switch-${request.id}`}
                              />
                              <label htmlFor={`boost-switch-${request.id}`} className="text-sm font-medium cursor-pointer">
                                {request.status === 'active' ? 'Activé' : 'Désactivé'}
                              </label>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{request.status === 'active' ? 'Désactiver le boost' : 'Activer/Réactiver le boost'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 bg-red-50" onClick={() => openDeleteModal(request)} disabled={loadingAction?.id === request.id}>
                        {loadingAction?.id === request.id && loadingAction?.type === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune demande de boost trouvée</h3>
            <p className="text-gray-500">Essayez d'ajuster votre recherche ou attendez de nouvelles demandes.</p>
          </div>
        )}
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la demande de boost</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande de boost pour l'annonce "{selectedRequest?.listing_title}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteBoost} disabled={loadingAction?.id === selectedRequest?.id}>
              {loadingAction?.id === selectedRequest?.id && loadingAction?.type === 'delete' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminBoostsTab;