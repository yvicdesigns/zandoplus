import DOMPurify from 'dompurify';

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

// Valide un numéro sur le nombre de CHIFFRES, pas sur le nombre de caractères :
// l'ancienne règle (9 à 15 caractères, espaces compris) refusait des écritures
// normales au Congo comme "+242 06 462 37 78" (16 caractères) ou "66812632".
//   - Congo (avec ou sans +242 / 00242) : 8 ou 9 chiffres (le 0 initial est facultatif)
//   - Autre pays (diaspora), en écriture internationale (+ ou 00) : 8 à 15 chiffres
// On accepte espaces, tirets, points et parenthèses comme séparateurs.
export const validatePhone = (phone) => {
  const raw = String(phone ?? '').trim();
  if (!raw || !/^\+?[\d\s().-]+$/.test(raw)) return false;

  const international = raw.startsWith('+') || raw.startsWith('00');
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('242')) {
    const national = digits.slice(3);
    return national.length === 8 || national.length === 9;
  }
  if (international) return digits.length >= 8 && digits.length <= 15;
  return digits.length === 8 || digits.length === 9;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const validatePasswordStrength = (password) => {
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  const isLengthValid = password.length >= 8;
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas && isLengthValid;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Strip ALL html tags for strict text inputs (titles, names, basic descriptions)
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return html;
  // Allow safe HTML for rich text, completely preventing XSS
  return DOMPurify.sanitize(html);
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};