// Normalise un numéro congolais en chiffres utilisables dans un lien wa.me.
//
// Au Congo-Brazzaville le 0 initial fait PARTIE du numéro et reste après
// l'indicatif : +242 06 681 2632 -> 242066812632. Le retirer (comme on le
// faisait avant) donne un numéro que WhatsApp refuse. Les numéros en base sont
// stockés dans des formats incohérents ("+242064623778", "066812632",
// "66812632"...) faute de validation à la saisie.
export const toWhatsAppDigits = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  let national = digits.startsWith('242') ? digits.slice(3) : digits;
  // Numéro saisi sans le 0 (8 chiffres) : on le remet.
  if (national.length === 8) national = `0${national}`;
  return `242${national}`;
};

// `text` (optionnel) pré-remplit le message dans WhatsApp.
export const toWhatsAppLink = (phone, text) => {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
};
