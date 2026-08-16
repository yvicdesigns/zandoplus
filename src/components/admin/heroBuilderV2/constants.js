export const DEVICES = ['desktop', 'tablet', 'mobile'];

// Dimensions calquées sur le vrai conteneur du hero en prod (src/components/home/HeroSection.jsx) :
// max-w-[1280px] mx-auto px-4 sm:px-6, hauteurs alignées sur les layout_type existants (v22/overlay/fullimage/classic).
export const CANVAS_SIZE = {
  desktop: { w: 1232, h: 380, label: '1232 × 380' },
  tablet: { w: 720, h: 340, label: '720 × 340' },
  mobile: { w: 358, h: 300, label: '358 × 300' },
};

export const DEFAULT_BACKGROUND = {
  desktop: 'linear-gradient(135deg, #101657, #211569 52%, #9f368f)',
  tablet: 'linear-gradient(135deg, #101657, #6f38b2)',
  mobile: 'linear-gradient(160deg, #101657, #9f368f)',
};

export const ELEMENT_TYPES = {
  text: {
    label: 'Texte',
    defaults: (canvas) => ({
      type: 'text',
      name: 'Texte',
      text: 'Nouveau texte',
      fontSize: 24,
      fontWeight: 700,
      color: '#ffffff',
      align: 'left',
      rotation: 0,
      opacity: 1,
      layout: centeredLayout(canvas, 300, 60),
    }),
  },
  button: {
    label: 'Bouton',
    defaults: (canvas) => ({
      type: 'button',
      name: 'Bouton',
      text: 'Cliquez ici',
      link: '/listings',
      bgColor: '#ff6d81',
      textColor: '#ffffff',
      rotation: 0,
      opacity: 1,
      layout: centeredLayout(canvas, 180, 44),
    }),
  },
  image: {
    label: 'Image',
    defaults: (canvas) => ({
      type: 'image',
      name: 'Image',
      imageUrl: '',
      fit: 'cover',
      rotation: 0,
      opacity: 1,
      layout: centeredLayout(canvas, 280, 220),
    }),
  },
  badge: {
    label: 'Badge',
    defaults: (canvas) => ({
      type: 'badge',
      name: 'Badge',
      text: 'Promo -20%',
      bgColor: '#ff6d81',
      textColor: '#ffffff',
      rotation: 0,
      opacity: 1,
      layout: centeredLayout(canvas, 140, 32),
    }),
  },
  shape: {
    label: 'Forme',
    defaults: (canvas) => ({
      type: 'shape',
      name: 'Forme',
      shape: 'rect',
      bgColor: '#ffffff',
      rotation: 0,
      opacity: 0.15,
      layout: centeredLayout(canvas, 140, 140),
    }),
  },
  separator: {
    label: 'Séparateur',
    defaults: (canvas) => ({
      type: 'separator',
      name: 'Séparateur',
      bgColor: '#ffffff',
      rotation: 0,
      opacity: 0.6,
      layout: centeredLayout(canvas, 200, 3),
    }),
  },
};

function centeredLayout(canvas, w, h) {
  const x = Math.max(0, Math.round((canvas.w - w) / 2));
  const y = Math.max(0, Math.round((canvas.h - h) / 2));
  return { x, y, w, h };
}

// Centre un élément par device selon un ratio vertical, en le bornant toujours à l'intérieur
// du canvas de CE device (largeur/hauteur/position clampées) — un template ne peut donc jamais
// produire un élément hors-cadre, même si ses dimensions de base ont été pensées pour un autre
// canvas.
function layoutAllDevices(w, h, centerYRatio) {
  const layout = {};
  DEVICES.forEach((d) => {
    const canvas = CANVAS_SIZE[d];
    const bw = Math.min(w, canvas.w);
    const bh = Math.min(h, canvas.h);
    const x = Math.max(0, Math.min(Math.round((canvas.w - bw) / 2), canvas.w - bw));
    const y = Math.max(0, Math.min(Math.round(canvas.h * centerYRatio - bh / 2), canvas.h - bh));
    layout[d] = { x, y, w: bw, h: bh };
  });
  return layout;
}

let tplCounter = 0;
const tplId = () => `el_tpl_${Date.now()}_${tplCounter++}`;

export const SLIDE_TEMPLATES = [
  {
    key: 'blank',
    label: 'Vide',
    build: () => ({ background: { ...DEFAULT_BACKGROUND }, elements: [] }),
  },
  {
    key: 'promo',
    label: 'Promo',
    build: () => ({
      background: { ...DEFAULT_BACKGROUND },
      elements: [
        { id: tplId(), type: 'badge', name: 'Badge', text: 'Promo -20%', bgColor: '#ff6d81', textColor: '#ffffff', layout: layoutAllDevices(140, 32, 0.22) },
        { id: tplId(), type: 'text', name: 'Texte', text: 'Les meilleures offres du moment', fontSize: 24, fontWeight: 700, color: '#ffffff', align: 'center', layout: layoutAllDevices(320, 64, 0.5) },
        { id: tplId(), type: 'button', name: 'Bouton', text: 'Voir les offres', link: '/listings?daily=true', bgColor: '#ff6d81', textColor: '#ffffff', layout: layoutAllDevices(170, 40, 0.8) },
      ],
    }),
  },
  {
    key: 'image_text',
    label: 'Image + texte',
    build: () => ({
      background: { ...DEFAULT_BACKGROUND },
      elements: [
        { id: tplId(), type: 'text', name: 'Texte', text: 'Découvrez la nouvelle collection', fontSize: 22, fontWeight: 700, color: '#ffffff', align: 'left', layout: layoutAllDevices(320, 56, 0.2) },
        { id: tplId(), type: 'button', name: 'Bouton', text: 'Découvrir', link: '/listings', bgColor: '#ffffff', textColor: '#101657', layout: layoutAllDevices(160, 40, 0.42) },
        { id: tplId(), type: 'image', name: 'Image', imageUrl: '', fit: 'cover', layout: layoutAllDevices(220, 120, 0.75) },
      ],
    }),
  },
  {
    key: 'simple_text',
    label: 'Texte simple',
    build: () => ({
      background: { ...DEFAULT_BACKGROUND },
      elements: [
        { id: tplId(), type: 'text', name: 'Titre', text: 'Bienvenue sur Zando+', fontSize: 30, fontWeight: 700, color: '#ffffff', align: 'center', layout: layoutAllDevices(320, 56, 0.4) },
        { id: tplId(), type: 'text', name: 'Sous-titre', text: 'Achetez, vendez, simplement.', fontSize: 15, fontWeight: 400, color: '#e5e5f0', align: 'center', layout: layoutAllDevices(320, 28, 0.58) },
      ],
    }),
  },
];

export const MIN_EL_W = 40;
export const MIN_EL_H = 24;
