import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, Check, Eye, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/* ── helpers ─────────────────────────────────────────────── */

const DEFAULT_SLIDE = {
  text_content: [
    { spans: [{ text: 'Acheter et vendre tout au Congo', color: '#ffffff', size: '2.25rem', weight: 'bold', style: 'normal' }] },
    { spans: [{ text: "La première place de marché du Congo-Brazzaville connectant des millions d'acheteurs et de vendeurs.", color: 'rgba(255,255,255,0.8)', size: '0.875rem', weight: 'normal', style: 'normal' }] },
  ],
  text_align: 'left',
  cta_text: 'Parcourir les Annonces',
  cta_link: '/listings',
  secondary_cta_text: 'Publier une Annonce Gratuite',
  secondary_cta_link: '/post-ad',
  image_url: '',
  background_color: '#2EB565',
  overlay_enabled: false,
  overlay_color: '#000000',
  overlay_opacity: 0.4,
  is_active: false,
  layout_type: 'classic',
  settings: {
    bg_type: 'gradient',
    gradient_start: '#2EB565',
    gradient_end: '#005023',
    gradient_direction: 'to right',
    badge_show: true,
    badge_text: 'Offres du mois',
    badge_color: '#fbc401',
    badge_text_color: '#1a1a1a',
    right_side: 'circle',
    promo_value: '-50%',
    promo_label_top: 'Bons plans du mois',
    promo_caption: 'Sur une sélection de produits',
    promo_color: '#005023',
  },
};

function slideToForm(slide) {
  const s = slide?.settings || {};
  const t0 = slide?.text_content?.[0]?.spans?.[0] || {};
  const t1 = slide?.text_content?.[1]?.spans?.[0] || {};
  return {
    bg_type: s.bg_type || 'gradient',
    background_color: slide?.background_color || '#2EB565',
    gradient_start: s.gradient_start || '#2EB565',
    gradient_end: s.gradient_end || '#005023',
    gradient_direction: s.gradient_direction || 'to right',
    image_url: slide?.image_url || '',
    badge_show: s.badge_show !== false,
    badge_text: s.badge_text || 'Offres du mois',
    badge_color: s.badge_color || '#fbc401',
    badge_text_color: s.badge_text_color || '#1a1a1a',
    title: t0.text || '',
    title_color: t0.color || '#ffffff',
    subtitle: t1.text || '',
    subtitle_color: t1.color || 'rgba(255,255,255,0.8)',
    text_align: slide?.text_align || 'left',
    cta_text: slide?.cta_text || '',
    cta_link: slide?.cta_link || '/listings',
    cta_style: s.btn1_style || 'fill',
    cta_color: s.btn1_color || '#fbc401',
    secondary_cta_text: slide?.secondary_cta_text || '',
    secondary_cta_link: slide?.secondary_cta_link || '/post-ad',
    secondary_cta_style: s.btn2_style || 'outline',
    secondary_cta_color: s.btn2_color || '#ffffff',
    right_side: s.right_side || 'circle',
    promo_value: s.promo_value || '-50%',
    promo_label_top: s.promo_label_top || 'Bons plans du mois',
    promo_caption: s.promo_caption || 'Sur une sélection de produits',
    promo_color: s.promo_color || '#005023',
    overlay_enabled: slide?.overlay_enabled || false,
    overlay_color: slide?.overlay_color || '#000000',
    overlay_opacity: slide?.overlay_opacity ?? 0.4,
    is_active: slide?.is_active ?? false,
    // Mobile overrides
    mobile_enabled: s.mobile?.enabled || false,
    mobile_bg_type: s.mobile?.bg_type || 'inherit',
    mobile_image_url: s.mobile?.image_url || '',
    mobile_right_side: s.mobile?.right_side || 'none',
    mobile_text_align: s.mobile?.text_align || 'center',
    mobile_badge_show: s.mobile?.badge_show !== false,
    mobile_deco_url: s.mobile?.deco_url || '',
    mobile_deco_position: s.mobile?.deco_position || 'bottom-right',
    mobile_deco_size: s.mobile?.deco_size ?? 40,
    mobile_deco_opacity: s.mobile?.deco_opacity ?? 1,
    // Tablet overrides
    tablet_enabled: s.tablet?.enabled || false,
    tablet_bg_type: s.tablet?.bg_type || 'inherit',
    tablet_image_url: s.tablet?.image_url || '',
    tablet_right_side: s.tablet?.right_side || 'inherit',
    tablet_text_align: s.tablet?.text_align || 'inherit',
    tablet_badge_show: s.tablet?.badge_show !== false,
    tablet_deco_url: s.tablet?.deco_url || '',
    tablet_deco_position: s.tablet?.deco_position || 'bottom-right',
    tablet_deco_size: s.tablet?.deco_size ?? 40,
    tablet_deco_opacity: s.tablet?.deco_opacity ?? 1,
  };
}

function formToPayload(form, order) {
  return {
    text_content: [
      { spans: [{ text: form.title, color: form.title_color, size: '2.25rem', weight: 'bold', style: 'normal' }] },
      { spans: [{ text: form.subtitle, color: form.subtitle_color, size: '0.875rem', weight: 'normal', style: 'normal' }] },
    ],
    text_align: form.text_align,
    cta_text: form.cta_text,
    cta_link: form.cta_link,
    secondary_cta_text: form.secondary_cta_text,
    secondary_cta_link: form.secondary_cta_link,
    image_url: form.image_url || '',
    background_color: form.background_color,
    overlay_enabled: form.overlay_enabled,
    overlay_color: form.overlay_color,
    overlay_opacity: form.overlay_opacity,
    is_active: form.is_active,
    layout_type: 'classic',
    order,
    settings: {
      bg_type: form.bg_type,
      gradient_start: form.gradient_start,
      gradient_end: form.gradient_end,
      gradient_direction: form.gradient_direction,
      badge_show: form.badge_show,
      badge_text: form.badge_text,
      badge_color: form.badge_color,
      badge_text_color: form.badge_text_color,
      right_side: form.right_side,
      promo_value: form.promo_value,
      promo_label_top: form.promo_label_top,
      promo_caption: form.promo_caption,
      promo_color: form.promo_color,
      btn1_style: form.cta_style,
      btn1_color: form.cta_color,
      btn2_style: form.secondary_cta_style,
      btn2_color: form.secondary_cta_color,
      btn_count: form.secondary_cta_text ? 2 : (form.cta_text ? 1 : 0),
      mobile: {
        enabled: form.mobile_enabled,
        ...(form.mobile_bg_type !== 'inherit' && { bg_type: form.mobile_bg_type }),
        ...(form.mobile_image_url && { image_url: form.mobile_image_url }),
        ...(form.mobile_right_side !== 'inherit' && { right_side: form.mobile_right_side }),
        ...(form.mobile_text_align !== 'inherit' && { text_align: form.mobile_text_align }),
        badge_show: form.mobile_badge_show,
        ...(form.mobile_deco_url && { deco_url: form.mobile_deco_url, deco_position: form.mobile_deco_position, deco_size: form.mobile_deco_size, deco_opacity: form.mobile_deco_opacity }),
      },
      tablet: {
        enabled: form.tablet_enabled,
        ...(form.tablet_bg_type !== 'inherit' && { bg_type: form.tablet_bg_type }),
        ...(form.tablet_image_url && { image_url: form.tablet_image_url }),
        ...(form.tablet_right_side !== 'inherit' && { right_side: form.tablet_right_side }),
        ...(form.tablet_text_align !== 'inherit' && { text_align: form.tablet_text_align }),
        badge_show: form.tablet_badge_show,
        ...(form.tablet_deco_url && { deco_url: form.tablet_deco_url, deco_position: form.tablet_deco_position, deco_size: form.tablet_deco_size, deco_opacity: form.tablet_deco_opacity }),
      },
    },
  };
}

function resolveForm(form, device) {
  if (device === 'desktop' || !form[`${device}_enabled`]) return form;
  return {
    ...form,
    bg_type: form[`${device}_bg_type`] !== 'inherit' ? form[`${device}_bg_type`] : form.bg_type,
    image_url: form[`${device}_bg_type`] === 'image' ? (form[`${device}_image_url`] || form.image_url) : form.image_url,
    right_side: form[`${device}_right_side`] !== 'inherit' ? form[`${device}_right_side`] : form.right_side,
    text_align: form[`${device}_text_align`] !== 'inherit' ? form[`${device}_text_align`] : form.text_align,
    badge_show: form[`${device}_badge_show`],
  };
}

function contrastColor(hex) {
  if (!hex?.startsWith('#') || hex.length < 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5 ? '#111827' : '#ffffff';
}

function getBg(form) {
  if (form.bg_type === 'gradient') return `linear-gradient(${form.gradient_direction}, ${form.gradient_start}, ${form.gradient_end})`;
  if (form.bg_type === 'image' && form.image_url) return `url(${form.image_url}) center/cover no-repeat`;
  return form.background_color;
}

/* ── Mini Preview ────────────────────────────────────────── */
const DEVICE_META = {
  desktop: { label: '🖥 Desktop', height: 190, padding: '0 28px', textFlex: '0 0 58%', rightFlex: '0 0 36%' },
  tablet:  { label: '💻 Tablette', height: 210, padding: '0 24px', textFlex: '0 0 58%', rightFlex: '0 0 36%' },
  mobile:  { label: '📱 Mobile', height: 240, padding: '0 20px', textFlex: '1', rightFlex: null },
};

const Preview = ({ form, device = 'desktop' }) => {
  const f = resolveForm(form, device);
  const meta = DEVICE_META[device];
  const isMobile = device === 'mobile';
  const showRight = !isMobile && f.right_side !== 'none';
  return (
    <div style={{ width: '100%', height: meta.height, background: getBg(f), borderRadius: 12, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', padding: meta.padding, flexShrink: 0 }}>
      {/* Device label */}
      <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 600, background: 'rgba(0,0,0,0.25)', borderRadius: 4, padding: '1px 5px' }}>{meta.label}</div>

      {f.overlay_enabled && (
        <div style={{ position: 'absolute', inset: 0, background: f.overlay_color, opacity: f.overlay_opacity }} />
      )}
      <div style={{ position: 'absolute', right: -24, top: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', right: -8, bottom: -16, width: 80, height: 80, borderRadius: '50%', background: 'rgba(251,196,1,0.14)' }} />

      <div style={{ flex: meta.textFlex, position: 'relative', zIndex: 1, textAlign: f.text_align === 'center' ? 'center' : 'left' }}>
        {f.badge_show && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: f.badge_color, color: f.badge_text_color, borderRadius: 999, padding: '2px 9px', fontSize: 8, fontWeight: 700, marginBottom: 7 }}>
            🌟 {f.badge_text}
          </div>
        )}
        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: f.title_color, lineHeight: 1.25, marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {f.title || <span style={{ opacity: 0.4 }}>Titre du hero…</span>}
        </div>
        <div style={{ fontSize: 8, color: f.subtitle_color, marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: isMobile ? 3 : 2, WebkitBoxOrient: 'vertical' }}>
          {f.subtitle}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: f.text_align === 'center' ? 'center' : 'flex-start' }}>
          {f.cta_text && (
            <div style={{
              background: f.cta_style === 'fill' ? f.cta_color : 'transparent',
              color: f.cta_style === 'fill' ? contrastColor(f.cta_color) : f.cta_color,
              border: f.cta_style === 'outline' ? `1.5px solid ${f.cta_color}` : 'none',
              borderRadius: 5, padding: '4px 10px', fontSize: 7.5, fontWeight: 700,
            }}>{f.cta_text}</div>
          )}
          {f.secondary_cta_text && (
            <div style={{
              background: f.secondary_cta_style === 'fill' ? f.secondary_cta_color : 'transparent',
              color: f.secondary_cta_style === 'fill' ? contrastColor(f.secondary_cta_color) : f.secondary_cta_color,
              border: f.secondary_cta_style === 'outline' ? `1.5px solid ${f.secondary_cta_color}` : 'none',
              borderRadius: 5, padding: '4px 10px', fontSize: 7.5, fontWeight: 600,
            }}>{f.secondary_cta_text}</div>
          )}
        </div>
      </div>

      {showRight && f.right_side === 'circle' && (
        <div style={{ flex: meta.rightFlex, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: f.promo_color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 5.5, textAlign: 'center', padding: '0 5px', marginBottom: 1 }}>{f.promo_label_top}</div>
            <div style={{ color: '#fbc401', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{f.promo_value}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 5, textAlign: 'center', padding: '0 5px', marginTop: 2 }}>{f.promo_caption}</div>
          </div>
        </div>
      )}
      {showRight && f.right_side === 'image' && f.image_url && (
        <div style={{ flex: meta.rightFlex, height: '80%', position: 'relative', zIndex: 1 }}>
          <img src={f.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}
      {/* Deco image preview */}
      {isMobile && form.mobile_deco_url && form.mobile_enabled && (() => {
        const pos = form.mobile_deco_position || 'bottom-right';
        const sz = `${form.mobile_deco_size || 40}%`;
        const op = form.mobile_deco_opacity ?? 1;
        const css = {
          'top-left':      { top: '8%',  left: '5%' },
          'top-center':    { top: '8%',  left: '50%', transform: 'translateX(-50%)' },
          'top-right':     { top: '8%',  right: '5%' },
          'center-left':   { top: '50%', left: '5%',  transform: 'translateY(-50%)' },
          'center':        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
          'center-right':  { top: '50%', right: '5%', transform: 'translateY(-50%)' },
          'bottom-left':   { bottom: '8%', left: '5%' },
          'bottom-center': { bottom: '8%', left: '50%', transform: 'translateX(-50%)' },
          'bottom-right':  { bottom: '8%', right: '5%' },
        }[pos] || { bottom: '8%', right: '5%' };
        return <img src={form.mobile_deco_url} alt="" style={{ position: 'absolute', width: sz, maxHeight: '75%', objectFit: 'contain', opacity: op, zIndex: 6, ...css }} />;
      })()}
    </div>
  );
};

/* ── Section wrapper ─────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8ea8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #23253a' }}>
      {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, children, half }) => (
  <div style={{ marginBottom: 10, width: half ? 'calc(50% - 5px)' : '100%' }}>
    {label && <label style={{ display: 'block', fontSize: 11, color: '#9ea2b8', marginBottom: 4 }}>{label}</label>}
    {children}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
);

const inputStyle = {
  width: '100%', background: '#1a1c2e', border: '1px solid #2e3150',
  borderRadius: 7, padding: '7px 10px', color: '#d4d6f0', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle };

const colorRowStyle = { display: 'flex', gap: 8, alignItems: 'center' };

const ColorField = ({ label, value, onChange, half }) => (
  <Field label={label} half={half}>
    <div style={colorRowStyle}>
      <input type="color" value={value?.startsWith('#') ? value : '#ffffff'} onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0 }} />
      <input style={{ ...inputStyle, flex: 1 }} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#ffffff" />
    </div>
  </Field>
);

const Toggle = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
    <span style={{ fontSize: 12, color: '#c0c4e0' }}>{label}</span>
    <button onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: checked ? '#2EB565' : '#2e3150', position: 'relative', transition: 'background .2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 20 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s',
      }} />
    </button>
  </div>
);

/* ── Position picker (3×3 grid) ─────────────────────────── */
const POSITIONS = [
  { id: 'top-left',      label: '↖' }, { id: 'top-center',    label: '↑' }, { id: 'top-right',     label: '↗' },
  { id: 'center-left',   label: '←' }, { id: 'center',        label: '·' }, { id: 'center-right',  label: '→' },
  { id: 'bottom-left',   label: '↙' }, { id: 'bottom-center', label: '↓' }, { id: 'bottom-right',  label: '↘' },
];
const PositionPicker = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gap: 4 }}>
    {POSITIONS.map(p => (
      <button key={p.id} onClick={() => onChange(p.id)} title={p.id} style={{
        width: 36, height: 36, border: `2px solid ${value === p.id ? '#2EB565' : '#2e3150'}`,
        borderRadius: 7, background: value === p.id ? '#0c2418' : '#1a1c2e',
        color: value === p.id ? '#2EB565' : '#5a5f80',
        cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s',
      }}>{p.label}</button>
    ))}
  </div>
);

/* ── Style picker (fill / outline) ──────────────────────── */
const StylePicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
    {[
      { id: 'fill', label: '■  Plein', desc: 'Fond coloré' },
      { id: 'outline', label: '□  Contour', desc: 'Bordure seulement' },
    ].map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)} style={{
        flex: 1, padding: '7px 4px', textAlign: 'center',
        border: `2px solid ${value === opt.id ? '#2EB565' : '#2e3150'}`,
        borderRadius: 7,
        background: value === opt.id ? '#0c2418' : '#1a1c2e',
        color: value === opt.id ? '#2EB565' : '#5a5f80',
        cursor: 'pointer', fontSize: 11, fontWeight: 600, lineHeight: 1.3,
        transition: 'all .15s',
      }}>
        <div>{opt.label}</div>
        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{opt.desc}</div>
      </button>
    ))}
  </div>
);

/* ── Image upload field ──────────────────────────────────── */
const ImageUploadField = ({ label, value, onChange }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `hero/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('site_assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('site_assets').getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  return (
    <Field label={label}>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #2e3150' }}>
          <img src={value} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            <button onClick={() => fileRef.current?.click()} style={{ background: '#2EB565', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Upload size={12} /> Changer
            </button>
            <button onClick={() => onChange('')} style={{ background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{ border: '2px dashed #2e3150', borderRadius: 8, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2EB565'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2e3150'}
        >
          {uploading ? (
            <Loader2 size={22} style={{ color: '#2EB565', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          ) : (
            <>
              <ImageIcon size={22} style={{ color: '#3d4166', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, color: '#6a6e8a' }}>Cliquer ou glisser une image</div>
              <div style={{ fontSize: 10, color: '#3d4166', marginTop: 3 }}>PNG, JPG, WebP</div>
            </>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {/* URL fallback */}
      <input
        style={{ ...inputStyle, marginTop: 6, fontSize: 11 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="ou coller une URL https://..."
      />
    </Field>
  );
};

/* ── Main component ──────────────────────────────────────── */
export default function HeroSlideEditor({ isOpen, onClose, initialSlideId }) {
  const [slides, setSlides] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(slideToForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [device, setDevice] = useState('desktop');
  const { toast } = useToast();

  const upd = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  /* Fetch slides */
  const fetchSlides = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hero_slides').select('*').order('order', { ascending: true });
    if (!error && data) {
      setSlides(data);
      const target = data.find(s => s.id === initialSlideId) || data[0];
      if (target) { setSelectedId(target.id); setForm(slideToForm(target)); }
    }
    setLoading(false);
  }, [initialSlideId]);

  useEffect(() => { if (isOpen) fetchSlides(); }, [isOpen, fetchSlides]);

  /* Sync form when selection changes */
  const selectSlide = useCallback((id) => {
    const s = slides.find(s => s.id === id);
    if (s) { setSelectedId(id); setForm(slideToForm(s)); setSaved(false); }
  }, [slides]);

  /* Save current slide */
  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const slide = slides.find(s => s.id === selectedId);
    const payload = formToPayload(form, slide?.order ?? 1);
    const { error } = await supabase.from('hero_slides').update(payload).eq('id', selectedId);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      setSaved(true);
      setSlides(prev => prev.map(s => s.id === selectedId ? { ...s, ...payload } : s));
      toast({ title: 'Enregistré', description: 'Le slide a été sauvegardé.', className: 'bg-custom-green-500 text-white' });
      setTimeout(() => setSaved(false), 2500);
    }
  };

  /* Publish = save + activate */
  const handlePublish = async () => {
    await handleSave();
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase.from('hero_slides').update({ is_active: true, layout_type: 'classic' }).eq('id', selectedId);
    if (!error) {
      setSlides(prev => prev.map(s => s.id === selectedId ? { ...s, is_active: true, layout_type: 'classic' } : s));
      upd('is_active', true);
      toast({ title: 'Publié !', description: 'Ce slide est maintenant actif sur la page d\'accueil.', className: 'bg-custom-green-500 text-white' });
    }
    setSaving(false);
  };

  /* Add new slide */
  const handleAdd = async () => {
    const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order || 0)) + 1 : 1;
    const { data, error } = await supabase.from('hero_slides').insert({ ...DEFAULT_SLIDE, order: nextOrder }).select().single();
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    setSlides(prev => [...prev, data]);
    setSelectedId(data.id);
    setForm(slideToForm(data));
    setSaved(false);
  };

  /* Delete slide */
  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce slide ?')) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erreur', description: error.message }); return; }
    const remaining = slides.filter(s => s.id !== id);
    setSlides(remaining);
    if (id === selectedId) {
      const next = remaining[0];
      if (next) selectSlide(next.id);
      else { setSelectedId(null); setForm(slideToForm(null)); }
    }
    toast({ title: 'Slide supprimé' });
  };

  /* Reorder */
  const moveSlide = async (id, dir) => {
    const idx = slides.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const reordered = [...slides];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const updated = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(updated);
    await Promise.all(updated.map(s => supabase.from('hero_slides').update({ order: s.order }).eq('id', s.id)));
  };

  if (!isOpen) return null;

  const selectedSlide = slides.find(s => s.id === selectedId);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0e0f1c', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 50, background: '#0a0b16', borderBottom: '1px solid #1e2038', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c8ccf0' }}>🎨 Éditeur Hero</span>
          {selectedSlide && (
            <span style={{ fontSize: 11, color: '#5a5f80', background: '#181a2e', padding: '3px 8px', borderRadius: 5 }}>
              {selectedSlide.text_content?.[0]?.spans?.[0]?.text?.slice(0, 30) || 'Nouveau slide'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handlePublish} disabled={saving || !selectedId} style={{ height: 32, padding: '0 14px', background: '#2EB565', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (!selectedId || saving) ? 0.5 : 1 }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={13} />} Publier
          </button>
          <button onClick={handleSave} disabled={saving || !selectedId} style={{ height: 32, padding: '0 14px', background: saved ? '#2EB565' : '#23253a', color: saved ? '#fff' : '#c0c4e0', border: '1px solid #2e3150', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (!selectedId || saving) ? 0.5 : 1 }}>
            {saved ? <Check size={13} /> : saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </button>
          <button onClick={onClose} style={{ height: 32, width: 32, background: '#1e2038', border: 'none', borderRadius: 7, color: '#8a8ea8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 220, background: '#090a15', borderRight: '1px solid #1a1c30', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #1a1c30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#5a5f80', textTransform: 'uppercase', letterSpacing: 0.8 }}>Slides ({slides.length})</span>
            <button onClick={handleAdd} title="Ajouter un slide" style={{ width: 26, height: 26, background: '#2EB565', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={13} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                <Loader2 size={20} style={{ color: '#3d4166', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : slides.map((slide, idx) => {
              const title = slide.text_content?.[0]?.spans?.[0]?.text?.slice(0, 22) || 'Nouveau slide';
              const active = slide.id === selectedId;
              const s = slide.settings || {};
              const bg = s.bg_type === 'gradient'
                ? `linear-gradient(to right, ${s.gradient_start || '#2EB565'}, ${s.gradient_end || '#005023'})`
                : slide.background_color || '#2EB565';
              return (
                <div key={slide.id} onClick={() => selectSlide(slide.id)} style={{
                  marginBottom: 6, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${active ? '#2EB565' : 'transparent'}`,
                  transition: 'border-color .15s',
                }}>
                  {/* Thumbnail */}
                  <div style={{ height: 48, background: bg, position: 'relative' }}>
                    {slide.is_active && (
                      <span style={{ position: 'absolute', top: 4, right: 4, background: '#2EB565', color: '#fff', fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>ACTIF</span>
                    )}
                  </div>
                  {/* Info + actions */}
                  <div style={{ background: active ? '#181a2e' : '#0f1020', padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: active ? '#c0c4e0' : '#6a6e8a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); moveSlide(slide.id, -1); }} disabled={idx === 0} style={{ width: 18, height: 18, background: 'transparent', border: 'none', color: '#5a5f80', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.3 : 1 }}>
                        <ChevronUp size={11} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); moveSlide(slide.id, 1); }} disabled={idx === slides.length - 1} style={{ width: 18, height: 18, background: 'transparent', border: 'none', color: '#5a5f80', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === slides.length - 1 ? 0.3 : 1 }}>
                        <ChevronDown size={11} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(slide.id); }} style={{ width: 18, height: 18, background: 'transparent', border: 'none', color: '#6a4040', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Editor panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {!selectedId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4e6a' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🖼️</div>
                <div style={{ fontSize: 14 }}>Sélectionne un slide ou crée-en un nouveau</div>
                <button onClick={handleAdd} style={{ marginTop: 16, padding: '8px 20px', background: '#2EB565', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  + Ajouter un slide
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Preview column */}
              <div style={{ width: 380, borderRight: '1px solid #1a1c30', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, overflowY: 'auto' }}>
                {/* Device tabs */}
                <div style={{ display: 'flex', gap: 3, background: '#0a0b16', borderRadius: 9, padding: 3 }}>
                  {[
                    { id: 'desktop', icon: '🖥', label: 'Desktop' },
                    { id: 'tablet',  icon: '💻', label: 'Tablette' },
                    { id: 'mobile',  icon: '📱', label: 'Mobile' },
                  ].map(d => (
                    <button key={d.id} onClick={() => setDevice(d.id)} style={{
                      flex: 1, padding: '6px 4px', border: 'none', borderRadius: 7,
                      background: device === d.id ? '#2EB565' : 'transparent',
                      color: device === d.id ? '#fff' : '#5a5f80',
                      cursor: 'pointer', fontSize: 10, fontWeight: 700,
                      transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    }}>
                      <span style={{ fontSize: 14 }}>{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>

                <Preview form={form} device={device} />
                <Toggle label="Slide actif" checked={form.is_active} onChange={v => upd('is_active', v)} />
                <div style={{ fontSize: 10, color: '#4a4e6a', lineHeight: 1.5 }}>
                  Un seul slide actif est affiché sur la page d'accueil. Utilise "Publier" pour activer ce slide.
                </div>
              </div>

              {/* Form column */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                {/* ── Mobile / Tablet override form ── */}
                {device !== 'desktop' && (
                  <>
                    <Toggle
                      label={`Personnaliser pour ${device === 'mobile' ? '📱 Mobile' : '💻 Tablette'}`}
                      checked={form[`${device}_enabled`]}
                      onChange={v => upd(`${device}_enabled`, v)}
                    />
                    {!form[`${device}_enabled`] && (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#4a4e6a', fontSize: 12, lineHeight: 1.7 }}>
                        {device === 'mobile' ? '📱' : '💻'} Ce dispositif utilise les mêmes<br />paramètres que le <strong style={{ color: '#5a6080' }}>Desktop</strong>.<br />
                        <span style={{ fontSize: 11 }}>Active la personnalisation ci-dessus<br />pour définir des réglages différents.</span>
                      </div>
                    )}
                    {form[`${device}_enabled`] && (
                      <>
                        <Section title="Arrière-plan">
                          <Field label="Type de fond">
                            <select style={selectStyle} value={form[`${device}_bg_type`]} onChange={e => upd(`${device}_bg_type`, e.target.value)}>
                              <option value="inherit">Identique au desktop</option>
                              <option value="color">Couleur unie</option>
                              <option value="gradient">Dégradé</option>
                              <option value="image">Image spécifique</option>
                            </select>
                          </Field>
                          {form[`${device}_bg_type`] === 'image' && (
                            <ImageUploadField
                              label={`Image ${device === 'mobile' ? 'mobile' : 'tablette'}`}
                              value={form[`${device}_image_url`]}
                              onChange={v => upd(`${device}_image_url`, v)}
                            />
                          )}
                        </Section>

                        <Section title="Disposition">
                          <Field label="Côté droit">
                            <select style={selectStyle} value={form[`${device}_right_side`]} onChange={e => upd(`${device}_right_side`, e.target.value)}>
                              <option value="inherit">Identique au desktop</option>
                              <option value="circle">Cercle promotionnel</option>
                              <option value="image">Image</option>
                              <option value="none">Masqué</option>
                            </select>
                          </Field>
                          <Field label="Alignement du texte">
                            <select style={selectStyle} value={form[`${device}_text_align`]} onChange={e => upd(`${device}_text_align`, e.target.value)}>
                              <option value="inherit">Identique au desktop</option>
                              <option value="left">Gauche</option>
                              <option value="center">Centre</option>
                              <option value="right">Droite</option>
                            </select>
                          </Field>
                          <Toggle label="Afficher le badge" checked={form[`${device}_badge_show`]} onChange={v => upd(`${device}_badge_show`, v)} />
                        </Section>

                        <Section title="Image décorative (positionnée librement)">
                          <ImageUploadField
                            label="Image à afficher"
                            value={form[`${device}_deco_url`]}
                            onChange={v => upd(`${device}_deco_url`, v)}
                          />
                          {form[`${device}_deco_url`] && (
                            <>
                              <Field label="Position dans le hero">
                                <PositionPicker value={form[`${device}_deco_position`]} onChange={v => upd(`${device}_deco_position`, v)} />
                              </Field>
                              <Field label={`Taille : ${form[`${device}_deco_size`]}% de la largeur`}>
                                <input
                                  type="range" min="10" max="90" step="5"
                                  value={form[`${device}_deco_size`]}
                                  onChange={e => upd(`${device}_deco_size`, +e.target.value)}
                                  style={{ width: '100%', accentColor: '#2EB565' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a4e6a', marginTop: 2 }}>
                                  <span>10%</span><span>50%</span><span>90%</span>
                                </div>
                              </Field>
                              <Field label={`Opacité : ${Math.round(form[`${device}_deco_opacity`] * 100)}%`}>
                                <input
                                  type="range" min="0.1" max="1" step="0.05"
                                  value={form[`${device}_deco_opacity`]}
                                  onChange={e => upd(`${device}_deco_opacity`, +e.target.value)}
                                  style={{ width: '100%', accentColor: '#2EB565' }}
                                />
                              </Field>
                            </>
                          )}
                        </Section>
                      </>
                    )}
                  </>
                )}

                {/* ── Desktop form (full) ── */}
                {device === 'desktop' && <><Section title="Arrière-plan">
                  <Field label="Type de fond">
                    <select style={selectStyle} value={form.bg_type} onChange={e => upd('bg_type', e.target.value)}>
                      <option value="color">Couleur unie</option>
                      <option value="gradient">Dégradé</option>
                      <option value="image">Image</option>
                    </select>
                  </Field>
                  {form.bg_type === 'color' && (
                    <ColorField label="Couleur" value={form.background_color} onChange={v => upd('background_color', v)} />
                  )}
                  {form.bg_type === 'gradient' && (
                    <>
                      <Row>
                        <ColorField label="Couleur 1" value={form.gradient_start} onChange={v => upd('gradient_start', v)} half />
                        <ColorField label="Couleur 2" value={form.gradient_end} onChange={v => upd('gradient_end', v)} half />
                      </Row>
                      <Field label="Direction">
                        <select style={selectStyle} value={form.gradient_direction} onChange={e => upd('gradient_direction', e.target.value)}>
                          <option value="to right">Gauche → Droite</option>
                          <option value="to left">Droite → Gauche</option>
                          <option value="to bottom">Haut → Bas</option>
                          <option value="to top">Bas → Haut</option>
                          <option value="to right bottom">Diagonal ↘</option>
                          <option value="to right top">Diagonal ↗</option>
                        </select>
                      </Field>
                    </>
                  )}
                  {form.bg_type === 'image' && (
                    <ImageUploadField label="Image de fond" value={form.image_url} onChange={v => upd('image_url', v)} />
                  )}
                  <Toggle label="Superposition sombre" checked={form.overlay_enabled} onChange={v => upd('overlay_enabled', v)} />
                  {form.overlay_enabled && (
                    <Row>
                      <ColorField label="Couleur overlay" value={form.overlay_color} onChange={v => upd('overlay_color', v)} half />
                      <Field label="Opacité (0-1)" half>
                        <input style={inputStyle} type="number" min="0" max="1" step="0.05" value={form.overlay_opacity} onChange={e => upd('overlay_opacity', +e.target.value)} />
                      </Field>
                    </Row>
                  )}
                </Section>

                <Section title="Badge">
                  <Toggle label="Afficher le badge" checked={form.badge_show} onChange={v => upd('badge_show', v)} />
                  {form.badge_show && (
                    <>
                      <Field label="Texte du badge">
                        <input style={inputStyle} value={form.badge_text} onChange={e => upd('badge_text', e.target.value)} />
                      </Field>
                      <Row>
                        <ColorField label="Fond badge" value={form.badge_color} onChange={v => upd('badge_color', v)} half />
                        <ColorField label="Texte badge" value={form.badge_text_color} onChange={v => upd('badge_text_color', v)} half />
                      </Row>
                    </>
                  )}
                </Section>

                <Section title="Contenu">
                  <Field label="Titre principal">
                    <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} value={form.title} onChange={e => upd('title', e.target.value)} />
                  </Field>
                  <ColorField label="Couleur du titre" value={form.title_color} onChange={v => upd('title_color', v)} />
                  <Field label="Sous-titre">
                    <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.subtitle} onChange={e => upd('subtitle', e.target.value)} />
                  </Field>
                  <ColorField label="Couleur du sous-titre" value={form.subtitle_color} onChange={v => upd('subtitle_color', v)} />
                  <Field label="Alignement">
                    <select style={selectStyle} value={form.text_align} onChange={e => upd('text_align', e.target.value)}>
                      <option value="left">Gauche</option>
                      <option value="center">Centre</option>
                      <option value="right">Droite</option>
                    </select>
                  </Field>
                </Section>

                <Section title="Boutons d'appel à l'action">
                  <Field label="Bouton principal — texte">
                    <input style={inputStyle} value={form.cta_text} onChange={e => upd('cta_text', e.target.value)} />
                  </Field>
                  <Field label="Bouton principal — lien">
                    <input style={inputStyle} value={form.cta_link} onChange={e => upd('cta_link', e.target.value)} placeholder="/listings" />
                  </Field>
                  <Field label="Bouton principal — style">
                    <StylePicker value={form.cta_style} onChange={v => upd('cta_style', v)} />
                  </Field>
                  <ColorField label="Bouton principal — couleur" value={form.cta_color} onChange={v => upd('cta_color', v)} />

                  <div style={{ height: 1, background: '#23253a', margin: '12px 0' }} />

                  <Field label="Bouton secondaire — texte (optionnel)">
                    <input style={inputStyle} value={form.secondary_cta_text} onChange={e => upd('secondary_cta_text', e.target.value)} placeholder="Laisser vide pour masquer" />
                  </Field>
                  {form.secondary_cta_text && (
                    <>
                      <Field label="Bouton secondaire — lien">
                        <input style={inputStyle} value={form.secondary_cta_link} onChange={e => upd('secondary_cta_link', e.target.value)} placeholder="/post-ad" />
                      </Field>
                      <Field label="Bouton secondaire — style">
                        <StylePicker value={form.secondary_cta_style} onChange={v => upd('secondary_cta_style', v)} />
                      </Field>
                      <ColorField label="Bouton secondaire — couleur" value={form.secondary_cta_color} onChange={v => upd('secondary_cta_color', v)} />
                    </>
                  )}
                </Section>

                <Section title="Côté droit">
                  <Field label="Contenu côté droit">
                    <select style={selectStyle} value={form.right_side} onChange={e => upd('right_side', e.target.value)}>
                      <option value="circle">Cercle promotionnel</option>
                      <option value="image">Image</option>
                      <option value="none">Aucun</option>
                    </select>
                  </Field>
                  {form.right_side === 'circle' && (
                    <>
                      <Field label="Valeur principale (ex: -50%)">
                        <input style={inputStyle} value={form.promo_value} onChange={e => upd('promo_value', e.target.value)} />
                      </Field>
                      <Field label="Label au-dessus">
                        <input style={inputStyle} value={form.promo_label_top} onChange={e => upd('promo_label_top', e.target.value)} />
                      </Field>
                      <Field label="Texte en-dessous">
                        <input style={inputStyle} value={form.promo_caption} onChange={e => upd('promo_caption', e.target.value)} />
                      </Field>
                      <ColorField label="Couleur du cercle" value={form.promo_color} onChange={v => upd('promo_color', v)} />
                    </>
                  )}
                  {form.right_side === 'image' && (
                    <ImageUploadField label="Image côté droit" value={form.image_url} onChange={v => upd('image_url', v)} />
                  )}
                </Section></>}

              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
