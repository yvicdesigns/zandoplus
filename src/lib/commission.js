// Commission Zando Sécurisé, à la charge du vendeur (déduite de son
// paiement, jamais ajoutée au prix acheteur) — barème à paliers :
//   - moins de 10 000 FCFA : 8%
//   - de 10 000 à 200 000 FCFA : 5%
//   - au-delà de 200 000 FCFA : plafonnée à 10 000 FCFA
export const computeCommission = (montant) => {
  const m = montant || 0;
  if (m < 10000) return Math.round(m * 0.08);
  if (m <= 200000) return Math.round(m * 0.05);
  return 10000;
};
