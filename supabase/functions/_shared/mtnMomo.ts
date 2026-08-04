import type { MomoProvider } from './types.ts';

// Phase 2 — non implémenté tant que les identifiants sandbox MTN
// MoMo Open API (Ocp-Apim-Subscription-Key, API user/key) ne sont
// pas obtenus. Cible documentée : Collection (`POST
// /collection/v1_0/requesttopay`, `GET
// /collection/v1_0/requesttopay/{referenceId}`) et Disbursement
// (`POST /disbursement/v1_0/transfer`, `GET
// /disbursement/v1_0/transfer/{referenceId}`) de l'API MTN MoMo
// Open API, base URL swappable via MTN_MOMO_BASE_URL (sandbox par
// défaut). Ne pas deviner la forme exacte des requêtes avant
// d'avoir accès à la doc/sandbox réelle.
export function createMtnMomoProvider(): MomoProvider {
  const notImplemented = (): never => {
    throw new Error(
      "MTN MoMo API non implémentée — en attente des identifiants sandbox. " +
      "Mettre PAYMENTS_MOCK_MODE=true en attendant (voir Phase 2 du plan d'automatisation MoMo)."
    );
  };
  return {
    name: 'mtn',
    requestPayment: notImplemented,
    getCollectionStatus: notImplemented,
    disburse: notImplemented,
    getDisbursementStatus: notImplemented,
  };
}
