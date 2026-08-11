import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/contexts/ListingsContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import {
  Loader2, LayoutDashboard, Package, Heart, MapPin, CreditCard,
  MessageSquare, Bell, Star, Users, Settings, ChevronRight, ChevronLeft,
  Camera, Pencil, Check, X, ShoppingBag, LogOut, Store,
  Shield, Eye, BadgeCheck,
} from 'lucide-react';
import AddressesTab from '@/components/profile/AddressesTab';
import MessagesInline from '@/components/messages/MessagesInline';
import CommandesInline from '@/components/profile/CommandesInline';
import FavorisInline from '@/components/profile/FavorisInline';
import NotificationsInline from '@/components/profile/NotificationsInline';
import AvisInline from '@/components/profile/AvisInline';
import AvatarCropDialog from '@/components/profile/AvatarCropDialog';

const fmt = (d) => {
  if (!d) return 'Non renseigné';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* ── Champ éditable inline ── */
const EditableRow = ({ label, value, type = 'text', options, onSave }) => {
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
              className="flex-1 h-11 border border-gray-200 rounded-lg px-3 text-base focus:outline-none focus:border-custom-green-500 bg-white">
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={val} onChange={e => setVal(e.target.value)} autoFocus
              className="flex-1 h-11 border border-gray-200 rounded-lg px-3 text-base focus:outline-none focus:border-custom-green-500" />
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
          <span className="text-[13px] font-semibold text-gray-900 flex-1 px-2">
            {type === 'date' ? fmt(value) : (value || 'Non renseigné')}
          </span>
          <button onClick={() => { setEditing(true); setVal(value || ''); }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-custom-green-500 hover:bg-green-50 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════ */
const ProfilePage = () => {
  const { user, updateUser, isLoading: authLoading, signOut } = useAuth();
  const { favorites } = useListings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({ commandes: 0, avis: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropFile, setCropFile] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [{ count: commandes }, { count: avis }] = await Promise.all([
        supabase.from('transactions_escrow').select('id', { count: 'exact', head: true }).eq('acheteur_id', user.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', user.id),
      ]);
      setStats({ commandes: commandes || 0, avis: avis || 0 });
    };
    fetchStats();
  }, [user]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = null;
  };

  const handleAvatarSave = async (blob) => {
    setCropFile(null);
    setIsUploadingAvatar(true);
    try {
      const path = `${user.id}/profile/${uuidv4()}.webp`;
      const { error: upErr } = await supabase.storage.from('profile_assets').upload(path, blob, { contentType: 'image/webp' });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('profile_assets').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (typeof updateUser === 'function') await updateUser();
      toast({ title: 'Photo mise à jour', className: 'bg-custom-green-500 text-white' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const updateField = async (field, value) => {
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    if (typeof updateUser === 'function') await updateUser();
    toast({ title: 'Mis à jour !', className: 'bg-custom-green-500 text-white' });
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  const NAV = [
    { id: 'dashboard',     label: 'Tableau de bord',         icon: LayoutDashboard },
    { id: 'commandes',     label: 'Mes commandes',            icon: Package        },
    { id: 'favoris',       label: 'Mes favoris',              icon: Heart          },
    { id: 'adresses',      label: 'Mes adresses',             icon: MapPin         },
    { id: 'paiement',      label: 'Mes moyens de paiement',   icon: CreditCard,    disabled: true },
    { id: 'messages',      label: 'Messages',                 icon: MessageSquare  },
    { id: 'notifications', label: 'Notifications',            icon: Bell           },
    { id: 'avis',          label: 'Mes avis',                 icon: Star           },
    { id: 'parrainage',    label: 'Parrainage',               icon: Users,          disabled: true },
    { id: 'parametres',    label: 'Paramètres du compte',     icon: Settings        },
  ];

  const handleNav = (item) => {
    if (item.disabled) { toast({ title: 'Bientôt disponible' }); return; }
    if (item.action) { item.action(); return; }
    setActiveSection(item.id);
  };

  /* ── Contenu principal selon section active ── */
  const renderMain = () => {
    if (activeSection === 'messages') return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        <MessagesInline />
      </div>
    );

    if (activeSection === 'commandes') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <CommandesInline />
      </div>
    );

    if (activeSection === 'favoris') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <FavorisInline />
      </div>
    );

    if (activeSection === 'notifications') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <NotificationsInline />
      </div>
    );

    if (activeSection === 'avis') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <AvisInline />
      </div>
    );

    if (activeSection === 'adresses') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-[17px] font-black text-gray-900 mb-6">Mes adresses</h2>
        <AddressesTab />
      </div>
    );

    if (activeSection === 'parametres') return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[17px] font-black text-gray-900">Paramètres du compte</h2>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Mot de passe</p>
              <p className="text-[12px] text-gray-400">Dernière modification il y a plus de 30 jours</p>
            </div>
            <button className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              Modifier
            </button>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Authentification à deux facteurs</p>
              <p className="text-[12px] text-orange-500 font-medium">Désactivée</p>
            </div>
            <button className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              Activer
            </button>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Sessions actives</p>
              <p className="text-[12px] text-gray-400">1 session active</p>
            </div>
            <button className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              Voir
            </button>
          </div>
        </div>
      </div>
    );

    /* ── Dashboard (vue principale) ── */
    return (
      <div className="space-y-5">

        {/* Mon profil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-[17px] font-black text-gray-900">Mon profil</h2>
            <button
              onClick={() => setActiveSection('parametres')}
              className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Modifier le profil
            </button>
          </div>

          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-custom-green-100 text-custom-green-600 text-[28px] font-black">
                    {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-custom-green-500 rounded-full flex items-center justify-center shadow border-2 border-white hover:bg-custom-green-600 transition-colors"
              >
                {isUploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />
                }
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarSelect} />
            </div>

            {/* Infos */}
            <div>
              <h3 className="text-[18px] font-black text-gray-900">{user.full_name || 'Utilisateur'}</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">{user.email}</p>
              {user.phone && <p className="text-[13px] text-gray-500">{user.phone}</p>}
              <span className="inline-flex items-center gap-1 mt-2 bg-custom-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Client
              </span>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[17px] font-black text-gray-900 mb-2">Informations personnelles</h2>
          <div className="divide-y divide-gray-100">
            <EditableRow label="Nom complet"     value={user.full_name}  onSave={v => updateField('full_name', v)} />
            <EditableRow label="Email"           value={user.email}      onSave={() => toast({ title: 'Contactez le support pour changer votre email.' })} />
            <EditableRow label="Téléphone"       value={user.phone}      onSave={v => updateField('phone', v)} />
            <EditableRow label="Date de naissance" value={user.birthdate} type="date" onSave={v => updateField('birthdate', v)} />
            <EditableRow
              label="Genre" value={user.gender}
              options={[
                { value: '', label: 'Non renseigné' },
                { value: 'Homme', label: 'Homme' },
                { value: 'Femme', label: 'Femme' },
                { value: 'Autre', label: 'Autre' },
              ]}
              onSave={v => updateField('gender', v)}
            />
            <EditableRow label="Pays / Ville"   value={user.location}   onSave={v => updateField('location', v)} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: ShoppingBag, color: 'bg-green-100 text-custom-green-500', count: stats.commandes, label: 'Commandes',    section: 'commandes',     linkLabel: 'Voir mes commandes' },
            { icon: Heart,       color: 'bg-pink-100 text-pink-500',          count: favorites.size,  label: 'Favoris',      section: 'favoris',       linkLabel: 'Voir mes favoris' },
            { icon: Star,        color: 'bg-yellow-100 text-yellow-500',      count: stats.avis,      label: 'Avis laissés', section: 'avis',          linkLabel: 'Voir mes avis' },
          ].map(({ icon: Icon, color, count, label, section, linkLabel }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-[28px] font-black text-gray-900 leading-none">{count}</p>
              <p className="text-[12px] text-gray-500 mt-1 mb-3">{label}</p>
              <button onClick={() => setActiveSection(section)} className="text-[12px] text-custom-green-500 font-semibold hover:underline">
                {linkLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Espace vendeur (si déjà vendeur) */}
        {user.is_seller && (
          <div className="bg-gradient-to-r from-[#0d1f12] to-custom-green-500 rounded-2xl p-5 flex items-center gap-5">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-[14px]">Votre espace vendeur</p>
              <p className="text-green-200 text-[12px]">Gérez votre boutique, vos produits et vos commandes.</p>
            </div>
            <button
              onClick={() => navigate('/espace-vendeur')}
              className="flex-shrink-0 flex items-center gap-1.5 bg-accent-yellow text-gray-900 font-black text-[12px] px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Accéder <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Devenez vendeur */}
        {!user.is_seller && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <h3 className="text-[16px] font-black text-gray-900 mb-1">Devenez vendeur sur Zando+</h3>
                <p className="text-[13px] text-gray-500 mb-4">
                  Commencez à vendre vos produits à des milliers de clients. C'est simple, rapide et sécurisé.
                </p>
                <ul className="space-y-2 mb-5">
                  {['Créez votre boutique', 'Gérez vos produits', 'Suivez vos ventes', 'Augmentez vos revenus'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-[12px] text-gray-600">
                      <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-custom-green-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/become-seller')}
                  className="flex items-center gap-2 h-10 px-5 bg-custom-green-500 text-white rounded-xl text-[13px] font-bold hover:bg-custom-green-600 transition-colors"
                >
                  Devenir vendeur <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-shrink-0 hidden md:block">
                <div className="w-32 h-32 bg-green-50 rounded-2xl flex items-center justify-center">
                  <Store className="w-16 h-16 text-custom-green-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sécurité */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[17px] font-black text-gray-900 mb-2">Sécurité du compte</h2>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Mot de passe',                     value: '••••••••',         btnLabel: 'Modifier',  btnAction: () => {} },
              { label: 'Authentification à deux facteurs', value: null,               btnLabel: 'Activer',   valueEl: <span className="text-[13px] text-orange-500 font-medium">Désactivée</span> },
              { label: 'Sessions actives',                 value: '1 session active', btnLabel: 'Voir',      btnAction: () => {} },
            ].map(({ label, value, valueEl, btnLabel, btnAction }) => (
              <div key={label} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                  {valueEl || (value && <p className="text-[12px] text-gray-400 mt-0.5">{value}</p>)}
                </div>
                <button onClick={btnAction}
                  className="h-9 px-4 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  {btnLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Mon profil — {user.full_name || user.email} — Zando+</title>
      </Helmet>

      <div className="bg-page-bg min-h-screen">

        {/* ══════════════ MOBILE ══════════════ */}
        <div className="lg:hidden">
          {activeSection === 'dashboard' ? (
            /* ── Menu principal mobile ── */
            <div>
              {/* Header profil */}
              <div className="bg-custom-green-600 px-4 pt-6 pb-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[26px] font-black">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      }
                    </div>
                    <button onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                      {isUploadingAvatar ? <Loader2 className="w-3 h-3 text-custom-green-600 animate-spin" /> : <Camera className="w-3 h-3 text-custom-green-600" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-white font-black text-[17px] leading-tight">{user.full_name || 'Utilisateur'}</p>
                    <p className="text-white/70 text-[12px]">{user.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Client vérifié
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mx-4 -mt-5 grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: ShoppingBag, count: stats.commandes, label: 'Commandes', section: 'commandes', color: 'text-custom-green-600' },
                  { icon: Heart,       count: favorites.size,  label: 'Favoris',   section: 'favoris',   color: 'text-pink-500' },
                  { icon: Star,        count: stats.avis,      label: 'Avis',      section: 'avis',      color: 'text-yellow-500' },
                ].map(({ icon: Icon, count, label, section, color }) => (
                  <button key={label} onClick={() => setActiveSection(section)}
                    className="bg-white rounded-xl p-3 flex flex-col items-center shadow-sm border border-gray-100 active:bg-gray-50">
                    <Icon className={`w-4 h-4 ${color} mb-1`} />
                    <p className="text-[18px] font-black text-gray-900 leading-none">{count}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                  </button>
                ))}
              </div>

              {/* Espace vendeur */}
              {user.is_seller ? (
                <button onClick={() => navigate('/espace-vendeur')}
                  className="mx-4 mb-4 w-[calc(100%-2rem)] flex items-center gap-3 bg-gradient-to-r from-[#0d1f12] to-custom-green-600 rounded-xl p-4 text-left">
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-[13px]">Mon espace vendeur</p>
                    <p className="text-white/60 text-[11px]">Gérer ma boutique</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
              ) : (
                <button onClick={() => navigate('/become-seller')}
                  className="mx-4 mb-4 w-[calc(100%-2rem)] flex items-center gap-3 bg-custom-green-600 rounded-xl p-4 text-left">
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-[13px]">Devenir vendeur</p>
                    <p className="text-white/60 text-[11px]">Vendez sur Zando+</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
              )}

              {/* Navigation sections */}
              <div className="mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                {NAV.filter(i => i.id !== 'dashboard').map((item, idx, arr) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => handleNav(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''} ${item.disabled ? 'opacity-40' : ''}`}>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="flex-1 text-[13px] font-semibold text-gray-800">{item.label}</span>
                      {item.disabled
                        ? <span className="text-[9px] font-bold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded">Bientôt</span>
                        : <ChevronRight className="w-4 h-4 text-gray-300" />
                      }
                    </button>
                  );
                })}
              </div>

              {/* Déconnexion */}
              <div className="mx-4 mb-8">
                <button onClick={() => { signOut?.(); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-100 rounded-xl text-[13px] font-semibold text-red-400 active:bg-red-50">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </div>
            </div>
          ) : (
            /* ── Section active mobile ── */
            <div className="min-h-screen">
              {/* Header section */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-[60px] z-10">
                <button onClick={() => setActiveSection('dashboard')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-[15px] font-black text-gray-900">
                  {NAV.find(n => n.id === activeSection)?.label || 'Mon compte'}
                </h1>
              </div>
              <div className="p-4">
                {renderMain()}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ DESKTOP ══════════════ */}
        <div className="hidden lg:block py-8">
          <div className="max-w-[1280px] mx-auto px-6">
            <nav className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-6">
              <button onClick={() => navigate('/')} className="hover:text-custom-green-500">Accueil</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-500">Mon compte</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-800 font-medium">Mon profil</span>
            </nav>

            <div className="grid lg:grid-cols-12 gap-6 items-start">

              {/* Sidebar */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[14px] font-black text-gray-900">Mon compte</h2>
                  </div>
                  <nav className="py-2">
                    {NAV.map(item => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button key={item.id} onClick={() => handleNav(item)}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-[13px] font-medium transition-colors text-left ${
                            isActive
                              ? 'bg-green-50 text-custom-green-600 font-semibold border-r-2 border-custom-green-500'
                              : item.disabled
                                ? 'text-gray-300 cursor-default'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}>
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {item.label}
                          {item.disabled && (
                            <span className="ml-auto text-[9px] font-bold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded">Bientôt</span>
                          )}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button onClick={() => { signOut?.(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <LogOut className="w-4 h-4 flex-shrink-0" /> Se déconnecter
                      </button>
                    </div>
                  </nav>
                  <div className="m-3 bg-gradient-to-br from-custom-green-500 to-green-700 rounded-xl p-4 text-white">
                    {user.is_seller ? (
                      <>
                        <p className="text-[13px] font-black mb-1">Mon espace vendeur</p>
                        <p className="text-[11px] opacity-80 mb-3">Gérez votre boutique et suivez vos ventes.</p>
                        <button onClick={() => navigate('/espace-vendeur')}
                          className="w-full h-8 bg-white text-custom-green-600 rounded-lg text-[12px] font-bold hover:bg-green-50 transition-colors">
                          Accéder à mon espace
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] font-black mb-1">Vendez sur Zando+</p>
                        <p className="text-[11px] opacity-80 mb-3">Devenez vendeur et développez votre activité en ligne.</p>
                        <button onClick={() => navigate('/become-seller')}
                          className="w-full h-8 bg-white text-custom-green-600 rounded-lg text-[12px] font-bold hover:bg-green-50 transition-colors">
                          Devenir vendeur
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="lg:col-span-9">
                {renderMain()}
              </div>

            </div>
          </div>
        </div>

      </div>

      {cropFile && (
        <AvatarCropDialog
          file={cropFile}
          onClose={() => setCropFile(null)}
          onSave={handleAvatarSave}
        />
      )}
    </>
  );
};

export default ProfilePage;
