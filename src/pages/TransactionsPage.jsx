import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, PackageCheck, AlertTriangle, Loader2,
  Clock, CheckCircle, XCircle, Truck, ArrowLeft, Wallet, Download, Link2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const STATUS_CONFIG = {
  en_attente_paiement: { label: 'En attente de paiement',          color: 'bg-yellow-100 text-yellow-800', icon: Clock         },
  fonds_bloques:       { label: 'Paiement sécurisé',               color: 'bg-blue-100 text-blue-800',    icon: ShieldCheck    },
  paiement_valide:     { label: 'Paiement validé',                 color: 'bg-indigo-100 text-indigo-800',icon: ShieldCheck    },
  livre:               { label: 'Livré — en attente confirmation',  color: 'bg-purple-100 text-purple-800',icon: Truck          },
  confirme:            { label: 'Réception confirmée',             color: 'bg-green-100 text-green-800',  icon: CheckCircle    },
  retrait_demande:     { label: 'Retrait en cours',                color: 'bg-orange-100 text-orange-800',icon: Wallet         },
  complete:            { label: 'Terminé',                         color: 'bg-green-200 text-green-900',  icon: CheckCircle    },
  litige:              { label: 'Litige ouvert',                   color: 'bg-red-100 text-red-800',      icon: AlertTriangle  },
  rembourse:           { label: 'Remboursé',                       color: 'bg-gray-100 text-gray-700',    icon: XCircle        },
  // COD
  cod_en_attente:      { label: '💵 En attente de livraison',      color: 'bg-orange-100 text-orange-800',icon: Truck          },
  cod_livre:           { label: '✅ Livré — cash collecté',         color: 'bg-green-100 text-green-800',  icon: CheckCircle    },
  cod_annule:          { label: 'Annulé',                          color: 'bg-gray-100 text-gray-700',    icon: XCircle        },
};

const COMMISSION_RATE = 0.10;

const StatusBadge = ({ statut }) => {
  const cfg = STATUS_CONFIG[statut] || { label: statut, color: 'bg-gray-100 text-gray-700', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
};

const Countdown = ({ targetDate, label }) => {
  const calc = () => {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}min`;
  };
  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 30_000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!remaining) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>{label} <strong>{remaining}</strong></span>
    </div>
  );
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatAmount = (n) => (n ?? 0).toLocaleString('fr-FR');

const TransactionsPage = () => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(
    searchParams.get('tab') === 'ventes' ? 'ventes' : 'achats'
  );
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'ventes' || t === 'achats') setTab(t);
  }, [searchParams]);
  const [loading, setLoading] = useState(true);

  const [confirmDialog, setConfirmDialog]     = useState(null);
  const [litigeDialog, setLitigeDialog]       = useState(null);
  const [livraisonDialog, setLivraisonDialog] = useState(null);
  const [litigeNote, setLitigeNote]           = useState('');
  const [actionLoading, setActionLoading]     = useState(false);
  const [downloadingId, setDownloadingId]     = useState(null);

  // Utiliser user.id (primitif stable) plutôt que l'objet user entier
  // pour éviter les re-fetch à chaque refresh de token
  const userId = user?.id;

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try { await supabase.rpc('auto_confirm_transactions'); } catch (_) {}

    const field = tab === 'achats' ? 'acheteur_id' : 'vendeur_id';
    const { data, error } = await supabase
      .from('transactions_escrow')
      .select(`
        id, statut, montant, created_at, delivery_choice,
        date_livraison_declaree, date_confirmation,
        paiement_valide_at, auto_confirm_at,
        withdrawal_available_at, withdrawal_requested_at,
        annonce:annonce_id(id, title, images, is_digital, digital_delivery_type),
        acheteur:acheteur_id(full_name),
        vendeur:vendeur_id(full_name)
      `)
      .eq(field, userId)
      .order('created_at', { ascending: false });

    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setTransactions(data || []);
    setLoading(false);
  }, [userId, tab, toast]);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    fetchTransactions();
  }, [user, fetchTransactions, openAuthModal, navigate]);

  const handleDownloadDigital = async (tx) => {
    setDownloadingId(tx.id);
    try {
      const { data, error } = await supabase.functions.invoke('get-digital-download-url', {
        body: { transaction_id: tx.id },
      });
      if (error || !data?.url) throw new Error(data?.error || error?.message || 'Lien indisponible');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({ title: 'Téléchargement impossible', description: err.message, variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const doConfirmReception = async (tx) => {
    setActionLoading(true);
    const { error } = await supabase.rpc('buyer_confirm_receipt', { p_transaction_id: tx.id });
    setActionLoading(false);
    setConfirmDialog(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Réception confirmée !', description: 'Le vendeur pourra retirer ses fonds dans 48h.' });
    fetchTransactions();
  };

  const doOuvrirLitige = async (tx) => {
    if (!litigeNote.trim()) { toast({ title: 'Décrivez le problème', variant: 'destructive' }); return; }
    setActionLoading(true);
    const { error } = await supabase.rpc('buyer_open_dispute', {
      p_transaction_id: tx.id,
      p_notes: litigeNote.trim(),
    });
    setActionLoading(false);
    setLitigeDialog(null);
    setLitigeNote('');
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Litige ouvert', description: 'Notre équipe va examiner votre demande.' });
    fetchTransactions();
  };

  const doDeclarelivraison = async (tx) => {
    setActionLoading(true);
    const { error } = await supabase.rpc('vendor_declare_delivery', { p_transaction_id: tx.id });
    setActionLoading(false);
    setLivraisonDialog(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Livraison déclarée !', description: "L'acheteur a 24h pour confirmer la réception, sinon confirmation automatique." });
    fetchTransactions();
  };

  const canLitige = (tx) => {
    if (tx.statut !== 'confirme') return false;
    const confirmed = tx.date_confirmation ? new Date(tx.date_confirmation) : null;
    if (!confirmed) return false;
    return (Date.now() - confirmed.getTime()) / 3_600_000 <= 24;
  };

  return (
    <>
      <Helmet><title>Mes Commandes — Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
              <p className="text-sm text-gray-500">Achats &amp; ventes sécurisés Zando+</p>
            </div>
          </div>

          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border w-fit">
            {[{ id: 'achats', label: 'Mes achats' }, { id: 'ventes', label: 'Mes ventes' }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === t.id ? 'bg-custom-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-custom-green-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShieldCheck className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune transaction pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(tx => {
                const commission = Math.round(tx.montant * COMMISSION_RATE);
                const netVendeur = tx.montant - commission;
                const isAchats = tab === 'achats';
                const otherParty = isAchats ? tx.vendeur?.full_name : tx.acheteur?.full_name;

                return (
                  <Card key={tx.id} className="shadow-md border-0">
                    <CardContent className="p-4 space-y-4">

                      {/* En-tête */}
                      <div className="flex gap-4 items-start">
                        <img
                          src={tx.annonce?.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={tx.annonce?.title}
                          className="w-16 h-16 object-cover rounded-xl border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{tx.annonce?.title || 'Annonce supprimée'}</p>
                          <p className="text-sm text-gray-500">{isAchats ? 'Vendeur' : 'Acheteur'} : {otherParty || '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Le {formatDate(tx.created_at)}</p>
                        </div>
                        <StatusBadge statut={tx.statut} />
                      </div>

                      {/* Montants */}
                      <div className="bg-gray-50 rounded-xl divide-y text-sm">
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-600">Montant payé</span>
                          <span className="font-semibold">{formatAmount(tx.montant)} FCFA</span>
                        </div>
                        {!isAchats && (
                          <>
                            <div className="flex justify-between px-4 py-2.5 text-gray-500">
                              <span>Commission Zando (7%)</span>
                              <span>— {formatAmount(commission)} FCFA</span>
                            </div>
                            <div className="flex justify-between px-4 py-2.5 bg-green-50 rounded-b-xl">
                              <span className="font-bold text-gray-800">Vous recevrez</span>
                              <span className="font-bold text-green-700">{formatAmount(netVendeur)} FCFA</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* ── Actions ACHETEUR ── */}
                      {isAchats && tx.statut === 'fonds_bloques' && (
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                          Votre paiement est sécurisé chez Zando+. En attente de validation.
                        </div>
                      )}
                      {isAchats && tx.statut === 'paiement_valide' && (
                        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg px-4 py-3">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                          Paiement validé par Zando+ — votre commande est en préparation.
                        </div>
                      )}
                      {isAchats && tx.statut === 'livre' && (
                        <div className="space-y-3">
                          {tx.annonce?.is_digital && (
                            <Button
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => handleDownloadDigital(tx)}
                              disabled={downloadingId === tx.id}
                            >
                              {downloadingId === tx.id
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : tx.annonce.digital_delivery_type === 'link'
                                  ? <Link2 className="w-4 h-4 mr-2" />
                                  : <Download className="w-4 h-4 mr-2" />}
                              {tx.annonce.digital_delivery_type === 'link' ? 'Ouvrir le lien' : 'Télécharger le fichier'}
                            </Button>
                          )}
                          {tx.auto_confirm_at && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 space-y-1">
                              <Countdown targetDate={tx.auto_confirm_at} label="Confirmation automatique dans" />
                              <p className="text-xs text-orange-600 mt-1">Si vous ne confirmez pas, la commande sera confirmée automatiquement.</p>
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setConfirmDialog(tx)}
                            >
                              <PackageCheck className="w-4 h-4 mr-2" />
                              {tx.annonce?.is_digital ? "J'ai bien reçu mon fichier" : 'Confirmer la réception'}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => { setLitigeDialog(tx); setLitigeNote(''); }}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" /> Litige
                            </Button>
                          </div>
                        </div>
                      )}
                      {isAchats && tx.annonce?.is_digital && ['confirme', 'retrait_demande', 'complete'].includes(tx.statut) && (
                        <Button
                          variant="outline"
                          className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => handleDownloadDigital(tx)}
                          disabled={downloadingId === tx.id}
                        >
                          {downloadingId === tx.id
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : tx.annonce?.digital_delivery_type === 'link'
                              ? <Link2 className="w-4 h-4 mr-2" />
                              : <Download className="w-4 h-4 mr-2" />}
                          {tx.annonce?.digital_delivery_type === 'link' ? 'Rouvrir le lien' : 'Retélécharger le fichier'}
                        </Button>
                      )}
                      {isAchats && canLitige(tx) && (
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => { setLitigeDialog(tx); setLitigeNote(''); }}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" /> Ouvrir un litige
                        </Button>
                      )}

                      {/* ── Actions VENDEUR ── */}
                      {!isAchats && tx.statut === 'fonds_bloques' && (
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                          Paiement reçu — en attente de validation par Zando+.
                        </div>
                      )}
                      {!isAchats && tx.statut === 'paiement_valide' && tx.delivery_choice === 'zando' && (
                        <div className="flex items-center gap-2 text-sm text-custom-green-700 bg-custom-green-50 rounded-lg px-4 py-3">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          Zando+ assure la livraison — préparez l'article, un livreur viendra le collecter.
                        </div>
                      )}
                      {!isAchats && tx.statut === 'paiement_valide' && tx.delivery_choice === 'seller' && (
                        <Button className="w-full gradient-bg" onClick={() => setLivraisonDialog(tx)}>
                          <Truck className="w-4 h-4 mr-2" /> Déclarer la livraison
                        </Button>
                      )}
                      {!isAchats && tx.statut === 'paiement_valide' && tx.delivery_choice === 'pickup' && (
                        <Button className="w-full gradient-bg" onClick={() => setLivraisonDialog(tx)}>
                          <Truck className="w-4 h-4 mr-2" /> Confirmer que l'acheteur a récupéré l'article
                        </Button>
                      )}
                      {!isAchats && tx.statut === 'paiement_valide' && !tx.delivery_choice && (
                        <Button className="w-full gradient-bg" onClick={() => setLivraisonDialog(tx)}>
                          <Truck className="w-4 h-4 mr-2" /> Déclarer la livraison
                        </Button>
                      )}
                      {!isAchats && tx.statut === 'livre' && (
                        <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-4 py-3">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          {tx.annonce?.is_digital
                            ? "Fichier disponible pour l'acheteur — en attente de sa confirmation (ou automatique)."
                            : "Livraison déclarée — en attente de confirmation de l'acheteur (24h max)."}
                        </div>
                      )}
                      {!isAchats && tx.statut === 'confirme' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            Réception confirmée — vos fonds sont disponibles dans votre portefeuille.
                          </div>
                          <Button
                            className="w-full gradient-bg"
                            onClick={() => navigate('/wallet')}
                          >
                            <Wallet className="w-4 h-4 mr-2" /> Accéder à mon portefeuille
                          </Button>
                        </div>
                      )}
                      {!isAchats && tx.statut === 'retrait_demande' && (
                        <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 rounded-lg px-4 py-3">
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                          Retrait en cours — Zando+ prépare l'envoi sur votre MoMo.
                        </div>
                      )}
                      {!isAchats && tx.statut === 'complete' && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          Fonds envoyés sur votre MoMo. Transaction terminée ✓
                        </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog : Confirmer réception */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          {(() => {
            const isDigitalConfirm = !!confirmDialog?.annonce?.is_digital;
            const isLinkConfirm = confirmDialog?.annonce?.digital_delivery_type === 'link';
            const Icon = isLinkConfirm ? Link2 : isDigitalConfirm ? Download : PackageCheck;
            return (
              <>
                <DialogHeader>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${isDigitalConfirm ? 'bg-indigo-100' : 'bg-green-100'}`}>
                    <Icon className={`w-6 h-6 ${isDigitalConfirm ? 'text-indigo-600' : 'text-green-600'}`} />
                  </div>
                  <DialogTitle>{isLinkConfirm ? 'Confirmer la réception du lien' : isDigitalConfirm ? 'Confirmer la réception du fichier' : 'Confirmer la réception'}</DialogTitle>
                  <DialogDescription>
                    {isLinkConfirm
                      ? "En confirmant, vous indiquez avoir bien ouvert et vérifié le lien reçu."
                      : isDigitalConfirm
                        ? "En confirmant, vous indiquez avoir bien téléchargé et vérifié votre fichier."
                        : "En confirmant, vous indiquez avoir bien reçu l'article."}
                    {' '}Le vendeur pourra retirer ses fonds 24h après votre confirmation.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {isLinkConfirm
                      ? "Vérifiez que le lien fonctionne et donne bien accès au contenu avant de confirmer."
                      : isDigitalConfirm
                        ? "Vérifiez que le fichier s'ouvre correctement avant de confirmer."
                        : "Vérifiez l'article avant de confirmer."}
                    {' '}Cette action est <strong>irréversible</strong> — en cas de problème, ouvrez un litige plutôt que de confirmer.
                  </span>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
                  <Button
                    className={isDigitalConfirm ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                    onClick={() => doConfirmReception(confirmDialog)}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirmer
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog : Litige */}
      <Dialog open={!!litigeDialog} onOpenChange={() => setLitigeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Ouvrir un litige</DialogTitle>
            <DialogDescription>Décrivez le problème. Notre équipe examinera votre demande et vous contactera.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={litigeDialog?.annonce?.is_digital
              ? "Ex: le fichier reçu est corrompu, incomplet, ou ne correspond pas à la description..."
              : "Ex: l'article reçu ne correspond pas à la description..."}
            value={litigeNote}
            onChange={e => setLitigeNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLitigeDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => doOuvrirLitige(litigeDialog)} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Soumettre le litige
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Déclarer livraison */}
      <Dialog open={!!livraisonDialog} onOpenChange={() => setLivraisonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-custom-green-50 flex items-center justify-center mb-2">
              <Truck className="w-6 h-6 text-custom-green-600" />
            </div>
            <DialogTitle>Déclarer la livraison</DialogTitle>
            <DialogDescription>
              Confirmez que l'article a été remis à l'acheteur. L'acheteur aura <strong>24h</strong> pour confirmer la réception. Passé ce délai, la commande est confirmée automatiquement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLivraisonDialog(null)}>Annuler</Button>
            <Button className="gradient-bg" onClick={() => doDeclarelivraison(livraisonDialog)} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirmer la livraison
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default TransactionsPage;
