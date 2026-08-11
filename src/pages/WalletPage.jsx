import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import {
  Wallet, ArrowLeft, Loader2, Clock, CheckCircle,
  AlertTriangle, Smartphone, TrendingUp, Lock,
  ArrowDownCircle, Pencil, Check, X, ShoppingBag,
  BarChart2, CircleDollarSign, BadgePercent, History,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const COMMISSION_RATE = 0.07;
const MIN_WITHDRAW = 1000;

const fmt = (n) => (n ?? 0).toLocaleString('fr-FR');
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const STATUT_WITHDRAWAL = {
  pending:    { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'En cours',   color: 'bg-blue-100 text-blue-700' },
  paid:       { label: 'Payé ✅',    color: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejeté',     color: 'bg-red-100 text-red-700' },
};

/* ── Carte solde ── */
const BalanceCard = ({ icon: Icon, label, amount, sub, accent }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-1 ${accent || 'bg-white border border-gray-100 shadow-sm'}`}>
    <div className="flex items-center gap-1.5 text-[12px] font-medium opacity-75 mb-0.5">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <p className="text-[22px] font-black leading-none">
      {fmt(amount)} <span className="text-[12px] font-normal opacity-60">FCFA</span>
    </p>
    {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
  </div>
);

/* ── Stat mensuelle ── */
const MonthStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-[14px] font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════ */
const WalletPage = () => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [wallet, setWallet]           = useState(null);
  const [momoNumber, setMomoNumber]   = useState('');
  const [editingMomo, setEditingMomo] = useState(false);
  const [momoEdit, setMomoEdit]       = useState('');
  const [savingMomo, setSavingMomo]   = useState(false);
  const [sales, setSales]             = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [tab, setTab]                 = useState('ventes');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, profileRes, salesRes, withdrawalsRes] = await Promise.all([
      supabase.rpc('get_vendor_wallet', { p_vendor_id: user.id }),
      supabase.from('profiles').select('momo_number').eq('id', user.id).single(),
      supabase
        .from('transactions_escrow')
        .select('id, montant, commission_amount, created_at, annonce:annonce_id(title, images), acheteur:acheteur_id(full_name, avatar_url)')
        .eq('vendeur_id', user.id)
        .in('statut', ['confirme', 'complete'])
        .order('created_at', { ascending: false }),
      supabase
        .from('wallet_withdrawals')
        .select('id, montant, momo_number, statut, created_at, paid_at, admin_notes')
        .eq('vendeur_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (walletRes.data?.[0]) setWallet(walletRes.data[0]);
    if (profileRes.data?.momo_number) setMomoNumber(profileRes.data.momo_number);
    setSales(salesRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    fetchData();
  }, [user, fetchData, openAuthModal, navigate]);

  /* ── Stats mensuelles ── */
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySales = sales.filter(s => new Date(s.created_at) >= startOfMonth);
  const monthlyRevenu = monthlySales.reduce((s, t) => s + (t.montant || 0), 0);
  const monthlyCommission = monthlySales.reduce((s, t) => s + (t.commission_amount ?? Math.round((t.montant || 0) * COMMISSION_RATE)), 0);
  const totalRetire = withdrawals.filter(w => w.statut === 'paid').reduce((s, w) => s + (w.montant || 0), 0);

  const hasPendingWithdrawal = withdrawals.some(w => w.statut === 'pending' || w.statut === 'processing');

  /* ── Sauvegarder MoMo ── */
  const saveMomo = async () => {
    if (!momoEdit.trim()) return;
    setSavingMomo(true);
    const { error } = await supabase.from('profiles').update({ momo_number: momoEdit.trim() }).eq('id', user.id);
    setSavingMomo(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setMomoNumber(momoEdit.trim());
    setEditingMomo(false);
    toast({ title: 'Numéro MoMo mis à jour', className: 'bg-custom-green-500 text-white' });
  };

  /* ── Ouvrir dialog retrait ── */
  const openWithdraw = () => {
    setWithdrawAmount(String(wallet?.solde_disponible || ''));
    setWithdrawDialog(true);
  };

  /* ── Soumettre retrait ── */
  const handleRequestWithdrawal = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount < MIN_WITHDRAW) {
      toast({ title: `Montant minimum : ${fmt(MIN_WITHDRAW)} FCFA`, variant: 'destructive' });
      return;
    }
    if (amount > (wallet?.solde_disponible || 0)) {
      toast({ title: 'Montant supérieur au solde disponible', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('wallet_withdrawals').insert({
      vendeur_id: user.id,
      montant: amount,
      momo_number: momoNumber,
      statut: 'pending',
    });
    setSubmitting(false);
    setWithdrawDialog(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }

    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('site_settings').select('notification_email').eq('id', 1).single(),
    ]);
    supabase.functions.invoke('notify-withdrawal-request', {
      body: {
        vendeur_name: profile?.full_name || 'Vendeur',
        vendeur_momo: momoNumber,
        montant: amount,
        commission: 0,
        net: amount,
        transaction_id: 'portefeuille-global',
        admin_email: settings?.notification_email || 'zandopluscg@gmail.com',
      },
    }).catch(console.error);

    toast({ title: 'Demande envoyée !', description: 'Zando+ va traiter votre retrait sous 24h.', className: 'bg-green-100 text-green-800' });
    setTab('retraits');
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  const canWithdraw = (wallet?.solde_disponible || 0) >= MIN_WITHDRAW && momoNumber && !hasPendingWithdrawal;

  return (
    <>
      <Helmet><title>Mon Portefeuille — Zando+</title></Helmet>
      <div className="min-h-screen bg-gray-50 pb-24">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[17px] font-black text-gray-900">Mon Portefeuille</h1>
            <p className="text-[11px] text-gray-400">Revenus & retraits</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

          {/* ── 4 cartes solde ── */}
          <div className="grid grid-cols-2 gap-3">
            <BalanceCard
              icon={TrendingUp}
              label="Total gagné"
              amount={wallet?.solde_total}
              sub="Depuis le début"
              accent="bg-gradient-to-br from-custom-green-500 to-emerald-700 text-white shadow-md"
            />
            <BalanceCard
              icon={CircleDollarSign}
              label="Total retiré"
              amount={totalRetire}
              sub="Retraits payés"
              accent="bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md"
            />
            <BalanceCard
              icon={Clock}
              label="En attente"
              amount={wallet?.solde_en_attente}
              sub="Disponible après 48h"
            />
            <BalanceCard
              icon={CheckCircle}
              label="Disponible"
              amount={wallet?.solde_disponible}
              sub="Retrait possible"
            />
          </div>

          {/* ── Stats du mois ── */}
          <div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ce mois-ci</p>
            <div className="grid grid-cols-3 gap-2">
              <MonthStat icon={ShoppingBag}   label="Ventes"      value={monthlySales.length}              color="bg-purple-50 text-purple-600" />
              <MonthStat icon={BarChart2}      label="Revenu brut" value={`${fmt(monthlyRevenu)} F`}        color="bg-green-50 text-green-600" />
              <MonthStat icon={BadgePercent}   label="Commission"  value={`− ${fmt(monthlyCommission)} F`}  color="bg-orange-50 text-orange-500" />
            </div>
          </div>

          {/* ── Numéro MoMo ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Numéro MoMo</p>
            {editingMomo ? (
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={momoEdit}
                  onChange={e => setMomoEdit(e.target.value)}
                  placeholder="06 XXX XX XX"
                  autoFocus
                  className="flex-1 h-10 border border-gray-200 rounded-xl px-3 text-base focus:outline-none focus:border-custom-green-500"
                />
                <button onClick={saveMomo} disabled={savingMomo}
                  className="w-10 h-10 bg-custom-green-500 text-white rounded-xl flex items-center justify-center hover:bg-custom-green-600 transition-colors disabled:opacity-50">
                  {savingMomo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingMomo(false)}
                  className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-yellow-600" />
                  </div>
                  {momoNumber
                    ? <span className="text-[15px] font-bold text-gray-800 font-mono">{momoNumber}</span>
                    : <span className="text-[13px] text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Aucun numéro configuré</span>
                  }
                </div>
                <button
                  onClick={() => { setMomoEdit(momoNumber); setEditingMomo(true); }}
                  className="flex items-center gap-1.5 text-[12px] text-custom-green-600 hover:text-custom-green-700 transition-colors font-semibold"
                >
                  <Pencil className="w-3.5 h-3.5" /> {momoNumber ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            )}
          </div>

          {/* ── Bouton retrait ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {hasPendingWithdrawal && (
              <div className="flex items-center gap-2 text-[12px] text-blue-700 bg-blue-50 rounded-xl px-3 py-2.5">
                <Clock className="w-4 h-4 shrink-0" /> Une demande de retrait est déjà en cours de traitement.
              </div>
            )}
            {!momoNumber && (
              <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Ajoutez votre numéro MoMo ci-dessus pour retirer vos gains.
              </div>
            )}
            <button
              onClick={openWithdraw}
              disabled={!canWithdraw}
              className="w-full h-12 bg-gradient-to-r from-custom-green-500 to-emerald-600 text-white text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!momoNumber
                ? <><Smartphone className="w-4 h-4" /> Configurer votre numéro MoMo</>
                : hasPendingWithdrawal
                  ? <><Lock className="w-4 h-4" /> Retrait en cours de traitement</>
                  : (wallet?.solde_disponible || 0) < MIN_WITHDRAW
                    ? <><Lock className="w-4 h-4" /> Solde insuffisant (min {fmt(MIN_WITHDRAW)} FCFA)</>
                    : <><ArrowDownCircle className="w-4 h-4" /> Retirer mes gains ({fmt(wallet?.solde_disponible)} FCFA dispo)</>
              }
            </button>
          </div>

          {/* ── Historique tabs ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab nav */}
            <div className="flex border-b border-gray-100">
              {[
                { id: 'ventes',   label: `Ventes (${sales.length})`,      icon: ShoppingBag },
                { id: 'retraits', label: `Retraits (${withdrawals.length})`, icon: History },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-bold border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-custom-green-500 text-custom-green-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            {/* Ventes */}
            {tab === 'ventes' && (
              <div className="divide-y divide-gray-50">
                {sales.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-gray-300">
                    <ShoppingBag className="w-12 h-12 mb-3" />
                    <p className="text-[13px]">Aucune vente encaissée pour l'instant</p>
                  </div>
                ) : sales.map(sale => {
                  const commission = sale.commission_amount ?? Math.round((sale.montant || 0) * COMMISSION_RATE);
                  const net = (sale.montant || 0) - commission;
                  const img = sale.annonce?.images?.[0];
                  return (
                    <div key={sale.id} className="flex items-center gap-3 px-4 py-3.5">
                      {img
                        ? <img src={img} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100" />
                        : <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-300" /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{sale.annonce?.title || 'Article vendu'}</p>
                        <p className="text-[11px] text-gray-400">{sale.acheteur?.full_name || 'Acheteur'} · {fmtDate(sale.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-black text-custom-green-600">+{fmt(net)} F</p>
                        <p className="text-[10px] text-gray-400">brut {fmt(sale.montant)} − comm. {fmt(commission)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Retraits */}
            {tab === 'retraits' && (
              <div className="divide-y divide-gray-50">
                {withdrawals.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-gray-300">
                    <Wallet className="w-12 h-12 mb-3" />
                    <p className="text-[13px]">Aucun retrait effectué</p>
                  </div>
                ) : withdrawals.map(w => {
                  const cfg = STATUT_WITHDRAWAL[w.statut] || { label: w.statut, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={w.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 shrink-0 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800">Retrait MoMo</p>
                        <p className="text-[11px] text-gray-400">{w.momo_number} · {fmtDate(w.created_at)}</p>
                        {w.paid_at && <p className="text-[10px] text-custom-green-600">Payé le {fmtDate(w.paid_at)}</p>}
                        {w.admin_notes && <p className="text-[10px] text-gray-400 italic mt-0.5">{w.admin_notes}</p>}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-[14px] font-black text-gray-800">{fmt(w.montant)} F</p>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Dialog retrait partiel ── */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Retirer mes gains</DialogTitle>
            <DialogDescription>
              Solde disponible : <strong>{fmt(wallet?.solde_disponible)} FCFA</strong><br />
              MoMo : <strong className="font-mono">{momoNumber}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-[13px] font-semibold text-gray-700 block">Montant à retirer (FCFA)</label>
            <div className="relative">
              <input
                type="number"
                min={MIN_WITHDRAW}
                max={wallet?.solde_disponible || 0}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-[16px] font-bold focus:outline-none focus:border-custom-green-500 pr-20"
                placeholder={fmt(MIN_WITHDRAW)}
              />
              <button
                onClick={() => setWithdrawAmount(String(wallet?.solde_disponible || ''))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-custom-green-600 hover:text-custom-green-700"
              >
                MAX
              </button>
            </div>
            <p className="text-[11px] text-gray-400">Minimum : {fmt(MIN_WITHDRAW)} FCFA · Zando+ traite votre demande sous 24h.</p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setWithdrawDialog(false)} className="flex-1">Annuler</Button>
            <Button
              onClick={handleRequestWithdrawal}
              disabled={submitting}
              className="flex-1 gradient-bg"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletPage;
