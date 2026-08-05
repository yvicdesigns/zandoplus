// Extrait la ville depuis un champ location du type "Brazzaville - Poto-Poto"
export function extractCity(location) {
  if (!location) return null;
  return location.split(' - ')[0].trim() || null;
}

// Récupère la config de livraison pour une ville donnée
// Retourne null si la ville n'a pas de config (= tout est autorisé par défaut)
export async function fetchCityDeliveryConfig(supabase, city) {
  if (!city) return null;
  const { data } = await supabase
    .from('delivery_city_config')
    .select('zando_delivery_enabled, cod_enabled, seller_delivery_enabled')
    .ilike('city', city)
    .maybeSingle();
  return data ?? null;
}
