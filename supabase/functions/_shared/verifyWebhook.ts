// Vérification partagée pour les callbacks publics MTN/Airtel
// (momo-collection-webhook, momo-payout-webhook). Signature HMAC-SHA256
// sur `${timestamp}.${rawBody}` + fenêtre de tolérance sur
// l'horodatage pour bloquer le rejeu d'un payload capturé.
//
// Schéma générique en attendant la doc réelle des webhooks
// MTN/Airtel (Phase 2) — adapter le calcul de signature une fois
// leur format exact connu, mais garder l'exigence de secret +
// horodatage.
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  secret: string | undefined,
  toleranceSeconds = 300,
): Promise<{ ok: boolean; reason?: string }> {
  if (!secret) return { ok: false, reason: 'Secret webhook non configuré côté serveur' };
  if (!signatureHeader) return { ok: false, reason: 'Signature manquante' };
  if (!timestampHeader) return { ok: false, reason: 'Horodatage manquant' };

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) {
    return { ok: false, reason: 'Horodatage hors tolérance (possible rejeu)' };
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestampHeader}.${rawBody}`));
  const expected = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

  if (expected.length !== signatureHeader.length) return { ok: false, reason: 'Signature invalide' };

  // Comparaison à temps constant pour éviter une attaque par timing.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  if (diff !== 0) return { ok: false, reason: 'Signature invalide' };

  return { ok: true };
}
