import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../cors.ts';

const SYSTEM_PROMPT = `Tu es un modérateur automatique pour Zando+, la marketplace du Congo Brazzaville.

Ton rôle : analyser les annonces publiées par les utilisateurs et détecter les contenus problématiques.

Problèmes à détecter :
1. FRAUDE / ARNAQUE : prix anormalement bas pour attirer des victimes, produits contrefaits, demande de paiement à l'avance
2. CONTENU INAPPROPRIÉ : offres illicites, contenu pour adultes, produits dangereux ou illégaux
3. SPAM : annonce dupliquée, contenu sans sens, caractères aléatoires
4. FAUX PROFIL : identité suspecte, contact externe forcé (WhatsApp/Telegram uniquement)
5. PRIX SUSPECT : prix trop bas (>70% sous le marché) ou trop élevé (>3x le marché) pour la catégorie
6. INFORMATIONS MANQUANTES : description vide ou trop courte, titre trompeur

Niveaux de risque :
- "low" : annonce normale, rien à signaler
- "medium" : quelques éléments suspects, publier mais surveiller
- "high" : arnaque probable ou contenu illicite, mettre en attente de vérification

Format de réponse OBLIGATOIRE (JSON strict) :
{
  "risk_level": "low" | "medium" | "high",
  "approved": true | false,
  "flags": ["flag1", "flag2"],
  "reason": "<explication courte en français, max 60 mots, vide si low>"
}

Règle : "approved" est false UNIQUEMENT si risk_level est "high".`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { listing_id, title, description, category, price, currency, condition, location } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY non configuré');
    if (!title) throw new Error('Titre requis');

    const priceStr = price ? `${price} ${currency || 'FCFA'}` : 'Non renseigné';

    const userMessage = `Analyse cette annonce publiée sur Zando+ Congo :

Titre : ${title}
Catégorie : ${category || 'Non renseignée'}
Prix : ${priceStr}
État : ${condition || 'Non renseigné'}
Localisation : ${location || 'Non renseignée'}
Description : ${description || 'Aucune description'}`;

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
        max_tokens: 256,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Erreur API Claude');

    const rawText = data.content?.[0]?.text?.trim();
    if (!rawText) throw new Error('Réponse vide de Claude');

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Format de réponse invalide');

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      success: true,
      listing_id,
      risk_level: result.risk_level || 'low',
      approved:   result.approved !== false,
      flags:      result.flags || [],
      reason:     result.reason || '',
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
