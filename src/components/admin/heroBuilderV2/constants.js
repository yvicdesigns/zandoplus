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

export const MIN_EL_W = 40;
export const MIN_EL_H = 24;
