import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../cors.ts';
import { normalizePhone } from '../_shared/normalizePhone.ts';

// Alerte WhatsApp vers le numéro support Zando+ (ADMIN_WHATSAPP_NUMBER) dès
// qu'une preuve de paiement (boost ou escrow) est soumise — sans ça, personne
// n'est prévenu et le paiement peut rester invisible plusieurs jours (vécu
// avec un client le 21/09/2026).
//
// Utilise un modèle WhatsApp approuvé par Meta (message initié par
// l'entreprise = obligatoire) — voir README_TEMPLATE ci-dessous pour le texte
// exact à soumettre tant que le modèle n'existe pas encore.
//
// Appelée en interne (service_role uniquement) par submit-payment-proof et
// par le client juste après l'upload de preuve d'un boost. Ne bloque jamais
// le flux appelant si l'envoi WhatsApp échoue.

const TEMPLATE_NAME = 'zandoplus_alerte_paiement';

interface NotifyPaymentPayload {
  type: 'boost' | 'escrow';
  amount: number;
  reference: string;          // ID court a afficher (ex: 8 premiers caracteres de l'UUID)
  proof_url: string;
  detail?: string;            // ex: "Boost Urgent - 7 jours" ou le titre de l'annonce
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const WHATSAPP_TOKEN     = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_ID  = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const ADMIN_NUMBER_RAW   = Deno.env.get('ADMIN_WHATSAPP_NUMBER');

    const adminNumber = normalizePhone(ADMIN_NUMBER_RAW || '');
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !adminNumber) {
      console.error('notify-admin-payment: configuration WhatsApp incomplete, alerte non envoyee');
      return new Response(JSON.stringify({ success: false, error: 'WhatsApp non configure' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, amount, reference, proof_url, detail }: NotifyPaymentPayload = await req.json();
    if (!type || !amount || !reference || !proof_url) {
      throw new Error('type, amount, reference et proof_url sont requis');
    }

    const label = type === 'boost' ? 'Boost' : 'Paiement Escrow';
    const amountStr = `${Number(amount).toLocaleString('fr-FR')} FCFA`;

    const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: adminNumber,
        type: 'template',
        template: {
          name: TEMPLATE_NAME,
          language: { code: 'fr' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: label },
              { type: 'text', text: amountStr },
              { type: 'text', text: detail || reference },
              { type: 'text', text: proof_url },
            ],
          }],
        },
      }),
    });

    const resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('notify-admin-payment: envoi WhatsApp echoue', resJson);
      return new Response(JSON.stringify({ success: false, error: resJson }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-admin-payment error:', error);
    // Ne fait jamais echouer le flux de paiement appelant a cause de ca.
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* README_TEMPLATE — a soumettre dans Meta Business Manager tant que ca n'existe pas :

Nom du modele  : zandoplus_alerte_paiement
Categorie      : UTILITY
Langue         : Francais (fr)
Corps du message (4 variables) :

  💰 Nouveau paiement a verifier sur Zando+

  Type : {{1}}
  Montant : {{2}}
  Reference : {{3}}

  Preuve de paiement : {{4}}

Exemple de valeurs pour la soumission :
  {{1}} = Boost
  {{2}} = 300 FCFA
  {{3}} = Boost Urgent - 7 jours
  {{4}} = https://axlpfskrrlwibcnxkfvb.supabase.co/storage/v1/object/public/payment_proofs/exemple.jpg
*/
