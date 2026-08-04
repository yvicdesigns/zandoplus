import type { MomoProvider, ProviderName } from './types.ts';
import { createMockProvider } from './mockProvider.ts';
import { createMtnMomoProvider } from './mtnMomo.ts';
import { createAirtelMoneyProvider } from './airtelMoney.ts';

// Point de bascule unique mock ↔ réel. Par défaut MOCK (jamais
// d'appel réel accidentel tant que PAYMENTS_MOCK_MODE n'est pas
// explicitement mis à "false" une fois les identifiants obtenus.
export function getProvider(name: ProviderName): MomoProvider {
  const mockMode = (Deno.env.get('PAYMENTS_MOCK_MODE') ?? 'true').toLowerCase() !== 'false';
  if (mockMode) return createMockProvider(name);
  if (name === 'mtn') return createMtnMomoProvider();
  if (name === 'airtel') return createAirtelMoneyProvider();
  throw new Error(`Provider MoMo inconnu: ${name}`);
}
