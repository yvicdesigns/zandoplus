import React, { useState, useEffect, useCallback } from 'react';
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
import AdminChangelogTab from '@/components/admin/AdminChangelogTab';
import AdminQATab from '@/components/admin/AdminQATab';
import AdminAuditLogTab from '@/components/admin/AdminAuditLogTab';
import AdminChangeRequestsTab from '@/components/admin/AdminChangeRequestsTab';
import AdminEmailTestTab from '@/components/admin/AdminEmailTestTab';
import AdminEmailsTab from '@/components/admin/AdminEmailsTab';
import AdminWhatsAppTab from '@/components/admin/AdminWhatsAppTab';
import AdminPaymentsTab from '@/components/admin/AdminPaymentsTab';
import AdminCategoriesTab from '@/components/admin/AdminCategoriesTab';
import AdminSiteTab from '@/components/admin/AdminSiteTab';
import AdminBetaTab from '@/components/admin/AdminBetaTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import AdminDeliveryConfigTab from '@/components/admin/AdminDeliveryConfigTab';
import AdminBannersTab from '@/components/admin/AdminBannersTab';
import AdminHomeCardsTab from '@/components/admin/AdminHomeCardsTab';
import AdminHomepageAdsTab from '@/components/admin/AdminHomepageAdsTab';
import { Helmet } from 'react-helmet-async';
import {
  Users, ShoppingBag, Truck, Flag, Zap, Megaphone, ShieldCheck,
  Settings, Mail, Activity, FileText, ClipboardCheck, CreditCard,
  LayoutGrid, Menu, X, ChevronRight, Home, Wallet, MapPin,
  ArrowRight, RefreshCw, Bell, Globe, LogOut, TrendingUp,
  TrendingDown, Minus, Shield, Package, Tag, Star, Image, Layers, Send, MessageCircle,
  UserPlus, DollarSign, Award,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ─── Role permissions ─────────────────────────────────────── */
const ROLE_TABS = {
  admin:        null,
  monetisation: new Set(['overview', 'escrow', 'payments', 'withdrawals', 'ads', 'boosts']),
  gestion:      new Set(['overview', 'users', 'listings', 'deliveries', 'categories', 'reports', 'verifications', 'delivery-config']),
  editor:       null,
  viewer:       new Set(['overview', 'listings']),
};

const ROLE_LABELS = {
  admin:        'Administrateur',
  monetisation: 'Monétisation',
  gestion:      'Gestion',
  editor:       'Éditeur',
  viewer:       'Lecteur',
};

const canAccessTab = (tabId, userRole, isAdmin) => {
  if (isAdmin) return true;
  const allowed = ROLE_TABS[userRole];
  if (allowed === null || allowed === undefined) return true;
  return allowed.has(tabId);
};

/* ─── Nav ───────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Gestion',
    items: [
      { id: 'users',           icon: Users,        label: 'Utilisateurs',    badge: 'total_users' },
      { id: 'listings',        icon: ShoppingBag,  label: 'Annonces',        badge: 'total_listings' },
      { id: 'deliveries',      icon: Truck,        label: 'Livraisons' },
      { id: 'categories',      icon: LayoutGrid,   label: 'Catégories' },
      { id: 'reports',         icon: Flag,         label: 'Signalements',    badge: 'pending_reports', badgeAlert: true },
      { id: 'verifications',   icon: ShieldCheck,  label: 'Vérifications' },
    ],
  },
  {
    label: 'Monétisation',
    items: [
      { id: 'escrow',          icon: ShieldCheck,  label: 'Transactions',    badge: 'pending_escrow', badgeAlert: true },
      { id: 'payments',        icon: CreditCard,   label: 'Paiements',       adminOnly: true },
      { id: 'withdrawals',     icon: Wallet,       label: 'Retraits',        badge: 'pending_withdrawals', badgeAlert: true },
      { id: 'ads',             icon: Megaphone,    label: 'Publicités' },
      { id: 'boosts',          icon: Zap,          label: 'Boosts' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { id: 'settings',        icon: Settings,     label: 'Paramètres' },
      { id: 'approvals',       icon: ClipboardCheck,label: 'Approbations',   adminOnly: true },
      { id: 'audit',           icon: FileText,     label: "Logs d'activité", adminOnly: true },
      { id: 'delivery-config', icon: MapPin,       label: 'Config Livraison' },
      { id: 'site',            icon: Globe,        label: 'Gestion du site' },
      { id: 'hero',            icon: Layers,       label: 'Slides Hero' },
      { id: 'home-cards',      icon: Package,      label: 'Cartes Accueil' },
      { id: 'banners',         icon: Image,        label: 'Bannières & Hero' },
      { id: 'homepage-ads',    icon: Megaphone,    label: 'Publicités Homepage' },
      { id: 'emails',          icon: Send,         label: 'Campagnes Email', adminOnly: true },
      { id: 'whatsapp',        icon: MessageCircle, label: 'WhatsApp',       adminOnly: true },
      { id: 'email-test',      icon: Mail,         label: 'Test E-mail',     adminOnly: true },
      { id: 'qa',              icon: Activity,     label: 'QA & Tests' },
      { id: 'beta',            icon: Users,        label: 'Testeurs Beta' },
    ],
  },
];

const TAB_LABELS = {
  overview: "Vue d'ensemble", users: 'Utilisateurs', listings: 'Annonces',
  deliveries: 'Livraisons', reports: 'Signalements', verifications: 'Vérifications',
  boosts: 'Boosts', escrow: 'Transactions', withdrawals: 'Retraits',
  ads: 'Publicités', payments: 'Paiements', site: 'Gestion du site',
  categories: 'Catégories', approvals: 'Approbations', audit: "Logs d'activité",
  'emails': 'Campagnes Email', 'whatsapp': 'WhatsApp', 'email-test': 'Test E-mail', settings: 'Paramètres', qa: 'QA & Tests',
  'delivery-config': 'Config Livraison', beta: 'Testeurs Beta', hero: 'Slides Hero', 'home-cards': 'Cartes Accueil', banners: 'Bannières & Hero', 'homepage-ads': 'Publicités Homepage',
};

/* ─── Tab renderer ──────────────────────────────────────────── */
const renderTabContent = (t, userRole, isAdmin) => {
  if (!canAccessTab(t, userRole, isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Shield className="w-14 h-14 mb-4 text-gray-300" />
        <p className="text-lg font-bold text-gray-700">Accès non autorisé</p>
        <p className="text-sm mt-1 text-gray-400">Vous n'avez pas accès à cette section.</p>
      </div>
    );
  }
  switch (t) {
    case 'users':           return <AdminUsersTab />;
    case 'listings':        return <AdminListingsTab />;
    case 'deliveries':      return <AdminDeliveriesTab />;
    case 'delivery-config': return <AdminDeliveryConfigTab />;
    case 'reports':         return <AdminReportsTab />;
    case 'verifications':   return <AdminVerificationsTab />;
    case 'boosts':          return <AdminBoostsTab />;
    case 'escrow':          return <AdminEscrowTab />;
    case 'withdrawals':     return <AdminWithdrawalsTab />;
    case 'ads':             return <AdminAdsTab />;
    case 'payments':        return <AdminPaymentsTab />;
    case 'site':            return <AdminSiteTab />;
    case 'categories':      return <AdminCategoriesTab />;
    case 'hero':            return <AdminHeroTab />;
    case 'home-cards':      return <AdminHomeCardsTab />;
    case 'banners':         return <AdminBannersTab />;
    case 'homepage-ads':    return <AdminHomepageAdsTab />;
    case 'approvals':       return <AdminChangeRequestsTab />;
    case 'audit':           return <AdminAuditLogTab />;
    case 'emails':          return <AdminEmailsTab />;
    case 'whatsapp':        return <AdminWhatsAppTab />;
    case 'email-test':      return <AdminEmailTestTab />;
    case 'settings':        return <AdminSettingsTab />;
    case 'qa':              return <AdminQATab />;
    case 'beta':            return <AdminBetaTab />;
    default:                return null;
  }
};

/* ─── Donut SVG ─────────────────────────────────────────────── */
const DonutChart = ({ segments, size = 110, thickness = 14 }) => {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;

  let accumulated = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const len = frac * circ;
        const offset = circ - accumulated * circ / total;
        accumulated += seg.value;
        return (
          <circle key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${circ}`}
            strokeDashoffset={offset + circ * 0.25}
            strokeLinecap="butt"
            style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
    </svg>
  );
};

/* ─── Multi-line SVG chart ──────────────────────────────────── */
const MultiLineChart = ({ series, labels }) => {
  const W = 560, H = 180, PL = 36, PR = 16, PT = 16, PB = 32;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  if (!series.length || !series[0].data.length) return (
    <div className="h-[180px] flex items-center justify-center text-gray-300 text-[13px]">Aucune donnée</div>
  );

  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const n = series[0].data.length;

  const getX = (i) => PL + (i / (n - 1)) * innerW;
  const getY = (v) => PT + (1 - v / maxVal) * innerH;

  const gridVals = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Grid lines */}
      {gridVals.map((v, i) => {
        const y = getY(v);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text>
          </g>
        );
      })}

      {/* Lines */}
      {series.map(s => {
        const pts = s.data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {labels.map((l, i) => {
        if (n <= 7 || i % Math.ceil(n / 7) === 0 || i === n - 1) {
          return <text key={i} x={getX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{l}</text>;
        }
        return null;
      })}
    </svg>
  );
};

/* ─── BarChart (6-month revenue sparkline) ──────────────────── */
const BarChart = ({ bars }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-14">
      {bars.map((b, i) => {
        const isCurrent = i === bars.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all duration-700"
              style={{
                height: `${Math.max((b.value / max) * 48, 2)}px`,
                backgroundColor: isCurrent ? '#005023' : '#86efac',
              }}
            />
            <span className="text-[9px] text-gray-400 font-medium leading-none">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Overview ──────────────────────────────────────────────── */
const OverviewTab = ({ counts, loading, setActiveTab }) => {
  const [period, setPeriod] = useState('7');
  const [chartData, setChartData] = useState({ series: [], labels: [] });
  const [activities, setActivities] = useState([]);
  const [userDist, setUserDist] = useState([]);
  const [orderDist, setOrderDist] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [weekChanges, setWeekChanges] = useState({});
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [revenueData, setRevenueData] = useState({ ca_mois: 0, zando_mois: 0, ca_prev: 0, zando_prev: 0 });
  const [topVendeurs, setTopVendeurs] = useState([]);
  const [monthBars, setMonthBars] = useState([]);
  const [newUsersMonth, setNewUsersMonth] = useState(0);
  const [newUsersPrevMonth, setNewUsersPrevMonth] = useState(0);

  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Admin';

  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingExtra(true);
      const days = parseInt(period);
      const from = subDays(new Date(), days).toISOString();
      const prevFrom = subDays(new Date(), days * 2).toISOString();

      try {
        const thisMonthStart = startOfMonth(new Date()).toISOString();
        const prevMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
        const sixMonthsAgo   = startOfMonth(subMonths(new Date(), 5)).toISOString();

        const [
          { data: recentProfiles },
          { data: recentListings },
          { data: recentTx },
          { data: prevProfiles },
          { data: prevListings },
          { data: prevTx },
          { data: allProfiles },
          { data: txAll },
          { data: listingsAll },
          { data: revenueHistory },
          { count: newUsersThisMonthCount },
          { count: newUsersPrevMonthCount },
        ] = await Promise.all([
          supabase.from('profiles').select('created_at').gte('created_at', from),
          supabase.from('listings').select('created_at').gte('created_at', from),
          supabase.from('transactions_escrow').select('created_at, montant').gte('created_at', from),
          supabase.from('profiles').select('id').gte('created_at', prevFrom).lt('created_at', from),
          supabase.from('listings').select('id').gte('created_at', prevFrom).lt('created_at', from),
          supabase.from('transactions_escrow').select('id').gte('created_at', prevFrom).lt('created_at', from),
          supabase.from('profiles').select('is_seller'),
          supabase.from('transactions_escrow').select('statut'),
          supabase.from('listings').select('category').eq('status', 'active'),
          supabase.from('transactions_escrow')
            .select('montant, commission_amount, vendeur_id, created_at, vendeur:vendeur_id(full_name)')
            .gte('created_at', sixMonthsAgo)
            .in('statut', ['confirme', 'complete', 'fonds_liberes']),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', thisMonthStart),
        ]);

        /* ── % changes ── */
        const pct = (curr, prev) => prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null;
        setWeekChanges({
          users:    pct(recentProfiles?.length || 0,  prevProfiles?.length || 0),
          listings: pct(recentListings?.length || 0,  prevListings?.length || 0),
          orders:   pct(recentTx?.length || 0,        prevTx?.length || 0),
          newUsers: pct(newUsersThisMonthCount || 0,  newUsersPrevMonthCount || 0),
        });

        /* ── Revenue — 6 months ── */
        const monthlyMap = {};
        for (let i = 5; i >= 0; i--) {
          const key   = format(subMonths(new Date(), i), 'yyyy-MM');
          const label = format(subMonths(new Date(), i), 'MMM', { locale: fr });
          monthlyMap[key] = { label, ca: 0, zando: 0 };
        }
        const thisMonthKey = format(new Date(), 'yyyy-MM');
        const prevMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM');
        const vendorMap = {};
        (revenueHistory || []).forEach(tx => {
          const mk = tx.created_at.slice(0, 7);
          if (monthlyMap[mk]) {
            monthlyMap[mk].ca     += tx.montant || 0;
            const commission       = tx.commission_amount ?? Math.round((tx.montant || 0) * 0.07);
            monthlyMap[mk].zando  += commission;
          }
          if (mk === thisMonthKey) {
            const vid = tx.vendeur_id;
            if (!vendorMap[vid]) vendorMap[vid] = { name: tx.vendeur?.full_name || 'Vendeur', montant: 0, count: 0 };
            vendorMap[vid].montant += tx.montant || 0;
            vendorMap[vid].count++;
          }
        });
        const bars = Object.values(monthlyMap);
        setMonthBars(bars);
        const tmRev = monthlyMap[thisMonthKey] || { ca: 0, zando: 0 };
        const pmRev = monthlyMap[prevMonthKey] || { ca: 0, zando: 0 };
        setRevenueData({ ca_mois: tmRev.ca, zando_mois: tmRev.zando, ca_prev: pmRev.ca, zando_prev: pmRev.zando });
        setTopVendeurs(Object.values(vendorMap).sort((a, b) => b.montant - a.montant).slice(0, 5));
        setNewUsersMonth(newUsersThisMonthCount || 0);
        setNewUsersPrevMonth(newUsersPrevMonthCount || 0);

        /* ── Chart (daily counts) ── */
        const dayMap = {};
        const lblMap = {};
        for (let i = days - 1; i >= 0; i--) {
          const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
          dayMap[d] = { users: 0, listings: 0, orders: 0 };
          lblMap[d] = format(subDays(new Date(), i), 'd MMM', { locale: fr });
        }
        recentProfiles?.forEach(p => { const d = p.created_at.split('T')[0]; if (dayMap[d]) dayMap[d].users++; });
        recentListings?.forEach(l => { const d = l.created_at.split('T')[0]; if (dayMap[d]) dayMap[d].listings++; });
        recentTx?.forEach(t => { const d = t.created_at.split('T')[0]; if (dayMap[d]) dayMap[d].orders++; });
        const keys = Object.keys(dayMap);
        setChartData({
          labels: keys.map(k => lblMap[k]),
          series: [
            { label: 'Utilisateurs', color: '#005023', data: keys.map(k => dayMap[k].users) },
            { label: 'Annonces',     color: '#3b82f6', data: keys.map(k => dayMap[k].listings) },
            { label: 'Commandes',    color: '#f59e0b', data: keys.map(k => dayMap[k].orders) },
          ],
        });

        /* ── User distribution ── */
        const sellers = (allProfiles || []).filter(p => p.is_seller).length;
        const buyers  = (allProfiles || []).length - sellers;
        const totalU  = allProfiles?.length || 1;
        setUserDist([
          { label: 'Acheteurs', value: buyers,  pct: Math.round(buyers / totalU * 100),  color: '#005023' },
          { label: 'Vendeurs',  value: sellers, pct: Math.round(sellers / totalU * 100), color: '#3b82f6' },
        ]);

        /* ── Order distribution ── */
        const orderMap = {};
        const orderCfg = {
          fonds_liberes:  { label: 'Livrées',    color: '#005023' },
          fonds_bloques:  { label: 'En cours',   color: '#f59e0b' },
          confirme:       { label: 'Confirmées', color: '#3b82f6' },
          cod_en_attente: { label: 'En attente', color: '#8b5cf6' },
          rembourse:      { label: 'Remboursés', color: '#6b7280' },
          cod_annule:     { label: 'Annulées',   color: '#ef4444' },
        };
        (txAll || []).forEach(t => { orderMap[t.statut] = (orderMap[t.statut] || 0) + 1; });
        const totalO = (txAll || []).length || 1;
        const orderSegments = Object.entries(orderMap)
          .filter(([k]) => orderCfg[k])
          .map(([k, v]) => ({ label: orderCfg[k].label, value: v, pct: Math.round(v / totalO * 100), color: orderCfg[k].color }))
          .sort((a, b) => b.value - a.value);
        setOrderDist(orderSegments);

        /* ── Top categories ── */
        const catMap = {};
        (listingsAll || []).forEach(l => { if (l.category) catMap[l.category] = (catMap[l.category] || 0) + 1; });
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxCat = sorted[0]?.[1] || 1;
        setTopCategories(sorted.map(([name, count]) => ({ name, count, pct: Math.round(count / maxCat * 100) })));

        /* ── Recent activities ── */
        const [
          { data: newUsers },
          { data: newListings },
          { data: newOrders },
          { data: newReports },
        ] = await Promise.all([
          supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('listings').select('id, title, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('transactions_escrow').select('id, statut, created_at, annonce:annonce_id(title)').order('created_at', { ascending: false }).limit(2),
          supabase.from('reports').select('id, created_at, listing:listing_id(title)').order('created_at', { ascending: false }).limit(1).maybeSingle().then(r => ({ data: r.data ? [r.data] : [] })),
        ]);

        const feed = [
          ...(newUsers || []).map(u => ({ type: 'user',    label: 'Nouvel utilisateur inscrit',  sub: `${u.full_name || 'Utilisateur'} a rejoint la plateforme`, time: u.created_at, icon: Users,       color: 'bg-blue-100 text-blue-600' })),
          ...(newListings || []).map(l => ({ type: 'listing', label: 'Nouvelle annonce publiée', sub: `"${l.title}" publiée`, time: l.created_at, icon: ShoppingBag, color: 'bg-green-100 text-green-600' })),
          ...(newOrders || []).map(o => ({ type: 'order',   label: 'Nouvelle commande',          sub: `Commande #ZND-${o.id.slice(-5).toUpperCase()} — ${o.annonce?.title || ''}`, time: o.created_at, icon: Package, color: 'bg-amber-100 text-amber-600' })),
          ...(newReports || []).map(r => ({ type: 'report', label: 'Signalement reçu',           sub: `Signalement sur l'annonce ${r.listing?.title || ''}`, time: r.created_at, icon: Flag, color: 'bg-red-100 text-red-600' })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        setActivities(feed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingExtra(false);
      }
    };
    fetchOverview();
  }, [period]);

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `Il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Il y a ${h} h`;
    return `Il y a ${Math.floor(h / 24)} j`;
  };

  const pctDisplay = (v) => {
    if (v == null) return null;
    if (v > 0) return { icon: TrendingUp,   cls: 'text-emerald-600', label: `+${v}%` };
    if (v < 0) return { icon: TrendingDown,  cls: 'text-red-500',    label: `${v}%` };
    return { icon: Minus, cls: 'text-gray-400', label: '0%' };
  };

  const KPI = [
    { label: 'Utilisateurs',      sub: 'Total inscrits',           value: counts.total_users,     pctKey: 'users',    icon: Users,       bg: 'bg-blue-50',    ic: 'text-blue-500',    section: 'users' },
    { label: 'Annonces actives',  sub: 'Total annonces',           value: counts.total_listings,  pctKey: 'listings', icon: ShoppingBag, bg: 'bg-emerald-50', ic: 'text-emerald-500', section: 'listings' },
    { label: 'Nouveaux ce mois',  sub: format(new Date(), 'MMMM yyyy', { locale: fr }), value: newUsersMonth, pctKey: 'newUsers', icon: UserPlus, bg: 'bg-violet-50', ic: 'text-violet-500', section: 'users' },
    { label: 'Signalements',      sub: 'En attente',               value: counts.pending_reports, pctKey: null,       icon: Flag,        bg: 'bg-red-50',     ic: 'text-red-400',     section: 'reports' },
  ];

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-black text-gray-900">Bonjour, {firstName} 👋</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Voici un aperçu des activités sur Zando+ aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 h-9 text-[12px] font-semibold text-gray-600 bg-white">
            {format(new Date(), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, sub, value, pctKey, icon: Icon, bg, ic, section }) => {
          const ch = pctDisplay(weekChanges[pctKey]);
          const ChIcon = ch?.icon;
          return (
            <button key={label} onClick={() => setActiveTab(section)}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                {ch && <div className={`flex items-center gap-1 text-[11px] font-bold ${ch.cls}`}>
                  <ChIcon className="w-3 h-3" />{ch.label}
                </div>}
              </div>
              <p className="text-[28px] font-black text-gray-900 leading-none">{loading ? '—' : (value ?? 0).toLocaleString('fr-FR')}</p>
              <p className="text-[12px] font-semibold text-gray-700 mt-1">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
              {ch && <p className={`text-[11px] font-semibold mt-2 ${ch.cls}`}>
                {ch.label} vs la semaine dernière
              </p>}
            </button>
          );
        })}
      </div>

      {/* Chart + Activités récentes */}
      <div className="grid grid-cols-12 gap-4">

        {/* Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-black text-gray-900">Aperçu des activités</h3>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="h-8 px-3 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-600 focus:outline-none focus:border-custom-green-500">
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {chartData.series.map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-gray-500 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
          {loadingExtra ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MultiLineChart series={chartData.series} labels={chartData.labels} />
          )}
        </div>

        {/* Activités récentes */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-black text-gray-900">Activités récentes</h3>
          </div>
          {loadingExtra ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-900 leading-tight">{a.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{a.sub}</p>
                    </div>
                    <p className="text-[11px] text-gray-300 flex-shrink-0 whitespace-nowrap">{timeAgo(a.time)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chiffre d'affaires + Top vendeurs */}
      <div className="grid grid-cols-12 gap-4">

        {/* CA */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-custom-green-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-custom-green-600" />
              </div>
              <h3 className="text-[14px] font-black text-gray-900">Chiffre d'affaires</h3>
            </div>
            <span className="text-[11px] text-gray-400 font-medium capitalize">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </span>
          </div>

          {loadingExtra ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* CA total */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">CA total ce mois</p>
                  <p className="text-[22px] font-black text-gray-900 leading-none tabular-nums">
                    {(revenueData.ca_mois || 0).toLocaleString('fr-FR')}
                    <span className="text-[12px] font-semibold text-gray-400 ml-1">FCFA</span>
                  </p>
                  {revenueData.ca_prev > 0 ? (
                    <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-bold ${revenueData.ca_mois >= revenueData.ca_prev ? 'text-emerald-600' : 'text-red-500'}`}>
                      {revenueData.ca_mois >= revenueData.ca_prev ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {revenueData.ca_mois >= revenueData.ca_prev ? '+' : ''}{Math.round((revenueData.ca_mois - revenueData.ca_prev) / revenueData.ca_prev * 100)}% vs mois dernier
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-300 mt-1">Premier mois de données</p>
                  )}
                </div>

                {/* Commissions Zando */}
                <div className="bg-custom-green-50 rounded-xl p-3.5">
                  <p className="text-[10px] text-custom-green-600 font-bold uppercase tracking-wider mb-1">Commissions Zando (7%)</p>
                  <p className="text-[22px] font-black text-custom-green-900 leading-none tabular-nums">
                    {(revenueData.zando_mois || 0).toLocaleString('fr-FR')}
                    <span className="text-[12px] font-semibold text-custom-green-500 ml-1">FCFA</span>
                  </p>
                  {revenueData.zando_prev > 0 ? (
                    <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-bold ${revenueData.zando_mois >= revenueData.zando_prev ? 'text-custom-green-700' : 'text-red-500'}`}>
                      {revenueData.zando_mois >= revenueData.zando_prev ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {revenueData.zando_mois >= revenueData.zando_prev ? '+' : ''}{Math.round((revenueData.zando_mois - revenueData.zando_prev) / revenueData.zando_prev * 100)}% vs mois dernier
                    </div>
                  ) : (
                    <p className="text-[10px] text-custom-green-300 mt-1">Premier mois de données</p>
                  )}
                </div>
              </div>

              {/* Bar chart 6 mois */}
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Commissions — 6 derniers mois</p>
                <BarChart bars={monthBars.map(b => ({ label: b.label, value: b.zando }))} />
              </div>
            </>
          )}
        </div>

        {/* Top vendeurs */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-[14px] font-black text-gray-900">Top vendeurs ce mois</h3>
            </div>
            <button onClick={() => setActiveTab('users')} className="text-[11px] text-custom-green-500 font-bold hover:underline">Voir tous →</button>
          </div>

          {loadingExtra ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          ) : topVendeurs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-gray-400">Aucune vente confirmée ce mois</p>
              <p className="text-[11px] text-gray-300 mt-1">Les ventes apparaîtront ici une fois confirmées</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {topVendeurs.map((v, i) => {
                const medals = ['🥇', '🥈', '🥉', '4', '5'];
                const colors = ['#f59e0b', '#6b7280', '#a16207', '#005023', '#005023'];
                const maxV = topVendeurs[0].montant || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 text-center flex-shrink-0 font-black ${i < 3 ? 'text-[16px]' : 'text-[11px] text-gray-400'}`}>
                      {medals[i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold text-gray-800 truncate">{v.name}</span>
                        <span className="text-[11px] font-black text-gray-900 tabular-nums flex-shrink-0 ml-2">
                          {(v.montant || 0).toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.round(v.montant / maxV * 100)}%`, backgroundColor: colors[i] }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{v.count} vente{v.count > 1 ? 's' : ''} — {Math.round(v.montant / maxV * 100)}% du top</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Donuts + Top catégories */}
      <div className="grid grid-cols-12 gap-4">

        {/* Répartition utilisateurs */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-[14px] font-black text-gray-900 mb-4">Répartition des utilisateurs</h3>
          {loadingExtra ? (
            <div className="h-[140px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart segments={userDist} size={110} thickness={14} />
              <div className="flex-1 space-y-2.5">
                {userDist.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[12px] font-semibold text-gray-700">{s.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-gray-900">{s.pct}%</span>
                      <span className="text-[10px] text-gray-400 ml-1">({s.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statut des commandes */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-[14px] font-black text-gray-900 mb-4">Statut des commandes</h3>
          {loadingExtra ? (
            <div className="h-[140px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : orderDist.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">Aucune commande</p>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart segments={orderDist} size={110} thickness={14} />
              <div className="flex-1 space-y-2">
                {orderDist.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] font-semibold text-gray-700">{s.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-black text-gray-900">{s.pct}%</span>
                      <span className="text-[10px] text-gray-400 ml-1">({s.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top catégories */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-black text-gray-900">Top catégories</h3>
            <button onClick={() => setActiveTab('categories')} className="text-[11px] text-custom-green-500 font-bold hover:underline">Voir tout</button>
          </div>
          {loadingExtra ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-6 bg-gray-100 rounded" />)}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">Aucune catégorie</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(({ name, count, pct }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-gray-700 truncate">{name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{count} annonces</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-custom-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security banner */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-5">
        <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Shield className="w-7 h-7 text-custom-green-500" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-black text-gray-900">Plateforme sécurisée</p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Zando+ utilise des systèmes avancés pour protéger les données et garantir la sécurité de tous les utilisateurs.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="flex-shrink-0 flex items-center gap-2 h-10 px-5 bg-custom-green-500 text-white text-[12px] font-bold rounded-xl hover:bg-custom-green-600 transition-colors whitespace-nowrap"
        >
          Voir les paramètres de sécurité <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

/* ─── Sidebar blanche ───────────────────────────────────────── */
const SidebarNav = ({ activeTab, setActiveTab, isAdmin, userRole, user, counts, onNavigate, signOut }) => {
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const role = ROLE_LABELS[userRole] || 'Lecteur';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = user?.user_metadata?.avatar_url;

  const go = (id) => { setActiveTab(id); onNavigate?.(); };

  return (
    <nav className="flex flex-col h-full select-none bg-white border-r border-gray-100">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-black text-custom-green-500 leading-none">Zando</span>
          <span className="text-[22px] font-black text-accent-yellow leading-none">+</span>
        </div>
      </div>

      {/* Overview */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => go('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
            activeTab === 'overview'
              ? 'bg-custom-green-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="text-[13px] font-bold flex-1">Vue d'ensemble</span>
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-1 px-3 scrollbar-thin scrollbar-thumb-gray-200">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(i => canAccessTab(i.id, userRole, isAdmin) && (!i.adminOnly || isAdmin));
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1.5">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-custom-green-500 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px] font-semibold flex-1">{item.label}</span>
                    {showBadge && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeAlert
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-500'
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
      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-custom-green-500 flex items-center justify-center flex-shrink-0 shadow-sm relative">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-[12px] font-black">{initials}</span>}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">{name}</p>
            <p className="text-[11px] text-gray-400">{role}</p>
          </div>
        </div>
        <button
          onClick={() => { signOut?.(); navigate('/'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-[12px] font-semibold"
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
  const [counts, setCounts] = useState({
    total_users: 0, total_listings: 0, pending_reports: 0,
    pending_escrow: 0, pending_withdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { userRole, isAdmin, user, logout } = useAuth();

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
        setCounts({
          total_users:         data.total_users,
          total_listings:      data.total_listings,
          pending_reports:     data.pending_reports,
          pending_escrow:      escrowRes.count || 0,
          pending_withdrawals: withdrawalRes.count || 0,
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
  const sidebarProps = { activeTab, setActiveTab, isAdmin, userRole, user, counts, signOut: logout };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-page-bg">
      <Helmet><title>Administration — Zando+ Congo</title></Helmet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 sticky top-16 md:top-[7.75rem] h-[calc(100vh-4rem)] md:h-[calc(100vh-7.75rem)] overflow-hidden">
        <SidebarNav {...sidebarProps} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[220px] z-50 lg:hidden shadow-2xl flex flex-col">
              <button onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10">
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
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <Menu className="w-5 h-5" />
          </button>

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
            {totalAlerts > 0 && (
              <button
                onClick={() => setActiveTab(counts.pending_reports > 0 ? 'reports' : counts.pending_escrow > 0 ? 'escrow' : 'withdrawals')}
                className="relative p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              </button>
            )}
            <button onClick={() => fetchStats(true)} disabled={refreshing}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <span className={`hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              userRole === 'admin'        ? 'bg-red-50 text-red-600 border-red-200'
              : userRole === 'monetisation' ? 'bg-amber-50 text-amber-700 border-amber-200'
              : userRole === 'gestion'    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : userRole === 'editor'     ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {ROLE_LABELS[userRole] || 'Lecteur'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}>
              {activeTab === 'overview'
                ? <OverviewTab counts={counts} loading={loading} setActiveTab={setActiveTab} />
                : renderTabContent(activeTab, userRole, isAdmin)}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
