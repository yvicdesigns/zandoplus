import React from 'react';

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || hex.length < 4) hex = '#000000';
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getBgStyle = (d) => {
  const bgType = d?.bg_type || 'color';
  if (bgType === 'gradient') {
    const dir   = d?.gradient_direction || 'to right';
    const start = d?.gradient_start     || '#2EB565';
    const end   = d?.gradient_end       || '#005023';
    return { background: `linear-gradient(${dir}, ${start}, ${end})` };
  }
  if (bgType === 'image') return {};
  return { backgroundColor: d?.background_color || '#ffffff' };
};

const HeroSlidePreview = ({ slideData: d, imageUrl, mode = 'desktop' }) => {
  const isMobile = mode === 'mobile';
  const layout        = d?.layout_type  || 'classic';
  const title         = d?.title        || '';
  const subtitle      = d?.subtitle     || '';
  const description   = d?.description  || '';
  const ctaText       = d?.btn_count >= 1 ? (d?.cta_text            || 'Bouton principal') : null;
  const secText       = d?.btn_count >= 2 ? (d?.secondary_cta_text  || null)               : null;
  const btn1Style     = d?.btn1_style   || 'filled';
  const btn2Style     = d?.btn2_style   || 'outline';
  const badge         = d?.badge_show !== false;
  const badgeText     = d?.badge_text       || 'Offres du mois';
  const badgeColor    = d?.badge_color      || '#fbc401';
  const badgeTxtColor = d?.badge_text_color || '#1a1a1a';
  const titleColor    = d?.title_color      || (layout === 'classic' ? '#111827' : '#ffffff');
  const subtitleColor = d?.subtitle_color   || (layout === 'classic' ? '#6B7280' : 'rgba(255,255,255,0.75)');
  const descColor     = d?.description_color|| '#9CA3AF';
  const bgStyle       = getBgStyle(d);
  const bgType        = d?.bg_type || 'color';
  const rightSide     = d?.right_side      || 'circle';
  const promoValue    = d?.promo_value     || '-50%';
  const promoLabelTop = d?.promo_label_top || 'Bons plans du mois';
  const promoCaption  = d?.promo_caption   || 'Sur une sélection de produits';
  const promoColor    = d?.promo_color     || '#005023';

  /* Shared button renderer */
  const Btn1 = ({ text, small }) => {
    const cls = btn1Style === 'filled'
      ? 'bg-green-700 text-white font-bold'
      : 'border-2 border-green-700 text-green-700 font-bold bg-transparent';
    return (
      <div className={`${cls} rounded-xl ${small ? 'text-[7px] px-2 py-1' : 'text-[9px] px-3 py-1.5'}`}>{text} →</div>
    );
  };
  const Btn2 = ({ text, small, dark }) => {
    const cls = btn2Style === 'filled'
      ? 'bg-green-700 text-white font-bold'
      : dark
        ? 'border-2 border-white/40 text-white font-bold bg-white/10'
        : 'border-2 border-green-700 text-green-700 font-bold bg-transparent';
    return (
      <div className={`${cls} rounded-xl ${small ? 'text-[7px] px-2 py-1' : 'text-[9px] px-3 py-1.5'}`}>{text}</div>
    );
  };

  /* ── FULLIMAGE ── */
  if (layout === 'fullimage') {
    const h = isMobile ? 'min-h-[140px]' : 'w-full h-full';
    return (
      <div className={`${h} rounded-xl overflow-hidden relative`} style={{ backgroundColor: '#111', ...bgStyle }}>
        {bgType === 'image' && imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        {!imageUrl && (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-white/30 gap-2">
            <div className="text-3xl">🖼️</div>
            <span className="text-[10px]">Ajouter une image</span>
          </div>
        )}
        {!isMobile && <span className="absolute bottom-2 left-2 text-[9px] bg-black/30 text-white/60 px-1.5 py-0.5 rounded">Image pleine</span>}
      </div>
    );
  }

  /* ── OVERLAY ── */
  if (layout === 'overlay') {
    const containerCls = isMobile
      ? 'w-full min-h-[160px] relative flex items-center justify-center overflow-hidden'
      : 'w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center shadow-md border';
    return (
      <div
        className={containerCls}
        style={{
          backgroundColor: d?.background_color || '#005023',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {d?.overlay_enabled && (
          <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(d.overlay_color || '#000', d.overlay_opacity ?? 0.45) }} />
        )}
        <div className="relative z-10 flex flex-col items-center text-center px-4 py-6 w-full">
          {badge && (
            <span className={`inline-block font-black uppercase tracking-widest rounded-full mb-2 ${isMobile ? 'text-[7px] px-2 py-0.5' : 'text-[8px] px-2.5 py-0.5'}`}
              style={{ backgroundColor: badgeColor, color: badgeTxtColor }}>
              {badgeText}
            </span>
          )}
          {title && (
            <p className={`font-black leading-tight mb-1.5 ${isMobile ? 'text-[12px]' : 'text-[15px]'}`} style={{ color: titleColor }}>{title}</p>
          )}
          {subtitle && (
            <p className={`leading-snug mb-3 max-w-[220px] ${isMobile ? 'text-[8px]' : 'text-[9px]'}`} style={{ color: subtitleColor }}>{subtitle}</p>
          )}
          {description && (
            <p className="text-[8px] leading-snug mb-2 max-w-[200px] opacity-80" style={{ color: subtitleColor }}>{description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {ctaText && <Btn1 text={ctaText} small={isMobile} />}
            {secText  && <Btn2 text={secText}  small={isMobile} dark />}
          </div>
        </div>
        {!isMobile && <span className="absolute bottom-2 left-2 text-[9px] bg-black/30 text-white/60 px-1.5 py-0.5 rounded">Fond + texte</span>}
      </div>
    );
  }

  /* ── CLASSIC ── */
  const hasImageBg = bgType === 'image' && imageUrl;

  const containerStyle = {
    ...bgStyle,
    ...(hasImageBg ? {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } : {}),
  };

  if (isMobile) {
    return (
      <div className="w-full flex items-center px-3 py-4 min-h-[150px] relative overflow-hidden" style={containerStyle}>
        {/* Left text */}
        <div className="flex-1 min-w-0 pr-2">
          {badge && (
            <span className="inline-block text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: badgeColor, color: badgeTxtColor }}>
              {badgeText}
            </span>
          )}
          {title && (
            <p className="font-black leading-tight mb-1 text-[12px] line-clamp-2" style={{ color: titleColor }}>{title}</p>
          )}
          {subtitle && (
            <p className="text-[8px] leading-snug mb-2 line-clamp-1" style={{ color: subtitleColor }}>{subtitle}</p>
          )}
          {description && (
            <p className="text-[7px] leading-snug mb-2 opacity-75 line-clamp-1" style={{ color: descColor }}>{description}</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ctaText && <Btn1 text={ctaText} small />}
            {secText  && <Btn2 text={secText}  small />}
          </div>
        </div>
        {/* Right */}
        {rightSide === 'circle' && (
          <div className="w-[68px] h-[68px] rounded-full shrink-0 flex flex-col items-center justify-center text-center px-1 border-2 border-white/20 shadow-md"
            style={{ backgroundColor: promoColor }}>
            <span className="text-[4px] font-bold text-white/70 uppercase">{promoLabelTop.split(' ').slice(0, 3).join(' ')}</span>
            <span className="text-[4px] text-white/60 mt-0.5">Jusqu'à</span>
            <span className="text-[18px] font-black text-yellow-400 leading-none">{promoValue}</span>
            <span className="text-[3.5px] text-white/60 uppercase mt-0.5">{promoCaption.slice(0, 18)}</span>
          </div>
        )}
        {rightSide === 'image' && imageUrl && (
          <div className="w-[70px] h-[70px] shrink-0">
            <img src={imageUrl} alt="" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    );
  }

  /* Desktop classic */
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-md border relative flex items-center" style={containerStyle}>
      {/* Left */}
      <div className="flex-1 px-5 py-5 flex flex-col justify-center overflow-hidden">
        {badge && (
          <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 self-start"
            style={{ backgroundColor: badgeColor, color: badgeTxtColor }}>
            {badgeText}
          </span>
        )}
        {title && (
          <p className="font-black leading-tight mb-1.5" style={{ fontSize: '15px', color: titleColor }}>{title}</p>
        )}
        {subtitle && (
          <p className="leading-snug mb-1 text-[9px]" style={{ color: subtitleColor }}>{subtitle}</p>
        )}
        {description && (
          <p className="leading-snug mb-3 text-[8px] opacity-75" style={{ color: descColor }}>{description}</p>
        )}
        {!description && <div className="mb-3" />}
        <div className="flex items-center gap-2 flex-wrap">
          {ctaText && <Btn1 text={ctaText} />}
          {secText  && <Btn2 text={secText} />}
        </div>
      </div>

      {/* Right */}
      <div className="w-[38%] self-stretch shrink-0 relative flex items-center justify-center overflow-hidden">
        <div className="absolute bottom-[-20px] right-[-20px] w-[130px] h-[130px] rounded-full" style={{ background: '#fbc401', opacity: 0.18 }} />

        {rightSide === 'circle' && (
          <div className="relative z-10 w-[90px] h-[90px] rounded-full flex flex-col items-center justify-center text-center px-2 border-2 border-white/20 shadow-lg"
            style={{ backgroundColor: promoColor }}>
            {promoLabelTop.split(' ').slice(0, 2).map((w, i) => (
              <span key={i} className="text-[5px] font-bold text-white/80 uppercase">{w}</span>
            ))}
            <span className="text-[5px] text-white/70 mt-0.5">Jusqu'à</span>
            <span className="text-[24px] font-black text-yellow-400 leading-none">{promoValue}</span>
            <span className="text-[4px] text-white/70 uppercase leading-tight mt-0.5">{promoCaption.slice(0, 28)}</span>
          </div>
        )}

        {rightSide === 'image' && imageUrl && (
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain z-10" />
        )}
        {rightSide === 'image' && !imageUrl && (
          <div className="relative z-10 flex flex-col items-center text-gray-300 text-[9px]">
            <div className="text-3xl mb-1">🖼️</div>
            Image droite
          </div>
        )}
      </div>

      <span className="absolute bottom-2 left-2 text-[9px] bg-black/10 text-gray-400 px-1.5 py-0.5 rounded">Classique</span>
    </div>
  );
};

export default HeroSlidePreview;
