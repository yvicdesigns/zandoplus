// Commission Zando Sécurisé : 5% du montant, plafonnée à 10 000 FCFA, à la
// charge du vendeur (déduite de son paiement, jamais ajoutée au prix acheteur).
export const COMMISSION_RATE = 0.05;
export const COMMISSION_CAP = 10000;

export const computeCommission = (montant) =>
  Math.min(Math.round((montant || 0) * COMMISSION_RATE), COMMISSION_CAP);
