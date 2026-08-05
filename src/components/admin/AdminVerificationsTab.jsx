import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileText, Camera, Home, Loader2, ExternalLink, ShieldCheck, Search, UserCheck, ShieldOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchVerificationRequestsAdmin } from '@/lib/adminQueryHelpers';
import { translateAdminError } from '@/lib/adminErrorHandler';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Approuvée', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

// ── Section : certifier manuellement un vendeur ───────────────────────────────
const ManualCertificationSection = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleSearch = useCallback(async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }

    setSearching(true);
    // profiles n'a pas de colonne email — on cherche uniquement par full_name
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, verified')
      .ilike('full_name', `%${q}%`)
      .limit(8);
    setResults(data || []);
    setSearching(false);
  }, []);

  const handleToggle = async (profile) => {
    setActionLoading(profile.id);
    const newVerified = !profile.verified;
    const { error } = await supabase
      .from('profiles')
      .update({ verified: newVerified })
      .eq('id', profile.id);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: newVerified ? 'Vendeur certifié ✅' : 'Certification retirée',
        description: newVerified
          ? `${profile.full_name} est maintenant Vendeur Certifié.`
          : `La certification de ${profile.full_name} a été retirée.`,
        className: newVerified ? 'bg-green-100 text-green-800' : undefined,
      });
      setResults(prev => prev.map(r => r.id === profile.id ? { ...r, verified: newVerified } : r));
    }
    setActionLoading(null);
  };

  return (
    <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Certifier manuellement un vendeur</h3>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 bg-white"
          placeholder="Rechercher par nom ou email…"
          value={query}
          onChange={handleSearch}
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(profile => (
            <div key={profile.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{profile.full_name || 'Sans nom'}</p>
                  <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                </div>
                {profile.verified && (
                  <Badge className="bg-blue-100 text-blue-700 border-none text-xs ml-1 flex-shrink-0">Vérifié</Badge>
                )}
              </div>
              <Button
                size="sm"
                variant={profile.verified ? 'outline' : 'default'}
                className={profile.verified
                  ? 'text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0'
                  : 'bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0'
                }
                disabled={actionLoading === profile.id}
                onClick={() => handleToggle(profile)}
              >
                {actionLoading === profile.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : profile.verified
                    ? <><ShieldOff className="w-4 h-4 mr-1" /> Retirer</>
                    : <><UserCheck className="w-4 h-4 mr-1" /> Certifier</>
                }
              </Button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">Aucun utilisateur trouvé.</p>
      )}
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
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

  const handleAction = async (requestId, userId, newStatus, reason = null) => {
    setIsActionLoading(true);
    try {
      // 1. Mettre à jour le statut de la demande
      const { error: reqError } = await supabase
        .from('verification_requests')
        .update({ status: newStatus, reviewed_at: new Date().toISOString(), ...(reason ? { rejection_reason: reason } : {}) })
        .eq('id', requestId);
      if (reqError) throw reqError;

      // 2. Si approuvé, marquer le profil comme vérifié
      if (newStatus === 'approved' && userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verified: true })
          .eq('id', userId);
        if (profileError) throw profileError;
      }

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

  const handleSync = async (userId, userName) => {
    const { error } = await supabase.from('profiles').update({ verified: true }).eq('id', userId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Badge synchronisé ✅', description: `${userName} est maintenant Vendeur Certifié.`, className: 'bg-green-100 text-green-800' });
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

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">

        {/* Certification manuelle */}
        <ManualCertificationSection />

        {/* Demandes via documents */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-700 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Clock className="w-4 h-4" /> En attente ({pending.length})
            </h3>
            <AnimatePresence>
              {pending.map((request, index) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  index={index}
                  formatDate={formatDate}
                  DocumentLink={DocumentLink}
                  onApprove={() => handleAction(request.id, request.user_id, 'approved')}
                  onReject={() => openRejectionModal(request)}
                  isActionLoading={isActionLoading}
                  selectedRequest={selectedRequest}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {processed.length > 0 && (
          <details className="group" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-700 list-none flex items-center gap-2 py-2">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Historique ({processed.length} traitée{processed.length > 1 ? 's' : ''})
            </summary>
            <div className="mt-3 space-y-3">
              <AnimatePresence>
                {processed.map((request, index) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    index={index}
                    formatDate={formatDate}
                    DocumentLink={DocumentLink}
                    onSync={() => handleSync(request.user_id, request.user?.full_name)}
                    readonly
                  />
                ))}
              </AnimatePresence>
            </div>
          </details>
        )}

        {requests.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Aucune demande de vérification</h3>
            <p className="text-gray-400 text-sm">Les nouvelles demandes apparaîtront ici.</p>
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
              onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, 'rejected', rejectionReason)}
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

const RequestCard = ({ request, index, formatDate, DocumentLink, onApprove, onReject, onSync, isActionLoading, selectedRequest, readonly }) => (
  <motion.div
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
          {!readonly && request.status === 'pending' && (
            <>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={onApprove} disabled={isActionLoading && selectedRequest?.id === request.id}>
                {isActionLoading && selectedRequest?.id === request.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approuver
              </Button>
              <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={onReject} disabled={isActionLoading}>
                <XCircle className="w-4 h-4 mr-2" /> Rejeter
              </Button>
            </>
          )}
          {request.status === 'approved' && onSync && (
            <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={onSync}>
              <ShieldCheck className="w-4 h-4 mr-1" /> Sync badge
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default AdminVerificationsTab;
