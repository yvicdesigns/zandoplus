import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { corsHeaders } from '../cors.ts';

const SYSTEM_PROMPT = `Tu es un modérateur automatique pour Zando+, la marketplace du Congo Brazzaville.

IMPORTANT : Tu dois être TRÈS tolérant. Le Congo Brazzaville a des prix bas et des annonces courtes — c'est normal. La grande majorité des annonces sont légitimes. En cas de doute, tu laisses passer (low).

Tu juges DEUX choses séparément.

## 1. Contenu illicite ou frauduleux

Ton rôle : bloquer UNIQUEMENT les contenus clairement illicites ou frauduleux.

Cas "high" (bloquer) — SEULEMENT si c'est ÉVIDENT et CERTAIN :
1. Contenu illégal explicite : vente de drogues, armes, personnes, contenus pédopornographiques
2. Arnaque flagrante : "envoyez de l'argent d'abord pour recevoir un article à 1 FCFA", demande de virement Western Union pour un article gratuit
3. Spam pur : texte sans sens, caractères aléatoires, contenu vide

Cas "medium" (publier mais noter) :
- Prix qui semble inhabituel mais pas clairement frauduleux
- Description un peu vague

Cas "low" (normal — la grande majorité des annonces) :
- Téléphones, vêtements, électroménager, voitures, mobilier, offres d'emploi, services
- Prix bas — NORMAL au Congo, ne jamais bloquer pour le prix seul
- Description courte — NORMAL et acceptable
- Vente de seconde main, produits reconditionnés
- Toute annonce qui ressemble à une vraie offre de marché

Règle absolue : si tu n'es pas sûr à 95% que c'est illicite/frauduleux, réponds "low" et approved: true.

## 2. Cohérence entre la photo et le prix

Si une photo est fournie, regarde ce qu'elle montre et compare-le au prix annoncé.

IMPORTANT : un prix bas est NORMAL au Congo (négociation, occasion, bonne affaire) — ne signale JAMAIS juste parce qu'un prix te paraît "un peu bas". Tu ne signales que si l'écart est ÉNORME et évident, même pour quelqu'un qui ne connaît pas le marché congolais — un facteur d'environ 10x ou plus entre ce que montre la photo et le prix affiché. Exemples de vrais cas à signaler : un gros sac de riz ou d'oignons à 200 FCFA (impossible même en gros), une voiture visiblement en état de marche à 1000 FCFA, un smartphone récent à 500 FCFA. Si tu hésites, si la photo est floue/peu claire, ou si aucune photo n'est fournie : ne signale pas (flagged: false).

Format de réponse OBLIGATOIRE (JSON strict, rien d'autre) :
{
  "risk_level": "low" | "medium" | "high",
  "approved": true | false,
  "flags": ["flag1", "flag2"],
  "reason": "<explication courte en français, max 60 mots, vide si low>",
  "price_mismatch": {
    "flagged": true | false,
    "reason": "<courte explication en français si flagged, sinon chaîne vide>"
  }
}

Règle : "approved" est false UNIQUEMENT si risk_level est "high". Le champ "price_mismatch" est indépendant et n'affecte pas "approved" — c'est le serveur qui combine les deux.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { listing_id, title, description, category, price, currency, condition, location, images } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY non configuré');
    if (!title) throw new Error('Titre requis');

    const priceStr = price ? `${price} ${currency || 'FCFA'}` : 'Non renseigné';

    const userText = `Analyse cette annonce publiée sur Zando+ Congo :

Titre : ${title}
Catégorie : ${category || 'Non renseignée'}
Prix : ${priceStr}
État : ${condition || 'Non renseigné'}
Localisation : ${location || 'Non renseignée'}
Description : ${description || 'Aucune description'}
Photo fournie : ${images?.[0] ? 'oui, ci-jointe' : 'non'}`;

    // On ne récupère que la 1ère photo (celle que les vendeurs mettent en
    // avant) — suffisant pour juger la cohérence prix/objet, et évite de
    // multiplier le coût/latence par annonce avec plusieurs images.
    const userContent: Array<Record<string, unknown>> = [];
    if (images?.[0]) {
      try {
        const imgRes = await fetch(images[0]);
        if (imgRes.ok) {
          const mediaType = imgRes.headers.get('content-type') || 'image/jpeg';
          const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
          if (imgBytes.byteLength <= 4_500_000) {
            userContent.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: encodeBase64(imgBytes) } });
          }
        }
      } catch {
        // Photo inaccessible — on continue sans elle, le prompt gère ce cas (ne signale pas price_mismatch).
      }
    }
    userContent.push({ type: 'text', text: userText });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Erreur API Claude');

    const rawText = data.content?.[0]?.text?.trim();
    if (!rawText) throw new Error('Réponse vide de Claude');

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Format de réponse invalide');

    const result = JSON.parse(jsonMatch[0]);

    // On combine les deux jugements (contenu illicite + cohérence prix/photo)
    // dans le même contrat de réponse que l'admin/useModeration connaissent
    // déjà (approved/flags/reason) — pas de nouvelle colonne DB nécessaire.
    const priceMismatch = result.price_mismatch?.flagged === true;
    const flags = [...(result.flags || [])];
    let reason = result.reason || '';
    if (priceMismatch) {
      flags.push('prix_incoherent');
      const priceReason = result.price_mismatch?.reason || '';
      reason = reason ? `${reason} | ${priceReason}` : priceReason;
    }

    return new Response(JSON.stringify({
      success: true,
      listing_id,
      risk_level: priceMismatch ? 'high' : (result.risk_level || 'low'),
      approved:   result.approved !== false && !priceMismatch,
      flags,
      reason,
      price_mismatch: priceMismatch,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fail open — if moderation fails, let the listing through
    return new Response(JSON.stringify({
      success: false,
      approved: true,
      risk_level: 'low',
      flags: [],
      reason: '',
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
