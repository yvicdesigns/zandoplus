import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import {
  Wallet, ArrowLeft, Loader2, Clock, CheckCircle,
  AlertTriangle, Smartphone, TrendingUp, Lock, ArrowDownCircle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const formatAmount = (n) => (n ?? 0).toLocaleString('fr-FR');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUT_WITHDRAWAL = {
  pending:    { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  paid:       { label: 'Payé ✅', color: 'bg-green-100 text-green-800' },
  rejected:   { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

const WalletPage = () => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, profileRes, withdrawalsRes] = await Promise.all([
      supabase.rpc('get_vendor_wallet', { p_vendor_id: user.id }),
      supabase.from('profiles').select('momo_number').eq('id', user.id).single(),
      supabase.from('wallet_withdrawals')
        .select('id, montant, momo_number, statut, created_at, paid_at, admin_notes')
        .eq('vendeur_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (walletRes.data?.[0]) setWallet(walletRes.data[0]);
    if (profileRes.data?.momo_number) setMomoNumber(profileRes.data.momo_number);
    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    fetchData();
  }, [user, fetchData, openAuthModal, navigate]);

  const handleRequestWithdrawal = async () => {
    if (!momoNumber) {
      toast({ title: 'Numéro MoMo requis', description: 'Ajoutez votre numéro MoMo dans Paramètres.', variant: 'destructive' });
      navigate('/settings');
      return;
    }
    if (!wallet?.solde_disponible || wallet.solde_disponible <= 0) return;

    setSubmitting(true);
    const { error } = await supabase.from('wallet_withdrawals').insert({
      vendeur_id: user.id,
      montant: wallet.solde_disponible,
      momo_number: momoNumber,
      statut: 'pending',
    });
    setSubmitting(false);
    setWithdrawDialog(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }

    // Notify admin by email
    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('site_settings').select('notification_email').eq('id', 1).single(),
    ]);
    // solde_disponible is already net (commission already deducted by get_vendor_wallet)
    supabase.functions.invoke('notify-withdrawal-request', {
      body: {
        vendeur_name: profile?.full_name || 'Vendeur',
        vendeur_momo: momoNumber,
        montant: wallet.solde_disponible,
        commission: 0,
        net: wallet.solde_disponible,
        transaction_id: 'portefeuille-global',
        admin_email: settings?.notification_email || 'zandopluscg@gmail.com',
      },
    }).catch(console.error);

    toast({ title: 'Demande envoyée !', description: 'Zando+ va traiter votre retrait sous 24h.', className: 'bg-green-100 text-green-800' });
    fetchData();
  };

  const canWithdraw = wallet?.solde_disponible > 0 && momoNumber;
  const hasPendingWithdrawal = withdrawals.some(w => w.statut === 'pending' || w.statut === 'processing');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <>
      <Helmet><title>Mon Portefeuille — Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Portefeuille</h1>
              <p className="text-sm text-gray-500">Gérez vos revenus de ventes</p>
            </div>
          </div>

          {/* Solde cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1 opacity-80 text-sm">
                  <TrendingUp className="w-4 h-4" /> Total gagné
                </div>
                <p className="text-2xl font-bold">{formatAmount(wallet?.solde_total)} <span className="text-sm font-normal">FCFA</span></p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4 text-amber-500" /> En attente (24h)
                </div>
                <p className="text-2xl font-bold text-amber-600">{formatAmount(wallet?.solde_en_attente)} <span className="text-sm font-normal text-gray-500">FCFA</span></p>
                <p className="text-xs text-gray-400 mt-1">Disponible après 24h</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Disponible
                </div>
                <p className="text-2xl font-bold text-green-600">{formatAmount(wallet?.solde_disponible)} <span className="text-sm font-normal text-gray-500">FCFA</span></p>
                <p className="text-xs text-gray-400 mt-1">Retrait possible</p>
              </CardContent>
            </Card>
          </div>

          {/* Bouton retrait */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">Retirer mes gains</h3>
                  {momoNumber ? (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" /> MoMo : <span className="font-mono">{momoNumber}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Ajoutez votre numéro MoMo dans les paramètres
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setWithdrawDialog(true)}
                  disabled={!canWithdraw || hasPendingWithdrawal}
                  className="gradient-bg disabled:opacity-50"
                >
                  {!momoNumber ? (
                    <><Smartphone className="w-4 h-4 mr-2" /> Configurer MoMo</>
                  ) : !canWithdraw || hasPendingWithdrawal ? (
                    <><Lock className="w-4 h-4 mr-2" /> Retrait indisponible</>
                  ) : (
                    <><ArrowDownCircle className="w-4 h-4 mr-2" /> Retirer {formatAmount(wallet?.solde_disponible)} FCFA</>
                  )}
                </Button>
              </div>
              {hasPendingWithdrawal && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4" />
                  Une demande de retrait est en cours de traitement.
                </div>
              )}
              {!momoNumber && (
                <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                  Aller dans Paramètres
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Historique retraits */}
          {withdrawals.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Historique des retraits</h2>
              <div className="space-y-3">
                {withdrawals.map(w => {
                  const cfg = STATUT_WITHDRAWAL[w.statut] || { label: w.statut, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <Card key={w.id} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-800">{formatAmount(w.montant)} FCFA</p>
                          <p className="text-xs text-gray-400">MoMo : {w.momo_number}</p>
                          <p className="text-xs text-gray-400">Demandé le {formatDate(w.created_at)}</p>
                          {w.paid_at && <p className="text-xs text-green-600">Payé le {formatDate(w.paid_at)}</p>}
                          {w.admin_notes && <p className="text-xs text-gray-500 mt-1 italic">{w.admin_notes}</p>}
                        </div>
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {withdrawals.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun retrait effectué pour l'instant</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le retrait</DialogTitle>
            <DialogDescription>
              Vous allez demander le retrait de <strong>{formatAmount(wallet?.solde_disponible)} FCFA</strong> vers le numéro MoMo <strong>{momoNumber}</strong>.<br /><br />
              Zando+ traitera votre demande sous 24h.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(false)}>Annuler</Button>
            <Button onClick={handleRequestWithdrawal} disabled={submitting} className="gradient-bg">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer le retrait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletPage;
