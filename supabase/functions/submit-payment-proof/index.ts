import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';

// Point d'entrée unique pour soumettre une preuve de paiement manuelle.
// Remplace l'appel direct à buyer_submit_payment_proof (RPC désormais
// réservée au service_role) pour qu'un client ne puisse pas sauter le
// contrôle IA en appelant la RPC directement.
//
// L'IA ne juge PAS l'authenticité du paiement — elle filtre seulement les
// envois évidemment hors-sujet (photo sans rapport) ou incohérents (montant
// visible ≠ montant de la commande). La validation finale reste manuelle,
// faite par l'admin dans /admin (onglet Escrow).

const SYSTEM_PROMPT = `Tu vérifies des preuves de paiement Mobile Money (MTN Money / Airtel Money) envoyées par des acheteurs sur Zando+, une marketplace au Congo-Brazzaville.

On te donne une image et le contexte de la commande (montant attendu, code de transaction saisi par l'acheteur). Réponds STRICTEMENT en JSON, rien d'autre :

{
  "is_payment_screenshot": true | false,
  "detected_amount": <nombre ou null>,
  "detected_code": "<chaîne ou null>",
  "amount_matches": true | false | null,
  "code_matches": true | false | null,
  "confidence": "high" | "medium" | "low",
  "reason": "<courte explication en français, max 30 mots>"
}

Règles :
- "is_payment_screenshot": false UNIQUEMENT si l'image n'a clairement AUCUN rapport avec un paiement Mobile Money (photo de personne, voiture, maison, document sans rapport, image vide, etc.). En cas de doute, mets true.
- "amount_matches"/"code_matches": null si tu n'arrives pas à lire clairement le montant/code dans l'image (mauvaise qualité, coupé...) — ne mets false que si tu LIS clairement une valeur différente de celle attendue.
- "confidence": "low" si l'image est floue, coupée, ou ambiguë — dans ce cas on ne bloque jamais, on laisse passer pour vérification humaine.
- Sois tolérant : le but est d'éliminer les envois évidemment hors-sujet, pas de juger l'authenticité du paiement (ça, un humain le fait après).`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { transaction_id, proof_url, proof_path, momo_code } = await req.json();
    if (!transaction_id || !proof_url || !proof_path || !momo_code) {
      throw new Error('transaction_id, proof_url, proof_path et momo_code sont requis');
    }

    // Contrôle propriétaire/statut ici : appelée en service_role plus bas,
    // la RPC ne peut plus s'appuyer sur auth.uid() pour ce contrôle.
    const { data: tx, error: txError } = await admin
      .from('transactions_escrow')
      .select('id, acheteur_id, statut, montant')
      .eq('id', transaction_id)
      .single();
    if (txError || !tx) throw new Error('Transaction introuvable');
    if (tx.acheteur_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (tx.statut !== 'en_attente_paiement') {
      throw new Error(`Paiement déjà soumis (statut: ${tx.statut})`);
    }

    // ── Vérification IA de l'image ──────────────────────────────────────
    let aiVerdict: 'ok' | 'uncertain' = 'uncertain';
    let aiReason = "Vérification IA indisponible — à contrôler manuellement.";

    if (ANTHROPIC_API_KEY) {
      try {
        // Bucket privé : on télécharge via l'API storage (service_role),
        // pas via l'URL publique qui ne sert rien sur un bucket non-public.
        const { data: imgBlob, error: dlError } = await admin.storage.from('payment_proofs').download(proof_path);
        if (dlError || !imgBlob) throw new Error('Image inaccessible');
        const mediaType = imgBlob.type || 'image/jpeg';
        const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
        // Garde-fou taille (Claude limite les images ~5MB en base64)
        if (imgBytes.byteLength > 4_500_000) throw new Error('Image trop volumineuse');
        const b64 = encodeBase64(imgBytes);

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-opus-5',
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
                { type: 'text', text: `Montant attendu de la commande : ${tx.montant} FCFA.\nCode de transaction saisi par l'acheteur : ${momo_code}.` },
              ],
            }],
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const raw = aiJson?.content?.[0]?.text || '{}';
          const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

          if (parsed.confidence === 'low') {
            aiVerdict = 'uncertain';
            aiReason = 'IA peu sûre de son analyse — à vérifier manuellement.';
          } else if (parsed.is_payment_screenshot === false) {
            return new Response(JSON.stringify({
              success: false, rejected: true,
              reason: "Cette image ne ressemble pas à une confirmation de paiement Mobile Money. Uploadez la capture d'écran reçue après le paiement.",
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else if (parsed.amount_matches === false) {
            return new Response(JSON.stringify({
              success: false, rejected: true,
              reason: `Le montant visible sur la capture ne correspond pas au montant de la commande (${tx.montant} FCFA).`,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else if (parsed.code_matches === false && parsed.confidence === 'high') {
            return new Response(JSON.stringify({
              success: false, rejected: true,
              reason: "Le code de transaction visible sur la capture ne correspond pas au code saisi.",
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
            aiVerdict = 'ok';
            aiReason = parsed.reason || 'Capture cohérente avec la commande.';
          }
        }
      } catch (aiErr) {
        console.error('submit-payment-proof: AI check failed:', aiErr);
        // on ne bloque jamais un vrai acheteur à cause d'une panne IA —
        // l'admin verra "uncertain" et vérifiera à la main.
      }
    }

    const { error: proofError } = await admin.rpc('buyer_submit_payment_proof', {
      p_transaction_id: transaction_id,
      p_proof_url: proof_url,
      p_momo_code: momo_code,
      p_ai_verdict: aiVerdict,
      p_ai_reason: aiReason,
    });
    if (proofError) throw proofError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('submit-payment-proof error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
