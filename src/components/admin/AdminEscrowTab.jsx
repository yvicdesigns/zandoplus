import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Search, ShieldCheck, Loader2, CheckCircle, XCircle,
  AlertTriangle, Link as LinkIcon, Clock, Truck
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const COMMISSION_RATE = 0.03;

const STATUS_CONFIG = {
  en_attente_paiement: { label: 'En attente paiement', color: 'bg-yellow-100 text-yellow-800' },
  fonds_bloques:       { label: 'Fonds bloqués', color: 'bg-blue-100 text-blue-800' },
  livre:               { label: 'Livré', color: 'bg-purple-100 text-purple-800' },
  confirme:            { label: 'Confirmé', color: 'bg-green-100 text-green-800' },
  complete:            { label: 'Terminé', color: 'bg-green-200 text-green-900' },
  litige:              { label: 'Litige', color: 'bg-red-100 text-red-800' },
  rembourse:           { label: 'Remboursé', color: 'bg-gray-100 text-gray-700' },
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const StatusBadge = ({ statut }) => {
  const cfg = STATUS_CONFIG[statut] || { label: statut, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const AdminEscrowTab = memo(() => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions_escrow')
      .select(`
        id, statut, montant, created_at, date_limite_confirmation,
        date_livraison_declaree, date_confirmation, preuve_paiement_url, notes_litige,
        annonce:annonce_id(id, title, images),
        acheteur:acheteur_id(full_name, phone),
        vendeur:vendeur_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setTransactions(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRelease = async (tx) => {
    setActionLoading({ id: tx.id, type: 'release' });
    const { error } = await supabase.from('transactions_escrow')
      .update({ statut: 'complete' })
      .eq('id', tx.id);
    setActionLoading(null);
    setReleaseTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fonds libérés au vendeur.' });
    fetchData();
  };

  const handleRefund = async (tx) => {
    setActionLoading({ id: tx.id, type: 'refund' });
    const { error } = await supabase.from('transactions_escrow')
      .update({ statut: 'rembourse' })
      .eq('id', tx.id);
    setActionLoading(null);
    setRefundTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: "Remboursement enregistré." });
    fetchData();
  };

  const filtered = useMemo(() =>
    transactions.filter(tx =>
      tx.annonce?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.acheteur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vendeur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [transactions, searchQuery]
  );

  const counts = useMemo(() => ({
    litiges: transactions.filter(t => t.statut === 'litige').length,
    pending: transactions.filter(t => t.statut === 'fonds_bloques').length,
  }), [transactions]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        {/* Summary chips */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-sm text-red-700 font-medium">
            <AlertTriangle className="w-4 h-4" /> {counts.litiges} litige{counts.litiges !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm text-blue-700 font-medium">
            <ShieldCheck className="w-4 h-4" /> {counts.pending} fonds bloqué{counts.pending !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Rechercher par annonce, acheteur ou vendeur..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/2"
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((tx, i) => {
              const commission = Math.round(tx.montant * COMMISSION_RATE);
              const netVendeur = tx.montant - commission;
              const isLitige = tx.statut === 'litige';

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                >
                  <Card className={`border shadow-sm ${isLitige ? 'border-red-200 bg-red-50/30' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex gap-4 items-start">
                        <img
                          src={tx.annonce?.images?.[0] || 'https://via.placeholder.com/64'}
                          alt={tx.annonce?.title}
                          className="w-14 h-14 object-cover rounded-xl border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{tx.annonce?.title || 'Annonce supprimée'}</p>
                          <p className="text-xs text-gray-500">
                            Acheteur : <strong>{tx.acheteur?.full_name}</strong>
                            {tx.acheteur?.phone ? ` — ${tx.acheteur.phone}` : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vendeur : <strong>{tx.vendeur?.full_name}</strong>
                            {tx.vendeur?.phone ? ` — ${tx.vendeur.phone}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Le {formatDate(tx.created_at)}</p>
                        </div>
                        <StatusBadge statut={tx.statut} />
                      </div>

                      {/* Litige note */}
                      {isLitige && tx.notes_litige && (
                        <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                          {tx.notes_litige}
                        </div>
                      )}

                      {/* Financials */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Payé :</span>{' '}
                          <span className="font-semibold">{tx.montant?.toLocaleString()} FCFA</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission :</span>{' '}
                          <span className="font-semibold text-red-600">— {commission.toLocaleString()} FCFA</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Net vendeur :</span>{' '}
                          <span className="font-semibold text-green-700">{netVendeur.toLocaleString()} FCFA</span>
                        </div>
                      </div>

                      {/* Proof link */}
                      {tx.preuve_paiement_url && (
                        <a
                          href={tx.preuve_paiement_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-custom-green-600 hover:underline text-xs w-fit"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Preuve de paiement
                        </a>
                      )}

                      {/* Admin actions */}
                      {['fonds_bloques', 'livre', 'confirme', 'litige'].includes(tx.statut) && (
                        <div className="flex gap-2 flex-wrap pt-1">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setReleaseTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Libérer les fonds
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setRefundTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Rembourser l'acheteur
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ShieldCheck className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700">Aucune transaction</p>
          </div>
        )}
      </div>

      {/* Release dialog */}
      <Dialog open={!!releaseTarget} onOpenChange={() => setReleaseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Libérer les fonds</DialogTitle>
            <DialogDescription>
              Les fonds seront marqués comme libérés au vendeur ({releaseTarget?.vendeur?.full_name}).
              Montant net : <strong>{(releaseTarget?.montant - Math.round(releaseTarget?.montant * COMMISSION_RATE))?.toLocaleString()} FCFA</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseTarget(null)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleRelease(releaseTarget)}
              disabled={actionLoading?.id === releaseTarget?.id}
            >
              {actionLoading?.type === 'release' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer la libération
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={!!refundTarget} onOpenChange={() => setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser l'acheteur</DialogTitle>
            <DialogDescription>
              Cette action marque la transaction comme remboursée. Montant : <strong>{refundTarget?.montant?.toLocaleString()} FCFA</strong> à retourner à <strong>{refundTarget?.acheteur?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => handleRefund(refundTarget)}
              disabled={actionLoading?.id === refundTarget?.id}
            >
              {actionLoading?.type === 'refund' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer le remboursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default AdminEscrowTab;
