import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  AlertTriangle,
  User,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminDeletionRequestsTab = memo(() => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes de suppression.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('data_deletion_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Delete user account if user_id exists
      if (selectedRequest.user_id) {
        const { error: deleteError } = await supabase.rpc('delete_user_account_admin', {
          target_user_id: selectedRequest.user_id
        });

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée et les données ont été supprimées.",
      });

      setShowApproveDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'approbation.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('data_deletion_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée.",
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du rejet.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'default', icon: Clock },
      processing: { label: 'En traitement', variant: 'secondary', icon: Loader2 },
      approved: { label: 'Approuvée', variant: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejetée', variant: 'destructive', icon: XCircle },
      completed: { label: 'Terminée', variant: 'default', icon: CheckCircle, className: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const openDetailsDialog = (request) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const openApproveDialog = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Demande</DialogTitle>
            <DialogDescription>Informations complètes sur la demande de suppression</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Statut</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Date de demande</p>
                  <p className="text-sm">{new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm">{selectedRequest.email}</p>
              </div>

              {selectedRequest.profiles && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Utilisateur</p>
                  <div className="flex items-center gap-2">
                    {selectedRequest.profiles.avatar_url ? (
                      <img src={selectedRequest.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <p className="text-sm">{selectedRequest.profiles.full_name || 'Non renseigné'}</p>
                  </div>
                </div>
              )}

              {selectedRequest.reason && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Raison</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedRequest.reason}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Notes administrateur</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {selectedRequest.completed_at && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Date de traitement</p>
                  <p className="text-sm">{new Date(selectedRequest.completed_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Approuver la Suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de l'utilisateur seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approve-notes">Notes (optionnel)</Label>
            <Textarea
              id="approve-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ajoutez des notes sur cette approbation..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Approuver et Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la Demande</AlertDialogTitle>
            <AlertDialogDescription>
              La demande sera marquée comme rejetée. L'utilisateur en sera informé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-notes">Raison du rejet (optionnel)</Label>
            <Textarea
              id="reject-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Rejeter la Demande'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Demandes de Suppression de Données
          </CardTitle>
          <CardDescription>
            Gérez les demandes de suppression de compte et de données personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande de suppression</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.profiles?.avatar_url ? (
                            <img src={request.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <span className="font-medium">
                            {request.profiles?.full_name || 'Utilisateur supprimé'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {request.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(request)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openApproveDialog(request)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectDialog(request)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
});

export default AdminDeletionRequestsTab;