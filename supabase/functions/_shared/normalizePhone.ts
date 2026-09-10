// Normalise un numéro vers le format WhatsApp (sans +, avec indicatif pays).
// Congo-Brazzaville (+242) par défaut. Retourne null si non exploitable.
export function normalizePhone(raw: string, countryCode = '242'): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.length < 6) return null;

  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('00')) return cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length <= 10) return countryCode + cleaned.slice(1);
  if (cleaned.startsWith(countryCode)) return cleaned;
  if (cleaned.length >= 8 && cleaned.length <= 9) return countryCode + cleaned;
  return null;
}
