import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, PackageCheck, AlertTriangle, Loader2,
  Clock, CheckCircle, XCircle, Truck, ArrowLeft
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const STATUS_CONFIG = {
  en_attente_paiement: { label: 'En attente de paiement', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  fonds_bloques:       { label: 'Fonds bloqués', color: 'bg-blue-100 text-blue-800', icon: ShieldCheck },
  livre:               { label: 'Livré — en attente confirmation', color: 'bg-purple-100 text-purple-800', icon: Truck },
  confirme:            { label: 'Réception confirmée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  complete:            { label: 'Terminé', color: 'bg-green-200 text-green-900', icon: CheckCircle },
  litige:              { label: 'Litige ouvert', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  rembourse:           { label: 'Remboursé', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const COMMISSION_RATE = 0.03;

const StatusBadge = ({ statut }) => {
  const cfg = STATUS_CONFIG[statut] || { label: statut, color: 'bg-gray-100 text-gray-700', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatAmount = (n) => n?.toLocaleString?.() ?? '0';

const TransactionsPage = () => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('achats');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [litigeDialog, setLitigeDialog] = useState(null);
  const [livraisonDialog, setLivraisonDialog] = useState(null);
  const [litigeNote, setLitigeNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const isAchats = tab === 'achats';
    const field = isAchats ? 'acheteur_id' : 'vendeur_id';
    const { data, error } = await supabase
      .from('transactions_escrow')
      .select(`
        id, statut, montant, created_at, date_limite_confirmation,
        date_livraison_declaree, date_confirmation,
        annonce:annonce_id(id, title, images),
        acheteur:acheteur_id(full_name),
        vendeur:vendeur_id(full_name)
      `)
      .eq(field, user.id)
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setTransactions(data || []);
    setLoading(false);
  }, [user, tab, toast]);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    fetch();
  }, [user, fetch, openAuthModal, navigate]);

  const doConfirmReception = async (tx) => {
    setActionLoading(true);
    const { error } = await supabase.from('transactions_escrow')
      .update({ statut: 'confirme', date_confirmation: new Date().toISOString() })
      .eq('id', tx.id);
    setActionLoading(false);
    setConfirmDialog(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Réception confirmée !', description: 'Les fonds seront libérés au vendeur.' });
    fetch();
  };

  const doOuvrirLitige = async (tx) => {
    if (!litigeNote.trim()) {
      toast({ title: 'Décrivez le problème', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    const { error } = await supabase.from('transactions_escrow')
      .update({ statut: 'litige', notes_litige: litigeNote.trim() })
      .eq('id', tx.id);
    setActionLoading(false);
    setLitigeDialog(null);
    setLitigeNote('');
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Litige ouvert', description: 'Notre équipe va examiner votre demande.' });
    fetch();
  };

  const doDeclarelivraison = async (tx) => {
    setActionLoading(true);
    const { error } = await supabase.from('transactions_escrow')
      .update({ statut: 'livre', date_livraison_declaree: new Date().toISOString() })
      .eq('id', tx.id);
    setActionLoading(false);
    setLivraisonDialog(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Livraison déclarée !', description: "L'acheteur doit maintenant confirmer la réception." });
    fetch();
  };

  const canLitige = (tx) => {
    if (tx.statut !== 'confirme') return false;
    const confirmed = tx.date_confirmation ? new Date(tx.date_confirmation) : null;
    if (!confirmed) return false;
    const hoursSince = (Date.now() - confirmed.getTime()) / 3_600_000;
    return hoursSince <= 48;
  };

  return (
    <>
      <Helmet><title>Mes Transactions — Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Transactions</h1>
              <p className="text-sm text-gray-500">Achat sécurisé Zando+</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border w-fit">
            {[{ id: 'achats', label: 'Mes achats' }, { id: 'ventes', label: 'Mes ventes' }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === t.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
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
                      {/* Header row */}
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

                      {/* Amounts */}
                      <div className="bg-gray-50 rounded-xl divide-y text-sm">
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-600">Montant payé</span>
                          <span className="font-semibold">{formatAmount(tx.montant)} FCFA</span>
                        </div>
                        {!isAchats && (
                          <>
                            <div className="flex justify-between px-4 py-2.5 text-gray-500">
                              <span>Commission Zando (3%)</span>
                              <span>— {formatAmount(commission)} FCFA</span>
                            </div>
                            <div className="flex justify-between px-4 py-2.5 bg-green-50 rounded-b-xl">
                              <span className="font-bold text-gray-800">Vous recevrez</span>
                              <span className="font-bold text-green-700">{formatAmount(netVendeur)} FCFA</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action buttons — Acheteur */}
                      {isAchats && tx.statut === 'livre' && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setConfirmDialog(tx)}
                          >
                            <PackageCheck className="w-4 h-4 mr-2" /> Confirmer la réception
                          </Button>
                        </div>
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

                      {/* Action buttons — Vendeur */}
                      {!isAchats && tx.statut === 'fonds_bloques' && (
                        <Button
                          className="w-full gradient-bg"
                          onClick={() => setLivraisonDialog(tx)}
                        >
                          <Truck className="w-4 h-4 mr-2" /> Déclarer la livraison
                        </Button>
                      )}
                      {!isAchats && tx.statut === 'confirme' && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          Réception confirmée — les fonds seront libérés sous 24h.
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

      {/* Confirm reception dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la réception</DialogTitle>
            <DialogDescription>
              En confirmant, vous indiquez avoir bien reçu l'article. Les fonds seront libérés au vendeur.
              Cette action est <strong>irréversible</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => doConfirmReception(confirmDialog)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Litige dialog */}
      <Dialog open={!!litigeDialog} onOpenChange={() => setLitigeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ouvrir un litige</DialogTitle>
            <DialogDescription>
              Décrivez le problème. Notre équipe examinera votre demande et vous contactera.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: l'article reçu ne correspond pas à la description..."
            value={litigeNote}
            onChange={e => setLitigeNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLitigeDialog(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => doOuvrirLitige(litigeDialog)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Soumettre le litige
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Livraison dialog */}
      <Dialog open={!!livraisonDialog} onOpenChange={() => setLivraisonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclarer la livraison</DialogTitle>
            <DialogDescription>
              En déclarant la livraison, vous confirmez que l'article a été remis à l'acheteur.
              L'acheteur aura 72h pour confirmer la réception.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLivraisonDialog(null)}>Annuler</Button>
            <Button
              className="gradient-bg"
              onClick={() => doDeclarelivraison(livraisonDialog)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer la livraison
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionsPage;
