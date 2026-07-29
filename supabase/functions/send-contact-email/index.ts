
    import { corsHeaders } from "./cors.ts";

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const CONTACT_FORM_RECEIVER = Deno.env.get('CONTACT_FORM_RECEIVER') || 'zandopluscg@gmail.com';

    Deno.serve(async (req) => {
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }

      try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
          return new Response(
            JSON.stringify({ error: 'Tous les champs sont requis.' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
              h1 { color: #2EB565; }
              .field { margin-bottom: 15px; }
              .field strong { color: #555; }
              .message-box { background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Nouveau Message de Contact Zando+</h1>
              <div class="field"><strong>Nom:</strong> ${name}</div>
              <div class="field"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></div>
              <div class="field"><strong>Sujet:</strong> ${subject}</div>
              <hr>
              <div class="message-box">
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Contact Zando+ <noreply@zandopluscg.com>',
            to: [CONTACT_FORM_RECEIVER],
            reply_to: email,
            subject: `Nouveau message de ${name}: ${subject}`,
            html: emailHtml,
            tags: [
              { name: 'category', value: 'contact_form' },
            ]
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Erreur Resend:', errorData);
          throw new Error(`Erreur Resend: ${response.status}`);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'E-mail envoyé avec succès.' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (error) {
        console.error('Erreur dans la fonction send-contact-email:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erreur lors de l\'envoi de l\'e-mail.',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    });
  