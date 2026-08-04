import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { getProvider } from '../_shared/providerFactory.ts';
import type { ProviderName } from '../_shared/types.ts';

const MAX_ATTEMPTS = 5;
const STUCK_AFTER_MINUTES = 10;
const MIN_PAYOUT_FCFA = Number(Deno.env.get('MOMO_PAYOUT_MIN_FCFA') ?? '100');
const MAX_PAYOUT_FCFA = Number(Deno.env.get('MOMO_PAYOUT_MAX_FCFA') ?? '2000000');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const logCall = async (transactionId: string | null, provider: string, req_payload: unknown, res_payload: unknown, http_status: number) => {
    await admin.from('payment_provider_logs').insert({
      transaction_id: transactionId,
      direction: 'disbursement',
      provider,
      request_payload: req_payload,
      response_payload: res_payload,
      http_status,
    });
  };

  const alertAdminMaxAttempts = async (transactionId: string, reason: string | null) => {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return;
    const ADMIN_EMAIL = Deno.env.get('ADMIN_ALERT_EMAIL') || 'zandopluscg@gmail.com';
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Zando+ <noreply@zandopluscg.com>',
          to: [ADMIN_EMAIL],
          subject: `🚨 Reversement automatique échoué (5 tentatives) — transaction ${transactionId}`,
          html: `<p>Le reversement automatique de la transaction <code>${transactionId}</code> a échoué 5 fois et ne sera plus retenté automatiquement.</p>
                 <p>Raison de la dernière tentative : ${reason || 'inconnue'}</p>
                 <p>Intervention manuelle requise : ouvrez <strong>Admin → Escrow</strong>, envoyez le virement à la main, puis cliquez "Marquer comme envoyé", ou corrigez le problème et cliquez "Réessayer".</p>`,
        }),
      });
    } catch (_e) {
      // best-effort, ne bloque jamais le traitement du lot pour un email raté
    }
  };

  try {
    const results = { reconciled: 0, sent: 0, failed: 0, skipped: 0 };

    // ── Réconciliation : jamais de retry aveugle sur une ligne
    // restée en 'processing' — on vérifie d'abord le vrai statut
    // côté provider avant de la finaliser.
    const { data: stuck, error: stuckError } = await admin.rpc('get_stuck_payouts', { p_minutes: STUCK_AFTER_MINUTES });
    if (stuckError) throw stuckError;

    for (const row of stuck || []) {
      if (!row.payout_provider || !row.payout_provider_ref) continue;
      const provider = getProvider(row.payout_provider as ProviderName);
      const statusResult = await provider.getDisbursementStatus(row.payout_provider_ref);
      await logCall(row.id, row.payout_provider, { action: 'getDisbursementStatus', providerRef: row.payout_provider_ref }, statusResult, 200);

      if (statusResult.status === 'pending') continue; // toujours en cours, on retentera au prochain tick

      const { error: finalizeError } = await admin.rpc('finalize_payout', {
        p_transaction_id: row.id,
        p_success: statusResult.status === 'successful',
        p_provider_ref: statusResult.providerRef,
        p_failure_reason: statusResult.status === 'failed' ? 'Échec confirmé après réconciliation (ligne bloquée en processing)' : null,
      });
      if (finalizeError) throw finalizeError;
      results.reconciled++;
    }

    // ── Claim : réserve un lot atomique, aucune ligne prise deux
    // fois même si ce cron tourne en parallèle d'une autre
    // exécution.
    const { data: batch, error: claimError } = await admin.rpc('claim_payout_batch', { p_batch_size: 50 });
    if (claimError) throw claimError;

    for (const tx of batch || []) {
      const net = tx.montant - (tx.commission_amount ?? Math.round(tx.montant * 0.07));

      if (!tx.payout_provider || !tx.vendeur_momo_number) {
        await admin.rpc('finalize_payout', {
          p_transaction_id: tx.id,
          p_success: false,
          p_failure_reason: 'Numéro ou provider MoMo du vendeur manquant',
        });
        results.skipped++;
        continue;
      }

      if (net < MIN_PAYOUT_FCFA || net > MAX_PAYOUT_FCFA) {
        await admin.rpc('finalize_payout', {
          p_transaction_id: tx.id,
          p_success: false,
          p_failure_reason: `Montant net (${net} FCFA) hors limites autorisées [${MIN_PAYOUT_FCFA}, ${MAX_PAYOUT_FCFA}]`,
        });
        results.skipped++;
        continue;
      }

      const provider = getProvider(tx.payout_provider as ProviderName);
      let disbursement;
      try {
        disbursement = await provider.disburse(tx.vendeur_momo_number, net, tx.payout_provider_ref);
        await logCall(tx.id, tx.payout_provider, { action: 'disburse', phone: tx.vendeur_momo_number, net, externalId: tx.payout_provider_ref }, disbursement, 200);
      } catch (err) {
        await logCall(tx.id, tx.payout_provider, { action: 'disburse', externalId: tx.payout_provider_ref }, { error: String(err) }, 500);
        await admin.rpc('finalize_payout', { p_transaction_id: tx.id, p_success: false, p_failure_reason: String(err).slice(0, 500) });
        results.failed++;
        if (tx.payout_attempts >= MAX_ATTEMPTS) await alertAdminMaxAttempts(tx.id, String(err));
        continue;
      }

      if (disbursement.status === 'pending') {
        // Reste en payout_status='processing' — sera vérifié par
        // la passe de réconciliation au prochain tick si ça dure.
        continue;
      }

      const success = disbursement.status === 'successful';
      await admin.rpc('finalize_payout', {
        p_transaction_id: tx.id,
        p_success: success,
        p_provider_ref: disbursement.providerRef,
        p_failure_reason: success ? null : 'Le provider a renvoyé un échec direct',
      });

      if (success) {
        results.sent++;
      } else {
        results.failed++;
        if (tx.payout_attempts >= MAX_ATTEMPTS) await alertAdminMaxAttempts(tx.id, 'Le provider a renvoyé un échec direct');
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('momo-auto-payout error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
