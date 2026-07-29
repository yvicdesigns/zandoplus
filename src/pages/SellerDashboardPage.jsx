import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet-async';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Store, Package, ShoppingBag, RotateCcw,
  Star, Megaphone, Tag, Radio, BarChart2, User, CreditCard,
  MapPin, Settings, HelpCircle, ChevronRight, BadgeCheck,
  Truck, Clock, Shield, ExternalLink, Plus, Loader2, Users,
  TrendingUp, ArrowUpRight, MessageSquare, Lock, Check, X,
} from 'lucide-react';
import AddressesTab from '@/components/profile/AddressesTab';
import SellerOrdersInline from '@/components/seller/SellerOrdersInline';
import SellerListingsInline from '@/components/seller/SellerListingsInline';
import SellerReviewsInline from '@/components/seller/SellerReviewsInline';

/* ─── Statuts ──────────────────────────────────────────────── */
const STATUS_CFG = {
  fonds_liberes:   { label: 'Livrée',    cls: 'bg-emerald-100 text-emerald-700' },
  fonds_bloques:   { label: 'En cours',  cls: 'bg-orange-100 text-orange-700'  },
  confirme:        { label: 'Confirmée', cls: 'bg-blue-100 text-blue-700'      },
  cod_en_attente:  { label: 'En attente',cls: 'bg-sky-100 text-sky-700'        },
  litige:          { label: 'Litige',    cls: 'bg-red-100 text-red-700'        },
  rembourse:       { label: 'Remboursé', cls: 'bg-gray-100 text-gray-600'      },
  cod_annule:      { label: 'Annulée',   cls: 'bg-gray-100 text-gray-600'      },
};

/* ─── Chart SVG simple ──────────────────────────────────────── */
const LineChart = ({ data }) => {
  const W = 600, H = 160, PAD = 20;
  const max = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - d.count) / max) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const area = `M${pts[0]} L${pts.join(' L')} L${PAD + (W - PAD * 2)},${H - PAD} L${PAD},${H - PAD} Z`;
  const line = `M${pts.join(' L')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#005023" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#005023" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <path d={line} fill="none" stroke="#005023" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => d.count > 0 && (
        <circle key={i}
          cx={PAD + (i / (data.length - 1)) * (W - PAD * 2)}
          cy={PAD + ((max - d.count) / max) * (H - PAD * 2)}
          r="3.5" fill="#005023" />
      ))}
    </svg>
  );
};

/* ─── Champ éditable ────────────────────────────────────────── */
const EditableRow = ({ label, value, type = 'text', options, onSave, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-500 w-40 flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          {options ? (
            <select value={val} onChange={e => setVal(e.target.value)}
              className="flex-1 h-9 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500 bg-white">
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={val} onChange={e => setVal(e.target.value)} autoFocus
              placeholder={placeholder}
              className="flex-1 h-9 border border-gray-200 rounded-lg px-3 text-[13px] focus:outline-none focus:border-custom-green-500" />
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-8 h-8 bg-custom-green-500 text-white rounded-lg flex items-center justify-center hover:bg-custom-green-600 flex-shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setEditing(false); setVal(value || ''); }}
            className="w-8 h-8 border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="text-[13px] font-semibold text-gray-900 flex-1 px-2">{value || 'Non renseigné'}</span>
          <button onClick={() => { setEditing(true); setVal(value || ''); }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-custom-green-500 hover:bg-green-50 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

/* ─── Sidebar nav item ──────────────────────────────────────── */
const NavItem = ({ icon: Icon, label, to, onClick, active, badge, badgeLabel, locked, indent }) => {
  const base = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all w-full text-left ${indent ? 'pl-4' : ''}`;
  const cls = locked
    ? `${base} text-gray-300 cursor-not-allowed`
    : active
    ? `${base} bg-custom-green-500 text-white shadow-sm`
    : `${base} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;

  const content = (
    <>
      <Icon className={`w-4 h-4 flex-shrink-0 ${locked ? 'opacity-40' : ''}`} />
      <span className="flex-1 truncate">{label}</span>
      {locked && <Lock className="w-3 h-3 opacity-30" />}
      {badge != null && !locked && (
        <span className="min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
      )}
      {badgeLabel && !locked && (
        <span className="text-[9px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">{badgeLabel}</span>
      )}
    </>
  );

  if (locked) return <div className={cls}>{content}</div>;
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  return <button className={cls} onClick={onClick}>{content}</button>;
};

/* ─── Page principale ──────────────────────────────────────── */
const SellerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [profile, setProfile]       = useState(null);
  const [stats, setStats]           = useState({ listings: 0, orders: 0, revenue: 0, satisfaction: null, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [period, setPeriod]         = useState('30');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    const daysAgo = subDays(new Date(), parseInt(period)).toISOString();

    const [
      { count: listCount },
      { data: txAll },
      { data: revData },
    ] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
      supabase.from('transactions_escrow')
        .select('id, statut, montant, created_at, annonce:annonce_id(id, title, images, price)')
        .eq('vendeur_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('reviews').select('rating').eq('seller_id', user.id),
    ]);

    const allTx = txAll || [];
    const completed = allTx.filter(t => t.statut === 'fonds_liberes');
    const pending   = allTx.filter(t => ['fonds_bloques', 'confirme', 'cod_en_attente'].includes(t.statut));
    const revenue   = completed.reduce((s, t) => s + (t.montant || 0), 0);
    const revs      = revData || [];
    const satisfaction = revs.length ? Math.round(revs.filter(r => r.rating >= 4).length / revs.length * 100) : null;

    setStats({ listings: listCount || 0, orders: completed.length, revenue, satisfaction, pending: pending.length });
    setRecentOrders(allTx.slice(0, 5));

    const days = parseInt(period);
    const grouped = {};
    for (let i = days - 1; i >= 0; i--) {
      grouped[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0;
    }
    allTx.filter(t => t.created_at >= daysAgo).forEach(t => {
      const d = t.created_at.split('T')[0];
      if (grouped[d] !== undefined) grouped[d]++;
    });
    setChartData(Object.entries(grouped).map(([date, count]) => ({ date, count })));

    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const updateField = async (field, value) => {
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setProfile(prev => ({ ...prev, [field]: value }));
    toast({ title: 'Mis à jour !', className: 'bg-custom-green-500 text-white' });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  const sellerSlug = profile?.shop_slug || profile?.id;
  const memberSince = profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy', { locale: fr }) : '';
  const memberLabel = memberSince ? `Vendeur depuis ${memberSince}` : '';

  const TRUST = [
    { icon: BadgeCheck, title: 'Boutique vérifiée',   sub: 'Authenticité garantie'    },
    { icon: Truck,      title: 'Livraison rapide',     sub: '2 à 3 jours ouvrés'      },
    { icon: MessageSquare, title: 'Réponse rapide',   sub: 'Moins de 24h'            },
    { icon: Shield,     title: 'Paiement sécurisé',   sub: 'Transactions protégées'   },
  ];

  /* ── renderContent par section ── */
  const renderContent = () => {
    if (activeSection === 'produits') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SellerListingsInline />
      </div>
    );

    if (activeSection === 'commandes') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SellerOrdersInline />
      </div>
    );

    if (activeSection === 'avis') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SellerReviewsInline />
      </div>
    );

    if (activeSection === 'informations') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-[17px] font-black text-gray-900 mb-4">Informations personnelles</h2>
        <div className="divide-y divide-gray-100">
          <EditableRow label="Nom complet"          value={profile?.full_name}       onSave={v => updateField('full_name', v)} />
          <EditableRow label="Email"                value={user?.email}              onSave={() => toast({ title: 'Contactez le support pour changer votre email.' })} />
          <EditableRow label="Téléphone"            value={profile?.phone}           onSave={v => updateField('phone', v)} />
          <EditableRow label="Numéro WhatsApp"      value={profile?.whatsapp_number} onSave={v => updateField('whatsapp_number', v)} placeholder="+242 06 000 0000" />
          <EditableRow label="Bio / Description"    value={profile?.bio}             onSave={v => updateField('bio', v)} />
          <EditableRow label="Pays / Ville"         value={profile?.location}        onSave={v => updateField('location', v)} />
        </div>
      </div>
    );

    if (activeSection === 'adresses') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-[17px] font-black text-gray-900 mb-6">Mes adresses</h2>
        <AddressesTab />
      </div>
    );

    if (activeSection === 'paiement') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-[16px] font-black text-gray-900">Moyens de paiement</p>
        <p className="text-[13px] text-gray-400 text-center max-w-xs">
          La gestion de vos moyens de paiement sera bientôt disponible sur Zando+.
        </p>
        <span className="text-[11px] font-bold text-gray-300 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Lock className="w-3 h-3" /> Bientôt disponible
        </span>
      </div>
    );

    if (activeSection === 'parametres') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[17px] font-black text-gray-900">Paramètres du compte</h2>
        <div className="divide-y divide-gray-100">
          {[
            { label: 'Mot de passe',                     value: '••••••••',         btnLabel: 'Modifier'  },
            { label: 'Authentification à deux facteurs', valueEl: <span className="text-[13px] text-orange-500 font-medium">Désactivée</span>, btnLabel: 'Activer' },
            { label: 'Sessions actives',                 value: '1 session active', btnLabel: 'Voir'      },
          ].map(({ label, value, valueEl, btnLabel }) => (
            <div key={label} className="flex items-center justify-between py-4">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                {valueEl || (value && <p className="text-[12px] text-gray-400 mt-0.5">{value}</p>)}
              </div>
              <button className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                {btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    );

    /* ── Dashboard (vue par défaut) ── */
    return (
      <div className="space-y-5">
        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden bg-[#0d1f12]">
          <div className="relative p-6 min-h-[200px] flex items-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 bg-custom-green-500 opacity-10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
              <div className="absolute bottom-0 right-32 w-56 h-56 bg-green-400 opacity-10 rounded-full blur-2xl translate-y-1/4" />
            </div>
            <div className="absolute right-6 top-6 bottom-6 w-[42%] hidden lg:grid grid-cols-2 gap-2 opacity-50">
              {recentOrders.slice(0, 4).map((o, i) => o.annonce?.images?.[0] && (
                <div key={i} className={`rounded-xl overflow-hidden ${i === 0 ? 'row-span-2' : ''}`}>
                  <img src={o.annonce.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-custom-green-500">
                    {(profile?.full_name || 'V').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-white text-xl font-black">{profile?.full_name || 'Votre boutique'}</h1>
                  {profile?.verified && <BadgeCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                </div>
                <p className="text-green-300 text-[12px] font-semibold mb-3">
                  {profile?.verified ? 'Boutique officielle' : 'Vendeur particulier'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[12px]">
                  {memberLabel && (
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock className="w-3.5 h-3.5" /><span>{memberLabel}</span>
                    </div>
                  )}
                  {stats.satisfaction != null && (
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="text-white font-semibold">{stats.satisfaction}%</span>
                      <span className="text-gray-400">satisfaction</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Users className="w-3.5 h-3.5" /><span>Abonnés bientôt</span>
                  </div>
                </div>
              </div>
            </div>
            {sellerSlug && (
              <Link to={`/seller/${sellerSlug}`}
                className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold px-4 py-2 rounded-xl border border-white/20 transition-colors backdrop-blur-sm">
                Voir ma boutique <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="bg-white grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {TRUST.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-2.5 px-5 py-3.5">
                <Icon className="w-5 h-5 text-custom-green-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">{title}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats 4 cartes */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Package,    value: stats.listings.toLocaleString('fr-FR'), label: 'Produits en ligne',   section: 'produits',  linkLabel: 'Voir mes produits',    locked: false },
            { icon: ShoppingBag,value: stats.orders.toLocaleString('fr-FR'),   label: 'Commandes réussies',  section: 'commandes', linkLabel: 'Voir les commandes',   locked: false },
            { icon: TrendingUp, value: stats.revenue > 0 ? `${stats.revenue.toLocaleString('fr-FR')} FCFA` : '—', label: 'Ventes totales', section: null, linkLabel: 'Bientôt disponible', locked: stats.revenue === 0 },
            { icon: Star,       value: stats.satisfaction != null ? `${stats.satisfaction}%` : '—', label: 'Taux de satisfaction', section: 'avis', linkLabel: 'Voir les avis', locked: stats.satisfaction == null },
          ].map(({ icon: Icon, value, label, section, linkLabel, locked }) => (
            <div key={label} className={`bg-white rounded-2xl border border-gray-100 p-5 ${locked ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-custom-green-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
              <p className="text-[11px] text-gray-400 mb-3">{label}</p>
              {locked ? (
                <p className="text-[11px] text-gray-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bientôt disponible
                </p>
              ) : section ? (
                <button onClick={() => setActiveSection(section)} className="text-[11px] text-custom-green-500 font-semibold flex items-center gap-1 hover:underline">
                  {linkLabel} <ArrowUpRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-[11px] text-gray-300">{linkLabel}</span>
              )}
            </div>
          ))}
        </div>

        {/* Performances + Commandes récentes */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-black text-gray-900">
                Performances
                <span className="text-gray-400 font-normal text-[12px] ml-2">({period} derniers jours)</span>
              </h3>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="h-8 px-3 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-600 focus:outline-none focus:border-custom-green-500"
              >
                <option value="7">7 jours</option>
                <option value="30">30 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Vues boutique',    value: '—',                              locked: true  },
                { label: 'Visites produits', value: '—',                              locked: true  },
                { label: 'Commandes',        value: recentOrders.length.toString(),   locked: false },
                { label: 'Taux conversion',  value: '—',                              locked: true  },
              ].map(({ label, value, locked }) => (
                <div key={label} className={locked ? 'opacity-40' : ''}>
                  <p className="text-[18px] font-black text-gray-900">{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  {!locked && <p className="text-[10px] text-emerald-500 font-semibold">données réelles</p>}
                  {locked  && <p className="text-[10px] text-gray-300 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> bientôt</p>}
                </div>
              ))}
            </div>
            <div className="h-[140px]">
              {chartData.some(d => d.count > 0) ? (
                <LineChart data={chartData} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <BarChart2 className="w-10 h-10 mb-2" />
                  <p className="text-[12px]">Aucune donnée sur cette période</p>
                </div>
              )}
            </div>
            {chartData.length > 0 && (
              <div className="flex justify-between mt-1">
                {[0, Math.floor(chartData.length / 2), chartData.length - 1].map(i => (
                  <span key={i} className="text-[10px] text-gray-300">
                    {format(new Date(chartData[i]?.date || new Date()), 'd MMM', { locale: fr })}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-5 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-black text-gray-900">Commandes récentes</h3>
              <button onClick={() => setActiveSection('commandes')} className="text-[11px] text-custom-green-500 font-semibold flex items-center gap-1 hover:underline">
                Voir toutes <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map(o => {
                  const cfg = STATUS_CFG[o.statut] || { label: o.statut, cls: 'bg-gray-100 text-gray-600' };
                  const shortId = o.id?.slice(-5).toUpperCase();
                  return (
                    <div key={o.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {o.annonce?.images?.[0] ? (
                          <img src={o.annonce.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 m-2.5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{o.annonce?.title || 'Produit'}</p>
                        <p className="text-[10px] text-gray-400">Commande #ZND-{shortId}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5 ${cfg.cls}`}>{cfg.label}</span>
                        <p className="text-[11px] font-black text-gray-900">{(o.montant || 0).toLocaleString('fr-FR')} FCFA</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-300">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[12px]">Aucune commande pour l'instant</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div>
          <h3 className="text-[15px] font-black text-gray-900 mb-3">Actions rapides</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: Plus,        title: 'Ajouter un produit',    sub: 'Publier un nouveau produit',  onClick: () => navigate('/post-ad'),          locked: false },
              { icon: Package,     title: 'Gérer les produits',    sub: 'Modifier vos produits',       onClick: () => setActiveSection('produits'),  locked: false },
              { icon: ShoppingBag, title: 'Voir les commandes',    sub: 'Gérer vos commandes',         onClick: () => setActiveSection('commandes'), locked: false },
              { icon: Megaphone,   title: 'Promouvoir ma boutique',sub: 'Augmenter votre visibilité',  onClick: null,                                locked: true  },
              { icon: BarChart2,   title: 'Voir les statistiques', sub: 'Analyser vos performances',   onClick: null,                                locked: true  },
            ].map(({ icon: Icon, title, sub, onClick, locked }) => (
              locked ? (
                <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-start gap-2 opacity-50 cursor-not-allowed">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-600">{title}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                    <p className="text-[10px] text-gray-300 flex items-center gap-0.5 mt-0.5"><Lock className="w-2.5 h-2.5" /> Bientôt</p>
                  </div>
                </div>
              ) : (
                <button key={title} onClick={onClick}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-start gap-2 hover:shadow-md hover:border-custom-green-200 transition-all group text-left">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-custom-green-500 transition-colors">
                    <Icon className="w-4 h-4 text-custom-green-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">{title}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </button>
              )
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="bg-gradient-to-r from-[#0d1f12] to-custom-green-500 rounded-2xl p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-[16px] font-black mb-1">Développez votre activité avec Zando+</h4>
            <p className="text-green-200 text-[12px] leading-relaxed">
              Profitez de nos outils marketing et de notre audience pour augmenter vos ventes.
            </p>
          </div>
          <button
            onClick={() => toast({ title: 'Bientôt disponible !', description: 'Nos solutions marketing arrivent prochainement.' })}
            className="flex-shrink-0 flex items-center gap-2 bg-accent-yellow text-gray-900 font-black text-[12px] px-5 py-3 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Découvrir nos solutions <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Espace vendeur — Zando+</title>
      </Helmet>

      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 py-2.5 flex items-center gap-1.5 text-[12px] text-gray-400">
          <Link to="/" className="hover:text-custom-green-500 transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/profile" className="hover:text-custom-green-500 transition-colors">Mon compte</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-semibold">Ma boutique</span>
        </div>
      </div>

      <div className="bg-page-bg min-h-screen">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">

            {/* ══ SIDEBAR ══ */}
            <aside className="col-span-3">
              {/* En-tête vendeur */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-custom-green-500 flex items-center justify-center mb-3 shadow">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-white" />
                  )}
                </div>
                <p className="text-[13px] font-black text-gray-900">Espace vendeur</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Gérez votre boutique<br/>et développez vos ventes</p>
              </div>

              {/* Nav */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-1">
                <NavItem icon={LayoutDashboard} label="Tableau de bord"
                  active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} />

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">Gestion de la boutique</p>
                <NavItem icon={Store}       label="Ma boutique"
                  to={sellerSlug ? `/seller/${sellerSlug}` : '#'} />
                <NavItem icon={Package}     label="Produits"
                  active={activeSection === 'produits'} onClick={() => setActiveSection('produits')} />
                <NavItem icon={ShoppingBag} label="Commandes"
                  active={activeSection === 'commandes'} onClick={() => setActiveSection('commandes')}
                  badge={stats.pending || undefined} />
                <NavItem icon={RotateCcw}   label="Retours & réclamations" locked />
                <NavItem icon={Star}        label="Avis clients"
                  active={activeSection === 'avis'} onClick={() => setActiveSection('avis')} />

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">Marketing & ventes</p>
                <NavItem icon={Tag}         label="Promotions"          locked />
                <NavItem icon={Megaphone}   label="Codes de réduction"  locked />
                <NavItem icon={Radio}       label="Publicités"          locked badgeLabel="Nouveau" />
                <NavItem icon={BarChart2}   label="Statistiques"        locked />

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">Mon compte</p>
                <NavItem icon={User}       label="Informations personnelles"
                  active={activeSection === 'informations'} onClick={() => setActiveSection('informations')} />
                <NavItem icon={CreditCard} label="Moyens de paiement"
                  active={activeSection === 'paiement'} onClick={() => setActiveSection('paiement')} />
                <NavItem icon={MapPin}     label="Adresses"
                  active={activeSection === 'adresses'} onClick={() => setActiveSection('adresses')} />
                <NavItem icon={Settings}   label="Paramètres du compte"
                  active={activeSection === 'parametres'} onClick={() => setActiveSection('parametres')} />
              </div>

              {/* Aide */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 mt-4 text-center">
                <HelpCircle className="w-8 h-8 text-custom-green-500 mx-auto mb-2" />
                <p className="text-[12px] font-bold text-gray-800 mb-1">Besoin d'aide ?</p>
                <p className="text-[11px] text-gray-500 mb-3">Notre équipe est disponible pour vous accompagner.</p>
                <button
                  onClick={() => navigate('/messages')}
                  className="w-full h-8 border border-custom-green-500 text-custom-green-600 rounded-xl text-[11px] font-bold hover:bg-custom-green-500 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Contacter le support
                </button>
              </div>
            </aside>

            {/* ══ MAIN ══ */}
            <main className="col-span-9">
              {renderContent()}
            </main>

          </div>
        </div>
      </div>
    </>
  );
};

export default SellerDashboardPage;
