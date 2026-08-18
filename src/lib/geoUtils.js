// Coordonnées approximatives des principales villes du Congo-Brazzaville, utilisées
// pour retrouver la ville la plus proche à partir d'une position GPS (pas d'API de
// géocodage externe disponible — la zone couverte est petite et connue à l'avance).
const CITY_COORDS = {
  'Brazzaville': [-4.2634, 15.2429],
  'Pointe-Noire': [-4.7761, 11.8636],
  'Dolisie': [-4.1997, 12.6714],
  'Nkayi': [-4.1825, 13.2925],
  'Ouesso': [1.6136, 16.0517],
  'Impfondo': [1.6381, 18.0669],
  'Sibiti': [-3.6833, 13.35],
  'Madingou': [-4.15, 13.55],
  'Owando': [-0.4819, 15.8988],
  'Mossendjo': [-2.9503, 12.7264],
  'Kinkala': [-4.3614, 14.7647],
  'Gamboma': [-1.8783, 15.8664],
  'Djambala': [-2.5439, 14.75],
  'Ewo': [-0.8814, 14.8283],
};

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Retourne, parmi `candidateCities`, le nom le plus proche de (lat, lng), ou null
// si aucune de ces villes n'a de coordonnées connues.
export const findNearestCity = (lat, lng, candidateCities) => {
  let nearest = null;
  let nearestDist = Infinity;
  for (const city of candidateCities) {
    const coords = CITY_COORDS[city];
    if (!coords) continue;
    const d = distanceKm(lat, lng, coords[0], coords[1]);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = city;
    }
  }
  return nearest;
};
