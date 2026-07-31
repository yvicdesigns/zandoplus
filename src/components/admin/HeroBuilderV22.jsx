import React, { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/*
 * Canvas : 960×340px desktop = équivalent 1920×680 sur écran.
 * Defaults calés exactement sur HeroSection.jsx pour que l'aperçu
 * dans le builder corresponde à ce qui s'affiche sur la page d'accueil.
 */
function classicToV22(slide) {
  const s  = slide?.settings || {};
  const t0 = slide?.text_content?.[0]?.spans?.[0] || {};
  const t1 = slide?.text_content?.[1]?.spans?.[0] || {};
  const t2 = slide?.text_content?.[2]?.spans?.[0] || null;

  // ── Fond — mêmes defaults que HeroSection.jsx ──
  const bgType = s.bg_type           || 'color';        // HeroSection default = 'color'
  const gStart = s.gradient_start    || '#2EB565';
  const gEnd   = s.gradient_end      || '#005023';
  const gDir   = s.gradient_direction|| 'to right';
  const solidBg = slide?.background_color || '#FFFFFF';

  const dirToAngle = d =>
    ({ 'to right':90,'to left':270,'to bottom':180,'to top':0,
       'to right bottom':135,'to right top':45,
       'to left bottom':225,'to left top':315 })[d] ?? (parseInt(d) || 90);

  const gradientAngle = gDir.includes('deg') ? parseInt(gDir) : dirToAngle(gDir);
  const bgStr = bgType === 'gradient'
    ? `linear-gradient(${gradientAngle}deg, ${gStart}, ${gEnd})`
    : bgType === 'image' && slide?.image_url
      ? `url(${slide.image_url}) center/cover`
      : solidBg;

  // backgroundConfig au format attendu par l'éditeur V22
  const bgMode = bgType === 'gradient' ? 'gradient' : bgType === 'image' ? 'image' : 'solid';
  const bgCfg = {
    mode: bgMode, solid: solidBg,
    gradientColor1: gStart, gradientColor2: gEnd, gradientAngle,
    imageUrl: slide?.image_url || '', imageSize:'cover', imagePosition:'center',
    overlayColor:'#000000', overlayOpacity:0,
  };

  // ── Textes — mêmes defaults que HeroSection.jsx ──
  const badgeShow  = s.badge_show !== false;
  const badgeText  = s.badge_text       || 'Offres du mois';
  const badgeBg    = s.badge_color      || '#fbc401';
  const badgeClr   = s.badge_text_color || '#1a1a1a';

  const rawTitle   = t0.text || 'Acheter et vendre\ntout au Congo';
  const titleText  = rawTitle.replace(/\\n/g, '\n');
  const titleColor = t0.color || '#111827';              // HeroSection default = dark

  const subText    = t1.text  || "La première place de marché du Congo-Brazzaville\nconnectant des millions d'acheteurs et de vendeurs.";
  const subColor   = t1.color || '#6B7280';             // HeroSection default = gray

  const descText   = s.description       || t2?.text  || null;
  const descColor  = s.description_color || t2?.color || '#9CA3AF';

  const btnCount   = s.btn_count  ?? 2;
  const btn1Style  = s.btn1_style ?? 'filled';
  const btn2Style  = s.btn2_style ?? 'outline';
  const cta1Txt    = (slide?.cta_text           || 'Parcourir les annonces') + '  →';
  const cta2Txt    =  slide?.secondary_cta_text || 'Publier une annonce gratuite';
  const align      =  slide?.text_align || 'left';

  // ── Côté droit ──
  const rightSide    = s.right_side      || 'circle';
  const promoVal     = s.promo_value     || '-50%';
  const promoLabel   = s.promo_label_top || 'Bons plans du mois';
  const promoCaption = s.promo_caption   || 'Sur une sélection de produits';
  const promoClr     = s.promo_color     || '#005023';

  // ── Positions calées sur canvas 960×340px ──
  // Vertical centering avec ~20px padding haut/bas
  const badgeY = 20;
  const titleY = badgeShow ? 54 : 28;
  const subY   = titleY + 96;   // titre ~90px de hauteur
  const descY  = subY + 56;
  const btnY   = descText ? descY + 42 : subY + 56;

  const els = [];

  // Badge
  if (badgeShow) els.push({
    id:'zp-badge', type:'badge', name:'Badge offres', group:'foreground',
    text: badgeText, subtext: '',
    layout: {
      desktop: {x:38, y:badgeY, w:124, h:26},
      tablet:  {x:38, y:badgeY, w:120, h:26},
      mobile:  {x:24, y:18,     w:112, h:24},
    },
    background: badgeBg, color: badgeClr,
    radius:999, opacity:1, rotation:0, badgeFontSize:10,
    hidden:{}, locked:false,
  });

  // Titre — canvas 1280px, texte plus large
  els.push({
    id:'zp-title', type:'text', name:'Titre principal', group:'content',
    text: titleText,
    layout: {
      desktop: {x:38, y:titleY, w:520, h:90},
      tablet:  {x:38, y:titleY, w:375, h:90},
      mobile:  {x:24, y:titleY, w:340, h:82},
    },
    fontSize:{desktop:34, tablet:28, mobile:24},
    fontWeight:900, color: titleColor, background:'transparent',
    radius:0, opacity:1, rotation:0, align, lineHeight:1.1, letterSpacing:-0.5,
    hidden:{}, locked:false,
  });

  // Sous-titre
  els.push({
    id:'zp-sub', type:'text', name:'Sous-titre', group:'content',
    text: subText,
    layout: {
      desktop: {x:38, y:subY, w:480, h:52},
      tablet:  {x:38, y:subY, w:355, h:56},
      mobile:  {x:24, y:subY, w:340, h:62},
    },
    fontSize:{desktop:11, tablet:11, mobile:11},
    fontWeight:400, color: subColor, background:'transparent',
    radius:0, opacity:1, rotation:0, align, lineHeight:1.55, letterSpacing:0,
    hidden:{}, locked:false,
  });

  // Description (optionnel)
  if (descText) els.push({
    id:'zp-desc', type:'text', name:'Description', group:'content',
    text: descText,
    layout: {
      desktop: {x:38, y:descY, w:480, h:36},
      tablet:  {x:38, y:descY, w:355, h:36},
      mobile:  {x:24, y:descY, w:340, h:36},
    },
    fontSize:{desktop:10, tablet:10, mobile:10},
    fontWeight:400, color: descColor, background:'transparent',
    radius:0, opacity:1, rotation:0, align, lineHeight:1.4, letterSpacing:0,
    hidden:{}, locked:false,
  });

  // Bouton 1
  if (btnCount >= 1) {
    const isOutline = btn1Style === 'outline';
    els.push({
      id:'zp-cta1', type:'button', name:'Bouton principal', group:'content',
      text: cta1Txt,
      layout: {
        desktop: {x:38, y:btnY, w:186, h:38},
        tablet:  {x:38, y:btnY, w:182, h:38},
        mobile:  {x:24, y:btnY, w:180, h:40},
      },
      fontSize:{desktop:12, tablet:12, mobile:12},
      fontWeight:700,
      color:      isOutline ? '#2EB565' : '#ffffff',
      background: isOutline ? 'transparent' : '#2EB565',
      ...(isOutline ? { border:'2px solid #2EB565' } : {}),
      radius:10, opacity:1, rotation:0, align:'center',
      hidden:{}, locked:false,
    });
  }

  // Bouton 2
  if (btnCount >= 2) {
    const isFilled = btn2Style === 'filled';
    els.push({
      id:'zp-cta2', type:'button', name:'Bouton secondaire', group:'content',
      text: cta2Txt,
      layout: {
        desktop: {x:234, y:btnY, w:200, h:38},
        tablet:  {x:230, y:btnY, w:196, h:38},
        mobile:  {x:212, y:btnY, w:192, h:40},
      },
      fontSize:{desktop:12, tablet:12, mobile:12},
      fontWeight:700,
      color:      isFilled ? '#ffffff' : '#2EB565',
      background: isFilled ? '#2EB565' : '#F9FAFB',
      ...(isFilled ? {} : { border:'2px solid #2EB565' }),
      radius:10, opacity:1, rotation:0, align:'center',
      hidden:{}, locked:false,
    });
  }

  // ── Côté droit — positions pour canvas 1280px ──
  // Centre du cercle à x≈1021 (même proportion que 732/960 → 975/1280)
  if (rightSide === 'circle') {
    els.push(
      { id:'zp-ring-out', type:'circle', name:'Cercle extérieur', group:'foreground',
        layout:{
          desktop:{x:887,y:38, w:268,h:268},
          tablet: {x:474,y:34, w:238,h:238},
          mobile: {x:100,y:340,w:190,h:190},
        },
        background: promoClr, radius:999, opacity:0.18, rotation:0, hidden:{}, locked:false },

      { id:'zp-ring-in', type:'circle', name:'Cercle promo', group:'foreground',
        layout:{
          desktop:{x:919,y:70, w:204,h:204},
          tablet: {x:504,y:64, w:178,h:178},
          mobile: {x:125,y:365,w:140,h:140},
        },
        background: promoClr, radius:999, opacity:1, rotation:0, hidden:{}, locked:false },

      { id:'zp-promo-lbl', type:'text', name:'Label promo', group:'foreground',
        text: promoLabel,
        layout:{
          desktop:{x:925,y:107,w:192,h:16},
          tablet: {x:508,y:100,w:168,h:16},
          mobile: {x:128,y:380,w:134,h:14},
        },
        fontSize:{desktop:9,tablet:9,mobile:9}, fontWeight:700,
        color:'rgba(255,255,255,0.68)', background:'transparent',
        radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.2, letterSpacing:1,
        hidden:{}, locked:false },

      { id:'zp-promo-jus', type:'text', name:"Jusqu'à", group:'foreground',
        text:"Jusqu'à",
        layout:{
          desktop:{x:963,y:124,w:116,h:15},
          tablet: {x:548,y:118,w:102,h:15},
          mobile: {x:156,y:396,w:88, h:13},
        },
        fontSize:{desktop:10,tablet:10,mobile:9}, fontWeight:400,
        color:'rgba(255,255,255,0.62)', background:'transparent',
        radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.2, letterSpacing:0,
        hidden:{}, locked:false },

      { id:'zp-promo-val', type:'text', name:'Valeur promo', group:'foreground',
        text: promoVal,
        layout:{
          desktop:{x:897,y:132,w:248,h:68},
          tablet: {x:484,y:126,w:208,h:60},
          mobile: {x:124,y:406,w:152,h:48},
        },
        fontSize:{desktop:54,tablet:46,mobile:36}, fontWeight:900,
        color:'#fbc401', background:'transparent',
        radius:0, opacity:1, rotation:0, align:'center', lineHeight:1, letterSpacing:-2,
        hidden:{}, locked:false },

      { id:'zp-promo-cap', type:'text', name:'Caption promo', group:'foreground',
        text: promoCaption,
        layout:{
          desktop:{x:925,y:203,w:192,h:34},
          tablet: {x:508,y:188,w:168,h:34},
          mobile: {x:128,y:456,w:144,h:28},
        },
        fontSize:{desktop:9,tablet:9,mobile:9}, fontWeight:400,
        color:'rgba(255,255,255,0.58)', background:'transparent',
        radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.4, letterSpacing:0,
        hidden:{}, locked:false }
    );
  } else if (rightSide === 'image' && slide?.image_url) {
    els.push({
      id:'zp-img', type:'image', name:'Image hero', group:'content',
      layout:{
        desktop:{x:700,y:10, w:560,h:320},
        tablet: {x:390,y:10, w:340,h:300},
        mobile: {x:50, y:320,w:300,h:200},
      },
      imageUrl: slide.image_url, fit:'contain',
      background:'transparent', radius:0, opacity:1, rotation:0, hidden:{}, locked:false,
    });
  }

  // Éléments décoratifs — proportionnels au canvas 1280px
  els.push(
    { id:'zp-deco-tr', type:'circle', name:'Déco haut-droite', group:'foreground',
      layout:{
        desktop:{x:1136,y:-44,w:168,h:168},
        tablet: {x:660, y:-38,w:150,h:150},
        mobile: {x:290, y:-30,w:130,h:130},
      },
      background:'rgba(255,255,255,0.05)', radius:999, opacity:1, rotation:0, hidden:{}, locked:false },

    { id:'zp-deco-br', type:'circle', name:'Déco bas-droite (jaune)', group:'foreground',
      layout:{
        desktop:{x:1168,y:258,w:120,h:120},
        tablet: {x:678, y:236,w:104,h:104},
        mobile: {x:290, y:400,w:80, h:80 },
      },
      background:'rgba(251,196,1,0.18)', radius:999, opacity:1, rotation:0, hidden:{}, locked:false }
  );

  return {
    background:       { desktop:bgStr, tablet:bgStr, mobile:bgStr },
    backgroundConfig: { desktop:bgCfg, tablet:bgCfg, mobile:bgCfg },
    elements: els,
    settings: { grid:false, rulers:false, snap:true, autoSave:true },
  };
}

/* ── Fallback si aucun slide n'est fourni ── */
const ZANDO_HERO_STATE = {
  background: {
    desktop: 'linear-gradient(to right, #2EB565, #005023)',
    tablet:  'linear-gradient(to right, #2EB565, #005023)',
    mobile:  'linear-gradient(to right, #2EB565, #005023)',
  },
  backgroundConfig: {
    desktop: { type: 'gradient' },
    tablet:  { type: 'gradient' },
    mobile:  { type: 'gradient' },
  },
  elements: [
    { id:'zp-badge', type:'badge', name:'Badge offres', group:'foreground',
      text:'Offres du mois', subtext:'',
      layout:{ desktop:{x:38,y:20,w:124,h:26}, tablet:{x:38,y:20,w:120,h:26}, mobile:{x:24,y:18,w:112,h:24} },
      background:'#fbc401', color:'#1a1a1a', radius:999, opacity:1, rotation:0, badgeFontSize:10,
      hidden:{}, locked:false },
    { id:'zp-title', type:'text', name:'Titre principal', group:'content',
      text:'Acheter et vendre\ntout au Congo',
      layout:{ desktop:{x:38,y:54,w:520,h:90}, tablet:{x:38,y:54,w:375,h:90}, mobile:{x:24,y:52,w:340,h:82} },
      fontSize:{desktop:34,tablet:28,mobile:24}, fontWeight:900,
      color:'#ffffff', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'left', lineHeight:1.1, letterSpacing:-0.5,
      hidden:{}, locked:false },
    { id:'zp-sub', type:'text', name:'Sous-titre', group:'content',
      text:"La première place de marché du Congo-Brazzaville\nconnectant des millions d'acheteurs et de vendeurs.",
      layout:{ desktop:{x:38,y:150,w:480,h:52}, tablet:{x:38,y:150,w:355,h:56}, mobile:{x:24,y:140,w:340,h:62} },
      fontSize:{desktop:11,tablet:11,mobile:11}, fontWeight:400,
      color:'rgba(255,255,255,0.80)', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'left', lineHeight:1.55, letterSpacing:0,
      hidden:{}, locked:false },
    { id:'zp-cta1', type:'button', name:'Bouton principal', group:'content',
      text:'Parcourir les annonces  →',
      layout:{ desktop:{x:38,y:216,w:186,h:38}, tablet:{x:38,y:216,w:182,h:38}, mobile:{x:24,y:214,w:180,h:40} },
      fontSize:{desktop:12,tablet:12,mobile:12}, fontWeight:700,
      color:'#ffffff', background:'#2EB565',
      radius:10, opacity:1, rotation:0, align:'center',
      hidden:{}, locked:false },
    { id:'zp-cta2', type:'button', name:'Bouton secondaire', group:'content',
      text:'Publier une annonce gratuite',
      layout:{ desktop:{x:234,y:216,w:200,h:38}, tablet:{x:230,y:216,w:196,h:38}, mobile:{x:212,y:214,w:192,h:40} },
      fontSize:{desktop:12,tablet:12,mobile:12}, fontWeight:700,
      color:'#ffffff', background:'rgba(255,255,255,0.08)',
      border:'1.5px solid rgba(255,255,255,0.45)',
      radius:10, opacity:1, rotation:0, align:'center',
      hidden:{}, locked:false },
    { id:'zp-ring-out', type:'circle', name:'Cercle extérieur', group:'foreground',
      layout:{ desktop:{x:887,y:38,w:268,h:268}, tablet:{x:474,y:34,w:238,h:238}, mobile:{x:100,y:340,w:190,h:190} },
      background:'rgba(0,80,35,0.20)', radius:999, opacity:1, rotation:0, hidden:{}, locked:false },
    { id:'zp-ring-in', type:'circle', name:'Cercle promo', group:'foreground',
      layout:{ desktop:{x:919,y:70,w:204,h:204}, tablet:{x:504,y:64,w:178,h:178}, mobile:{x:125,y:365,w:140,h:140} },
      background:'#005023', radius:999, opacity:1, rotation:0, hidden:{}, locked:false },
    { id:'zp-promo-lbl', type:'text', name:'Label promo', group:'foreground',
      text:'Bons plans du mois',
      layout:{ desktop:{x:925,y:107,w:192,h:16}, tablet:{x:508,y:100,w:168,h:16}, mobile:{x:128,y:380,w:134,h:14} },
      fontSize:{desktop:9,tablet:9,mobile:9}, fontWeight:700,
      color:'rgba(255,255,255,0.68)', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.2, letterSpacing:1,
      hidden:{}, locked:false },
    { id:'zp-promo-jus', type:'text', name:"Jusqu'à", group:'foreground',
      text:"Jusqu'à",
      layout:{ desktop:{x:963,y:124,w:116,h:15}, tablet:{x:548,y:118,w:102,h:15}, mobile:{x:156,y:396,w:88,h:13} },
      fontSize:{desktop:10,tablet:10,mobile:9}, fontWeight:400,
      color:'rgba(255,255,255,0.62)', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.2, letterSpacing:0,
      hidden:{}, locked:false },
    { id:'zp-promo-val', type:'text', name:'Valeur promo', group:'foreground',
      text:'-50%',
      layout:{ desktop:{x:897,y:132,w:248,h:68}, tablet:{x:484,y:126,w:208,h:60}, mobile:{x:124,y:406,w:152,h:48} },
      fontSize:{desktop:54,tablet:46,mobile:36}, fontWeight:900,
      color:'#fbc401', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'center', lineHeight:1, letterSpacing:-2,
      hidden:{}, locked:false },
    { id:'zp-promo-cap', type:'text', name:'Caption promo', group:'foreground',
      text:'Sur une sélection de produits',
      layout:{ desktop:{x:925,y:203,w:192,h:34}, tablet:{x:508,y:188,w:168,h:34}, mobile:{x:128,y:456,w:144,h:28} },
      fontSize:{desktop:9,tablet:9,mobile:9}, fontWeight:400,
      color:'rgba(255,255,255,0.58)', background:'transparent',
      radius:0, opacity:1, rotation:0, align:'center', lineHeight:1.4, letterSpacing:0,
      hidden:{}, locked:false },
    { id:'zp-deco-tr', type:'circle', name:'Déco haut-droite', group:'foreground',
      layout:{ desktop:{x:1136,y:-44,w:168,h:168}, tablet:{x:660,y:-38,w:150,h:150}, mobile:{x:290,y:-30,w:130,h:130} },
      background:'rgba(255,255,255,0.05)', radius:999, opacity:1, rotation:0, hidden:{}, locked:false },
    { id:'zp-deco-br', type:'circle', name:'Déco bas-droite', group:'foreground',
      layout:{ desktop:{x:1168,y:258,w:120,h:120}, tablet:{x:678,y:236,w:104,h:104}, mobile:{x:290,y:400,w:80,h:80} },
      background:'rgba(251,196,1,0.18)', radius:999, opacity:1, rotation:0, hidden:{}, locked:false },
  ],
  settings: { grid: false, rulers: false, snap: true },
};

const HeroBuilderV22 = ({ isOpen, onClose, slide, onSave }) => {
  const iframeRef = useRef(null);
  const { toast } = useToast();
  const slideRef = useRef(slide);
  useEffect(() => { slideRef.current = slide; }, [slide]);

  // Écrit l'état dans localStorage avant que l'iframe charge (useLayoutEffect = synchrone)
  useLayoutEffect(() => {
    if (!isOpen) return;
    const s = slide;
    const st = s?.settings?.builder_data_v22 ?? (s ? classicToV22(s) : ZANDO_HERO_STATE);
    try { localStorage.setItem('__zando_hero_load__', JSON.stringify(st)); } catch(e) {}
    return () => { try { localStorage.removeItem('__zando_hero_load__'); } catch(e) {} };
  }, [isOpen, slide?.id, slide]);

  // Listen for ZANDO_EDITOR_READY / ZANDO_EDITOR_LOADED / SAVE / AUTOSAVE / PUBLISH
  const handleMessage = useCallback(async (e) => {
    const { type, state: editorState } = e.data || {};
    if (!type) return;

    // Handshake : l'éditeur est initialisé → on envoie l'état à charger
    if (type === 'ZANDO_EDITOR_READY') {
      const s = slideRef.current;
      const stateToLoad = s?.settings?.builder_data_v22
        ?? (s ? classicToV22(s) : ZANDO_HERO_STATE);
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ZANDO_EDITOR_LOAD', state: stateToLoad },
        window.location.origin
      );
      return;
    }

    if (type === 'ZANDO_EDITOR_LOADED' || type === 'ZANDO_EDITOR_LOAD_ERROR') return;

    if (!editorState) return;
    const currentSlide = slideRef.current;
    if (!currentSlide?.id) return;

    if (type === 'SAVE' || type === 'AUTOSAVE') {
      // Sauvegarde le brouillon SANS changer layout_type — la page d'accueil n'est PAS affectée
      const newSettings = { ...(currentSlide.settings || {}), builder_data_v22: editorState };
      const { error } = await supabase
        .from('hero_slides')
        .update({ settings: newSettings })
        .eq('id', currentSlide.id);

      if (!error) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'SAVE_ACK' }, '*');
        if (type === 'SAVE') {
          toast({ title: 'Brouillon enregistré', description: 'La page d\'accueil reste inchangée. Cliquez "Publier" pour mettre à jour le hero.', className: 'bg-custom-green-500 text-white' });
          onSave();
        }
      } else {
        console.error('HeroBuilderV22 save error:', error);
      }
    }

    if (type === 'PUBLISH') {
      const newSettings = { ...(currentSlide.settings || {}), builder_data_v22: editorState };
      const { error } = await supabase
        .from('hero_slides')
        .update({ settings: newSettings, layout_type: 'v22', is_active: true })
        .eq('id', currentSlide.id);

      if (!error) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'PUBLISH_ACK' }, '*');
        toast({ title: 'Hero publié !', description: 'Visible immédiatement sur la page d\'accueil.', className: 'bg-custom-green-500 text-white' });
        onSave();
      } else {
        console.error('HeroBuilderV22 publish error:', error);
        toast({ variant: 'destructive', title: 'Erreur de publication', description: error.message });
      }
    }
  }, [toast, onSave]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, handleMessage]);

  // Block background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#111118', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', height: 40, minHeight: 40,
        background: '#0d0d14', borderBottom: '1px solid #2a2a3a',
        flexShrink: 0,
      }}>
        <span style={{ color: '#a0a0c0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: 0.3 }}>
          Hero Builder · Zando+
        </span>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#c0c0d8', borderRadius: 8, padding: '4px 10px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <X size={13} /> Fermer
        </button>
      </div>

      {/* V22 iframe — full area | ?v=24 force rechargement du cache */}
      <iframe
        ref={iframeRef}
        src="/editor.html?v=27"
        style={{ flex: 1, border: 'none', display: 'block', width: '100%' }}
        title="Zando Hero Builder V22"
        allow="clipboard-write"
        onLoad={() => {
          // Backup postMessage : si ZANDO_EDITOR_READY n'est pas arrivé (cache), on envoie quand même
          const s = slideRef.current;
          const st = s?.settings?.builder_data_v22 ?? (s ? classicToV22(s) : ZANDO_HERO_STATE);
          setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'ZANDO_EDITOR_LOAD', state: st },
              window.location.origin
            );
          }, 200);
        }}
      />
    </div>
  );
};

export default HeroBuilderV22;
