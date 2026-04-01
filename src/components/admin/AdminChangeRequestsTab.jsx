import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X, Eye } from 'lucide-react';
import { logAuditAction } from '@/lib/adminUtils';
import { useAuth } from '@/contexts/AuthContext';
import { fetchChangeRequestsWithProfiles } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const AdminChangeRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await fetchChangeRequestsWithProfiles();
    
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else if (data) {
      const transformed = data.map(req => {
        const requester = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
        const reviewer = Array.isArray(req.reviewed_by_profile) ? req.reviewed_by_profile[0] : req.reviewed_by_profile;
        return {
          ...req,
          requester_name: requester?.full_name || 'Utilisateur Inconnu',
          reviewer_name: reviewer?.full_name || 'Non examiné'
        };
      });
      setRequests(transformed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      const { resource_type, resource_id, action, payload } = selectedRequest;
      let error = null;

      if (resource_type === 'site_settings' && action === 'update') {
          const { error: updateError } = await supabase
            .from('site_settings')
            .update(payload)
            .eq('id', resource_id);
          error = updateError;
      } else {
          throw new Error("Type de ressource non supporté pour l'approbation automatique.");
      }

      if (error) throw error;

      await supabase
        .from('change_requests')
        .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date() })
        .eq('id', selectedRequest.id);

      await logAuditAction(user.id, 'APPROVE_CHANGE', 'change_request', selectedRequest.id, { original_action: action });

      toast({ title: 'Approuvé', description: 'La modification a été appliquée avec succès.', className: "bg-green-100 text-green-800" });
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast({ title: 'Erreur', description: translateAdminError(err), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('change_requests')
        .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date() })
        .eq('id', selectedRequest.id);
        
      if (error) throw error;

      await logAuditAction(user.id, 'REJECT_CHANGE', 'change_request', selectedRequest.id);

      toast({ title: 'Rejeté', description: 'La demande a été rejetée.' });
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast({ title: 'Erreur', description: translateAdminError(err), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Modification (Workflow d'Approbation)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500 w-8 h-8"/></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'} 
                               className={req.status === 'approved' ? 'bg-green-100 text-green-800' : ''}>
                          {req.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-sm">{req.resource_type}</span>
                        <span className="text-xs text-gray-500">par {req.requester_name}</span>
                     </div>
                     <p className="text-sm text-gray-600 font-medium">Action: {req.action}</p>
                     <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                   </div>
                   <div className="flex gap-2">
                     <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                       <Eye className="w-4 h-4 mr-2" /> Détails
                     </Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Examiner la demande</DialogTitle>
            <DialogDescription>
              Vérifiez les modifications demandées par <strong>{selectedRequest?.requester_name}</strong> avant de valider.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <p><strong>Ressource:</strong> {selectedRequest.resource_type}</p>
                <p><strong>ID:</strong> {selectedRequest.resource_id}</p>
                <p><strong>Action:</strong> {selectedRequest.action}</p>
                <p><strong>Date:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Contenu de la modification :</h4>
                <div className="bg-slate-50 border p-4 rounded-md overflow-auto max-h-60 text-xs font-mono text-gray-800 shadow-inner">
                  <pre>{JSON.stringify(selectedRequest.payload, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Annuler</Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                   {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <X className="w-4 h-4 mr-2" />}
                   Rejeter
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={actionLoading}>
                   {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Check className="w-4 h-4 mr-2" />}
                   Approuver & Appliquer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminChangeRequestsTab;