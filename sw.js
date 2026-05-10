/* ============================================================
   SYSTEL — Service Worker
   Permet au BIP de sonner même si l'utilisateur est sur
   une autre page (cartographie, COSSIM, etc.)
   ============================================================ */

const CACHE_NAME = 'systel-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// Écouter les messages depuis les pages
self.addEventListener('message', event => {
  if (event.data?.type === 'BIP_ALERTE') {
    // Diffuser le bip à TOUTES les pages ouvertes
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'BIP_ALERTE', bip: event.data.bip });
      });
    });
    // Notification navigateur si permission accordée
    if (self.registration.showNotification) {
      self.registration.showNotification('🚨 ' + (event.data.bip?.motif || 'INTERVENTION'), {
        body: (event.data.bip?.enginNom || '') + ' — ' + (event.data.bip?.interNum || ''),
        icon: 'images/BIP.png',
        badge: 'images/BIP.png',
        tag: 'bip-alerte',
        renotify: true,
        requireInteraction: true
      });
    }
  }
});
