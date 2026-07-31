import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Pencil, Trash2, Upload, X, Eye, EyeOff,
  ExternalLink, Smartphone, Monitor, LayoutGrid, Image as ImageIcon,
  Palette, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ─── Constantes ──────────────────────────────────────────────── */
const PLACEMENTS = [
  { value: 'after_categories', label: 'Après les catégories', desc: 'Bloc visible dès le haut de page' },
  { value: 'after_listings',   label: 'Après les annonces',   desc: 'Milieu de page, fort trafic' },
];

const TARGETS = [
  { value: 'both',    label: 'Mobile + Desktop' },
  { value: 'mobile',  label: 'Mobile uniquement' },
  { value: 'desktop', label: 'Desktop uniquement' },
];

const DIMENSIONS = {
  after_categories: { mobile: '800 × 200 px',  desktop: '1200 × 180 px' },
  after_listings:   { mobile: '800 × 250 px',  desktop: '1200 × 220 px' },
};

const COLORS = ['#005023','#003518','#fbc401','#111827','#1d4ed8','#dc2626','#7c3aed','#0891b2','#ffffff'];

/* ─── Mini builder preview ────────────────────────────────────── */
const AdPreview = ({ ad }) => {
  const bg = ad.bg_image_url
    ? { backgroundImage: `url(${ad.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: ad.bg_color || '#005023' };

  return (
    <div
      className="w-full rounded-xl overflow-hidden flex items-center justify-between px-6 py-5 min-h-[90px] relative"
      style={bg}
    >
      {ad.bg_image_url && <div className="absolute inset-0 bg-black/30" />}
      <div className="relative z-10 flex-1">
        {ad.ad_title && (
          <p className="font-black text-[16px] leading-tight" style={{ color: ad.text_color || '#ffffff' }}>
            {ad.ad_title}
          </p>
        )}
        {ad.ad_subtitle && (
          <p className="text-[12px] mt-0.5 opacity-80" style={{ color: ad.text_color || '#ffffff' }}>
            {ad.ad_subtitle}
          </p>
        )}
      </div>
      {ad.btn_text && (
        <div
          className="relative z-10 ml-4 px-4 py-2 rounded-lg text-[12px] font-bold flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: ad.btn_color || '#ffffff', color: ad.btn_text_color || '#005023' }}
        >
          {ad.btn_text}
        </div>
      )}
      {ad.image_url && !ad.ad_title && (
        <img src={ad.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
    </div>
  );
};

/* ─── Formulaire création/édition ─────────────────────────────── */
const AdForm = ({ ad, onSave, onCancel }) => {
  const isEdit = !!ad?.id;
  const [mode, setMode] = useState(ad?.image_url && !ad?.ad_title ? 'image' : 'builder');
  const [form, setForm] = useState({
    title:         ad?.title         || '',
    client_name:   ad?.client_name   || '',
    placement:     ad?.placement     || 'after_categories',
    target:        ad?.target        || 'both',
    redirect_url:  ad?.redirect_url  || '',
    is_active:     ad?.is_active     ?? true,
    start_date:    ad?.start_date    || '',
    end_date:      ad?.end_date      || '',
    // Image mode
    image_url:     ad?.image_url     || '',
    // Builder mode
    bg_color:      ad?.bg_color      || '#005023',
    bg_image_url:  ad?.bg_image_url  || '',
    ad_title:      ad?.ad_title      || '',
    ad_subtitle:   ad?.ad_subtitle   || '',
    btn_text:      ad?.btn_text      || '',
    btn_url:       ad?.btn_url       || '',
    btn_color:     ad?.btn_color     || '#ffffff',
    btn_text_color:ad?.btn_text_color|| '#005023',
    text_color:    ad?.text_color    || '#ffffff',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const bgFileRef = useRef(null);
  const { toast } = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const uploadImg = async (file, key) => {
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `ads/${Date.now()}_${key}.${ext}`;
      const { error } = await supabase.storage.from('site_assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site_assets').getPublicUrl(path);
      set(key, data.publicUrl);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) return toast({ variant: 'destructive', title: 'Titre requis' });
    setSaving(true);
    try {
      const payload = {
        ...form,
        image_url:    mode === 'image'   ? form.image_url   : null,
        bg_image_url: mode === 'builder' ? form.bg_image_url: null,
        ad_title:     mode === 'builder' ? form.ad_title    : null,
        ad_subtitle:  mode === 'builder' ? form.ad_subtitle : null,
        btn_text:     mode === 'builder' ? form.btn_text    : null,
        btn_url:      mode === 'builder' ? form.btn_url     : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = isEdit
        ? await supabase.from('homepage_ads').update(payload).eq('id', ad.id)
        : await supabase.from('homepage_ads').insert(payload);

      if (error) throw error;
      toast({ title: isEdit ? 'Mis à jour !' : 'Publicité créée !', description: form.title });
      onSave();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const dims = DIMENSIONS[form.placement];

  return (
    <div className="space-y-5">
      {/* Infos générales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px]">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block">Nom interne *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Pub Novembre — Vodacom" className="h-9 text-[13px]" />
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block">Nom du client</Label>
            <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Ex: Vodacom Congo" className="h-9 text-[13px]" />
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block">Emplacement</Label>
            <select
              value={form.placement}
              onChange={e => set('placement', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 h-9 text-[13px] bg-white outline-none focus:border-custom-green-500"
            >
              {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block">Affichage</Label>
            <select
              value={form.target}
              onChange={e => set('target', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 h-9 text-[13px] bg-white outline-none focus:border-custom-green-500"
            >
              {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[12px] font-semibold mb-1.5 block">Lien de redirection</Label>
            <Input value={form.redirect_url} onChange={e => set('redirect_url', e.target.value)} placeholder="https://..." className="h-9 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[12px] font-semibold mb-1.5 block">Début</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px] font-semibold mb-1.5 block">Fin</Label>
              <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions info */}
      <div className="bg-custom-green-50 border border-custom-green-100 rounded-xl px-4 py-3 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-[12px] text-custom-green-700">
          <Smartphone className="w-4 h-4" />
          <span><strong>Mobile :</strong> {dims?.mobile}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-custom-green-700">
          <Monitor className="w-4 h-4" />
          <span><strong>Desktop :</strong> {dims?.desktop}</span>
        </div>
        <span className="text-[11px] text-custom-green-600">PNG/JPG/WebP · Fond transparent supporté</span>
      </div>

      {/* Mode sélection */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('image')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${mode === 'image' ? 'bg-custom-green-500 text-white border-custom-green-500' : 'bg-white text-gray-700 border-gray-200 hover:border-custom-green-300'}`}
        >
          <ImageIcon className="w-4 h-4" /> Upload image
        </button>
        <button
          onClick={() => setMode('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${mode === 'builder' ? 'bg-custom-green-500 text-white border-custom-green-500' : 'bg-white text-gray-700 border-gray-200 hover:border-custom-green-300'}`}
        >
          <Palette className="w-4 h-4" /> Créer dans l'éditeur
        </button>
      </div>

      {/* Mode image */}
      {mode === 'image' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">Image de la publicité</CardTitle>
            <CardDescription className="text-[12px]">Uploadez le visuel fourni par le client aux dimensions indiquées ci-dessus</CardDescription>
          </CardHeader>
          <CardContent>
            {form.image_url ? (
              <div className="space-y-3">
                <div className="relative">
                  <img src={form.image_url} alt="" className="w-full max-h-40 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                  <button onClick={() => set('image_url', '')} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => fileRef.current?.click()} className="text-[12px] text-custom-green-600 hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Changer l'image
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-custom-green-400 hover:bg-custom-green-50/40 transition-all">
                {uploading ? <Loader2 className="w-7 h-7 animate-spin mx-auto text-custom-green-500" /> : (
                  <>
                    <Upload className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                    <p className="text-[13px] text-gray-500">Cliquer pour uploader</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0], 'image_url')} />
          </CardContent>
        </Card>
      )}

      {/* Mode builder */}
      {mode === 'builder' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">Éditeur de bannière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview live */}
            <div>
              <Label className="text-[12px] font-semibold mb-2 block text-gray-500 uppercase tracking-wide">Aperçu</Label>
              <AdPreview ad={form} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              {/* Fond */}
              <div>
                <Label className="text-[12px] font-semibold mb-2 block">Couleur de fond</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { set('bg_color', c); set('bg_image_url', ''); }}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${form.bg_color === c && !form.bg_image_url ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={form.bg_color} onChange={e => { set('bg_color', e.target.value); set('bg_image_url', ''); }} className="w-7 h-7 rounded-lg border-2 border-gray-200 cursor-pointer p-0" />
                </div>
                <button onClick={() => bgFileRef.current?.click()} className="text-[12px] text-custom-green-600 hover:underline flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> {form.bg_image_url ? 'Changer image de fond' : 'Utiliser une image de fond'}
                </button>
                {form.bg_image_url && (
                  <button onClick={() => set('bg_image_url', '')} className="ml-3 text-[11px] text-red-500 hover:underline">Retirer</button>
                )}
                <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0], 'bg_image_url')} />
              </div>

              {/* Couleur texte */}
              <div>
                <Label className="text-[12px] font-semibold mb-2 block">Couleur du texte</Label>
                <div className="flex gap-2">
                  {['#ffffff','#111827','#fbc401','#005023'].map(c => (
                    <button key={c} onClick={() => set('text_color', c)}
                      className={`w-7 h-7 rounded-lg border-2 ${form.text_color === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={form.text_color} onChange={e => set('text_color', e.target.value)} className="w-7 h-7 rounded-lg border-2 border-gray-200 cursor-pointer p-0" />
                </div>
              </div>

              {/* Titre */}
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Titre</Label>
                <Input value={form.ad_title} onChange={e => set('ad_title', e.target.value)} placeholder="Titre accrocheur..." className="h-9 text-[13px]" />
              </div>

              {/* Sous-titre */}
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Sous-titre</Label>
                <Input value={form.ad_subtitle} onChange={e => set('ad_subtitle', e.target.value)} placeholder="Description courte..." className="h-9 text-[13px]" />
              </div>

              {/* Bouton */}
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Texte du bouton</Label>
                <Input value={form.btn_text} onChange={e => set('btn_text', e.target.value)} placeholder="Ex: Découvrir" className="h-9 text-[13px]" />
              </div>

              <div>
                <Label className="text-[12px] font-semibold mb-2 block">Couleur du bouton</Label>
                <div className="flex gap-2">
                  {['#ffffff','#005023','#fbc401','#111827'].map(c => (
                    <button key={c} onClick={() => set('btn_color', c)}
                      className={`w-7 h-7 rounded-lg border-2 ${form.btn_color === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={form.btn_color} onChange={e => set('btn_color', e.target.value)} className="w-7 h-7 rounded-lg border-2 border-gray-200 cursor-pointer p-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving || uploading} className="bg-custom-green-500 hover:bg-custom-green-600 text-white h-10 px-6">
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isEdit ? 'Mettre à jour' : 'Publier la publicité'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-10">Annuler</Button>
      </div>
    </div>
  );
};

/* ─── Tab principal ───────────────────────────────────────────── */
const AdminHomepageAdsTab = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();

  const fetchAds = async () => {
    const { data } = await supabase.from('homepage_ads').select('*').order('created_at', { ascending: false });
    setAds(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const toggleActive = async (ad) => {
    await supabase.from('homepage_ads').update({ is_active: !ad.is_active }).eq('id', ad.id);
    fetchAds();
  };

  const deleteAd = async (id) => {
    if (!confirm('Supprimer cette publicité ?')) return;
    await supabase.from('homepage_ads').delete().eq('id', id);
    toast({ title: 'Publicité supprimée' });
    fetchAds();
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setView('list'); setSelected(null); }} className="text-[13px] text-gray-500 hover:text-gray-800">← Retour</button>
          <h2 className="text-[17px] font-bold text-gray-900">{view === 'edit' ? 'Modifier la publicité' : 'Nouvelle publicité'}</h2>
        </div>
        <AdForm ad={selected} onSave={() => { fetchAds(); setView('list'); setSelected(null); }} onCancel={() => { setView('list'); setSelected(null); }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-gray-900">Publicités Homepage</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">Gérez les bannières publicitaires affichées sur la page d'accueil.</p>
        </div>
        <Button onClick={() => setView('create')} className="bg-custom-green-500 hover:bg-custom-green-600 text-white h-9 gap-2">
          <Plus className="w-4 h-4" /> Nouvelle pub
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-[14px]">Aucune publicité pour l'instant</p>
          <button onClick={() => setView('create')} className="mt-2 text-custom-green-600 text-[13px] hover:underline">Créer la première</button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <Card key={ad.id} className={!ad.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                {/* Preview miniature */}
                <div className="w-28 flex-shrink-0 rounded-lg overflow-hidden">
                  <AdPreview ad={ad} />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{ad.title}</p>
                    <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {ad.client_name && <p className="text-[12px] text-gray-500">Client : {ad.client_name}</p>}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {PLACEMENTS.find(p => p.value === ad.placement)?.label || ad.placement}
                    </span>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TARGETS.find(t => t.value === ad.target)?.label || ad.target}
                    </span>
                    {ad.end_date && (
                      <span className="text-[11px] text-gray-400">
                        Expire : {format(new Date(ad.end_date), 'd MMM yyyy', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(ad)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors" title={ad.is_active ? 'Désactiver' : 'Activer'}>
                    {ad.is_active ? <Eye className="w-4 h-4 text-custom-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  {ad.redirect_url && (
                    <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  )}
                  <button onClick={() => { setSelected(ad); setView('edit'); }} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteAd(ad.id)} className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHomepageAdsTab;
