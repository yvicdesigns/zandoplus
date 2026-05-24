import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../cors.ts';

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans la rédaction d'annonces pour Zando+, la marketplace numéro 1 du Congo Brazzaville.

Ton rôle : générer une description d'annonce professionnelle, convaincante et adaptée au marché congolais.

Règles impératives :
- Rédiger UNIQUEMENT en français correct et accessible
- Longueur : entre 80 et 200 mots
- Ton : professionnel mais chaleureux, adapté aux acheteurs congolais
- Mettre en avant les caractéristiques clés du produit/service
- Terminer par un appel à l'action court (ex: "Contactez-moi pour plus d'infos !")
- NE PAS inventer de caractéristiques non mentionnées
- NE PAS inclure de prix dans la description (il est affiché séparément)
- Utiliser des emojis avec modération (2-3 maximum, pertinents)

Format de sortie : uniquement le texte de la description, sans titre ni commentaire.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, category, subcategory, condition, keywords } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY non configuré');
    if (!title && !keywords) throw new Error('Titre ou mots-clés requis');

    const userMessage = [
      `Génère une description d'annonce pour :`,
      title       ? `- Titre : ${title}` : null,
      category    ? `- Catégorie : ${category}` : null,
      subcategory ? `- Sous-catégorie : ${subcategory}` : null,
      condition   ? `- État : ${condition}` : null,
      keywords    ? `- Mots-clés / infos supplémentaires : ${keywords}` : null,
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
        max_tokens: 512,
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

    const description = data.content?.[0]?.text?.trim();
    if (!description) throw new Error('Réponse vide de Claude');

    return new Response(JSON.stringify({ success: true, description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
