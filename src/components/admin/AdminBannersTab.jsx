import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Smartphone, Monitor, Truck, Smartphone as AppIcon, LayoutDashboard, Ruler } from 'lucide-react';

const SLOTS = [
  {
    key: 'hero_mobile',
    label: 'Hero — Mobile',
    desc: 'Image affichée dans le hero uniquement sur smartphone',
    size: '400 × 400 px recommandé · PNG avec transparence',
    icon: Smartphone,
    hasText: true,
  },
  {
    key: 'hero_desktop',
    label: 'Hero — Desktop',
    desc: 'Image affichée à droite du hero sur ordinateur (remplace l\'emoji produit)',
    size: '600 × 500 px recommandé · PNG avec transparence',
    icon: Monitor,
    hasText: true,
  },
  {
    key: 'card_delivery',
    label: 'Carte Livraison (mobile)',
    desc: 'Illustration de la carte "Livraison rapide" (remplace /camion.png)',
    size: '260 × 200 px recommandé · PNG avec transparence',
    icon: Truck,
    hasText: false,
  },
  {
    key: 'card_app',
    label: 'Carte Application (mobile)',
    desc: 'Illustration de la carte "Téléchargez l\'App" (remplace /telephone2.png)',
    size: '220 × 300 px recommandé · PNG avec transparence',
    icon: AppIcon,
    hasText: false,
  },
  {
    key: 'desktop_banner',
    label: 'Bannière Desktop',
    desc: 'Grande bannière publicitaire affichée sur ordinateur dans la section app',
    size: '1280 × 280 px recommandé · JPG ou WebP',
    icon: LayoutDashboard,
    hasText: false,
  },
];

/* ─── Slot individuel ─────────────────────────────────────────── */
const BannerSlot = ({ slot, data, onSave }) => {
  const [imageUrl, setImageUrl] = useState(data?.image_url || '');
  const [title, setTitle] = useState(data?.title || '');
  const [subtitle, setSubtitle] = useState(data?.subtitle || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const { toast } = useToast();
  const Icon = slot.icon;

  useEffect(() => {
    setImageUrl(data?.image_url || '');
    setTitle(data?.title || '');
    setSubtitle(data?.subtitle || '');
  }, [data]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `visuals/${slot.key}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('site_assets')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        key: slot.key,
        image_url: imageUrl || null,
        title: title || null,
        subtitle: subtitle || null,
        updated_at: new Date().toISOString(),
      };

      // Essaie site_visuals, fallback sur banners
      let { data, error, status, statusText } = await supabase
        .from('site_visuals')
        .upsert(payload, { onConflict: 'key' })
        .select();
      if (error?.code === '42P01') {
        ({ data, error, status, statusText } = await supabase
          .from('banners')
          .upsert(payload, { onConflict: 'key' })
          .select());
      }


      if (error) throw error;
      toast({ title: 'Sauvegardé', description: `${slot.label} mis à jour avec succès.` });
      onSave?.();
    } catch (err) {
      console.error('[banners save error]', err);
      toast({
        variant: 'destructive',
        title: `Erreur (${err?.code || err?.name || 'inconnu'})`,
        description: err?.message || err?.toString() || 'Erreur inconnue',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiag = async () => {
    const sel = await supabase.from('site_visuals').select('*').limit(5);
    const ins = await supabase.from('site_visuals').insert({ key: `__test_${Date.now()}`, image_url: null });
    const upd = await supabase.from('site_visuals').update({ title: 'test' }).eq('key', slot.key);

    const status = `SELECT: ${sel.error ? sel.error.message : 'OK'} | INSERT: ${ins.error ? ins.error.message : 'OK'} | UPDATE: ${upd.error ? upd.error.message : 'OK'}`;
    toast({ title: 'Diagnostic terminé', description: status });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-custom-green-50 border border-custom-green-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-custom-green-600" />
          </div>
          <div>
            <CardTitle className="text-[15px]">{slot.label}</CardTitle>
            <CardDescription className="text-[12px] mt-0.5">{slot.desc}</CardDescription>
            <p className="flex items-center gap-1 text-[11px] text-custom-green-600 font-semibold mt-1">
              <Ruler className="w-3 h-3" /> {slot.size}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image */}
        <div>
          <Label className="text-[12px] font-semibold mb-2 block text-gray-700">Image</Label>
          {imageUrl ? (
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt=""
                  className="h-28 w-auto max-w-[200px] rounded-xl border border-gray-200 object-contain bg-gray-50"
                />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[12px] text-custom-green-600 hover:underline flex items-center gap-1 mt-2"
              >
                <Upload className="w-3.5 h-3.5" /> Changer
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-custom-green-400 hover:bg-custom-green-50/40 transition-all group"
            >
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-custom-green-500" />
              ) : (
                <>
                  <Upload className="w-7 h-7 mx-auto text-gray-300 group-hover:text-custom-green-500 transition-colors mb-2" />
                  <p className="text-[13px] font-medium text-gray-500">Cliquer pour uploader une image</p>
                  <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP · Transparence supportée</p>
                </>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Texte — uniquement pour les slots hero */}
        {slot.hasText && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] font-semibold mb-1.5 block text-gray-700">Titre</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre principal..."
                className="text-[13px] h-9"
              />
            </div>
            <div>
              <Label className="text-[12px] font-semibold mb-1.5 block text-gray-700">Sous-titre</Label>
              <Input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Sous-titre / description..."
                className="text-[13px] h-9"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-custom-green-500 hover:bg-custom-green-600 text-white h-9 px-5"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
          {slot.key === 'hero_mobile' && (
            <Button variant="outline" onClick={handleDiag} className="h-9 px-4 text-[12px]">
              🔍 Diagnostic
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Tab principal ───────────────────────────────────────────── */
const AdminBannersTab = () => {
  const [banners, setBanners] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    // Essaie site_visuals d'abord, fallback sur banners si rename pas encore fait
    let { data } = await supabase.from('site_visuals').select('*');
    if (!data) ({ data } = await supabase.from('banners').select('*'));
    if (data) {
      const map = {};
      data.forEach(b => { map[b.key] = b; });
      setBanners(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-[17px] font-bold text-gray-900">Bannières & Hero</h2>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Gérez les images et contenus des sections visuelles de la page d'accueil. Les modifications sont appliquées immédiatement.
        </p>
      </div>

      {/* Hero */}
      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Section Hero</p>
        {SLOTS.filter(s => s.key.startsWith('hero')).map(slot => (
          <BannerSlot key={slot.key} slot={slot} data={banners[slot.key]} onSave={fetchBanners} />
        ))}
      </div>

      {/* Cartes mobiles */}
      <div className="space-y-3 pt-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Cartes Mobiles</p>
        {SLOTS.filter(s => s.key.startsWith('card')).map(slot => (
          <BannerSlot key={slot.key} slot={slot} data={banners[slot.key]} onSave={fetchBanners} />
        ))}
      </div>

      {/* Desktop */}
      <div className="space-y-3 pt-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Desktop</p>
        {SLOTS.filter(s => s.key === 'desktop_banner').map(slot => (
          <BannerSlot key={slot.key} slot={slot} data={banners[slot.key]} onSave={fetchBanners} />
        ))}
      </div>
    </div>
  );
};

export default AdminBannersTab;
