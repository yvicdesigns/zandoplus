import React, { useState, useEffect } from 'react';
import { Loader2, Save, Globe, Megaphone, Image, Users, Sliders } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AdminHeroTab from '@/components/admin/AdminHeroTab';
import AdminSubscribersTab from '@/components/admin/AdminSubscribersTab';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[13px] font-semibold text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ ...props }) => (
  <input
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-custom-green-500 transition-colors bg-white"
    {...props}
  />
);

/* ── Sous-onglet Apparence ── */
const ApparenceSection = () => {
  const { siteSettings, fetchSiteSettings } = useSiteSettings();
  const { toast } = useToast();
  const [form, setForm] = useState({ logo_url: '', footer_logo_url: '', site_tagline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setForm({
        logo_url:        siteSettings.logo_url        || '',
        footer_logo_url: siteSettings.footer_logo_url || '',
        site_tagline:    siteSettings.site_tagline    || '',
      });
    }
  }, [siteSettings]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').update(form).eq('id', 1);
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      fetchSiteSettings();
      toast({ title: 'Enregistré !', description: 'Apparence mise à jour.', className: 'bg-custom-green-500 text-white' });
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Field label="URL du logo (header)" hint="Affiché dans la barre de navigation en haut">
        <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
      </Field>
      <Field label="URL du logo (footer)" hint="Affiché dans le pied de page">
        <Input value={form.footer_logo_url} onChange={e => setForm(f => ({ ...f, footer_logo_url: e.target.value }))} placeholder="https://..." />
      </Field>
      <Field label="Tagline du site" hint="Sous-titre affiché sous le logo dans le header">
        <Input value={form.site_tagline} onChange={e => setForm(f => ({ ...f, site_tagline: e.target.value }))} placeholder="Plus de ventes, moins de tracas" />
      </Field>
      {(form.logo_url || form.footer_logo_url) && (
        <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
          {form.logo_url && <div><p className="text-[10px] text-gray-400 mb-1">Header</p><img src={form.logo_url} alt="logo" className="h-8 object-contain" /></div>}
          {form.footer_logo_url && <div><p className="text-[10px] text-gray-400 mb-1">Footer</p><img src={form.footer_logo_url} alt="logo footer" className="h-8 object-contain" /></div>}
        </div>
      )}
      <button onClick={save} disabled={saving} className="flex items-center gap-2 h-[40px] px-6 bg-custom-green-500 text-white text-[13px] font-bold rounded-lg hover:bg-custom-green-600 transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Enregistrer
      </button>
    </div>
  );
};

/* ── Sous-onglet Barre d'annonces ── */
const AnnouncementSection = () => {
  const { siteSettings, fetchSiteSettings } = useSiteSettings();
  const { toast } = useToast();
  const [msgs, setMsgs] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setMsgs([
        siteSettings.ann_msg1 || '🚚 Livraison rapide à Brazzaville et partout au Congo',
        siteSettings.ann_msg2 || '🔒 Paiements 100% sécurisés',
        siteSettings.ann_msg3 || '🎧 Service client à votre écoute',
      ]);
    }
  }, [siteSettings]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').update({
      ann_msg1: msgs[0],
      ann_msg2: msgs[1],
      ann_msg3: msgs[2],
    }).eq('id', 1);
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      fetchSiteSettings();
      toast({ title: 'Enregistré !', description: 'Barre d\'annonces mise à jour.', className: 'bg-custom-green-500 text-white' });
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="p-3 bg-custom-green-500 rounded-lg text-white text-[12px] mb-4">
        <p className="font-bold mb-1">Aperçu de la barre verte en haut du site :</p>
        <div className="flex items-center gap-4 opacity-90">
          {msgs.filter(Boolean).map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <Field key={i} label={`Message ${i + 1}`} hint={i === 0 ? 'Ex: 🚚 Livraison rapide...' : i === 1 ? 'Ex: 🔒 Paiements sécurisés' : 'Ex: 🎧 Service client...'}>
          <Input value={msgs[i]} onChange={e => setMsgs(m => { const n = [...m]; n[i] = e.target.value; return n; })} />
        </Field>
      ))}
      <button onClick={save} disabled={saving} className="flex items-center gap-2 h-[40px] px-6 bg-custom-green-500 text-white text-[13px] font-bold rounded-lg hover:bg-custom-green-600 transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Enregistrer
      </button>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-800">
        <p className="font-bold mb-1">⚠️ Migration SQL requise</p>
        <p className="mb-2">Pour activer l'édition des messages, exécute ce SQL dans Supabase :</p>
        <pre className="bg-white border border-amber-200 rounded p-2 text-[11px] overflow-x-auto whitespace-pre-wrap">{`ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS ann_msg1 TEXT DEFAULT '🚚 Livraison rapide à Brazzaville et partout au Congo',
  ADD COLUMN IF NOT EXISTS ann_msg2 TEXT DEFAULT '🔒 Paiements 100% sécurisés',
  ADD COLUMN IF NOT EXISTS ann_msg3 TEXT DEFAULT '🎧 Service client à votre écoute',
  ADD COLUMN IF NOT EXISTS site_tagline TEXT DEFAULT 'Plus de ventes, moins de tracas';`}</pre>
      </div>
    </div>
  );
};

/* ── Composant principal ── */
const SUBTABS = [
  { id: 'apparence',    label: 'Apparence',        icon: Sliders },
  { id: 'annonces',     label: 'Barre d\'annonces', icon: Megaphone },
  { id: 'hero',         label: 'Hero Slider',       icon: Image },
  { id: 'subscribers',  label: 'Newsletter',        icon: Users },
];

const AdminSiteTab = () => {
  const [sub, setSub] = useState('apparence');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[20px] font-black text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-custom-green-500" />
          Gestion du site
        </h2>
        <p className="text-[13px] text-gray-500 mt-1">Modifiez le contenu et l'apparence de votre site depuis ici.</p>
      </div>

      {/* Sous-navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
              sub === id
                ? 'border-custom-green-500 text-custom-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {sub === 'apparence'   && <ApparenceSection />}
      {sub === 'annonces'    && <AnnouncementSection />}
      {sub === 'hero'        && <AdminHeroTab />}
      {sub === 'subscribers' && <AdminSubscribersTab />}
    </div>
  );
};

export default AdminSiteTab;
