import React, { useState, useEffect } from 'react';
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
import AdminBetaTab from '@/components/admin/AdminBetaTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import { Helmet } from 'react-helmet-async';
import {
  Users, ShoppingBag, Truck, Flag, Zap, Megaphone, ShieldCheck,
  Settings, Image, Mail, MessageSquare, Trash2, GitBranch, Activity,
  FileText, ClipboardCheck, CreditCard, LayoutGrid, Menu, X,
  ChevronRight, BarChart3, Home
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const NAV_GROUPS = [
  {
    label: 'Gestion',
    items: [
      { id: 'users', icon: Users, label: 'Utilisateurs', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { id: 'listings', icon: ShoppingBag, label: 'Annonces', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { id: 'deliveries', icon: Truck, label: 'Livraisons', color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { id: 'reports', icon: Flag, label: 'Signalements', color: 'text-red-400', bg: 'bg-red-500/10', badge: 'reports' },
      { id: 'verifications', icon: ShieldCheck, label: 'Vérifications', color: 'text-teal-400', bg: 'bg-teal-500/10' },
    ],
  },
  {
    label: 'Monétisation',
    items: [
      { id: 'boosts', icon: Zap, label: 'Boosts', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { id: 'escrow', icon: ShieldCheck, label: 'Escrow', color: 'text-green-400', bg: 'bg-green-500/10' },
      { id: 'withdrawals', icon: CreditCard, label: 'Retraits', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { id: 'ads', icon: Megaphone, label: 'Publicités', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { id: 'payments', icon: CreditCard, label: 'Paiements', color: 'text-green-400', bg: 'bg-green-500/10', adminOnly: true },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { id: 'categories', icon: LayoutGrid, label: 'Catégories', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { id: 'hero', icon: Image, label: 'Hero Slider', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    ],
  },
  {
    label: 'Beta Programme',
    items: [
      { id: 'beta', icon: Users, label: 'Testeurs Beta', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ],
  },
  {
    label: 'Système',
    items: [
      { id: 'approvals', icon: ClipboardCheck, label: 'Approbations', color: 'text-blue-300', bg: 'bg-blue-500/10', adminOnly: true },
      { id: 'audit', icon: FileText, label: 'Audit Logs', color: 'text-violet-400', bg: 'bg-violet-500/10', adminOnly: true },
      { id: 'email-test', icon: Mail, label: 'Test E-mail', color: 'text-cyan-400', bg: 'bg-cyan-500/10', adminOnly: true },
      { id: 'settings', icon: Settings, label: 'Paramètres', color: 'text-gray-400', bg: 'bg-gray-500/10' },
      { id: 'qa', icon: Activity, label: 'QA & Tests', color: 'text-sky-400', bg: 'bg-sky-500/10' },
    ],
  },
];

const ROLE_LABELS = {
  admin: { label: 'Administrateur', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  editor: { label: 'Éditeur', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  viewer: { label: 'Lecteur', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

const TAB_LABELS = {
  users: 'Utilisateurs', listings: 'Annonces', deliveries: 'Livraisons',
  reports: 'Signalements', verifications: 'Vérifications', boosts: 'Boosts',
  escrow: 'Escrow', withdrawals: 'Retraits',
  beta: 'Testeurs Beta',
  ads: 'Publicités', payments: 'Paiements', categories: 'Catégories',
  hero: 'Hero Slider', approvals: 'Approbations', audit: 'Audit Logs',
  'email-test': 'Test E-mail', settings: 'Paramètres', qa: 'QA & Tests',
};

const renderTabContent = (activeTab) => {
  switch (activeTab) {
    case 'users': return <AdminUsersTab />;
    case 'listings': return <AdminListingsTab />;
    case 'deliveries': return <AdminDeliveriesTab />;
    case 'reports': return <AdminReportsTab />;
    case 'verifications': return <AdminVerificationsTab />;
    case 'boosts': return <AdminBoostsTab />;
    case 'escrow': return <AdminEscrowTab />;
    case 'withdrawals': return <AdminWithdrawalsTab />;
    case 'ads': return <AdminAdsTab />;
    case 'payments': return <AdminPaymentsTab />;
    case 'categories': return <AdminCategoriesTab />;
    case 'hero': return <AdminHeroTab />;
    case 'approvals': return <AdminChangeRequestsTab />;
    case 'audit': return <AdminAuditLogTab />;
    case 'email-test': return <AdminEmailTestTab />;
    case 'settings': return <AdminSettingsTab />;
    case 'qa': return <AdminQATab />;
    case 'beta': return <AdminBetaTab />;
    default: return null;
  }
};

const SidebarNav = ({ activeTab, setActiveTab, isAdmin, userRole, onNavigate }) => (
  <nav className="flex flex-col h-full">
    <div className="px-4 py-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Zando+</p>
          <p className="text-white/40 text-xs">Tableau de bord</p>
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label} className="mb-2">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            {visibleItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onNavigate?.(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? item.bg : 'bg-transparent group-hover:' + item.bg.split(' ')[0]
                  }`}>
                    <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-current'}`} />
                  </div>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>

    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-2 px-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          A
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">Admin</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${ROLE_LABELS[userRole]?.color || ROLE_LABELS.viewer.color}`}>
            {ROLE_LABELS[userRole]?.label || 'Accès limité'}
          </span>
        </div>
      </div>
    </div>
  </nav>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const mainRef = React.useRef(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { userRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_statistics');
      if (error) throw error;
      setStats([
        { label: 'Utilisateurs Totaux', value: data.total_users, icon: Users, color: 'from-blue-500 to-blue-600' },
        { label: 'Annonces Actives', value: data.total_listings, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600', change: `+${data.new_listings_last_24h} / 24h` },
        { label: 'Boosts Actifs', value: data.active_boosts, icon: Zap, color: 'from-amber-400 to-orange-500' },
        { label: 'Signalements', value: data.pending_reports, icon: Flag, color: 'from-red-500 to-pink-600' },
      ]);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({ title: "Erreur", description: "Impossible de charger les statistiques.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-50">
      <Helmet>
        <title>Tableau de Bord Administrateur | Zando+ Congo</title>
      </Helmet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 flex-shrink-0 sticky top-16 md:top-[7.75rem] h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)] overflow-hidden shadow-2xl">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          userRole={userRole}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 z-50 lg:hidden shadow-2xl flex flex-col"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                userRole={userRole}
                onNavigate={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)]">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 lg:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Home className="w-3.5 h-3.5" />
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-semibold">{TAB_LABELS[activeTab] || activeTab}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_LABELS[userRole]?.color || ROLE_LABELS.viewer.color}`}>
              {ROLE_LABELS[userRole]?.label || 'Accès limité'}
            </span>
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats — only show on overview tabs */}
          {activeTab === 'users' && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-4">Vue d'ensemble</h1>
              <AdminStatsGrid stats={stats} loading={loading} />
            </div>
          )}

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent(activeTab)}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
