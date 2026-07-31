import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, Monitor, Smartphone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import FileUpload from '@/components/verification/FileUpload';
import imageCompression from 'browser-image-compression';
import HeroSlidePreview from './HeroSlidePreview';
import AdvancedColorPicker from './ColorPicker';

/* ── Helpers ── */
const ColorField = ({ label, value, onChange }) => (
  <div>
    {label && <Label className="text-xs text-gray-500 mb-1 block">{label}</Label>}
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="h-8 w-8 rounded-lg border-2 border-gray-200 shrink-0 shadow-sm" style={{ backgroundColor: value || '#ffffff' }} />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <AdvancedColorPicker color={value} onChange={onChange} />
        </PopoverContent>
      </Popover>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" className="h-8 text-xs font-mono" />
    </div>
  </div>
);

const TextField = ({ label, value, onChange, placeholder, color, onColorChange, isTextarea }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      {onColorChange && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="h-5 w-5 rounded border-2 border-gray-200 shadow-sm" style={{ backgroundColor: color || '#000000' }} />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <AdvancedColorPicker color={color} onChange={onColorChange} />
          </PopoverContent>
        </Popover>
      )}
    </div>
    {isTextarea ? (
      <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-xs resize-none" rows={2} />
    ) : (
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
    )}
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-3">
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
    {children}
  </div>
);

const ToggleGroup = ({ options, value, onChange }) => (
  <div className="flex gap-1">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all text-center ${
          value === opt.value ? 'border-custom-green-500 bg-green-50 text-custom-green-500' : 'border-gray-200 bg-white text-gray-500'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

/* ── Constants ── */
const TABS = [
  { id: 'contenu', label: 'Contenu' },
  { id: 'fond',    label: 'Fond' },
  { id: 'layout',  label: 'Mise en page' },
  { id: 'boutons', label: 'Boutons' },
];

const LAYOUTS = [
  { value: 'classic',   label: 'Classique',    desc: 'Texte à gauche, visuel à droite' },
  { value: 'overlay',   label: 'Fond + texte', desc: 'Image de fond avec texte par-dessus' },
  { value: 'fullimage', label: 'Image pleine', desc: 'Image seule, sans texte' },
];

const GRADIENT_DIRS = [
  { value: 'to right',  label: '→ Droite' },
  { value: 'to bottom', label: '↓ Bas' },
  { value: '135deg',    label: '↘ Diag.' },
  { value: '45deg',     label: '↗ Inv.' },
];

/* ── Default / hydrate ── */
const defaultForm = () => ({
  layout_type: 'classic',
  badge_show: true, badge_text: 'Offres du mois', badge_color: '#fbc401', badge_text_color: '#1a1a1a',
  title: '', title_color: '#111827',
  subtitle: '', subtitle_color: '#6B7280',
  description: '', description_color: '#9CA3AF',
  bg_type: 'color', background_color: '#FFFFFF',
  gradient_start: '#2EB565', gradient_end: '#005023', gradient_direction: 'to right',
  image_url: '',
  overlay_enabled: true, overlay_color: '#000000', overlay_opacity: 0.45,
  right_side: 'circle',
  promo_value: '-50%', promo_label_top: 'Bons plans du mois', promo_caption: 'Sur une sélection de produits', promo_color: '#005023',
  btn_count: 2, cta_text: '', cta_link: '/listings', btn1_style: 'filled',
  secondary_cta_text: '', secondary_cta_link: '/post-ad', btn2_style: 'outline',
  order: 1, is_active: true,
});

const slideToForm = (slide) => {
  if (!slide) return defaultForm();
  const s = slide.settings || {};
  const hasCta = !!(slide.cta_text);
  const hasSec = !!(slide.secondary_cta_text);
  return {
    layout_type:        slide.layout_type        || 'classic',
    badge_show:         s.badge_show !== false,
    badge_text:         s.badge_text              ?? 'Offres du mois',
    badge_color:        s.badge_color             ?? '#fbc401',
    badge_text_color:   s.badge_text_color        ?? '#1a1a1a',
    title:              slide.text_content?.[0]?.spans?.[0]?.text  || '',
    title_color:        slide.text_content?.[0]?.spans?.[0]?.color || '#111827',
    subtitle:           slide.text_content?.[1]?.spans?.[0]?.text  || '',
    subtitle_color:     slide.text_content?.[1]?.spans?.[0]?.color || '#6B7280',
    description:        s.description             ?? '',
    description_color:  s.description_color       ?? '#9CA3AF',
    bg_type:            s.bg_type                 ?? 'color',
    background_color:   slide.background_color    || '#FFFFFF',
    gradient_start:     s.gradient_start          ?? '#2EB565',
    gradient_end:       s.gradient_end            ?? '#005023',
    gradient_direction: s.gradient_direction      ?? 'to right',
    image_url:          slide.image_url           || '',
    overlay_enabled:    slide.overlay_enabled     ?? true,
    overlay_color:      slide.overlay_color       || '#000000',
    overlay_opacity:    slide.overlay_opacity     ?? 0.45,
    right_side:         s.right_side              ?? 'circle',
    promo_value:        s.promo_value             ?? '-50%',
    promo_label_top:    s.promo_label_top         ?? 'Bons plans du mois',
    promo_caption:      s.promo_caption           ?? 'Sur une sélection de produits',
    promo_color:        s.promo_color             ?? '#005023',
    btn_count:          s.btn_count               ?? (hasSec ? 2 : hasCta ? 1 : 2),
    cta_text:           slide.cta_text            || '',
    cta_link:           slide.cta_link            || '/listings',
    btn1_style:         s.btn1_style              ?? 'filled',
    secondary_cta_text: slide.secondary_cta_text  || '',
    secondary_cta_link: slide.secondary_cta_link  || '/post-ad',
    btn2_style:         s.btn2_style              ?? 'outline',
    order:              slide.order               ?? 1,
    is_active:          slide.is_active !== false,
  };
};

/* ── Component ── */
const EditHeroSlideDialog = ({ isOpen, onClose, slide, onSave }) => {
  const [form, setForm] = useState(defaultForm());
  const [activeTab, setActiveTab] = useState('contenu');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const f = slideToForm(slide);
      setForm(f);
      setPreviewUrl(f.image_url);
      setImageFile(null);
      setActiveTab('contenu');
    }
  }, [slide, isOpen]);

  const set = useCallback((updates) => setForm(prev => ({ ...prev, ...updates })), []);

  const handleImage = async (file) => {
    if (!file) { setImageFile(null); setPreviewUrl(form.image_url || ''); return; }
    setIsLoading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' });
      setImageFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally { setIsLoading(false); }
  };

  const removeImage = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl('');
    set({ image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let finalImageUrl = slide?.image_url || '';
      if (imageFile) {
        if (slide?.image_url?.includes('/site_assets/')) {
          try { const old = new URL(slide.image_url).pathname.split('/site_assets/')[1]; if (old) await supabase.storage.from('site_assets').remove([old]); } catch {}
        }
        const path = `hero_slides/${Date.now()}.webp`;
        const { error: upErr } = await supabase.storage.from('site_assets').upload(path, imageFile);
        if (upErr) throw upErr;
        finalImageUrl = supabase.storage.from('site_assets').getPublicUrl(path).data.publicUrl;
      } else if (!previewUrl && slide?.image_url?.includes('/site_assets/')) {
        try { const old = new URL(slide.image_url).pathname.split('/site_assets/')[1]; if (old) await supabase.storage.from('site_assets').remove([old]); } catch {}
        finalImageUrl = '';
      }

      const payload = {
        layout_type: form.layout_type,
        text_content: [
          { spans: [{ text: form.title,       color: form.title_color,       size: '2.25rem',  weight: 'bold',   style: 'normal' }] },
          { spans: [{ text: form.subtitle,    color: form.subtitle_color,    size: '0.875rem', weight: 'normal', style: 'normal' }] },
          ...(form.description ? [{ spans: [{ text: form.description, color: form.description_color, size: '0.875rem', weight: 'normal', style: 'normal' }] }] : []),
        ],
        cta_text:           form.btn_count >= 1 ? form.cta_text            : '',
        cta_link:           form.btn_count >= 1 ? form.cta_link            : '',
        secondary_cta_text: form.btn_count >= 2 ? form.secondary_cta_text  : '',
        secondary_cta_link: form.btn_count >= 2 ? form.secondary_cta_link  : '',
        background_color:   form.background_color,
        overlay_enabled:    form.overlay_enabled,
        overlay_color:      form.overlay_color,
        overlay_opacity:    form.overlay_opacity,
        image_url:          finalImageUrl,
        order:              form.order,
        is_active:          form.is_active,
        settings: {
          badge_show: form.badge_show, badge_text: form.badge_text, badge_color: form.badge_color, badge_text_color: form.badge_text_color,
          description: form.description, description_color: form.description_color,
          bg_type: form.bg_type, gradient_start: form.gradient_start, gradient_end: form.gradient_end, gradient_direction: form.gradient_direction,
          right_side: form.right_side, promo_value: form.promo_value, promo_label_top: form.promo_label_top, promo_caption: form.promo_caption, promo_color: form.promo_color,
          btn_count: form.btn_count, btn1_style: form.btn1_style, btn2_style: form.btn2_style,
        },
      };

      let result;
      if (slide?.id) {
        const { data, error } = await supabase.from('hero_slides').update(payload).eq('id', slide.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('hero_slides').insert(payload).select().single();
        if (error) throw error;
        result = data;
      }
      onSave(result);
      toast({ title: 'Sauvegardé', description: 'Le hero a été mis à jour.', className: 'bg-custom-green-500 text-white' });
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: err.message || 'Une erreur est survenue.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const currentImg = previewUrl || form.image_url;
  const isClassic  = form.layout_type === 'classic';
  const isOverlay  = form.layout_type === 'overlay';
  const isFullImg  = form.layout_type === 'fullimage';

  /* ── Image upload block ── */
  const ImageUpload = ({ label }) => (
    <div className="space-y-2">
      {label && <Label className="text-xs text-gray-500">{label}</Label>}
      {currentImg && (
        <div className="relative rounded-lg overflow-hidden">
          <img src={currentImg} alt="" className="w-full h-24 object-cover" />
          <button type="button" onClick={removeImage} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-lg p-1">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
      <FileUpload onFileSelect={handleImage} acceptedFileTypes="image/jpeg,image/png,image/webp" label="" loading={isLoading} />
      <p className="text-[10px] text-gray-400">Convertie en WebP automatiquement.</p>
    </div>
  );

  /* ── Tab: Contenu ── */
  const renderContenu = () => (
    <div className="space-y-3">
      <Section title="Badge">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Afficher le badge</Label>
          <Switch checked={form.badge_show} onCheckedChange={v => set({ badge_show: v })} />
        </div>
        {form.badge_show && (
          <>
            <Input value={form.badge_text} onChange={e => set({ badge_text: e.target.value })} placeholder="Offres du mois" className="h-8" />
            <div className="grid grid-cols-2 gap-2">
              <ColorField label="Fond du badge" value={form.badge_color} onChange={v => set({ badge_color: v })} />
              <ColorField label="Texte du badge" value={form.badge_text_color} onChange={v => set({ badge_text_color: v })} />
            </div>
          </>
        )}
      </Section>

      <Section title="Texte">
        <TextField
          label="Titre"
          value={form.title}
          onChange={v => set({ title: v })}
          placeholder="Ex: Acheter et vendre tout au Congo"
          color={form.title_color}
          onColorChange={v => set({ title_color: v })}
        />
        <TextField
          label="Sous-titre"
          value={form.subtitle}
          onChange={v => set({ subtitle: v })}
          placeholder="Ex: La première place de marché du Congo..."
          color={form.subtitle_color}
          onColorChange={v => set({ subtitle_color: v })}
        />
        <TextField
          label="Description (optionnel)"
          value={form.description}
          onChange={v => set({ description: v })}
          placeholder="Ex: Des milliers de produits disponibles..."
          color={form.description_color}
          onColorChange={v => set({ description_color: v })}
          isTextarea
        />
      </Section>
    </div>
  );

  /* ── Tab: Fond ── */
  const renderFond = () => (
    <div className="space-y-3">
      {isClassic ? (
        <Section title="Type de fond">
          <ToggleGroup
            options={[{ value: 'color', label: 'Couleur' }, { value: 'gradient', label: 'Dégradé' }, { value: 'image', label: 'Image' }]}
            value={form.bg_type}
            onChange={v => set({ bg_type: v })}
          />
          {form.bg_type === 'color' && (
            <ColorField label="Couleur de fond" value={form.background_color} onChange={v => set({ background_color: v })} />
          )}
          {form.bg_type === 'gradient' && (
            <div className="space-y-3">
              <div className="h-8 rounded-lg border" style={{ background: `linear-gradient(${form.gradient_direction}, ${form.gradient_start}, ${form.gradient_end})` }} />
              <div className="grid grid-cols-2 gap-2">
                <ColorField label="Couleur départ" value={form.gradient_start} onChange={v => set({ gradient_start: v })} />
                <ColorField label="Couleur fin" value={form.gradient_end} onChange={v => set({ gradient_end: v })} />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Direction</Label>
                <div className="grid grid-cols-4 gap-1">
                  {GRADIENT_DIRS.map(dir => (
                    <button
                      key={dir.value}
                      type="button"
                      onClick={() => set({ gradient_direction: dir.value })}
                      className={`p-1.5 rounded-lg border text-[10px] font-medium text-center transition-all ${
                        form.gradient_direction === dir.value ? 'border-custom-green-500 bg-green-50 text-custom-green-500' : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {form.bg_type === 'image' && <ImageUpload label="Image de fond" />}
        </Section>
      ) : (
        <Section title="Image de fond">
          <ImageUpload />
        </Section>
      )}

      {isOverlay && (
        <Section title="Superposition">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Activer l'overlay</Label>
            <Switch checked={form.overlay_enabled} onCheckedChange={v => set({ overlay_enabled: v })} />
          </div>
          {form.overlay_enabled && (
            <>
              <ColorField label="Couleur" value={form.overlay_color} onChange={v => set({ overlay_color: v })} />
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Opacité ({Math.round(form.overlay_opacity * 100)}%)</Label>
                <Slider min={0} max={1} step={0.05} value={[form.overlay_opacity]} onValueChange={([v]) => set({ overlay_opacity: v })} />
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  );

  /* ── Tab: Mise en page ── */
  const renderLayout = () => (
    <div className="space-y-3">
      <Section title="Type de mise en page">
        <div className="space-y-2">
          {LAYOUTS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ layout_type: opt.value })}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                form.layout_type === opt.value ? 'border-custom-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold">{opt.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {isClassic && (
        <Section title="Côté droit">
          <ToggleGroup
            options={[{ value: 'circle', label: 'Cercle promo' }, { value: 'image', label: 'Image' }, { value: 'none', label: 'Rien' }]}
            value={form.right_side}
            onChange={v => set({ right_side: v })}
          />
          {form.right_side === 'circle' && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Valeur (ex: -50%)</Label>
                  <Input value={form.promo_value} onChange={e => set({ promo_value: e.target.value })} placeholder="-50%" className="h-8 font-bold" />
                </div>
                <ColorField label="Couleur cercle" value={form.promo_color} onChange={v => set({ promo_color: v })} />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Texte haut</Label>
                <Input value={form.promo_label_top} onChange={e => set({ promo_label_top: e.target.value })} placeholder="Bons plans du mois" className="h-8" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Texte bas</Label>
                <Input value={form.promo_caption} onChange={e => set({ promo_caption: e.target.value })} placeholder="Sur une sélection de produits" className="h-8" />
              </div>
            </div>
          )}
          {form.right_side === 'image' && (
            <div className="pt-1">
              <ImageUpload label="Image côté droit" />
            </div>
          )}
        </Section>
      )}

      <Section title="Options">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Ordre d'affichage</Label>
          <Input type="number" value={form.order} onChange={e => set({ order: parseInt(e.target.value) || 1 })} className="h-8" />
        </div>
      </Section>
    </div>
  );

  /* ── Tab: Boutons ── */
  const renderBoutons = () => (
    <div className="space-y-3">
      <Section title="Nombre de boutons">
        <ToggleGroup
          options={[{ value: 0, label: 'Aucun' }, { value: 1, label: '1 bouton' }, { value: 2, label: '2 boutons' }]}
          value={form.btn_count}
          onChange={v => set({ btn_count: v })}
        />
        {form.btn_count === 0 && <p className="text-[11px] text-gray-400 text-center">Aucun bouton ne sera affiché.</p>}
      </Section>

      {form.btn_count >= 1 && (
        <Section title="Bouton principal">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Style</Label>
            <ToggleGroup
              options={[{ value: 'filled', label: 'Plein' }, { value: 'outline', label: 'Contour' }]}
              value={form.btn1_style}
              onChange={v => set({ btn1_style: v })}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Texte</Label>
            <Input value={form.cta_text} onChange={e => set({ cta_text: e.target.value })} placeholder="Parcourir les Annonces" className="h-8" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Lien</Label>
            <Input value={form.cta_link} onChange={e => set({ cta_link: e.target.value })} placeholder="/listings" className="h-8" />
          </div>
        </Section>
      )}

      {form.btn_count >= 2 && (
        <Section title="Bouton secondaire">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Style</Label>
            <ToggleGroup
              options={[{ value: 'filled', label: 'Plein' }, { value: 'outline', label: 'Contour' }]}
              value={form.btn2_style}
              onChange={v => set({ btn2_style: v })}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Texte</Label>
            <Input value={form.secondary_cta_text} onChange={e => set({ secondary_cta_text: e.target.value })} placeholder="Publier une Annonce" className="h-8" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Lien</Label>
            <Input value={form.secondary_cta_link} onChange={e => set({ secondary_cta_link: e.target.value })} placeholder="/post-ad" className="h-8" />
          </div>
        </Section>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3">
          <DialogTitle>{slide?.id ? 'Modifier le Hero' : 'Nouveau Hero'}</DialogTitle>
          <DialogDescription>Modifie chaque élément et visualise le résultat en direct.</DialogDescription>
        </DialogHeader>

        {/* Tab nav + preview toggle */}
        <div className="shrink-0 flex items-center justify-between border-b px-6 pb-3">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-custom-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr]">
          {/* Left: form */}
          <div className="border-r overflow-y-auto px-4 py-4">
            <form id="hero-form" onSubmit={handleSubmit} className="space-y-1">
              {activeTab === 'contenu' && (!isFullImg ? renderContenu() : (
                <div className="text-center py-10 text-gray-400 text-sm">Aucun texte pour le layout "Image pleine".</div>
              ))}
              {activeTab === 'fond'    && renderFond()}
              {activeTab === 'layout'  && renderLayout()}
              {activeTab === 'boutons' && (!isFullImg ? renderBoutons() : (
                <div className="text-center py-10 text-gray-400 text-sm">Aucun bouton pour le layout "Image pleine".</div>
              ))}
            </form>
          </div>

          {/* Right: preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 min-h-0">
            {previewMode === 'desktop' ? (
              <div className="w-full h-full">
                <HeroSlidePreview slideData={form} imageUrl={currentImg} mode="desktop" />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center overflow-y-auto">
                <div className="rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white shrink-0" style={{ width: '280px' }}>
                  {/* Status bar */}
                  <div className="h-5 bg-gray-900 flex items-center justify-between px-3">
                    <span className="text-white/70 text-[7px] font-medium">9:41</span>
                    <div className="flex items-center gap-0.5">
                      <div className="w-3 h-0.5 bg-white/70 rounded-full" />
                      <div className="w-0.5 h-0.5 bg-white/70 rounded-full" />
                    </div>
                  </div>
                  {/* Hero */}
                  <HeroSlidePreview slideData={form} imageUrl={currentImg} mode="mobile" />
                  {/* Fake page content */}
                  <div className="bg-gray-50 p-2 space-y-1.5 opacity-50">
                    <div className="h-2 bg-gray-200 rounded-full w-2/3" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="h-14 bg-gray-200 rounded-lg" />
                      <div className="h-14 bg-gray-200 rounded-lg" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full w-1/2" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="h-14 bg-gray-200 rounded-lg" />
                      <div className="h-14 bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                  {/* Home indicator */}
                  <div className="h-4 bg-white flex items-center justify-center">
                    <div className="w-14 h-0.5 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 px-6 py-3 border-t">
          <div className="flex items-center gap-2 mr-auto">
            <Switch checked={form.is_active} onCheckedChange={v => set({ is_active: v })} />
            <span className="text-sm font-medium">{form.is_active ? '✅ Publié' : '📝 Brouillon'}</span>
          </div>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
          <Button type="submit" form="hero-form" disabled={isLoading} className="gradient-bg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHeroSlideDialog;
