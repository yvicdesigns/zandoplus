import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { getProvider } from '../_shared/providerFactory.ts';
import type { ProviderName } from '../_shared/types.ts';

// Déclenché par l'acheteur sur EscrowPaymentPage.jsx (flux
// VITE_MOMO_AUTOPAY_ENABLED) — alternative au dépôt manuel d'une
// capture d'écran comme preuve de paiement.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { transaction_id, phone, provider } = await req.json();
    if (!transaction_id || !phone || !provider) {
      throw new Error('transaction_id, phone et provider sont requis');
    }
    if (provider !== 'mtn' && provider !== 'airtel') {
      throw new Error('provider doit être "mtn" ou "airtel"');
    }

    const { data: tx, error: txError } = await admin
      .from('transactions_escrow')
      .select('id, acheteur_id, montant, statut, collection_status')
      .eq('id', transaction_id)
      .single();
    if (txError || !tx) throw new Error('Transaction introuvable');
    if (tx.acheteur_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['en_attente_paiement', 'fonds_bloques'].includes(tx.statut)) {
      throw new Error(`Cette transaction n'est plus en attente de paiement (statut: ${tx.statut})`);
    }
    if (tx.collection_status === 'pending' || tx.collection_status === 'successful') {
      throw new Error('Un paiement est déjà en cours ou terminé pour cette transaction');
    }

    const externalId = crypto.randomUUID();
    const momoProvider = getProvider(provider as ProviderName);
    const result = await momoProvider.requestPayment(phone, tx.montant, externalId);

    await admin.from('payment_provider_logs').insert({
      transaction_id: tx.id,
      direction: 'collection',
      provider,
      request_payload: { phone, amount: tx.montant, externalId },
      response_payload: result,
      http_status: 200,
    });

    await admin.from('transactions_escrow').update({
      collection_provider: provider,
      collection_provider_ref: result.providerRef,
      collection_status: result.status === 'successful' ? 'successful' : 'pending',
    }).eq('id', tx.id);

    if (result.status === 'successful') {
      const { error: confirmError } = await admin.rpc('system_confirm_collection', {
        p_transaction_id: tx.id,
        p_provider: provider,
        p_provider_ref: result.providerRef,
      });
      if (confirmError) throw confirmError;
    }

    return new Response(JSON.stringify({ success: true, status: result.status, providerRef: result.providerRef }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('momo-initiate-collection error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
