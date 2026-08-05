import React, { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ── V22 Hero renderer ── */
const V22Element = ({ el }) => {
  const layout = el.layout?.desktop || { x: 0, y: 0, w: 100, h: 50 };
  const base = {
    position: 'absolute', left: layout.x, top: layout.y, width: layout.w, height: layout.h,
    transform: `rotate(${el.rotation || 0}deg)`, opacity: el.opacity ?? 1, borderRadius: el.radius ?? 0,
  };

  if (el.type === 'text') return (
    <div style={{ ...base, background: el.background || 'transparent', overflow: 'hidden' }}>
      <div style={{
        color: el.color || '#fff',
        fontSize: (el.fontSize?.desktop || 16) + 'px',
        fontWeight: el.fontWeight || 400,
        textAlign: el.align || 'left',
        lineHeight: el.lineHeight || 1.2,
        letterSpacing: (el.letterSpacing || 0) + 'px',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%',
      }}>
        {el.text}
      </div>
    </div>
  );

  if (el.type === 'button') return (
    <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: el.background || '#7557f7', color: el.color || '#fff',
        fontSize: (el.fontSize?.desktop || 14) + 'px', fontWeight: el.fontWeight || 700,
        borderRadius: el.radius ?? 8, border: el.border || 'none', cursor: 'default',
      }}>
        {el.text}
      </div>
    </div>
  );

  if (el.type === 'image') return (
    <div style={{ ...base, overflow: 'hidden', background: el.background || 'transparent' }}>
      {el.imageUrl && <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: el.fit || 'cover' }} />}
    </div>
  );

  if (el.type === 'badge') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: el.background || '#fff' }}>
      <span style={{ color: el.color || '#15172a', fontWeight: 800, fontSize: (el.badgeFontSize || 22) + 'px', lineHeight: 1.1 }}>{el.text}</span>
      {el.subtext && <span style={{ color: el.color || '#15172a', fontSize: 10, opacity: 0.7, marginTop: 2 }}>{el.subtext}</span>}
    </div>
  );

  if (el.type === 'circle' || el.type === 'shape') return (
    <div style={{ ...base, background: el.background || '#7557f7', borderRadius: el.type === 'circle' ? 999 : (el.radius ?? 0) }} />
  );

  if (el.type === 'separator') return (
    <div style={{ ...base, background: el.background || '#ffffff', borderRadius: 9999 }} />
  );

  return null;
};

const V22Hero = ({ state, onTouchStart, onTouchEnd }) => {
  const containerRef = useRef(null);
  const [sc, setSc] = useState(1);
  const CW = 1280, CH = 384;
  useEffect(() => {
    // Scaler par la HAUTEUR du container (fixée par Tailwind) → builder et homepage ont le même rendu
    const upd = () => {
      if (containerRef.current) setSc(containerRef.current.clientHeight / CH);
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  const bgStr = state?.background?.desktop || '#1a1b2e';
  const elements = (state?.elements || []).filter(e => !e.hidden?.desktop);
  return (
    <div ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl h-[300px] sm:h-[340px] lg:h-[384px]"
      style={{ background: bgStr }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ width: CW, height: CH, transform: `scale(${sc})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        {elements.map(el => <V22Element key={el.id} el={el} />)}
      </div>
    </div>
  );
};

/* ── Legacy Builder renderer (for slides created with HeroBuilderDialog) ── */
const BuilderElement = ({ el }) => {
  const s = {
    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
    transform: `rotate(${el.rotation || 0}deg)`, opacity: el.opacity ?? 1, zIndex: el.zIndex || 1,
  };
  if (el.type === 'text') return (
    <div style={s}>
      <div style={{ color: el.style.color, fontSize: el.style.fontSize, fontWeight: el.style.fontWeight, fontFamily: el.style.fontFamily || 'sans-serif', textAlign: el.style.textAlign, lineHeight: el.style.lineHeight || 1.2, letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing}px` : undefined, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {el.content.text}
      </div>
    </div>
  );
  if (el.type === 'button') return (
    <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <a href={el.content.link || '#'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: el.style.backgroundColor, color: el.style.color, fontSize: el.style.fontSize, fontWeight: el.style.fontWeight, fontFamily: el.style.fontFamily || 'sans-serif', borderRadius: el.style.borderRadius || 0, border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor}` : 'none', textDecoration: 'none', cursor: 'pointer' }}>
        {el.content.text}
      </a>
    </div>
  );
  if (el.type === 'image' || el.type === 'image-png') return (
    <div style={{ ...s, overflow: 'hidden', borderRadius: el.style.borderRadius || 0 }}>
      {el.content.url && <img src={el.content.url} alt={el.content.alt || ''} style={{ width: '100%', height: '100%', objectFit: el.content.fit || 'cover' }} />}
    </div>
  );
  if (el.type === 'shape-rect' || el.type === 'shape-circle') return (
    <div style={{ ...s, backgroundColor: el.style.backgroundColor, borderRadius: el.type === 'shape-circle' ? '50%' : (el.style.borderRadius || 0), border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor}` : 'none' }} />
  );
  if (el.type === 'separator') return <div style={{ ...s, backgroundColor: el.style.backgroundColor || '#ffffff', borderRadius: 9999 }} />;
  return null;
};

const BuilderHero = ({ builderData, onTouchStart, onTouchEnd }) => {
  const containerRef = useRef(null);
  const [sc, setSc] = useState(1);
  const CW2 = builderData?.canvas?.width || 1920;
  const CH2 = builderData?.canvas?.height || 900;
  useEffect(() => {
    const upd = () => { if (containerRef.current) setSc(containerRef.current.clientWidth / CW2); };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, [CW2]);
  const bg = builderData?.background || {};
  const bgStyle = bg.type === 'gradient'
    ? { background: `linear-gradient(${bg.direction || 'to right'}, ${bg.start || '#2EB565'}, ${bg.end || '#005023'})` }
    : bg.type === 'image' && bg.url
      ? { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: bg.color || '#1e1b4b' };
  const sorted = [...(builderData?.elements || [])].filter(e => e.visible !== false).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl" style={{ height: CH2 * sc }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ width: CW2, height: CH2, transform: `scale(${sc})`, transformOrigin: 'top left', position: 'relative', ...bgStyle }}>
        {sorted.map(el => <BuilderElement key={el.id} el={el} />)}
      </div>
    </div>
  );
};

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [deviceKey, setDeviceKey] = useState('desktop');
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setDeviceKey(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.from('hero_slides').select('*').eq('is_active', true).order('order', { ascending: true })
      .then(({ data }) => { if (data) setSlides(data); })
      .finally(() => setLoading(false));
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length, startTimer]);

  const goTo = (i) => { setCurrent(i); startTimer(); };
  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const slide       = slides[current] ?? null;
  const layoutType  = slide?.layout_type || 'classic';
  const baseSettings = slide?.settings || {};
  const devOver     = (deviceKey !== 'desktop' && baseSettings[deviceKey]?.enabled) ? baseSettings[deviceKey] : {};
  const eff         = (key, fallback) => (devOver[key] !== undefined && devOver[key] !== 'inherit') ? devOver[key] : (baseSettings[key] ?? fallback);
  const settings    = baseSettings;

  const ctaLabel      = slide?.cta_text           || 'Découvrir les offres';
  const ctaLink       = slide?.cta_link           || '/listings';
  const secLabel      = slide?.secondary_cta_text || 'Voir les nouveautés';
  const secondaryLink = slide?.secondary_cta_link || '/listings?sort=newest';
  const titleLine     = slide?.text_content?.[0]?.spans?.map(s => s.text).join('') || null;
  const subtitleLine  = slide?.text_content?.[1]?.spans?.map(s => s.text).join('') || null;
  const titleColor    = slide?.text_content?.[0]?.spans?.[0]?.color || null;
  const subtitleColor = slide?.text_content?.[1]?.spans?.[0]?.color || null;
  const deviceImg     = devOver.image_url || null;
  const desktopImg    = deviceImg || slide?.image_url || null;
  const hasImage      = !!desktopImg;

  // Badge — device-overridable
  const badgeShow     = eff('badge_show', true) !== false;
  const badgeText     = settings.badge_text       || 'Offres du mois';
  const badgeColor    = settings.badge_color      || '#fbc401';
  const badgeTxtColor = settings.badge_text_color || '#1a1a1a';

  // Description (3rd text element)
  const descriptionLine  = settings.description  || slide?.text_content?.[2]?.spans?.[0]?.text  || null;
  const descriptionColor = settings.description_color || slide?.text_content?.[2]?.spans?.[0]?.color || '#9CA3AF';

  // Background (classic) — device-overridable
  const bgType           = eff('bg_type', 'color');
  const gradientStart    = settings.gradient_start    || '#2EB565';
  const gradientEnd      = settings.gradient_end      || '#005023';
  const gradientDir      = settings.gradient_direction|| 'to right';
  const classicBgStyle   = bgType === 'gradient'
    ? { background: `linear-gradient(${gradientDir}, ${gradientStart}, ${gradientEnd})` }
    : bgType === 'image' && desktopImg
      ? { backgroundImage: `url(${desktopImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {};

  // Buttons
  const btnCount    = settings.btn_count  ?? 2;
  const btn1Style   = settings.btn1_style ?? 'fill';
  const btn1Color   = settings.btn1_color ?? '#fbc401';
  const btn2Style   = settings.btn2_style ?? 'outline';
  const btn2Color   = settings.btn2_color ?? '#ffffff';

  function btnInlineStyle(style, color) {
    const isLight = (() => {
      if (!color?.startsWith('#') || color.length < 7) return false;
      const r = parseInt(color.slice(1,3),16)/255, g = parseInt(color.slice(3,5),16)/255, b = parseInt(color.slice(5,7),16)/255;
      return (0.299*r + 0.587*g + 0.114*b) > 0.5;
    })();
    if (style === 'fill') return { backgroundColor: color, color: isLight ? '#111827' : '#ffffff', border: 'none' };
    return { backgroundColor: 'transparent', color, border: `2px solid ${color}` };
  }

  // Côté droit (classic) — device-overridable
  const rightSide     = eff('right_side', 'circle');
  const promoValue    = settings.promo_value   || '-50%';
  const promoLabelTop = settings.promo_label_top || 'Bons plans du mois';
  const promoCaption  = settings.promo_caption || 'Sur une sélection de produits';
  const promoColor    = settings.promo_color   || '#005023';

  // Decorative positioned image (mobile / tablet)
  // Read from current device, fall back to mobile settings if tablet has none
  const rawDevice    = deviceKey !== 'desktop' ? (baseSettings[deviceKey] || {}) : {};
  const rawMobile    = deviceKey === 'tablet'  ? (baseSettings['mobile']  || {}) : {};
  const decoUrl      = rawDevice.deco_url      || rawMobile.deco_url      || null;
  const decoPosition = rawDevice.deco_position || rawMobile.deco_position || 'bottom-right';
  const decoSize     = rawDevice.deco_size     ?? rawMobile.deco_size     ?? 40;
  const decoOpacity  = rawDevice.deco_opacity  ?? rawMobile.deco_opacity  ?? 1;

  // Map position key → flex alignment (avoids position:absolute %-in-flex issues)
  const decoFlexAlign = (() => {
    const map = {
      'top-left':      { alignItems: 'flex-start', justifyContent: 'flex-start' },
      'top-center':    { alignItems: 'flex-start', justifyContent: 'center' },
      'top-right':     { alignItems: 'flex-start', justifyContent: 'flex-end' },
      'center-left':   { alignItems: 'center',     justifyContent: 'flex-start' },
      'center':        { alignItems: 'center',     justifyContent: 'center' },
      'center-right':  { alignItems: 'center',     justifyContent: 'flex-end' },
      'bottom-left':   { alignItems: 'flex-end',   justifyContent: 'flex-start' },
      'bottom-center': { alignItems: 'flex-end',   justifyContent: 'center' },
      'bottom-right':  { alignItems: 'flex-end',   justifyContent: 'flex-end' },
    };
    return map[decoPosition] || map['bottom-right'];
  })();

  if (loading) return (
    <section className="pt-4 pb-2">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="h-[300px] sm:h-[340px] rounded-2xl bg-card-bg border border-gray-100 animate-pulse" />
      </div>
    </section>
  );

  return (
    <section className="pt-4 pb-2">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative">

        {/* ── LAYOUT: V22 HERO BUILDER ── */}
        {layoutType === 'v22' && settings.builder_data_v22 && (
          <V22Hero state={settings.builder_data_v22} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />
        )}

        {/* ── LAYOUT: BUILDER (drag-and-drop) ── */}
        {layoutType === 'builder' && settings.builder_data && (
          <BuilderHero builderData={settings.builder_data} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />
        )}

        {/* ── LAYOUT: IMAGE PLEINE ── */}
        {layoutType === 'fullimage' && (
          <div
            className="rounded-2xl overflow-hidden relative min-h-[300px] sm:min-h-[320px] lg:min-h-[360px]"
            style={{ backgroundColor: slide?.background_color || '#000000' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                {desktopImg && (
                  <img
                    src={desktopImg}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LAYOUT: IMAGE DE FOND + TEXTE PAR-DESSUS ── */}
        {layoutType === 'overlay' && (
          <div
            className="rounded-2xl overflow-hidden relative min-h-[300px] sm:min-h-[340px] lg:min-h-[380px] flex items-center justify-center"
            style={{
              backgroundColor: slide?.background_color || '#005023',
              backgroundImage: desktopImg ? `url(${desktopImg})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {slide?.overlay_enabled && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: hexToRgba(slide.overlay_color || '#000000', slide.overlay_opacity ?? 0.5) }}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 flex flex-col items-center text-center px-6 sm:px-16 py-10 sm:py-14 w-full"
              >
                {badgeShow && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                    style={{ backgroundColor: badgeColor, color: badgeTxtColor }}>
                    {badgeText}
                  </span>
                )}
                <h1 className="text-[26px] sm:text-[38px] lg:text-[48px] font-black leading-tight mb-3 text-white">
                  {titleLine
                    ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(titleLine) }} />
                    : <><span>Achetez malin,</span><br /><span className="text-accent-yellow">économisez plus !</span></>
                  }
                </h1>
                <p className="text-[12px] sm:text-[15px] text-white/80 mb-2 max-w-md">
                  {subtitleLine || 'Des milliers de produits de qualité à des prix imbattables.'}
                </p>
                {descriptionLine && (
                  <p className="text-[11px] sm:text-[13px] mb-5 max-w-md" style={{ color: descriptionColor }}>{descriptionLine}</p>
                )}
                {!descriptionLine && <div className="mb-5" />}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {btnCount >= 1 && (
                    <Link to={ctaLink}>
                      <button className="h-[40px] sm:h-[48px] px-6 sm:px-8 font-bold text-[13px] sm:text-[15px] rounded-xl transition-opacity hover:opacity-80"
                        style={btnInlineStyle(btn1Style, btn1Color)}>
                        {ctaLabel} &nbsp;→
                      </button>
                    </Link>
                  )}
                  {btnCount >= 2 && (
                    <Link to={secondaryLink}>
                      <button className="h-[40px] sm:h-[48px] px-6 sm:px-8 font-bold text-[13px] sm:text-[15px] rounded-xl transition-opacity hover:opacity-80"
                        style={btnInlineStyle(btn2Style, btn2Color)}>
                        {secLabel}
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LAYOUT: CLASSIQUE (image droite, texte gauche) ── */}
        {/* Classique : affiché si pas un layout spécial, OU si v22/builder sans données publiées */}
        {layoutType !== 'fullimage' && layoutType !== 'overlay' &&
         !(layoutType === 'v22' && settings.builder_data_v22) &&
         !(layoutType === 'builder' && settings.builder_data) && (
          <div
            className="rounded-2xl overflow-hidden relative flex items-center min-h-[300px] sm:min-h-[320px] lg:min-h-[340px] px-5 sm:px-10 py-6 sm:py-8"
            style={{ backgroundColor: bgType === 'color' ? (slide?.background_color || undefined) : undefined, ...classicBgStyle }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >

            {/* ── GAUCHE ── */}
            <div className="flex-1 max-w-[280px] sm:max-w-[400px] lg:max-w-[480px] pr-3 sm:pr-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  {badgeShow && (
                    <span
                      className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 sm:mb-5"
                      style={{ backgroundColor: badgeColor, color: badgeTxtColor }}
                    >
                      {badgeText}
                    </span>
                  )}

                  <h1 className="text-[24px] sm:text-[34px] lg:text-[40px] font-black leading-[1.08] mb-2 sm:mb-3" style={{ color: titleColor || '#111827' }}>
                    {titleLine
                      ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(titleLine) }} />
                      : <>Achetez malin,<br /><span className="text-custom-green-500">économisez plus !</span></>
                    }
                  </h1>

                  <p className="text-[12px] sm:text-[14px] leading-relaxed mb-2" style={{ color: subtitleColor || '#6B7280' }}>
                    {subtitleLine || <>Des milliers de produits de qualité<br />à des prix imbattables.</>}
                  </p>

                  {descriptionLine && (
                    <p className="text-[11px] sm:text-[13px] leading-relaxed mb-4 sm:mb-6" style={{ color: descriptionColor }}>{descriptionLine}</p>
                  )}
                  {!descriptionLine && <div className="mb-4 sm:mb-7" />}

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {btnCount >= 1 && (
                      <Link to={ctaLink}>
                        <button className="h-[38px] sm:h-[46px] px-4 sm:px-6 font-bold text-[12px] sm:text-[14px] rounded-xl transition-opacity hover:opacity-80"
                          style={btnInlineStyle(btn1Style, btn1Color)}>
                          {ctaLabel} &nbsp;→
                        </button>
                      </Link>
                    )}
                    {btnCount >= 2 && (
                      <Link to={secondaryLink}>
                        <button className="h-[38px] sm:h-[46px] px-4 sm:px-6 font-bold text-[12px] sm:text-[14px] rounded-xl transition-opacity hover:opacity-80"
                          style={btnInlineStyle(btn2Style, btn2Color)}>
                          {secLabel}
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── DROITE ── */}
            <div className="shrink-0 w-[110px] sm:w-[220px] lg:w-[380px] flex items-center justify-center self-stretch relative">
              <div className="hidden lg:block absolute bottom-[-24px] right-[-24px] w-[300px] h-[300px] rounded-full" style={{ background: '#fbc401', opacity: 0.2 }} />

              {/* Image desktop (quand right_side = 'image') */}
              {rightSide === 'image' && hasImage && (
                <img
                  src={desktopImg}
                  alt=""
                  className="hidden lg:block absolute inset-0 w-full h-full object-contain z-10"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )}

              {/* Cercle promo — affiché quand right_side = 'circle' */}
              {rightSide === 'circle' && (
                <div
                  className="flex relative z-20 w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] lg:w-[190px] lg:h-[190px] rounded-full flex-col items-center justify-center text-center px-2 sm:px-5 border-2 sm:border-4 border-white/20 shadow-lg"
                  style={{ backgroundColor: promoColor }}
                >
                  <span className="text-[7px] sm:text-[9px] font-bold text-white/70 uppercase tracking-widest leading-tight">{promoLabelTop}</span>
                  <span className="text-[7px] sm:text-[10px] text-white/70 mt-1">Jusqu'à</span>
                  <span className="text-[30px] sm:text-[44px] lg:text-[48px] font-black text-accent-yellow leading-none">{promoValue}</span>
                  <span className="text-[6px] sm:text-[9px] text-white/70 uppercase tracking-wider mt-0.5 leading-tight">{promoCaption}</span>
                </div>
              )}
            </div>

            {/* ── Image décorative positionnée (mobile / tablette) ── */}
            {decoUrl && deviceKey !== 'desktop' && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 10, pointerEvents: 'none',
                display: 'flex',
                alignItems: decoFlexAlign.alignItems,
                justifyContent: decoFlexAlign.justifyContent,
                padding: '5%',
              }}>
                <img src={decoUrl} alt="" style={{ width: `${decoSize}%`, objectFit: 'contain', opacity: decoOpacity }} />
              </div>
            )}

            {/* ── Dots ── */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-custom-green-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Flèches desktop uniquement ── */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={next}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
