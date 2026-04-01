import DOMPurify from 'dompurify';

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  // Accepts formats like +242061234567, 061234567, etc.
  // Minimal length 9, max 15, allows spaces, dashes, plus.
  const re = /^\+?[\d\s-]{9,15}$/;
  return re.test(String(phone));
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