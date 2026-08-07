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
  AlertTriangle, Clock, Truck, Wallet, Banknote, RefreshCw, Zap, Eye,
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
  cod_en_attente:      { label: '💵 COD — À livrer',             color: 'bg-orange-100 text-orange-800'},
  cod_livre:           { label: '✅ COD — Cash collecté',         color: 'bg-green-100 text-green-800'  },
  cod_annule:          { label: 'COD Annulé',                    color: 'bg-gray-100 text-gray-700'    },
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

const PAYOUT_STATUS_CONFIG = {
  processing: { label: 'Virement en cours…', color: 'bg-blue-100 text-blue-800' },
  sent:       { label: 'Virement envoyé auto',  color: 'bg-green-100 text-green-800' },
  failed:     { label: 'Virement auto échoué', color: 'bg-red-100 text-red-800' },
};

const PayoutBadge = ({ tx }) => {
  if (!tx.payout_status) return null;
  const cfg = PAYOUT_STATUS_CONFIG[tx.payout_status] || { label: tx.payout_status, color: 'bg-gray-100 text-gray-600' };
  const providerLabel = tx.payout_provider === 'mtn' ? 'MTN' : tx.payout_provider === 'airtel' ? 'Airtel' : '';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Zap className="w-3 h-3" />
      {cfg.label}{providerLabel ? ` (${providerLabel})` : ''}
      {tx.payout_attempts > 0 ? ` — tentative ${tx.payout_attempts}/5` : ''}
    </span>
  );
};

const PRIORITY_ORDER = {
  fonds_bloques:       0,
  litige:              1,
  livre:               2,
  retrait_demande:     3,
  cod_en_attente:      4,
  paiement_valide:     5,
  confirme:            6,
  complete:            7,
  rembourse:           8,
  cod_livre:           9,
  cod_annule:          10,
  en_attente_paiement: 11,
};

const AdminEscrowTab = memo(() => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [refundTarget, setRefundTarget]   = useState(null);
  const [validateTarget, setValidateTarget] = useState(null);
  const [completeWithdrawTarget, setCompleteWithdrawTarget] = useState(null);
  const [zandroDeclareTarget, setZandoDeclareTarget] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions_escrow')
      .select(`
        id, statut, montant, created_at, preuve_paiement_url, notes_litige,
        date_livraison_declaree, date_confirmation, paiement_valide_at,
        withdrawal_requested_at, vendeur_momo_number, delivery_choice,
        payout_status, payout_provider, payout_attempts, payout_failure_reason,
        collection_status, collection_provider,
        annonce:annonce_id(id, title, images),
        acheteur:acheteur_id(full_name, phone),
        vendeur:vendeur_id(full_name, phone, momo_number)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setTransactions(data || []);
    }
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

  const handleRetryPayout = async (tx) => {
    setActionLoading({ id: tx.id, type: 'retry_payout' });
    const { error } = await supabase.rpc('admin_retry_payout', { p_transaction_id: tx.id });
    setActionLoading(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '🔄 Reversement remis en file — sera retenté au prochain passage automatique.' });
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
    // Sets confirme + withdrawal_available_at = NOW() so vendor can request withdrawal immediately
    const { error } = await supabase.from('transactions_escrow').update({
      statut: 'confirme',
      date_confirmation: new Date().toISOString(),
      withdrawal_available_at: new Date().toISOString(),
    }).eq('id', tx.id);
    setActionLoading(null);
    setReleaseTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fonds libérés — le vendeur peut maintenant retirer.' });
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

  const handleCodDelivered = async (tx) => {
    setActionLoading({ id: tx.id, type: 'cod_delivered' });
    const { error } = await supabase.rpc('admin_confirm_cod_delivery', { p_tx_id: tx.id });
    setActionLoading(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '💰 COD confirmé — cash collecté, vendeur notifié.' });
    fetchData();
  };

  const handleZandoDeclareDelivery = async (tx) => {
    setActionLoading({ id: tx.id, type: 'zando_declare' });
    const { error } = await supabase.rpc('admin_declare_delivery', { p_transaction_id: tx.id });
    setActionLoading(null);
    setZandoDeclareTarget(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Livraison Zando déclarée — acheteur notifié.' });
    fetchData();
  };

  const handleCodCancel = async (tx) => {
    setActionLoading({ id: tx.id, type: 'cod_cancel' });
    const { error } = await supabase.from('transactions_escrow').update({ statut: 'cod_annule' }).eq('id', tx.id);
    setActionLoading(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Commande COD annulée.' });
    fetchData();
  };

  const counts = useMemo(() => ({
    litiges:  transactions.filter(t => t.statut === 'litige').length,
    pending:  transactions.filter(t => t.statut === 'fonds_bloques').length,
    retraits: transactions.filter(t => t.statut === 'retrait_demande').length,
    cod:      transactions.filter(t => t.statut === 'cod_en_attente').length,
    livre:    transactions.filter(t => t.statut === 'livre').length,
    libere:   transactions.filter(t => t.statut === 'confirme').length,
    complete: transactions.filter(t => ['complete', 'rembourse', 'cod_livre', 'cod_annule'].includes(t.statut)).length,
  }), [transactions]);

  const filtered = useMemo(() => {
    let result = transactions.filter(tx =>
      tx.annonce?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.acheteur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vendeur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== null) {
      if (statusFilter === 'complete') {
        result = result.filter(tx => ['complete', 'rembourse', 'cod_livre', 'cod_annule'].includes(tx.statut));
      } else {
        result = result.filter(tx => tx.statut === statusFilter);
      }
    }
    result.sort((a, b) => (PRIORITY_ORDER[a.statut] ?? 99) - (PRIORITY_ORDER[b.statut] ?? 99));
    return result;
  }, [transactions, searchQuery, statusFilter]);

  // Commandes COD en attente de livraison
  const codPending = useMemo(() =>
    transactions.filter(t => t.statut === 'cod_en_attente'),
    [transactions]
  );

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

        {/* Filtres cliquables */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: null,              label: 'Toutes',              icon: null,          count: transactions.length,  base: 'bg-gray-100 text-gray-700 border-gray-200',       act: 'bg-gray-700 text-white border-gray-700' },
            { id: 'fonds_bloques',   label: 'Paiement à valider',  icon: ShieldCheck,   count: counts.pending,       base: 'bg-blue-50 text-blue-700 border-blue-200',        act: 'bg-blue-600 text-white border-blue-600' },
            { id: 'livre',           label: 'Livré — à libérer',   icon: Truck,         count: counts.livre,         base: 'bg-purple-50 text-purple-700 border-purple-200',  act: 'bg-purple-600 text-white border-purple-600' },
            { id: 'litige',          label: 'En litige',            icon: AlertTriangle, count: counts.litiges,       base: 'bg-red-50 text-red-700 border-red-200',           act: 'bg-red-600 text-white border-red-600' },
            { id: 'confirme',        label: 'Fonds libérés',        icon: CheckCircle,   count: counts.libere,        base: 'bg-green-50 text-green-700 border-green-200',     act: 'bg-green-600 text-white border-green-600' },
            { id: 'retrait_demande', label: 'Retrait à envoyer',    icon: Wallet,        count: counts.retraits,      base: 'bg-orange-50 text-orange-700 border-orange-200',  act: 'bg-orange-600 text-white border-orange-600' },
            { id: 'cod_en_attente',  label: 'COD à livrer',         icon: Banknote,      count: counts.cod,           base: 'bg-yellow-50 text-yellow-700 border-yellow-200',  act: 'bg-yellow-500 text-white border-yellow-500' },
            { id: 'complete',        label: 'Terminé ✓',            icon: null,          count: counts.complete,      base: 'bg-gray-50 text-gray-500 border-gray-200',        act: 'bg-gray-500 text-white border-gray-500' },
          ].map(f => {
            const isActive = statusFilter === f.id;
            const Icon = f.icon;
            return (
              <button
                key={String(f.id)}
                onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? f.act : f.base}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25' : 'bg-black/10'}`}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* ── SECTION COD : Livraisons à effectuer ── */}
        {codPending.length > 0 && (statusFilter === null || statusFilter === 'cod_en_attente') && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
              <Banknote className="w-5 h-5" /> Livraisons COD à effectuer (cash à collecter)
            </h3>
            {codPending.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl border border-yellow-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{tx.annonce?.title || 'Annonce supprimée'}</p>
                    <p className="text-xs text-gray-500">Acheteur : <strong>{tx.acheteur?.full_name}</strong> — {tx.acheteur?.phone}</p>
                    <p className="text-xs text-gray-500">Vendeur : <strong>{tx.vendeur?.full_name}</strong></p>
                    {tx.adresse_livraison && <p className="text-xs text-gray-600 mt-1">📍 {tx.adresse_livraison}</p>}
                    {tx.telephone_contact && <p className="text-xs text-gray-600">📞 {tx.telephone_contact}</p>}
                  </div>
                  <StatusBadge statut={tx.statut} />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-yellow-700 font-semibold">Cash à collecter</p>
                  <p className="text-lg font-bold text-yellow-900">{(tx.montant + 1500).toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-gray-500">(Prix {tx.montant.toLocaleString()} + Livraison 1 500 FCFA)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-custom-green-600 hover:bg-custom-green-700 text-white"
                    onClick={() => handleCodDelivered(tx)}
                    disabled={actionLoading?.id === tx.id}
                  >
                    {actionLoading?.id === tx.id && actionLoading?.type === 'cod_delivered'
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    Cash collecté ✅
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleCodCancel(tx)}
                    disabled={actionLoading?.id === tx.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Annuler
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SECTION PRIORITAIRE : Retraits demandés ── */}
        {withdrawalRequests.length > 0 && (statusFilter === null || statusFilter === 'retrait_demande') && (
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
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge statut={tx.statut} />
                      <PayoutBadge tx={tx} />
                    </div>
                  </div>

                  {tx.payout_status === 'failed' && tx.payout_failure_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {tx.payout_failure_reason}
                    </div>
                  )}

                  {/* Infos MoMo */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 space-y-1">
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Envoyer via MoMo</p>
                    <p className="text-lg font-bold text-orange-900">{net.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-sm text-gray-700">
                      Numéro : <strong className="font-mono text-base">{momo}</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {tx.payout_status === 'failed' && (
                      <Button
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleRetryPayout(tx)}
                        disabled={actionLoading?.id === tx.id}
                      >
                        {actionLoading?.id === tx.id && actionLoading?.type === 'retry_payout'
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Réessayer
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => setCompleteWithdrawTarget(tx)}
                      disabled={actionLoading?.id === tx.id}
                    >
                      {actionLoading?.id === tx.id && actionLoading?.type !== 'retry_payout' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme envoyé (manuel)
                    </Button>
                  </div>
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">Le {formatDate(tx.created_at)}</p>
                            {tx.delivery_choice === 'zando' && (
                              <span className="text-xs bg-custom-green-100 text-custom-green-700 px-2 py-0.5 rounded-full font-medium">🛵 Zando livre</span>
                            )}
                            {tx.delivery_choice === 'seller' && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">📦 Vendeur livre</span>
                            )}
                            {tx.delivery_choice === 'pickup' && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">🏪 Retrait boutique</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge statut={tx.statut} />
                          <PayoutBadge tx={tx} />
                        </div>
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
                        <button
                          onClick={async () => {
                            try {
                              const urlObj = new URL(tx.preuve_paiement_url);
                              const parts = urlObj.pathname.split('/payment_proofs/');
                              const filePath = parts[1];
                              if (!filePath) throw new Error('Chemin introuvable');
                              const { data, error } = await supabase.storage
                                .from('payment_proofs')
                                .createSignedUrl(filePath, 120);
                              if (error) throw error;
                              window.open(data.signedUrl, '_blank');
                            } catch (e) {
                              toast({ title: 'Erreur', description: "Impossible d'ouvrir la preuve.", variant: 'destructive' });
                            }
                          }}
                          className="flex items-center gap-1 text-custom-green-600 hover:underline text-xs w-fit"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir preuve de paiement
                        </button>
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

                        {/* Déclarer livraison Zando (admin livre) */}
                        {tx.statut === 'paiement_valide' && tx.delivery_choice === 'zando' && (
                          <Button
                            size="sm"
                            className="bg-custom-green-600 hover:bg-custom-green-700 text-white"
                            onClick={() => setZandoDeclareTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <Truck className="w-4 h-4 mr-1.5" /> Déclarer livraison Zando
                          </Button>
                        )}

                        {/* Libérer les fonds — uniquement si pas encore libéré */}
                        {['livre', 'litige'].includes(tx.statut) && (
                          <Button
                            size="sm"
                            className="bg-custom-green-600 hover:bg-custom-green-700 text-white"
                            onClick={() => setReleaseTarget(tx)}
                            disabled={!!actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Libérer les fonds
                          </Button>
                        )}

                        {/* Rembourser l'acheteur */}
                        {['fonds_bloques', 'paiement_valide', 'livre', 'litige'].includes(tx.statut) && (
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
              className="bg-custom-green-600 hover:bg-custom-green-700 text-white"
              onClick={() => handleRelease(releaseTarget)}
              disabled={actionLoading?.id === releaseTarget?.id}
            >
              {actionLoading?.type === 'release' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer la libération
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Déclarer livraison Zando */}
      <Dialog open={!!zandroDeclareTarget} onOpenChange={() => setZandoDeclareTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la livraison Zando+</DialogTitle>
            <DialogDescription>
              Confirmez que Zando+ a bien livré la commande{' '}
              <strong>{zandroDeclareTarget?.annonce?.title}</strong> à{' '}
              <strong>{zandroDeclareTarget?.acheteur?.full_name}</strong>.
              L'acheteur aura 24h pour confirmer la réception.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZandoDeclareTarget(null)}>Annuler</Button>
            <Button
              className="bg-custom-green-600 hover:bg-custom-green-700 text-white"
              onClick={() => handleZandoDeclareDelivery(zandroDeclareTarget)}
              disabled={actionLoading?.id === zandroDeclareTarget?.id}
            >
              {actionLoading?.type === 'zando_declare' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Truck className="w-4 h-4 mr-2" /> Confirmer la livraison
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
