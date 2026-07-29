import React, { useState, useEffect, useCallback } from 'react';
import AdminStatsGrid from "@/components/admin/AdminStatsGrid";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminListingsTab from "@/components/admin/AdminListingsTab";
import AdminDeliveriesTab from "@/components/admin/AdminDeliveriesTab";
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import AdminBoostsTab from "@/components/admin/AdminBoostsTab";
import AdminEscrowTab from "@/components/admin/AdminEscrowTab";
import AdminAdsTab from "@/components/admin/AdminAdsTab";
import AdminVerificationsTab from "@/components/admin/AdminVerificationsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminHeroTab from "@/components/admin/AdminHeroTab";
import AdminSubscribersTab from "@/components/admin/AdminSubscribersTab";
import AdminBulkMessageTab from "@/components/admin/AdminBulkMessageTab";
import AdminDeletionRequestsTab from '@/components/admin/AdminDeletionRequestsTab';
import AdminChangelogTab from '@/components/admin/AdminChangelogTab';
import AdminQATab from '@/components/admin/AdminQATab';
import AdminAuditLogTab from '@/components/admin/AdminAuditLogTab';
import AdminChangeRequestsTab from '@/components/admin/AdminChangeRequestsTab';
import AdminEmailTestTab from '@/components/admin/AdminEmailTestTab';
import AdminPaymentsTab from '@/components/admin/AdminPaymentsTab';
import AdminCategoriesTab from '@/components/admin/AdminCategoriesTab';
import AdminSiteTab from '@/components/admin/AdminSiteTab';
import AdminBetaTab from '@/components/admin/AdminBetaTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import AdminDeliveryConfigTab from '@/components/admin/AdminDeliveryConfigTab';
import { Helmet } from 'react-helmet-async';
import {
  Users, ShoppingBag, Truck, Flag, Zap, Megaphone, ShieldCheck,
  Settings, Image, Mail, MessageSquare, Trash2, GitBranch, Activity,
  FileText, ClipboardCheck, CreditCard, LayoutGrid, Menu, X,
  ChevronRight, BarChart3, Home, Wallet, AlertTriangle, MapPin,
  TrendingUp, ArrowRight, RefreshCw, Bell, Globe, LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ─── Nav config ────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Gestion',
    items: [
      { id: 'users',          icon: Users,        label: 'Utilisateurs',     badge: 'total_users' },
      { id: 'listings',       icon: ShoppingBag,  label: 'Annonces',         badge: 'total_listings' },
      { id: 'deliveries',     icon: Truck,        label: 'Livraisons' },
      { id: 'delivery-config',icon: MapPin,       label: 'Config Livraison' },
      { id: 'reports',        icon: Flag,         label: 'Signalements',     badge: 'pending_reports', badgeAlert: true },
      { id: 'verifications',  icon: ShieldCheck,  label: 'Vérifications' },
    ],
  },
  {
    label: 'Monétisation',
    items: [
      { id: 'boosts',      icon: Zap,        label: 'Boosts' },
      { id: 'escrow',      icon: ShieldCheck, label: 'Escrow',    badge: 'pending_escrow',       badgeAlert: true },
      { id: 'withdrawals', icon: Wallet,     label: 'Retraits',  badge: 'pending_withdrawals',  badgeAlert: true },
      { id: 'ads',         icon: Megaphone,  label: 'Publicités' },
      { id: 'payments',    icon: CreditCard, label: 'Paiements', adminOnly: true },
    ],
  },
  {
    label: 'Site & Contenu',
    items: [
      { id: 'site',       icon: Globe,       label: 'Gestion du site' },
      { id: 'categories', icon: LayoutGrid,  label: 'Catégories' },
    ],
  },
  {
    label: 'Programme',
    items: [
      { id: 'beta', icon: Users, label: 'Testeurs Beta' },
    ],
  },
  {
    label: 'Système',
    items: [
      { id: 'approvals',  icon: ClipboardCheck, label: 'Approbations', adminOnly: true },
      { id: 'audit',      icon: FileText,        label: 'Audit Logs',   adminOnly: true },
      { id: 'email-test', icon: Mail,            label: 'Test E-mail',  adminOnly: true },
      { id: 'settings',   icon: Settings,        label: 'Paramètres' },
      { id: 'qa',         icon: Activity,        label: 'QA & Tests' },
    ],
  },
];

const TAB_LABELS = {
  overview: 'Vue d\'ensemble', users: 'Utilisateurs', listings: 'Annonces',
  deliveries: 'Livraisons', reports: 'Signalements', verifications: 'Vérifications',
  boosts: 'Boosts', escrow: 'Fonds protégés', withdrawals: 'Retraits',
  beta: 'Testeurs Beta', ads: 'Publicités', payments: 'Paiements',
  site: 'Gestion du site', categories: 'Catégories', approvals: 'Approbations',
  audit: 'Audit Logs', 'email-test': 'Test E-mail', settings: 'Paramètres', qa: 'QA & Tests',
  'delivery-config': 'Config Livraison',
};

const ROLE_CFG = {
  admin:  { label: 'Admin',    cls: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  editor: { label: 'Éditeur',  cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  viewer: { label: 'Lecteur',  cls: 'bg-white/10 text-white/50 border border-white/20' },
};

/* ─── Tab renderer ──────────────────────────────────────────── */
const renderTabContent = (activeTab) => {
  switch (activeTab) {
    case 'users':            return <AdminUsersTab />;
    case 'listings':         return <AdminListingsTab />;
    case 'deliveries':       return <AdminDeliveriesTab />;
    case 'delivery-config':  return <AdminDeliveryConfigTab />;
    case 'reports':          return <AdminReportsTab />;
    case 'verifications':    return <AdminVerificationsTab />;
    case 'boosts':           return <AdminBoostsTab />;
    case 'escrow':           return <AdminEscrowTab />;
    case 'withdrawals':      return <AdminWithdrawalsTab />;
    case 'ads':              return <AdminAdsTab />;
    case 'payments':         return <AdminPaymentsTab />;
    case 'site':             return <AdminSiteTab />;
    case 'categories':       return <AdminCategoriesTab />;
    case 'hero':             return <AdminHeroTab />;
    case 'approvals':        return <AdminChangeRequestsTab />;
    case 'audit':            return <AdminAuditLogTab />;
    case 'email-test':       return <AdminEmailTestTab />;
    case 'settings':         return <AdminSettingsTab />;
    case 'qa':               return <AdminQATab />;
    case 'beta':             return <AdminBetaTab />;
    default:                 return null;
  }
};

/* ─── Overview ──────────────────────────────────────────────── */
const OverviewTab = ({ stats, counts, loading, setActiveTab }) => {
  const alerts = [
    counts.pending_reports    > 0 && { id: 'reports',     label: 'Signalements',         value: counts.pending_reports,    icon: Flag,       cls: 'border-red-200 bg-red-50 text-red-700',         dot: 'bg-red-500' },
    counts.pending_escrow     > 0 && { id: 'escrow',      label: 'Escrow en attente',    value: counts.pending_escrow,     icon: ShieldCheck,cls: 'border-orange-200 bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
    counts.pending_withdrawals> 0 && { id: 'withdrawals', label: 'Retraits portefeuille',value: counts.pending_withdrawals,icon: Wallet,     cls: 'border-violet-200 bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  ].filter(Boolean);

  const QUICK = [
    { id: 'users',       label: 'Utilisateurs', icon: Users,        bg: 'bg-blue-100',   ic: 'text-blue-600'   },
    { id: 'listings',    label: 'Annonces',     icon: ShoppingBag,  bg: 'bg-emerald-100',ic: 'text-emerald-600'},
    { id: 'escrow',      label: 'Escrow',       icon: ShieldCheck,  bg: 'bg-green-100',  ic: 'text-green-600'  },
    { id: 'boosts',      label: 'Boosts',       icon: Zap,          bg: 'bg-amber-100',  ic: 'text-amber-600'  },
    { id: 'deliveries',  label: 'Livraisons',   icon: Truck,        bg: 'bg-orange-100', ic: 'text-orange-600' },
    { id: 'settings',    label: 'Paramètres',   icon: Settings,     bg: 'bg-gray-100',   ic: 'text-gray-600'   },
  ];

  return (
    <div className="space-y-6">

      {/* Hero KPI card */}
      <div className="rounded-2xl overflow-hidden bg-[#0d1f12] relative">
        {/* décos bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-custom-green-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-accent-yellow opacity-5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-0.5">Tableau de bord</p>
              <h2 className="text-white text-[20px] font-black">Vue d'ensemble</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/40 text-[11px] font-semibold">En direct</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Utilisateurs',     value: counts.total_users,    icon: Users,       color: 'text-blue-400',   section: 'users' },
              { label: 'Annonces actives', value: counts.total_listings, icon: ShoppingBag, color: 'text-emerald-400',section: 'listings' },
              { label: 'Signalements',     value: counts.pending_reports,icon: Flag,        color: 'text-red-400',    section: 'reports' },
              { label: 'Retraits',         value: counts.pending_withdrawals, icon: Wallet, color: 'text-violet-400', section: 'withdrawals' },
            ].map(({ label, value, icon: Icon, color, section }) => (
              <button key={label} onClick={() => setActiveTab(section)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-left transition-all group">
                <Icon className={`w-5 h-5 ${color} mb-3`} />
                <p className="text-white text-[26px] font-black leading-none">{loading ? '—' : (value ?? 0).toLocaleString('fr-FR')}</p>
                <p className="text-white/40 text-[11px] mt-1 group-hover:text-white/60 transition-colors">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-red-500" />
            <h3 className="text-[13px] font-black text-gray-900">Actions requises</h3>
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">{alerts.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {alerts.map(({ id, label, value, icon: Icon, cls, dot }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all ${cls}`}>
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5" />
                  <span className={`absolute -top-1 -right-1 w-2 h-2 ${dot} rounded-full animate-pulse`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[22px] font-black leading-none">{value}</p>
                  <p className="text-[11px] font-semibold mt-0.5 opacity-80">{label}</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div>
        <h3 className="text-[13px] font-black text-gray-900 mb-3">Statistiques</h3>
        <AdminStatsGrid stats={stats} loading={loading} />
      </div>

      {/* Accès rapide */}
      <div>
        <h3 className="text-[13px] font-black text-gray-900 mb-3">Accès rapide</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK.map(({ id, label, icon: Icon, bg, ic }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${ic}`} />
              </div>
              <span className="text-[11px] font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

/* ─── Sidebar ───────────────────────────────────────────────── */
const SidebarNav = ({ activeTab, setActiveTab, isAdmin, userRole, user, counts, onNavigate, signOut }) => {
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = user?.user_metadata?.avatar_url;

  const go = (id) => { setActiveTab(id); onNavigate?.(); };

  return (
    <nav className="flex flex-col h-full select-none bg-[#0d1f12]">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-yellow flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-[14px] font-black text-gray-900">Z+</span>
          </div>
          <div>
            <p className="text-white font-black text-[14px] leading-tight">Zando+</p>
            <p className="text-white/35 text-[10px] font-semibold tracking-wider uppercase">Administration</p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => go('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
            activeTab === 'overview'
              ? 'bg-accent-yellow/15 text-accent-yellow'
              : 'text-white/50 hover:text-white hover:bg-white/6'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === 'overview' ? 'bg-accent-yellow/20' : 'bg-white/6'}`}>
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-bold flex-1">Vue d'ensemble</span>
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(i => !i.adminOnly || isAdmin);
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-2">
              <p className="text-white/25 text-[9px] font-black uppercase tracking-[0.15em] px-3 pt-3 pb-1.5">
                {group.label}
              </p>
              {visible.map((item) => {
                const isActive = activeTab === item.id;
                const count = item.badge ? counts[item.badge] : null;
                const showBadge = count > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all relative group ${
                      isActive
                        ? 'bg-accent-yellow/15 text-accent-yellow'
                        : 'text-white/45 hover:text-white hover:bg-white/6'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-accent-yellow"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-accent-yellow/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12.5px] font-semibold flex-1 leading-none">{item.label}</span>
                    {showBadge && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        item.badgeAlert ? 'bg-red-500 text-white animate-pulse' : 'bg-white/15 text-white/60'
                      }`}>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-custom-green-500 flex items-center justify-center flex-shrink-0 shadow">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-[11px] font-black">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-bold truncate leading-tight">{name}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_CFG[userRole]?.cls || ROLE_CFG.viewer.cls}`}>
              {ROLE_CFG[userRole]?.label || 'Accès limité'}
            </span>
          </div>
        </div>
        <button
          onClick={() => { signOut?.(); navigate('/'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors text-[12px] font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" /> Se déconnecter
        </button>
      </div>
    </nav>
  );
};

/* ─── Main ──────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const mainRef = React.useRef(null);
  const [stats, setStats] = useState([]);
  const [counts, setCounts] = useState({
    total_users: 0, total_listings: 0, pending_reports: 0,
    pending_escrow: 0, pending_withdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { userRole, isAdmin, user, signOut } = useAuth();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [{ data }, escrowRes, withdrawalRes] = await Promise.all([
        supabase.rpc('get_admin_statistics'),
        supabase.from('transactions_escrow').select('id', { count: 'exact', head: true }).eq('statut', 'retrait_demande'),
        supabase.from('wallet_withdrawals').select('id', { count: 'exact', head: true }).eq('statut', 'pending'),
      ]);
      if (data) {
        setStats([
          { label: 'Utilisateurs',     value: data.total_users,     icon: Users,       color: 'from-blue-500 to-blue-600' },
          { label: 'Annonces actives', value: data.total_listings,  icon: ShoppingBag, color: 'from-emerald-500 to-teal-600', change: `+${data.new_listings_last_24h} / 24h` },
          { label: 'Boosts actifs',    value: data.active_boosts,   icon: Zap,         color: 'from-amber-400 to-orange-500' },
          { label: 'Signalements',     value: data.pending_reports, icon: Flag,        color: 'from-red-500 to-pink-600' },
        ]);
        setCounts({
          total_users:          data.total_users,
          total_listings:       data.total_listings,
          pending_reports:      data.pending_reports,
          pending_escrow:       escrowRes.count || 0,
          pending_withdrawals:  withdrawalRes.count || 0,
        });
      }
    } catch (err) {
      console.error(err);
      if (!silent) toast({ title: 'Erreur', description: 'Impossible de charger les statistiques.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalAlerts = counts.pending_reports + counts.pending_escrow + counts.pending_withdrawals;

  const sidebarProps = { activeTab, setActiveTab, isAdmin, userRole, user, counts, signOut };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-page-bg">
      <Helmet>
        <title>Administration — Zando+ Congo</title>
      </Helmet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 sticky top-16 md:top-[7.75rem] h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)] overflow-hidden shadow-2xl shadow-black/30">
        <SidebarNav {...sidebarProps} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[220px] z-50 lg:hidden shadow-2xl flex flex-col"
            >
              <button onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors z-10">
                <X className="w-4 h-4" />
              </button>
              <SidebarNav {...sidebarProps} onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main ref={mainRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)]">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px] min-w-0">
            <button onClick={() => setActiveTab('overview')} className="text-gray-400 hover:text-custom-green-500 transition-colors flex-shrink-0">
              <Home className="w-3.5 h-3.5" />
            </button>
            {activeTab !== 'overview' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-900 font-bold truncate">{TAB_LABELS[activeTab] || activeTab}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Alert bell */}
            {totalAlerts > 0 && (
              <button
                onClick={() => {
                  const first = counts.pending_reports > 0 ? 'reports' : counts.pending_escrow > 0 ? 'escrow' : 'withdrawals';
                  setActiveTab(first);
                }}
                className="relative p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <span className={`hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              userRole === 'admin' ? 'bg-red-50 text-red-600 border-red-200'
              : userRole === 'editor' ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {ROLE_CFG[userRole]?.label || 'Accès limité'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' ? (
                <OverviewTab stats={stats} counts={counts} loading={loading} setActiveTab={setActiveTab} />
              ) : (
                renderTabContent(activeTab)
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
