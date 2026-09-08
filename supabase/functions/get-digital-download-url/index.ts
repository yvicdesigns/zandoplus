import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';

// Appelé depuis TransactionsPage.jsx (acheteur) pour un produit numérique.
// Le bucket 'digital-products' est privé et n'a aucune policy SELECT pour
// anon/authenticated — seule cette fonction, avec la clé service_role,
// peut générer un lien signé, et seulement après avoir vérifié que
// l'appelant est bien l'acheteur d'une transaction payée pour cette annonce.
const ALLOWED_STATUSES = ['paiement_valide', 'livre', 'confirme', 'retrait_demande', 'complete'];

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

    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error('transaction_id requis');

    const { data: tx, error: txError } = await admin
      .from('transactions_escrow')
      .select('id, acheteur_id, statut, annonce_id')
      .eq('id', transaction_id)
      .single();
    if (txError || !tx) throw new Error('Transaction introuvable');
    if (tx.acheteur_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_STATUSES.includes(tx.statut)) {
      return new Response(JSON.stringify({ error: "Le paiement n'est pas encore validé pour cette commande" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('is_digital, digital_delivery_type, digital_file_path, digital_file_name, digital_external_url')
      .eq('id', tx.annonce_id)
      .single();
    if (listingError || !listing) throw new Error('Annonce introuvable');
    if (!listing.is_digital) throw new Error("Cette annonce n'a pas de contenu numérique associé");

    // Contenu hébergé par le vendeur lui-même (vidéo YouTube non répertoriée,
    // dossier Drive privé…) — on révèle juste le lien, aucun fichier à signer.
    if (listing.digital_delivery_type === 'link') {
      if (!listing.digital_external_url) throw new Error('Aucun lien associé à cette annonce');
      return new Response(JSON.stringify({ type: 'link', url: listing.digital_external_url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!listing.digital_file_path) throw new Error("Cette annonce n'a pas de fichier numérique associé");

    const { data: signed, error: signError } = await admin
      .storage
      .from('digital-products')
      .createSignedUrl(listing.digital_file_path, 3600, { download: listing.digital_file_name || true });
    if (signError || !signed) throw new Error(signError?.message || 'Impossible de générer le lien de téléchargement');

    return new Response(JSON.stringify({ type: 'file', url: signed.signedUrl, file_name: listing.digital_file_name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur inconnue' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
