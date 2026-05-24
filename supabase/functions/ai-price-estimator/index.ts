import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../cors.ts';

const SYSTEM_PROMPT = `Tu es un expert en évaluation de prix pour Zando+, la marketplace numéro 1 du Congo Brazzaville.

Ton rôle : estimer un prix de vente réaliste en FCFA (Franc CFA) pour un article ou service publié sur Zando+.

Contexte du marché congolais :
- Marché principal : Brazzaville et Pointe-Noire
- Pouvoir d'achat local : les prix doivent être adaptés au marché congolais
- Concurrence : marché secondaire (vente entre particuliers), pas du neuf en magasin
- Catégories principales : électronique, véhicules, immobilier, mode, services, emplois

Règles d'estimation :
1. Analyser la catégorie, l'état et la description pour estimer un prix juste
2. Tenir compte de la dépréciation selon l'état (neuf, très bon état, bon état, occasion)
3. Pour l'électronique : appliquer 20-40% de réduction par rapport au prix neuf
4. Pour les véhicules : tenir compte de l'âge et de l'état
5. Pour l'immobilier : prix en FCFA/mois pour la location, FCFA total pour la vente
6. Donner une fourchette min/max réaliste et un prix suggéré (médiane)

Format de réponse OBLIGATOIRE (JSON strict, rien d'autre) :
{
  "min_price": <nombre entier en FCFA>,
  "max_price": <nombre entier en FCFA>,
  "suggested_price": <nombre entier en FCFA>,
  "reasoning": "<explication courte en français, max 80 mots>"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, category, subcategory, condition, description } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY non configuré');
    if (!title && !category) throw new Error('Titre ou catégorie requis');

    const userMessage = [
      `Estime le prix de vente pour cet article sur Zando+ Congo :`,
      title       ? `- Titre : ${title}` : null,
      category    ? `- Catégorie : ${category}` : null,
      subcategory ? `- Sous-catégorie : ${subcategory}` : null,
      condition   ? `- État : ${condition}` : null,
      description ? `- Description : ${description.slice(0, 300)}` : null,
    ].filter(Boolean).join('\n');

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

    // Extract JSON from the response (Claude sometimes wraps in markdown)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Format de réponse invalide');

    const result = JSON.parse(jsonMatch[0]);

    if (!result.suggested_price || !result.min_price || !result.max_price) {
      throw new Error('Données de prix incomplètes');
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
