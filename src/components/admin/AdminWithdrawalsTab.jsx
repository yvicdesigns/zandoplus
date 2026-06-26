import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Smartphone, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const STATUS_CONFIG = {
  pending:    { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  paid:       { label: 'Payé ✅', color: 'bg-green-100 text-green-800' },
  rejected:   { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const formatAmount = (n) => (n ?? 0).toLocaleString('fr-FR');

const AdminWithdrawalsTab = memo(() => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null, notes: '' });
  const { toast } = useToast();

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wallet_withdrawals')
      .select('id, montant, momo_number, statut, created_at, paid_at, admin_notes, vendeur:vendeur_id(full_name, id)')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setWithdrawals(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const handlePaid = async (id) => {
    setActionLoading(id);
    const { error } = await supabase.from('wallet_withdrawals')
      .update({ statut: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Marqué comme payé ✅', className: 'bg-green-100 text-green-800' });
    fetchWithdrawals();
  };

  const handleReject = async () => {
    setActionLoading(rejectDialog.id);
    const { error } = await supabase.from('wallet_withdrawals')
      .update({ statut: 'rejected', admin_notes: rejectDialog.notes })
      .eq('id', rejectDialog.id);
    setActionLoading(null);
    setRejectDialog({ open: false, id: null, notes: '' });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Retrait rejeté', className: 'bg-red-100 text-red-800' });
    fetchWithdrawals();
  };

  const copyMomo = (num) => {
    navigator.clipboard.writeText(num);
    toast({ title: 'Numéro copié !' });
  };

  const pending = withdrawals.filter(w => w.statut === 'pending' || w.statut === 'processing');
  const done = withdrawals.filter(w => w.statut === 'paid' || w.statut === 'rejected');

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Pending withdrawals */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Demandes en attente ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-3">
              {pending.map(w => {
                const cfg = STATUS_CONFIG[w.statut];
                return (
                  <Card key={w.id} className="border shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-lg">{formatAmount(w.montant)} FCFA</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">Vendeur : <span className="font-medium">{w.vendeur?.full_name || '—'}</span></p>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-mono text-sm font-semibold text-gray-800">{w.momo_number}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyMomo(w.momo_number)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400">Demandé le {formatDate(w.created_at)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white gap-1"
                          onClick={() => handlePaid(w.id)}
                          disabled={actionLoading === w.id}
                        >
                          {actionLoading === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Payé
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                          onClick={() => setRejectDialog({ open: true, id: w.id, notes: '' })}
                          disabled={actionLoading === w.id}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* History */}
        {done.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Historique ({done.length})</h2>
            <div className="space-y-2">
              {done.map(w => {
                const cfg = STATUS_CONFIG[w.statut];
                return (
                  <Card key={w.id} className="border shadow-sm opacity-80">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{formatAmount(w.montant)} FCFA — {w.vendeur?.full_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{w.momo_number}</p>
                        {w.paid_at && <p className="text-xs text-green-600">Payé le {formatDate(w.paid_at)}</p>}
                        {w.admin_notes && <p className="text-xs text-gray-400 italic">{w.admin_notes}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: null, notes: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Raison du rejet (optionnel) :</p>
          <Textarea
            placeholder="Ex: Numéro MoMo incorrect..."
            value={rejectDialog.notes}
            onChange={e => setRejectDialog(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null, notes: '' })}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading === rejectDialog.id}>
              {actionLoading === rejectDialog.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminWithdrawalsTab;
