import type { MomoProvider } from './types.ts';

// Phase 2 — non implémenté tant que les identifiants UAT Airtel
// Money OpenAPI (client_id/client_secret) ne sont pas obtenus.
// Cible documentée : OAuth2 client-credentials (`POST
// /auth/oauth2/token`), Collection (`POST
// /merchant/v1/payments/`), Disbursement (`POST
// /standard/v1/disbursements/`), statut (`GET
// /standard/v1/payments/{id}`) de l'API Airtel Money OpenAPI, base
// URL swappable via AIRTEL_BASE_URL (UAT par défaut). Ne pas
// deviner la forme exacte des requêtes avant d'avoir accès à la
// doc/sandbox réelle.
export function createAirtelMoneyProvider(): MomoProvider {
  const notImplemented = (): never => {
    throw new Error(
      "Airtel Money API non implémentée — en attente des identifiants UAT. " +
      "Mettre PAYMENTS_MOCK_MODE=true en attendant (voir Phase 2 du plan d'automatisation MoMo)."
    );
  };
  return {
    name: 'airtel',
    requestPayment: notImplemented,
    getCollectionStatus: notImplemented,
    disburse: notImplemented,
    getDisbursementStatus: notImplemented,
  };
}
