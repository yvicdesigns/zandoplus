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
  AlertTriangle, Link as LinkIcon, Clock, Truck, Wallet,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const COMMISSION_RATE = 0.07;

const STATUS_CONFIG = {
  en_attente_paiement: { label: 'En attente paiement',           color: 'bg-yellow-100 text-yellow-800' },
  fonds_bloques:       { label: 'Paiement sécurisé',             color: 'bg-blue-100 text-blue-800'    },
  paiement_valide:     { label: 'Paiement validé',               color: 'bg-indigo-100 text-indigo-800'},
  livre:               { label: 'Livré',                         color: 'bg-purple-100 text-purple-800'},
  confirme:            { label: 'Confirmé',                      color: 'bg-green-100 text-green-800'  },
  retrait_demande:     { label: 'Retrait demandé',               color: 'bg-orange-100 text-orange-800'},
  complete:            { label: 'Terminé',                       color: 'bg-green-200 text-green-900'  },
  litige:              { label: 'Litige',                        color: 'bg-red-100 text-red-800'      },
  rembourse:           { label: 'Remboursé',                     color: 'bg-gray-100 text-gray-700'    },
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
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [refundTarget, setRefundTarget]   = useState(null);
  const [validateTarget, setValidateTarget] = useState(null);
  const [completeWithdrawTarget, setCompleteWithdrawTarget] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions_escrow')
      .select(`
        id, statut, montant, created_at, preuve_paiement_url, notes_litige,
        date_livraison_declaree, date_confirmation, paiement_valide_at,
        withdrawal_requested_at, vendeur_momo_number,
        annonce:annonce_id(id, title, images),
        acheteur:acheteur_id(full_name, phone),
        vendeur:vendeur_id(full_name, phone, momo_number)
      `)
      .order('created_at', { ascending: false });

    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setTransactions(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValidatePayment = async (tx) => {
    setActionLoading({ id: tx.id, type: 'validate' });
    const { error } = await supabase.rpc('admin_validate_payment', { p_transaction_id: tx.id });
    setActionLoading(null);
    setValidateTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Paiement validé', description: 'Le vendeur peut maintenant préparer la livraison.' });
    fetchData();
  };

  const handleCompleteWithdrawal = async (tx) => {
    setActionLoading({ id: tx.id, type: 'complete_withdraw' });
    const { error } = await supabase.rpc('admin_complete_withdrawal', { p_transaction_id: tx.id });
    setActionLoading(null);
    setCompleteWithdrawTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '💸 Retrait marqué comme effectué.' });
    fetchData();
  };

  const handleRelease = async (tx) => {
    setActionLoading({ id: tx.id, type: 'release' });
    const { error } = await supabase.from('transactions_escrow').update({ statut: 'complete' }).eq('id', tx.id);
    setActionLoading(null);
    setReleaseTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fonds libérés au vendeur.' });
    fetchData();
  };

  const handleRefund = async (tx) => {
    setActionLoading({ id: tx.id, type: 'refund' });
    const { error } = await supabase.from('transactions_escrow').update({ statut: 'rembourse' }).eq('id', tx.id);
    setActionLoading(null);
    setRefundTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Remboursement enregistré.' });
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
    litiges:   transactions.filter(t => t.statut === 'litige').length,
    pending:   transactions.filter(t => t.statut === 'fonds_bloques').length,
    retraits:  transactions.filter(t => t.statut === 'retrait_demande').length,
  }), [transactions]);

  // Transactions retrait demandé en haut (priorité)
  const withdrawalRequests = useMemo(() =>
    transactions.filter(t => t.statut === 'retrait_demande'),
    [transactions]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">

        {/* Chips résumé */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-sm text-red-700 font-medium">
            <AlertTriangle className="w-4 h-4" /> {counts.litiges} litige{counts.litiges !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm text-blue-700 font-medium">
            <ShieldCheck className="w-4 h-4" /> {counts.pending} à valider
          </div>
          {counts.retraits > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-300 px-3 py-1.5 rounded-lg text-sm text-orange-700 font-bold animate-pulse">
              <Wallet className="w-4 h-4" /> {counts.retraits} retrait{counts.retraits !== 1 ? 's' : ''} à envoyer ⚡
            </div>
          )}
        </div>

        {/* ── SECTION PRIORITAIRE : Retraits demandés ── */}
        {withdrawalRequests.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Retraits à envoyer maintenant
            </h3>
            {withdrawalRequests.map(tx => {
              const commission = Math.round(tx.montant * COMMISSION_RATE);
              const net = tx.montant - commission;
              const momo = tx.vendeur_momo_number || tx.vendeur?.momo_number || tx.vendeur?.phone || '—';
              return (
                <div key={tx.id} className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{tx.annonce?.title || 'Annonce supprimée'}</p>
                      <p className="text-xs text-gray-500">Vendeur : <strong>{tx.vendeur?.full_name}</strong></p>
                      <p className="text-xs text-gray-400">Demandé le {formatDate(tx.withdrawal_requested_at)}</p>
                    </div>
                    <StatusBadge statut={tx.statut} />
                  </div>

                  {/* Infos MoMo */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 space-y-1">
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Envoyer via MoMo</p>
                    <p className="text-lg font-bold text-orange-900">{net.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-sm text-gray-700">
                      Numéro : <strong className="font-mono text-base">{momo}</strong>
                    </p>
                  </div>

                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setCompleteWithdrawTarget(tx)}
                    disabled={actionLoading?.id === tx.id}
                  >
                    {actionLoading?.id === tx.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme envoyé
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Rechercher par annonce, acheteur ou vendeur..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/2"
          />
        </div>

        {/* Liste toutes transactions */}
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

                      {/* En-tête */}
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

                      {/* Note litige */}
                      {isLitige && tx.notes_litige && (
                        <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                          {tx.notes_litige}
                        </div>
                      )}

                      {/* Montants */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Payé :</span>{' '}
                          <span className="font-semibold">{tx.montant?.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Commission :</span>{' '}
                          <span className="font-semibold text-red-600">— {commission.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Net vendeur :</span>{' '}
                          <span className="font-semibold text-green-700">{netVendeur.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      </div>

                      {/* Preuve paiement */}
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

                      {/* Actions admin */}
                      <div className="flex gap-2 flex-wrap pt-1">
                        {/* Valider le paiement reçu */}
                        {tx.statut === 'fonds_bloques' && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => setValidateTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <ShieldCheck className="w-4 h-4 mr-1.5" /> Valider paiement reçu
                          </Button>
                        )}

                        {/* Libérer les fonds (litige / confirme / livre) */}
                        {['livre', 'confirme', 'litige'].includes(tx.statut) && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setReleaseTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Libérer les fonds
                          </Button>
                        )}

                        {/* Rembourser l'acheteur */}
                        {['fonds_bloques', 'paiement_valide', 'livre', 'confirme', 'litige'].includes(tx.statut) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setRefundTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Rembourser l'acheteur
                          </Button>
                        )}
                      </div>

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

      {/* Dialog : Valider paiement */}
      <Dialog open={!!validateTarget} onOpenChange={() => setValidateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le paiement reçu</DialogTitle>
            <DialogDescription>
              Confirmez que vous avez bien reçu le paiement de{' '}
              <strong>{validateTarget?.montant?.toLocaleString('fr-FR')} FCFA</strong> de{' '}
              <strong>{validateTarget?.acheteur?.full_name}</strong>.
              Le vendeur (<strong>{validateTarget?.vendeur?.full_name}</strong>) sera notifié pour préparer la livraison.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateTarget(null)}>Annuler</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => handleValidatePayment(validateTarget)}
              disabled={actionLoading?.id === validateTarget?.id}
            >
              {actionLoading?.type === 'validate' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Marquer retrait comme effectué */}
      <Dialog open={!!completeWithdrawTarget} onOpenChange={() => setCompleteWithdrawTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'envoi MoMo</DialogTitle>
            <DialogDescription>
              Confirmez que vous avez bien envoyé{' '}
              <strong>
                {completeWithdrawTarget
                  ? (completeWithdrawTarget.montant - Math.round(completeWithdrawTarget.montant * COMMISSION_RATE)).toLocaleString('fr-FR')
                  : 0
                } FCFA
              </strong>{' '}
              à <strong>{completeWithdrawTarget?.vendeur?.full_name}</strong> sur le numéro{' '}
              <strong className="font-mono">
                {completeWithdrawTarget?.vendeur_momo_number || completeWithdrawTarget?.vendeur?.momo_number || '—'}
              </strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteWithdrawTarget(null)}>Annuler</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => handleCompleteWithdrawal(completeWithdrawTarget)}
              disabled={actionLoading?.id === completeWithdrawTarget?.id}
            >
              {actionLoading?.type === 'complete_withdraw' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" /> Oui, envoi effectué
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Libérer les fonds */}
      <Dialog open={!!releaseTarget} onOpenChange={() => setReleaseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Libérer les fonds</DialogTitle>
            <DialogDescription>
              Les fonds seront marqués comme libérés au vendeur ({releaseTarget?.vendeur?.full_name}).
              Montant net : <strong>{(releaseTarget?.montant - Math.round(releaseTarget?.montant * COMMISSION_RATE))?.toLocaleString('fr-FR')} FCFA</strong>.
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

      {/* Dialog : Rembourser */}
      <Dialog open={!!refundTarget} onOpenChange={() => setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser l'acheteur</DialogTitle>
            <DialogDescription>
              Cette action marque la transaction comme remboursée. Montant :{' '}
              <strong>{refundTarget?.montant?.toLocaleString('fr-FR')} FCFA</strong> à retourner à{' '}
              <strong>{refundTarget?.acheteur?.full_name}</strong>.
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
