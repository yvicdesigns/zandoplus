import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { verifyWebhookSignature } from '../_shared/verifyWebhook.ts';

// Callback public MTN/Airtel confirmant un paiement acheteur.
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
      console.error('momo-collection-webhook rejected:', verification.reason);
      return new Response(JSON.stringify({ error: verification.reason }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { providerRef, status } = payload as { providerRef: string; status: 'successful' | 'failed' | 'expired' };
    if (!providerRef || !status) throw new Error('providerRef et status requis');

    const { data: tx, error: txError } = await admin
      .from('transactions_escrow')
      .select('id, statut, collection_status')
      .eq('collection_provider_ref', providerRef)
      .maybeSingle();
    if (txError) throw txError;

    if (!tx) {
      // Référence inconnue : on répond 200 quand même pour éviter
      // que le provider ne rejoue indéfiniment un callback qu'on
      // ne pourra jamais rattacher.
      return new Response(JSON.stringify({ success: true, note: 'Référence inconnue, ignorée' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('payment_provider_logs').insert({
      transaction_id: tx.id,
      direction: 'collection',
      provider,
      request_payload: { source: 'webhook' },
      response_payload: payload,
      http_status: 200,
    });

    if (tx.collection_status === 'successful') {
      // Déjà confirmé — idempotent, pas de double traitement.
      return new Response(JSON.stringify({ success: true, note: 'Déjà confirmé' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (status === 'successful') {
      const { error: confirmError } = await admin.rpc('system_confirm_collection', {
        p_transaction_id: tx.id,
        p_provider: provider,
        p_provider_ref: providerRef,
      });
      if (confirmError) throw confirmError;
    } else {
      await admin.from('transactions_escrow').update({ collection_status: status }).eq('id', tx.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('momo-collection-webhook error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
