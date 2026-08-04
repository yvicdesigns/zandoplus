export type ProviderName = 'mtn' | 'airtel';

export type ProviderStatus = 'pending' | 'successful' | 'failed';

export interface ProviderResult {
  // Référence externe — toujours égale à l'externalId fourni en
  // entrée (généré côté Zando+), jamais générée par le provider,
  // pour que rejouer un appel avec le même externalId soit traité
  // comme une demande de statut et non comme un nouveau paiement.
  providerRef: string;
  status: ProviderStatus;
  raw?: unknown;
}

export interface MomoProvider {
  name: ProviderName;
  requestPayment(phone: string, amountFcfa: number, externalId: string): Promise<ProviderResult>;
  getCollectionStatus(providerRef: string): Promise<ProviderResult>;
  disburse(phone: string, amountFcfa: number, externalId: string): Promise<ProviderResult>;
  getDisbursementStatus(providerRef: string): Promise<ProviderResult>;
}
