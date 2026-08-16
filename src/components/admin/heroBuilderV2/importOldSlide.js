// Convertit une slide de l'ancien système (table `hero_slides`, schéma à champs plats :
// text_content/cta_text/settings...) en une slide v2 (table `hero_slides_v2`, schéma à
// éléments positionnables). Best-effort : les mises en page complexes (promo box, badges
// décoratifs par device) ne sont pas reproduites à l'identique, seulement les éléments
// principaux (fond, badge, titre, sous-titre, boutons) — à ajuster ensuite dans l'éditeur.
import { CANVAS_SIZE, DEVICES } from './constants';

let counter = 0;
const genId = () => `el_import_${Date.now()}_${counter++}`;

const GRADIENT_DEG = {
  'to right': 90, 'to left': 270, 'to bottom': 180, 'to top': 0,
  'to bottom right': 135, 'to top left': 315, 'to bottom left': 225, 'to top right': 45,
};

function alignedLayout(w, h, yRatio, align) {
  const layout = {};
  DEVICES.forEach((d) => {
    const canvas = CANVAS_SIZE[d];
    const bw = Math.min(w, canvas.w - 32);
    const bh = Math.min(h, canvas.h);
    const useAlign = d === 'mobile' ? 'center' : align;
    let x = useAlign === 'left' ? 40 : Math.round((canvas.w - bw) / 2);
    x = Math.max(0, Math.min(x, canvas.w - bw));
    const y = Math.max(0, Math.min(Math.round(canvas.h * yRatio - bh / 2), canvas.h - bh));
    layout[d] = { x, y, w: bw, h: bh };
  });
  return layout;
}

function buildBackground(oldSlide) {
  const s = oldSlide?.settings || {};
  const bgType = s.bg_type || 'gradient';
  const build = (imageUrl) => {
    if (bgType === 'image') {
      const url = imageUrl || oldSlide.image_url;
      if (!url) return oldSlide.background_color || '#171a32';
      return `url('${url}') 50% 50%/cover no-repeat`;
    }
    if (bgType === 'gradient') {
      const deg = GRADIENT_DEG[s.gradient_direction] ?? 135;
      return `linear-gradient(${deg}deg, ${s.gradient_start || '#101657'}, ${s.gradient_end || '#211569'})`;
    }
    return oldSlide.background_color || '#171a32';
  };
  return {
    desktop: build(oldSlide.image_url),
    tablet: build(s.tablet?.image_url),
    mobile: build(s.mobile?.image_url),
  };
}

export function convertOldSlideToV2(oldSlide) {
  const s = oldSlide?.settings || {};
  const title = oldSlide?.text_content?.[0]?.spans?.[0];
  const subtitle = oldSlide?.text_content?.[1]?.spans?.[0];
  const align = oldSlide?.text_align === 'center' ? 'center' : 'left';
  const elements = [];

  if (s.badge_show && s.badge_text) {
    elements.push({
      id: genId(), type: 'badge', name: 'Badge',
      text: s.badge_text, bgColor: s.badge_color || '#fbc401', textColor: s.badge_text_color || '#1a1a1a',
      rotation: 0, opacity: 1,
      layout: alignedLayout(140, 32, 0.14, align),
    });
  }
  if (title?.text) {
    elements.push({
      id: genId(), type: 'text', name: 'Titre',
      text: title.text, fontSize: 30, fontWeight: 700, fontStyle: 'normal', textDecoration: 'none', textTransform: 'none',
      lineHeight: 1.15, letterSpacing: 0, color: title.color || '#ffffff', bgColor: null, align,
      rotation: 0, opacity: 1,
      layout: alignedLayout(440, 76, 0.35, align),
    });
  }
  if (subtitle?.text) {
    elements.push({
      id: genId(), type: 'text', name: 'Sous-titre',
      text: subtitle.text, fontSize: 15, fontWeight: 400, fontStyle: 'normal', textDecoration: 'none', textTransform: 'none',
      lineHeight: 1.4, letterSpacing: 0, color: subtitle.color || 'rgba(255,255,255,0.8)', bgColor: null, align,
      rotation: 0, opacity: 1,
      layout: alignedLayout(440, 50, 0.55, align),
    });
  }
  if (oldSlide?.cta_text) {
    const fill = (s.btn1_style || 'fill') === 'fill';
    elements.push({
      id: genId(), type: 'button', name: 'Bouton principal',
      text: oldSlide.cta_text, link: oldSlide.cta_link || '/listings',
      bgColor: fill ? (s.btn1_color || '#fbc401') : 'transparent',
      textColor: fill ? '#1a1a1a' : (s.btn1_color || '#ffffff'),
      rotation: 0, opacity: 1,
      layout: alignedLayout(190, 44, 0.75, align),
    });
  }
  if (oldSlide?.secondary_cta_text) {
    const fill = (s.btn2_style || 'outline') === 'fill';
    elements.push({
      id: genId(), type: 'button', name: 'Bouton secondaire',
      text: oldSlide.secondary_cta_text, link: oldSlide.secondary_cta_link || '/post-ad',
      bgColor: fill ? (s.btn2_color || '#ffffff') : 'transparent',
      textColor: fill ? '#1a1a1a' : (s.btn2_color || '#ffffff'),
      rotation: 0, opacity: 1,
      layout: alignedLayout(220, 44, 0.9, align),
    });
  }

  return {
    name: `${title?.text || 'Slide importée'} (importé)`,
    is_active: false,
    background: buildBackground(oldSlide),
    elements,
    settings: {},
  };
}
