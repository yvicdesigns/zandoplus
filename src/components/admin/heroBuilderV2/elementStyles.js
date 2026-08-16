// Logique de style pure, partagée entre l'éditeur (CanvasElement.jsx) et le rendu public
// en lecture seule (src/components/home/HeroSlideV2.jsx). Aucune dépendance à React ni au
// DOM — juste des fonctions qui transforment un élément en styles CSS.

// Visibilité par device : `hiddenByDevice` prime sur l'ancien flag global `hidden`
// (conservé comme repli pour les éléments créés avant ce champ).
export const isElementHidden = (el, device) => el.hiddenByDevice?.[device] ?? !!el.hidden;

const hexToRgba = (hex, alpha) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return `rgba(0,0,0,${alpha})`;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Rayon des coins : soit un seul rayon (lié), soit 4 valeurs indépendantes par coin.
export const cornerRadius = (el, fallback) => {
  if (el.cornersLinked === false) {
    return `${el.radiusTL ?? fallback}px ${el.radiusTR ?? fallback}px ${el.radiusBR ?? fallback}px ${el.radiusBL ?? fallback}px`;
  }
  return `${el.radius ?? fallback}px`;
};

// Bordure (stroke) : undefined si désactivée. Largeur/couleur/style retombent sur les mêmes
// valeurs par défaut que le panneau de propriétés (2px, solid, noir) tant que l'admin ne les a
// pas explicitement changées après avoir coché "Activer".
export const borderStyle = (element) => {
  const b = element.border;
  if (!b?.enabled) return undefined;
  const width = b.width ?? 2;
  if (!width) return undefined;
  return `${width}px ${b.style || 'solid'} ${b.color || '#000000'}`;
};

export const effectStyle = (element) => {
  const filters = [];
  if (element.blur) filters.push(`blur(${element.blur}px)`);
  if (element.shadow?.enabled) {
    const s = element.shadow;
    filters.push(`drop-shadow(${s.x ?? 0}px ${s.y ?? 4}px ${s.blurAmt ?? 8}px ${hexToRgba(s.color ?? '#000000', s.opacity ?? 0.3)})`);
  }
  const scaleX = element.flipX ? -1 : 1;
  const scaleY = element.flipY ? -1 : 1;
  const transforms = [];
  if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`);
  if (element.rotation) transforms.push(`rotate(${element.rotation}deg)`);
  return {
    filter: filters.length ? filters.join(' ') : undefined,
    transform: transforms.length ? transforms.join(' ') : undefined,
  };
};

// Format de stockage du fond image : `url('...') X% Y%/cover no-repeat /*z:1.4*/`
// Le commentaire final (zoom, optionnel, omis si 1) est notre propre convention — jamais
// interprété par un moteur CSS, seulement relu par ce parseur.
export const parseBgImage = (css) => {
  const m = /^url\((['"]?)(.*?)\1\)\s*(?:center|(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%)\s*\/\s*cover/i.exec((css || '').trim());
  if (!m) return null;
  const zoomMatch = /\/\*z:([\d.]+)\*\//.exec(css);
  return {
    url: m[2],
    x: m[3] !== undefined ? Number(m[3]) : 50,
    y: m[4] !== undefined ? Number(m[4]) : 50,
    zoom: zoomMatch ? Number(zoomMatch[1]) : 1,
  };
};

export const buildBgImageCss = ({ url, x, y, zoom }) =>
  `url('${url}') ${x}% ${y}%/cover no-repeat${zoom && zoom !== 1 ? ` /*z:${zoom}*/` : ''}`;

// Animations d'entrée (jouent une fois, de "invisible" à l'état final) et animations de
// boucle (oscillent entre le même état de départ/arrivée — pensées pour tourner en continu).
// Les deux catégories sont sélectionnables pour n'importe quel élément ; la case "Boucle"
// dans le panneau Propriétés permet de faire boucler indéfiniment une animation d'entrée
// aussi, si l'admin le souhaite explicitement.
export const ANIMATIONS = [
  ['none', 'Aucune'],
  ['fade', 'Fondu'],
  ['slide-left', 'Depuis la gauche'],
  ['slide-right', 'Depuis la droite'],
  ['rise', 'Montée'],
  ['zoom', 'Zoom'],
  ['typing', 'Machine à écrire'],
  ['wiggle', 'Wiggle (balancement)'],
  ['pulse', 'Pulsation'],
  ['bounce', 'Rebond'],
  ['shake', 'Secousse'],
  ['float', 'Flottement'],
];

// La machine à écrire ne se règle que sur les éléments Texte (révèle le texte lui-même,
// pas une boîte) — les autres types de contenu ne peuvent pas afficher cette option.
export const TEXT_ONLY_ANIMATIONS = ['typing'];

// Types d'animation conçus pour boucler proprement (état de départ = état d'arrivée à
// chaque cycle) — utilisé pour cocher "Boucle" par défaut quand l'admin les choisit.
export const LOOP_FRIENDLY_ANIMATIONS = ['wiggle', 'pulse', 'bounce', 'shake', 'float'];

export const ANIMATION_KEYFRAMES_CSS = `
  @keyframes hb-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hb-slide-left { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes hb-slide-right { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes hb-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes hb-zoom { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
  @keyframes hb-wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
  @keyframes hb-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  @keyframes hb-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes hb-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
  @keyframes hb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes hb-caret { from, to { border-color: transparent; } 50% { border-color: currentColor; } }
`;

// Construit les propriétés d'animation longhand (plus sûr que le shorthand vis-à-vis de
// l'ordre des composants) à partir de `element.animation = { type, duration, loop }`.
// Appliqué au conteneur de l'élément (position/taille) — ne gère PAS "typing", qui est piloté
// en JS par le composant <TypingText> (révélation progressive du texte) plutôt qu'en CSS pur,
// justement pour respecter les retours à la ligne et ne jamais couper la fin du texte.
export const animationStyle = (element) => {
  const type = element.animation?.type;
  if (!type || type === 'none' || TEXT_ONLY_ANIMATIONS.includes(type)) return {};
  const loop = !!element.animation?.loop;
  return {
    animationName: `hb-${type}`,
    animationDuration: `${element.animation?.duration ?? 600}ms`,
    animationTimingFunction: loop ? 'ease-in-out' : 'ease-out',
    animationIterationCount: loop ? 'infinite' : 1,
    animationFillMode: 'both',
  };
};
