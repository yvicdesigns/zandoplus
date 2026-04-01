import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileText, Camera, Home, Loader2, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchVerificationRequestsAdmin } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Approuvée', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

const AdminVerificationsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchVerificationRequestsAdmin();
    
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId, newStatus, reason = null) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: { type: 'verification', payload: { action: 'update-status', requestId, status: newStatus, reason } },
      });

      if (error) throw error;

      toast({ title: 'Succès', description: `La demande a été ${newStatus === 'approved' ? 'approuvée' : 'rejetée'}.`, className: 'bg-green-100 text-green-800' });
      fetchRequests(); 
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
      setIsRejectionModalOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
    }
  };

  const openRejectionModal = (request) => {
    setSelectedRequest(request);
    setIsRejectionModalOpen(true);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('fr-FR');

  const DocumentLink = ({ url, icon, label }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-3 py-1.5 rounded-md w-fit">
      {icon}
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
    </a>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4">
        <AnimatePresence>
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border shadow-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <h3 className="font-semibold text-lg">{request.user?.full_name || 'Utilisateur inconnu'}</h3>
                    <p className="text-sm text-gray-600">{request.user?.email}</p>
                    <p className="text-xs text-gray-400">Demandé le {formatDate(request.created_at)}</p>
                    <div className="mt-2">
                      <Badge className={statusConfig[request.status]?.color}>
                        {statusConfig[request.status]?.icon}
                        <span className="ml-1">{statusConfig[request.status]?.label}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wider">Documents fournis</h4>
                    <div className="flex flex-col space-y-2">
                      {request.id_document_url && <DocumentLink url={request.id_document_url} icon={<FileText className="w-4 h-4" />} label="Pièce d'identité" />}
                      {request.selfie_url && <DocumentLink url={request.selfie_url} icon={<Camera className="w-4 h-4" />} label="Selfie avec la pièce" />}
                      {request.proof_of_address_url && <DocumentLink url={request.proof_of_address_url} icon={<Home className="w-4 h-4" />} label="Justificatif de domicile" />}
                    </div>
                    {request.status === 'rejected' && (
                      <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
                        <p className="text-sm text-red-800">
                          <strong>Raison du rejet :</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-1 flex flex-col justify-center space-y-2">
                    {request.status === 'pending' && (
                      <>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(request.id, 'approved')} disabled={isActionLoading && selectedRequest?.id === request.id}>
                          {isActionLoading && selectedRequest?.id === request.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Approuver
                        </Button>
                        <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => openRejectionModal(request)} disabled={isActionLoading}>
                          <XCircle className="w-4 h-4 mr-2" /> Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {requests.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune demande de vérification</h3>
            <p className="text-gray-500">Les nouvelles demandes de vérification des utilisateurs apparaîtront ici.</p>
          </div>
        )}
      </div>

      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande de {selectedRequest?.user?.full_name}</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison claire pour le rejet. L'utilisateur recevra cette information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-gray-700 mb-2 block">Raison du rejet</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: La photo de la pièce d'identité est floue."
              className="mt-1"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(selectedRequest.id, 'rejected', rejectionReason)}
              disabled={isActionLoading || !rejectionReason.trim()}
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVerificationsTab;