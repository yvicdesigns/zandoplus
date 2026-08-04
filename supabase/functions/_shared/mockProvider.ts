import type { MomoProvider, ProviderName, ProviderResult, ProviderStatus } from './types.ts';

// Simulation en mémoire pour tester tout le pipeline (cron, claim,
// webhooks, UI admin) sans identifiants MTN/Airtel réels. L'état
// ne survit pas à un redémarrage de l'isolate Deno — suffisant
// pour les tests manuels en dev / supabase functions serve.
//
// Convention de test : un externalId contenant "FAIL" (insensible
// à la casse) échoue toujours, pour exercer volontairement le
// chemin d'échec / retry.
const store = new Map<string, { status: ProviderStatus; createdAt: number; forceFail: boolean }>();

const SIMULATED_DELAY_MS = 3000;

function touch(externalId: string): { status: ProviderStatus } {
  let entry = store.get(externalId);
  if (!entry) {
    entry = { status: 'pending', createdAt: Date.now(), forceFail: externalId.toUpperCase().includes('FAIL') };
    store.set(externalId, entry);
    return entry;
  }
  if (entry.status === 'pending' && Date.now() - entry.createdAt >= SIMULATED_DELAY_MS) {
    entry.status = entry.forceFail ? 'failed' : 'successful';
  }
  return entry;
}

export function createMockProvider(name: ProviderName): MomoProvider {
  const start = (phone: string, amountFcfa: number, externalId: string): ProviderResult => {
    const { status } = touch(externalId);
    return { providerRef: externalId, status, raw: { mock: true, provider: name, phone, amountFcfa } };
  };
  const poll = (providerRef: string): ProviderResult => {
    const { status } = touch(providerRef);
    return { providerRef, status, raw: { mock: true, provider: name } };
  };

  return {
    name,
    async requestPayment(phone, amountFcfa, externalId) {
      return start(phone, amountFcfa, externalId);
    },
    async getCollectionStatus(providerRef) {
      return poll(providerRef);
    },
    async disburse(phone, amountFcfa, externalId) {
      return start(phone, amountFcfa, externalId);
    },
    async getDisbursementStatus(providerRef) {
      return poll(providerRef);
    },
  };
}
