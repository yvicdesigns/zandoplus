import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Download, X } from 'lucide-react';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id6800881634',
  android: 'https://play.google.com/store/apps/details?id=com.zando.app',
};

const DISMISS_KEY = 'zando_update_dismissed_version';

// Ni l'App Store ni le Play Store ne préviennent jamais l'app elle-même
// qu'une nouvelle version existe (ça reste entre eux et le téléphone) —
// donc l'app compare sa propre version à une valeur qu'on contrôle dans
// site_settings, mise à jour manuellement après chaque soumission aux
// stores. Discret par défaut (fermable) ; min_*_version permet un blocage
// non-fermable réservé aux urgences (faille de sécurité, incompatibilité
// serveur) — vide par défaut, jamais activé sauf besoin réel.
const parts = (v) => (v || '').split('.').map(n => parseInt(n, 10) || 0);
const isOlder = (current, reference) => {
  if (!reference) return false;
  const c = parts(current), r = parts(reference);
  for (let i = 0; i < Math.max(c.length, r.length); i++) {
    const cv = c[i] || 0, rv = r[i] || 0;
    if (cv < rv) return true;
    if (cv > rv) return false;
  }
  return false;
};

const AppUpdateBanner = () => {
  const { siteSettings } = useSiteSettings();
  const [status, setStatus] = useState(null); // null | 'none' | 'soft' | 'hard'
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !siteSettings) return;

    const platform = Capacitor.getPlatform(); // 'ios' | 'android'
    const latest = platform === 'ios' ? siteSettings.latest_ios_version : siteSettings.latest_android_version;
    const min = platform === 'ios' ? siteSettings.min_ios_version : siteSettings.min_android_version;

    CapacitorApp.getInfo().then(({ version }) => {
      if (min && isOlder(version, min)) {
        setStatus('hard');
      } else if (isOlder(version, latest)) {
        setStatus('soft');
        try {
          if (localStorage.getItem(DISMISS_KEY) === latest) setDismissed(true);
        } catch {}
      } else {
        setStatus('none');
      }
    }).catch(() => setStatus('none'));
  }, [siteSettings]);

  if (status !== 'soft' && status !== 'hard') return null;
  if (status === 'soft' && dismissed) return null;

  const platform = Capacitor.getPlatform();
  const storeUrl = STORE_URLS[platform] || STORE_URLS.android;

  const dismiss = () => {
    const latest = platform === 'ios' ? siteSettings.latest_ios_version : siteSettings.latest_android_version;
    try { localStorage.setItem(DISMISS_KEY, latest); } catch {}
    setDismissed(true);
  };

  return (
    <div className={`fixed inset-x-0 z-[60] px-4 ${status === 'hard' ? 'inset-0 flex items-center justify-center bg-black/60' : 'top-0 pt-[env(safe-area-inset-top)]'}`}>
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3 ${status === 'hard' ? 'max-w-sm' : 'w-full mt-2 max-w-xl mx-auto'}`}>
        <div className="w-10 h-10 rounded-xl bg-custom-green-50 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-custom-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">
            {status === 'hard' ? 'Mise à jour requise' : 'Nouvelle version disponible'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {status === 'hard'
              ? "Cette version de Zando+ n'est plus prise en charge. Mettez à jour pour continuer."
              : 'De nouvelles fonctionnalités et corrections vous attendent.'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-custom-green-500 hover:bg-custom-green-600 text-white text-xs font-bold rounded-xl px-4 py-2 transition-colors"
            >
              Mettre à jour
            </a>
            {status === 'soft' && (
              <button
                onClick={dismiss}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-2"
              >
                Plus tard
              </button>
            )}
          </div>
        </div>
        {status === 'soft' && (
          <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AppUpdateBanner;
