export const DEVICES = ['desktop', 'tablet', 'mobile'];

export const CANVAS_SIZE = {
  desktop: { w: 960, h: 450, label: '1920 × 900' },
  tablet: { w: 720, h: 450, label: '1440 × 900' },
  mobile: { w: 390, h: 520, label: '390 × 520' },
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
      layout: centeredLayout(canvas, 140, 32),
    }),
  },
};

function centeredLayout(canvas, w, h) {
  const x = Math.max(0, Math.round((canvas.w - w) / 2));
  const y = Math.max(0, Math.round((canvas.h - h) / 2));
  return { x, y, w, h };
}

function layoutAllDevices(w, h, centerYRatio) {
  const layout = {};
  DEVICES.forEach((d) => {
    const canvas = CANVAS_SIZE[d];
    const x = Math.max(0, Math.round((canvas.w - w) / 2));
    const y = Math.max(0, Math.round(canvas.h * centerYRatio - h / 2));
    layout[d] = { x, y, w, h };
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
        { id: tplId(), type: 'badge', name: 'Badge', text: 'Promo -20%', bgColor: '#ff6d81', textColor: '#ffffff', layout: layoutAllDevices(140, 32, 0.3) },
        { id: tplId(), type: 'text', name: 'Texte', text: 'Les meilleures offres du moment', fontSize: 28, fontWeight: 700, color: '#ffffff', align: 'center', layout: layoutAllDevices(420, 70, 0.5) },
        { id: tplId(), type: 'button', name: 'Bouton', text: 'Voir les offres', link: '/listings?daily=true', bgColor: '#ff6d81', textColor: '#ffffff', layout: layoutAllDevices(180, 44, 0.72) },
      ],
    }),
  },
  {
    key: 'image_text',
    label: 'Image + texte',
    build: () => ({
      background: { ...DEFAULT_BACKGROUND },
      elements: [
        { id: tplId(), type: 'text', name: 'Texte', text: 'Découvrez la nouvelle collection', fontSize: 28, fontWeight: 700, color: '#ffffff', align: 'left', layout: layoutAllDevices(360, 80, 0.3) },
        { id: tplId(), type: 'button', name: 'Bouton', text: 'Découvrir', link: '/listings', bgColor: '#ffffff', textColor: '#101657', layout: layoutAllDevices(160, 44, 0.5) },
        { id: tplId(), type: 'image', name: 'Image', imageUrl: '', fit: 'cover', layout: layoutAllDevices(260, 200, 0.78) },
      ],
    }),
  },
  {
    key: 'simple_text',
    label: 'Texte simple',
    build: () => ({
      background: { ...DEFAULT_BACKGROUND },
      elements: [
        { id: tplId(), type: 'text', name: 'Titre', text: 'Bienvenue sur Zando+', fontSize: 34, fontWeight: 700, color: '#ffffff', align: 'center', layout: layoutAllDevices(420, 60, 0.42) },
        { id: tplId(), type: 'text', name: 'Sous-titre', text: 'Achetez, vendez, simplement.', fontSize: 16, fontWeight: 400, color: '#e5e5f0', align: 'center', layout: layoutAllDevices(360, 30, 0.55) },
      ],
    }),
  },
];

export const MIN_EL_W = 40;
export const MIN_EL_H = 24;
