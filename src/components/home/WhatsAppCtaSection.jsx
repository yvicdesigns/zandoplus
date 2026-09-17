import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

const SESSION_DISMISS_KEY = 'whatsapp_cta_dismissed_v1';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Bannière "Rejoins notre groupe/chaîne WhatsApp" — meme style que la carte
// "Créer ma boutique". Fermeture par X memorisee pour la session en cours
// seulement (sessionStorage), pas pour toujours : revient a la prochaine
// visite, meme logique que le bandeau de mise a jour de l'app.
const WhatsAppCtaSection = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <section className="container mx-auto px-4 py-2">
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#075E54] to-[#128C7E] text-white">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-10 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="relative max-w-md">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#25D366] mb-1.5">
            Restez connectés à Zando+
          </p>
          <h3 className="text-lg sm:text-xl font-black mb-1.5">
            Rejoignez-nous sur WhatsApp
          </h3>
          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            Nouvelles annonces, bons plans et actualités Zando+ directement dans votre WhatsApp.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href="https://chat.whatsapp.com/CgRPcdLTGVcFVn3JLh4SHh?s=cl&p=i&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white text-[#075E54] font-extrabold text-sm rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <WhatsAppIcon /> Rejoindre le groupe
            </a>
            <a
              href="https://whatsapp.com/channel/0029VbDPhv7DJ6Gs1Z38e924"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/15 text-white font-extrabold text-sm rounded-full px-4 py-2 hover:bg-white/25 transition-colors"
            >
              <Megaphone className="w-4 h-4" /> Suivre la chaîne
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppCtaSection;
