// Extrait la ville depuis un champ location du type "Brazzaville - Poto-Poto"
export function extractCity(location) {
  if (!location) return null;
  return location.split(' - ')[0].trim() || null;
}

// Normalise un nom de ville pour comparaison floue :
// "Pointe-Noire" / "Pointe noire" / "Pointe Noire" → "pointenoire"
export function normalizeCity(city) {
  return (city || '').toLowerCase().replace(/[\s\-_]+/g, '').replace(/[^a-z]/g, '');
}

// Récupère la config de livraison pour une ville donnée.
// Charge toute la table (petite) et fait la comparaison normalisée côté client
// pour gérer les variantes "Pointe-Noire" vs "Pointe noire" vs "Pointe Noire".
// Retourne null si la ville n'a pas de config (= tout est autorisé par défaut).
export async function fetchCityDeliveryConfig(supabase, city) {
  if (!city) return null;
  const normTarget = normalizeCity(city);
  const { data } = await supabase
    .from('delivery_city_config')
    .select('city, zando_delivery_enabled, cod_enabled, seller_delivery_enabled');
  if (!data) return null;
  return data.find(c => normalizeCity(c.city) === normTarget) ?? null;
}
