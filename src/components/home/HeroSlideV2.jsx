// Rendu public, en lecture seule, d'une slide créée avec le Hero Builder v2
// (src/components/admin/heroBuilderV2/). Aucune interactivité (pas de drag, pas de
// sélection, pas de barre d'outils) — juste la même logique visuelle que CanvasElement.jsx
// en mode "non-editing", pour que ce qui est conçu dans l'éditeur soit exactement ce qui
// s'affiche sur la vraie page.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cornerRadius, effectStyle, borderStyle, parseBgImage, isElementHidden, animationStyle, ANIMATION_KEYFRAMES_CSS } from '@/components/admin/heroBuilderV2/elementStyles';
import { ICON_MAP } from '@/components/admin/heroBuilderV2/iconLibrary';
import { CANVAS_SIZE } from '@/components/admin/heroBuilderV2/constants';

const ALIGN_TO_JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' };

const HeroV2Element = ({ element, device }) => {
  const layout = element.layout?.[device] || element.layout?.desktop;
  if (!layout) return null;

  const fontSize = element.fontSizeByDevice?.[device] ?? element.fontSize;
  const align = element.alignByDevice?.[device] ?? element.align;
  const subFontSize = element.subFontSizeByDevice?.[device] ?? element.subFontSize;
  const style = {
    position: 'absolute',
    left: layout.x,
    top: layout.y,
    width: layout.w,
    height: layout.h,
    pointerEvents: element.type === 'button' ? 'auto' : 'none',
    ...animationStyle(element),
    ...effectStyle(element),
  };
  const contentStyle = { width: '100%', height: '100%', opacity: element.opacity ?? 1 };

  return (
    <div style={style}>
      {element.type === 'text' && (
        <div
          style={{
            ...contentStyle, overflow: 'hidden',
            fontSize, fontWeight: element.fontWeight,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            textTransform: element.textTransform || 'none',
            color: element.color, textAlign: align,
            background: element.bgColor || 'transparent',
            lineHeight: element.lineHeight ?? 1.15,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'button' && (
        <Link
          to={element.link || '#'}
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: ALIGN_TO_JUSTIFY[align] || 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 14,
            borderRadius: cornerRadius(element, 8), border: borderStyle(element), boxSizing: 'border-box', textDecoration: 'none',
            padding: '0 12px',
          }}
        >
          {element.text}
        </Link>
      )}
      {element.type === 'badge' && (
        <div
          style={{
            ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: ALIGN_TO_JUSTIFY[align] || 'center',
            background: element.bgColor, color: element.textColor, fontWeight: 700, fontSize: fontSize ?? 12,
            letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: cornerRadius(element, 999),
            border: borderStyle(element), boxSizing: 'border-box', padding: '0 10px',
          }}
        >
          {element.text}
        </div>
      )}
      {element.type === 'stat' && (
        <div
          style={{
            ...contentStyle, display: 'flex', flexDirection: 'column', alignItems: ALIGN_TO_JUSTIFY[align] || 'center', justifyContent: 'center',
            background: element.bgColor, borderRadius: cornerRadius(element, 14), border: borderStyle(element), boxSizing: 'border-box',
            padding: '4px 10px', overflow: 'hidden',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: fontSize ?? 22, lineHeight: 1.1, color: element.textColor }}>{element.text}</span>
          <span style={{ fontWeight: 500, fontSize: subFontSize ?? 11, color: element.subColor, marginTop: element.gap ?? 4 }}>{element.subtext}</span>
        </div>
      )}
      {element.type === 'image' && element.imageUrl && (
        <div style={{ ...contentStyle, overflow: 'hidden', borderRadius: cornerRadius(element, 6), border: borderStyle(element), boxSizing: 'border-box' }}>
          <img
            src={element.imageUrl}
            alt=""
            style={{
              width: '100%', height: '100%', objectFit: element.fit || 'cover',
              objectPosition: `${element.focal?.x ?? 50}% ${element.focal?.y ?? 50}%`,
              transform: element.focal?.zoom && element.focal.zoom !== 1 ? `scale(${element.focal.zoom})` : undefined,
              transformOrigin: `${element.focal?.x ?? 50}% ${element.focal?.y ?? 50}%`,
            }}
          />
        </div>
      )}
      {element.type === 'video' && element.videoUrl && (
        <div style={{ ...contentStyle, overflow: 'hidden', borderRadius: cornerRadius(element, 6), border: borderStyle(element), boxSizing: 'border-box' }}>
          <video
            src={element.videoUrl}
            poster={element.poster || undefined}
            autoPlay={element.autoplay !== false}
            loop={element.loop !== false}
            muted={element.muted !== false}
            controls={!!element.controls}
            playsInline
            style={{
              width: '100%', height: '100%', objectFit: element.fit || 'cover',
              objectPosition: `${element.focal?.x ?? 50}% ${element.focal?.y ?? 50}%`,
              transform: element.focal?.zoom && element.focal.zoom !== 1 ? `scale(${element.focal.zoom})` : undefined,
              transformOrigin: `${element.focal?.x ?? 50}% ${element.focal?.y ?? 50}%`,
            }}
          />
        </div>
      )}
      {element.type === 'shape' && (
        <div
          style={{
            ...contentStyle,
            background: element.bgColor,
            borderRadius: element.shape === 'circle' ? '50%' : cornerRadius(element, 10),
            border: borderStyle(element), boxSizing: 'border-box',
          }}
        />
      )}
      {element.type === 'separator' && (
        <div style={{ ...contentStyle, background: element.bgColor }} />
      )}
      {element.type === 'icon' && (() => {
        const Icon = ICON_MAP[element.icon] || ICON_MAP.Star;
        return (
          <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon color={element.color} strokeWidth={element.strokeWidth ?? 2} style={{ width: '100%', height: '100%' }} />
          </div>
        );
      })()}
    </div>
  );
};


// Une slide du Hero Builder v2, mise à l'échelle pour remplir son conteneur (dimensions
// fluides de la vraie page) tout en gardant les proportions et positions conçues dans
// l'éditeur — même principe que BuilderHero (scale par la largeur), déjà utilisé plus haut
// dans ce dossier pour les anciennes slides "builder".
const HeroSlideV2 = ({ slide, device, onTouchStart, onTouchEnd }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const canvas = CANVAS_SIZE[device] || CANVAS_SIZE.desktop;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / canvas.w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.w]);

  const background = slide?.background?.[device] || slide?.background?.desktop || '#171a32';
  const isVideoBg = typeof background === 'string' && background.startsWith('video:');
  const bgImage = !isVideoBg ? parseBgImage(background) : null;
  const elements = (slide?.elements || []).filter((e) => !isElementHidden(e, device));

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height: canvas.h * scale, background: isVideoBg ? '#000' : (bgImage ? '#171a32' : background) }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{ANIMATION_KEYFRAMES_CSS}</style>
      {bgImage && (
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url('${bgImage.url}')`,
            backgroundPosition: `${bgImage.x}% ${bgImage.y}%`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: bgImage.zoom && bgImage.zoom !== 1 ? `scale(${bgImage.zoom})` : undefined,
            transformOrigin: `${bgImage.x}% ${bgImage.y}%`,
          }}
        />
      )}
      {isVideoBg && (
        <video
          src={background.slice(6)}
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{ width: canvas.w, height: canvas.h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        {elements.map((el) => <HeroV2Element key={el.id} element={el} device={device} />)}
      </div>
    </div>
  );
};

export default HeroSlideV2;
