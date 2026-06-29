// Zando+ Service Worker — Web Push notifications
const CACHE_NAME = 'zandoplus-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// Réception d'un push notification (app fermée ou en arrière-plan)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Zando+', body: event.data.text() };
  }

  const title = data.title || 'Zando+';
  const options = {
    body: data.body || data.message || 'Vous avez une nouvelle notification.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'zandoplus-notif',
    renotify: true,
    data: { url: data.url || '/' },
    actions: data.url ? [{ action: 'open', title: 'Voir' }] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification → ouvrir l'app sur le bon lien
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si l'app est déjà ouverte, focus + navigation
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url });
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      clients.openWindow(url);
    })
  );
});
