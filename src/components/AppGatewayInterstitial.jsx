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

// Un navigateur ne peut pas savoir si l'appli a été réellement installée
// (Apple/Google ne donnent pas cette info à une page web) — donc deux
// niveaux de mémoire, selon ce qu'on peut raisonnablement déduire du geste :
//  - Fermer (X / "Continuer sur le site") = "pas maintenant", pas "jamais" —
//    mémorisé pour la session en cours seulement (sessionStorage), donc
//    l'écran revient à la prochaine visite.
//  - Cliquer un badge App Store / Google Play = signal fort qu'on part
//    installer — mémorisé pour de bon (localStorage), ne revient plus.
//  - Ouvrir le site depuis l'appli native elle-même = preuve réelle
//    d'installation, garantie par Capacitor.isNativePlatform() ci-dessous.
const SEEN_KEY = 'zando_gateway_seen';
const SESSION_DISMISS_KEY = 'zando_gateway_dismissed_session';

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.3-3.1zM14.5 6.2c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4l13 8-13 8V4z" fill="currentColor" />
    <path d="M4 4l9.5 8L4 20" fill="currentColor" opacity=".45" />
  </svg>
);

const StoreBadge = ({ href, icon, kicker, label, onClick }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex items-center gap-3 rounded-2xl bg-custom-green-500 px-5 py-4 text-left text-white shadow-[0_10px_22px_-10px_rgba(0,82,42,0.5)] transition-shadow hover:bg-custom-green-600 hover:shadow-[0_14px_28px_-10px_rgba(0,82,42,0.6)] active:scale-[.98]"
  >
    {icon}
    <span className="flex flex-col leading-tight">
      <span className="text-[11px] text-white/75">{kicker}</span>
      <span className="text-base font-bold text-white">{label}</span>
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

    // Pratique pour retester sans vider tout le localStorage du site :
    // ?zando_gateway=reset efface les deux choix mémorisés.
    try {
      if (new URLSearchParams(window.location.search).get('zando_gateway') === 'reset') {
        localStorage.removeItem(SEEN_KEY);
        sessionStorage.removeItem(SESSION_DISMISS_KEY);
      }
    } catch {}

    let installedOrChosen = false;
    try { installedOrChosen = localStorage.getItem(SEEN_KEY) === '1'; } catch {}
    if (installedOrChosen) return;

    let dismissedThisVisit = false;
    try { dismissedThisVisit = sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch {}
    if (dismissedThisVisit) return;

    setVisible(true);
  }, []);

  // "Pas maintenant" — revient à la prochaine visite.
  const dismissSoft = () => {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  // Part vers un store — considéré comme un choix définitif.
  const dismissHard = () => {
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
              onClick={dismissSoft}
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
                onClick={dismissHard}
              />
              <StoreBadge
                href={STORE_URLS.android}
                icon={<PlayIcon />}
                kicker="Disponible sur"
                label="Google Play"
                onClick={dismissHard}
              />
            </div>

            <div className="self-start pt-4">
              <button
                onClick={dismissSoft}
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
