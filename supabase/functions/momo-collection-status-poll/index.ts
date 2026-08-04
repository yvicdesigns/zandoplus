import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { getProvider } from '../_shared/providerFactory.ts';
import type { ProviderName } from '../_shared/types.ts';

// Filet de sécurité si momo-collection-webhook n'arrive pas
// (livraison de webhook pas toujours fiable dans la région) —
// interroge activement le provider pour toute collecte encore
// 'pending'. Cron toutes les 5 min (voir momo_payments_cron.sql).
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: pending, error } = await admin
      .from('transactions_escrow')
      .select('id, collection_provider, collection_provider_ref')
      .eq('collection_status', 'pending')
      .not('collection_provider_ref', 'is', null)
      .limit(50);
    if (error) throw error;

    let resolved = 0;
    for (const tx of pending || []) {
      if (!tx.collection_provider || !tx.collection_provider_ref) continue;
      const provider = getProvider(tx.collection_provider as ProviderName);
      const result = await provider.getCollectionStatus(tx.collection_provider_ref);

      await admin.from('payment_provider_logs').insert({
        transaction_id: tx.id,
        direction: 'collection',
        provider: tx.collection_provider,
        request_payload: { action: 'getCollectionStatus', providerRef: tx.collection_provider_ref },
        response_payload: result,
        http_status: 200,
      });

      if (result.status === 'pending') continue;

      if (result.status === 'successful') {
        const { error: confirmError } = await admin.rpc('system_confirm_collection', {
          p_transaction_id: tx.id,
          p_provider: tx.collection_provider,
          p_provider_ref: result.providerRef,
        });
        if (confirmError) throw confirmError;
      } else {
        await admin.from('transactions_escrow').update({ collection_status: result.status }).eq('id', tx.id);
      }
      resolved++;
    }

    return new Response(JSON.stringify({ checked: pending?.length || 0, resolved }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('momo-collection-status-poll error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
