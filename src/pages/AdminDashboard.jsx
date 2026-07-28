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
  TrendingUp, ArrowRight, RefreshCw, Bell, Globe
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Navigation config ───────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'Gestion',
    items: [
      { id: 'users',         icon: Users,        label: 'Utilisateurs',   color: 'text-blue-400',   bg: 'bg-blue-500/20',    badge: 'total_users' },
      { id: 'listings',      icon: ShoppingBag,  label: 'Annonces',       color: 'text-emerald-400',bg: 'bg-emerald-500/20', badge: 'total_listings' },
      { id: 'deliveries',    icon: Truck,         label: 'Livraisons',     color: 'text-orange-400', bg: 'bg-orange-500/20' },
      { id: 'delivery-config', icon: MapPin,      label: 'Config Livraison', color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
      { id: 'reports',       icon: Flag,          label: 'Signalements',   color: 'text-red-400',    bg: 'bg-red-500/20',     badge: 'pending_reports',    badgeAlert: true },
      { id: 'verifications', icon: ShieldCheck,   label: 'Vérifications',  color: 'text-teal-400',   bg: 'bg-teal-500/20' },
    ],
  },
  {
    label: 'Monétisation',
    items: [
      { id: 'boosts',     icon: Zap,       label: 'Boosts',     color: 'text-amber-400',  bg: 'bg-amber-500/20' },
      { id: 'escrow',     icon: ShieldCheck,label: 'Escrow',    color: 'text-green-400',  bg: 'bg-green-500/20',   badge: 'pending_escrow', badgeAlert: true },
      { id: 'withdrawals',icon: Wallet,    label: 'Retraits',   color: 'text-violet-400', bg: 'bg-violet-500/20',  badge: 'pending_withdrawals', badgeAlert: true },
      { id: 'ads',        icon: Megaphone, label: 'Publicités', color: 'text-purple-400', bg: 'bg-purple-500/20' },
      { id: 'payments',   icon: CreditCard,label: 'Paiements',  color: 'text-green-400',  bg: 'bg-green-500/20',   adminOnly: true },
    ],
  },
  {
    label: 'Site & Contenu',
    items: [
      { id: 'site',       icon: Globe,      label: 'Gestion du site', color: 'text-custom-green-400', bg: 'bg-green-500/20' },
      { id: 'categories', icon: LayoutGrid, label: 'Catégories',      color: 'text-indigo-400',       bg: 'bg-indigo-500/20' },
    ],
  },
  {
    label: 'Programme',
    items: [
      { id: 'beta', icon: Users, label: 'Testeurs Beta', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    ],
  },
  {
    label: 'Système',
    items: [
      { id: 'approvals',   icon: ClipboardCheck, label: 'Approbations', color: 'text-blue-300',   bg: 'bg-blue-500/20',   adminOnly: true },
      { id: 'audit',       icon: FileText,        label: 'Audit Logs',   color: 'text-violet-400', bg: 'bg-violet-500/20', adminOnly: true },
      { id: 'email-test',  icon: Mail,            label: 'Test E-mail',  color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   adminOnly: true },
      { id: 'settings',    icon: Settings,        label: 'Paramètres',   color: 'text-gray-400',   bg: 'bg-gray-500/20' },
      { id: 'qa',          icon: Activity,        label: 'QA & Tests',   color: 'text-sky-400',    bg: 'bg-sky-500/20' },
    ],
  },
];

const TAB_LABELS = {
  overview: 'Vue d\'ensemble', users: 'Utilisateurs', listings: 'Annonces',
  deliveries: 'Livraisons', reports: 'Signalements', verifications: 'Vérifications',
  boosts: 'Boosts', escrow: 'Escrow', withdrawals: 'Retraits',
  beta: 'Testeurs Beta', ads: 'Publicités', payments: 'Paiements',
  site: 'Gestion du site', categories: 'Catégories', approvals: 'Approbations',
  audit: 'Audit Logs', 'email-test': 'Test E-mail', settings: 'Paramètres', qa: 'QA & Tests',
};

const ROLE_CONFIG = {
  admin:  { label: 'Admin',    color: 'bg-red-500/20    text-red-300    border-red-500/30' },
  editor: { label: 'Éditeur',  color: 'bg-blue-500/20   text-blue-300   border-blue-500/30' },
  viewer: { label: 'Lecteur',  color: 'bg-gray-500/20   text-gray-300   border-gray-500/30' },
};

// ─── Tab renderer ─────────────────────────────────────────────────────────────

const renderTabContent = (activeTab) => {
  switch (activeTab) {
    case 'users':         return <AdminUsersTab />;
    case 'listings':      return <AdminListingsTab />;
    case 'deliveries':       return <AdminDeliveriesTab />;
    case 'delivery-config':  return <AdminDeliveryConfigTab />;
    case 'reports':       return <AdminReportsTab />;
    case 'verifications': return <AdminVerificationsTab />;
    case 'boosts':        return <AdminBoostsTab />;
    case 'escrow':        return <AdminEscrowTab />;
    case 'withdrawals':   return <AdminWithdrawalsTab />;
    case 'ads':           return <AdminAdsTab />;
    case 'payments':      return <AdminPaymentsTab />;
    case 'site':          return <AdminSiteTab />;
    case 'categories':    return <AdminCategoriesTab />;
    case 'hero':          return <AdminHeroTab />;
    case 'approvals':     return <AdminChangeRequestsTab />;
    case 'audit':         return <AdminAuditLogTab />;
    case 'email-test':    return <AdminEmailTestTab />;
    case 'settings':      return <AdminSettingsTab />;
    case 'qa':            return <AdminQATab />;
    case 'beta':          return <AdminBetaTab />;
    default:              return null;
  }
};

// ─── Overview page ────────────────────────────────────────────────────────────

const OverviewTab = ({ stats, counts, loading, setActiveTab }) => {
  const alerts = [
    counts.pending_reports   > 0 && { id: 'reports',     label: 'Signalements en attente',    value: counts.pending_reports,    color: 'border-red-400    bg-red-50    text-red-700',    icon: Flag },
    counts.pending_escrow    > 0 && { id: 'escrow',      label: 'Retraits escrow en attente', value: counts.pending_escrow,     color: 'border-orange-400 bg-orange-50 text-orange-700', icon: ShieldCheck },
    counts.pending_withdrawals > 0 && { id: 'withdrawals', label: 'Retraits portefeuille',    value: counts.pending_withdrawals,color: 'border-violet-400 bg-violet-50 text-violet-700', icon: Wallet },
  ].filter(Boolean);

  const quickLinks = [
    { id: 'users',     label: 'Utilisateurs', icon: Users,       color: 'from-blue-500 to-blue-600' },
    { id: 'listings',  label: 'Annonces',     icon: ShoppingBag, color: 'from-emerald-500 to-teal-600' },
    { id: 'escrow',    label: 'Escrow',       icon: ShieldCheck, color: 'from-green-500 to-emerald-600' },
    { id: 'boosts',    label: 'Boosts',       icon: Zap,         color: 'from-amber-400 to-orange-500' },
    { id: 'deliveries',label: 'Livraisons',   icon: Truck,       color: 'from-orange-400 to-red-500' },
    { id: 'settings',  label: 'Paramètres',   icon: Settings,    color: 'from-gray-500 to-slate-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Statistiques</h2>
        <AdminStatsGrid stats={stats} loading={loading} />
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-500 animate-pulse" />
            Actions requises
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <button
                  key={alert.id}
                  onClick={() => setActiveTab(alert.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${alert.color}`}
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold leading-none">{alert.value}</p>
                    <p className="text-xs font-medium mt-1 opacity-80">{alert.label}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-60 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick access */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">{link.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SidebarNav = ({ activeTab, setActiveTab, isAdmin, userRole, user, counts, onNavigate }) => {
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';

  return (
    <nav className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">Zando+</p>
            <p className="text-white/40 text-[11px]">Administration</p>
          </div>
        </div>
      </div>

      {/* Overview button */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => { setActiveTab('overview'); onNavigate?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === 'overview' ? 'bg-emerald-500/30' : 'bg-white/5'}`}>
            <Home className={`w-4 h-4 ${activeTab === 'overview' ? 'text-emerald-400' : 'text-current'}`} />
          </div>
          <span className="text-sm font-semibold flex-1">Vue d'ensemble</span>
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const isActive = activeTab === item.id;
                const count = item.badge ? counts[item.badge] : null;
                const showBadge = count > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 relative ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-400"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? item.bg : ''}`}>
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? item.color : 'text-current'}`} />
                    </div>
                    <span className="text-[13px] font-medium flex-1 leading-none">{item.label}</span>
                    {showBadge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        item.badgeAlert
                          ? 'bg-red-500/90 text-white animate-pulse'
                          : 'bg-white/15 text-white/70'
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

      {/* User footer */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{displayName}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ROLE_CONFIG[userRole]?.color || ROLE_CONFIG.viewer.color}`}>
              {ROLE_CONFIG[userRole]?.label || 'Accès limité'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ─── Main dashboard ───────────────────────────────────────────────────────────

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
  const { userRole, isAdmin, user } = useAuth();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [{ data }, escrowRes, withdrawalRes] = await Promise.all([
        supabase.rpc('get_admin_statistics'),
        supabase.from('transactions_escrow').select('id', { count: 'exact', head: true }).eq('statut', 'retrait_demande'),
        supabase.from('wallet_withdrawals').select('id', { count: 'exact', head: true }).eq('statut', 'pending'),
      ]);

      if (data) {
        setStats([
          { label: 'Utilisateurs',    value: data.total_users,    icon: Users,       color: 'from-blue-500 to-blue-600' },
          { label: 'Annonces actives',value: data.total_listings, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600', change: `+${data.new_listings_last_24h} / 24h` },
          { label: 'Boosts actifs',   value: data.active_boosts,  icon: Zap,         color: 'from-amber-400 to-orange-500' },
          { label: 'Signalements',    value: data.pending_reports, icon: Flag,        color: 'from-red-500 to-pink-600' },
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-50/80">
      <Helmet>
        <title>Administration — Zando+ Congo</title>
      </Helmet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 flex-shrink-0 sticky top-16 md:top-[7.75rem] h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)] overflow-hidden shadow-2xl shadow-slate-900/40">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          userRole={userRole}
          user={user}
          counts={counts}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-60 bg-slate-900 z-50 lg:hidden shadow-2xl flex flex-col"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                userRole={userRole}
                user={user}
                counts={counts}
                onNavigate={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main ref={mainRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)]">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200/70 px-4 lg:px-6 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            {activeTab !== 'overview' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-900 font-semibold truncate">{TAB_LABELS[activeTab] || activeTab}</span>
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
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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

            <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_CONFIG[userRole]?.color || ROLE_CONFIG.viewer.color}`}>
              {ROLE_CONFIG[userRole]?.label || 'Accès limité'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'overview' ? (
                <OverviewTab
                  stats={stats}
                  counts={counts}
                  loading={loading}
                  setActiveTab={setActiveTab}
                />
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
