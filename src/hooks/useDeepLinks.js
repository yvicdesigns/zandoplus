import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Universal Links (iOS) / App Links (Android) : quand l'app est ouverte via
// un lien https://www.zandopluscg.com/<chemin>, on route React Router vers
// <chemin>. Ne touche PAS au retour OAuth (schéma privé com.zando.app://),
// géré séparément dans AuthContext.
const APP_HOSTS = ['zandopluscg.com', 'www.zandopluscg.com'];

const urlToInAppPath = (rawUrl) => {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' || !APP_HOSTS.includes(u.hostname)) return null;
    if (u.pathname.startsWith('/api/')) return null;
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path && path !== '/' ? path : '/';
  } catch {
    return null;
  }
};

export const useDeepLinks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Démarrage à froid : app lancée directement par un lien
    CapacitorApp.getLaunchUrl()
      .then((res) => {
        const path = res?.url ? urlToInAppPath(res.url) : null;
        if (path) navigate(path);
      })
      .catch(() => {});

    // App déjà ouverte : lien tapé pendant que l'app tourne
    let handle;
    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const path = urlToInAppPath(url);
      if (path) navigate(path);
    }).then((h) => { handle = h; });

    return () => { handle?.remove?.(); };
  }, [navigate]);
};
