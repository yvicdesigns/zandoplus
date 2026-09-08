import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { isMobile } from 'react-device-detect';
import { X } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id6800881634',
  android: 'https://play.google.com/store/apps/details?id=com.zando.app',
};

// Mémorisé pour toujours (pas juste la session) : un visiteur qui a fait un
// choix, quel qu'il soit, ne doit plus jamais revoir cet écran sur cet
// appareil. On ne peut pas savoir si l'appli est réellement installée
// (Apple/Google ne donnent pas cette info à un navigateur) — "première
// visite jamais vue" + "choix mémorisé" est le seul signal fiable dont on
// dispose côté web.
const SEEN_KEY = 'zando_gateway_seen';

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#111" aria-hidden="true">
    <path d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.3-3.1zM14.5 6.2c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4l13 8-13 8V4z" fill="#00A657" />
    <path d="M4 4l9.5 8L4 20" fill="#0B7F42" opacity=".55" />
  </svg>
);

const StoreBadge = ({ href, icon, kicker, label, onClick }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-left shadow-[0_10px_22px_-12px_rgba(18,22,14,0.35)] transition-shadow hover:shadow-[0_12px_26px_-12px_rgba(18,22,14,0.42)] active:scale-[.98]"
  >
    {icon}
    <span className="flex flex-col leading-tight">
      <span className="text-[10px] text-gray-500">{kicker}</span>
      <span className="text-sm font-bold text-gray-900">{label}</span>
    </span>
  </a>
);

const AppGatewayInterstitial = () => {
  const { siteSettings } = useSiteSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déjà dans l'appli native : rien à proposer.
    if (Capacitor.isNativePlatform()) return;
    // Réservé au web mobile — les badges App Store / Play Store n'ont pas
    // de sens pour quelqu'un qui arrive depuis un ordinateur.
    if (!isMobile) return;
    // PWA déjà installée sur l'écran d'accueil : elle a déjà fait son choix.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch {}
    if (seen) return;

    setVisible(true);
    // Évite d'empiler ce second écran avec la modale d'installation PWA
    // existante (PwaInstallModal), qui se déclenche après 4s sur la même
    // session pour le même visiteur.
    try { sessionStorage.setItem('pwaModalShown', 'true'); } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col bg-white"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Télécharger l'application Zando+"
        >
          <div className="flex justify-end p-4">
            <button
              onClick={dismiss}
              aria-label="Fermer et continuer sur le site"
              title="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-gray-50 text-gray-900 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid flex-1 grid-rows-[1fr_auto_1fr] items-center justify-items-center px-8 text-center">
            <div className="mb-8 flex flex-col items-center gap-3 self-end">
              {siteSettings?.logo_url ? (
                <img src={siteSettings.logo_url} alt="Zando+" className="h-12 w-auto object-contain" />
              ) : (
                <span className="text-3xl font-black leading-none text-custom-green-500">
                  Zando<span className="text-accent-yellow">+</span>
                </span>
              )}
              <h2 className="max-w-[18ch] text-2xl font-black leading-snug text-gray-900">
                Zando+ tient dans votre poche
              </h2>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-2.5">
              <StoreBadge
                href={STORE_URLS.ios}
                icon={<AppleIcon />}
                kicker="Télécharger sur l'"
                label="App Store"
                onClick={dismiss}
              />
              <StoreBadge
                href={STORE_URLS.android}
                icon={<PlayIcon />}
                kicker="Disponible sur"
                label="Google Play"
                onClick={dismiss}
              />
            </div>

            <div className="self-start pt-4">
              <button
                onClick={dismiss}
                className="text-[13px] font-bold text-custom-green-600 underline underline-offset-4"
              >
                Continuer sur le site →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppGatewayInterstitial;
