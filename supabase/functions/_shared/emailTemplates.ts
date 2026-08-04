// Zando+ brand colors
export const Z_DARK   = '#005023';
export const Z_DARKER = '#003D1A';
export const Z_BRIGHT = '#10CE6A';
export const Z_BG     = '#edfaf3';
export const Z_BORDER = '#a7e9c5';

export const emailFooter = (email = '') => `
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:2px solid ${Z_DARK};">
            <p style="color:#6b7280;font-size:12px;margin:0 0 6px;">
              <a href="https://www.zandopluscg.com" style="color:${Z_DARK};font-weight:700;text-decoration:none;">Zando+ Congo</a>
              &nbsp;·&nbsp; zandopluscg.com
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              © 2026 Zando+ Congo
              &nbsp;·&nbsp;
              <a href="https://www.zandopluscg.com/unsubscribe?email=${email}" style="color:#9ca3af;">Se desabonner</a>
            </p>
          </td>
        </tr>`;

export const emailHeader = (title: string, subtitle: string) => `
        <tr>
          <td style="background:linear-gradient(160deg,${Z_DARK} 0%,${Z_DARKER} 100%);padding:40px 40px 32px;text-align:center;">
            <p style="color:${Z_BRIGHT};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 16px;">Zando+ Congo</p>
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 10px;line-height:1.2;">${title}</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;margin:0;">${subtitle}</p>
          </td>
        </tr>`;

export const CAMPAIGN_TEMPLATES: Record<string, { subject: string; html: (name: string, email: string) => string }> = {
  reengagement: {
    subject: 'Zando+ — des nouvelles annonces vous attendent',
    html: (name, email) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
        ${emailHeader('Des annonces vous attendent', 'La marketplace congolaise est toujours active')}
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Bonjour <strong>${name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">Des nouvelles annonces ont ete publiees pres de chez vous. Vetements, electronique, maison, services... il y a toujours quelque chose de nouveau sur Zando+.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${Z_BG};border:1px solid ${Z_BORDER};border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="color:${Z_DARK};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Pourquoi revenir</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr><td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;">&#10003;</td><td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Achat securise — vos fonds proteges jusqu'a reception</td></tr>
                  <tr><td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;">&#10003;</td><td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Publication gratuite et illimitee pour les vendeurs</td></tr>
                  <tr><td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;">&#10003;</td><td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Livraison a domicile disponible a Brazzaville</td></tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="https://www.zandopluscg.com" style="display:inline-block;background:linear-gradient(135deg,${Z_DARK},${Z_DARKER});color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:12px;">Voir les annonces</a>
            </td></tr></table>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">L'equipe Zando+ Congo</p>
          </td>
        </tr>
        ${emailFooter(encodeURIComponent(email))}
      </table>
    </td></tr>
  </table>
</body></html>`,
  },

  new_seller: {
    subject: 'Vendez sur Zando+ — inscription et publication sans frais',
    html: (name, email) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
        ${emailHeader('Vendez vos articles en ligne', 'Sans frais d\'inscription, sans abonnement')}
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Bonjour <strong>${name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">Vous pouvez publier autant d'annonces que vous voulez sur Zando+ sans aucun frais. Vous ne payez une commission de 10% qu'au moment ou vous vendez via l'Achat Securise.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="32%" style="text-align:center;padding:20px 8px;background:${Z_BG};border-radius:12px;border:1px solid ${Z_BORDER};">
                  <div style="font-size:26px;margin-bottom:10px;">&#128247;</div>
                  <p style="color:${Z_DARK};font-size:13px;font-weight:700;margin:0 0 4px;">Publiez</p>
                  <p style="color:#6b7280;font-size:12px;margin:0;">Photos + description</p>
                </td>
                <td width="2%"></td>
                <td width="32%" style="text-align:center;padding:20px 8px;background:${Z_BG};border-radius:12px;border:1px solid ${Z_BORDER};">
                  <div style="font-size:26px;margin-bottom:10px;">&#128172;</div>
                  <p style="color:${Z_DARK};font-size:13px;font-weight:700;margin:0 0 4px;">Discutez</p>
                  <p style="color:#6b7280;font-size:12px;margin:0;">Chat direct</p>
                </td>
                <td width="2%"></td>
                <td width="32%" style="text-align:center;padding:20px 8px;background:${Z_BG};border-radius:12px;border:1px solid ${Z_BORDER};">
                  <div style="font-size:26px;margin-bottom:10px;">&#128176;</div>
                  <p style="color:${Z_DARK};font-size:13px;font-weight:700;margin:0 0 4px;">Encaissez</p>
                  <p style="color:#6b7280;font-size:12px;margin:0;">Mobile Money</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="https://www.zandopluscg.com/post-ad" style="display:inline-block;background:linear-gradient(135deg,${Z_DARK},${Z_DARKER});color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:12px;">Publier une annonce</a>
            </td></tr></table>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">L'equipe Zando+ Congo</p>
          </td>
        </tr>
        ${emailFooter(encodeURIComponent(email))}
      </table>
    </td></tr>
  </table>
</body></html>`,
  },
};
