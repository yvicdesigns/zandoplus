// Normalise un numéro congolais (avec ou sans +242, avec ou sans 0 initial)
// en chiffres utilisables dans un lien wa.me. Les numéros en base sont stockés
// dans des formats incohérents ("+242064623778" ou juste "066812632") faute de
// validation à la saisie ; sans l'indicatif 242, WhatsApp refuse le lien.
export const toWhatsAppDigits = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (!digits.startsWith('242')) {
    digits = digits.startsWith('0') ? digits.slice(1) : digits;
    digits = `242${digits}`;
  }
  return digits;
};
