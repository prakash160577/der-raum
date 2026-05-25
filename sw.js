// Der Raum – Service Worker
// Version hochzählen bei jedem Deploy erzwingt Cache-Refresh bei allen Nutzern
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'der-raum-' + CACHE_VERSION;

// Installation: neuen Cache anlegen
self.addEventListener('install', event => {
  self.skipWaiting(); // Sofort aktivieren, nicht auf Tab-Schließen warten
});

// Aktivierung: alle alten Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // Alle offenen Tabs übernehmen
  );
});

// Fetch: Network-First – immer frische Version versuchen
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort im Cache speichern
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Offline-Fallback: aus Cache laden
        caches.match(event.request)
      )
  );
});
