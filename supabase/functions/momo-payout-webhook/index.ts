import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { verifyWebhookSignature } from '../_shared/verifyWebhook.ts';

// Callback public MTN/Airtel confirmant un reversement vendeur.
// DOIT être déployé avec `--no-verify-jwt` (ou l'entrée équivalente
// dans supabase/config.toml) : MTN/Airtel n'envoient jamais de JWT
// Supabase, sinon Supabase renverrait 401 avant d'exécuter ce code.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const provider = payload.provider as 'mtn' | 'airtel';
    const secret = provider === 'mtn' ? Deno.env.get('MTN_WEBHOOK_SECRET') : Deno.env.get('AIRTEL_WEBHOOK_SECRET');

    const verification = await verifyWebhookSignature(
      rawBody,
      req.headers.get('X-Momo-Signature'),
      req.headers.get('X-Momo-Timestamp'),
      secret,
    );
    if (!verification.ok) {
      console.error('momo-payout-webhook rejected:', verification.reason);
      return new Response(JSON.stringify({ error: verification.reason }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { providerRef, status } = payload as { providerRef: string; status: 'successful' | 'failed' };
    if (!providerRef || !status) throw new Error('providerRef et status requis');

    const { data: tx, error: txError } = await admin
      .from('transactions_escrow')
      .select('id, payout_status')
      .eq('payout_provider_ref', providerRef)
      .maybeSingle();
    if (txError) throw txError;

    if (!tx) {
      return new Response(JSON.stringify({ success: true, note: 'Référence inconnue, ignorée' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('payment_provider_logs').insert({
      transaction_id: tx.id,
      direction: 'disbursement',
      provider,
      request_payload: { source: 'webhook' },
      response_payload: payload,
      http_status: 200,
    });

    if (tx.payout_status === 'sent') {
      // Déjà finalisé — idempotent, on ne relance jamais finalize_payout deux fois.
      return new Response(JSON.stringify({ success: true, note: 'Déjà finalisé' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: finalizeError } = await admin.rpc('finalize_payout', {
      p_transaction_id: tx.id,
      p_success: status === 'successful',
      p_provider_ref: providerRef,
      p_failure_reason: status === 'failed' ? 'Échec confirmé par webhook provider' : null,
    });
    if (finalizeError) throw finalizeError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('momo-payout-webhook error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
