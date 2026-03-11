// Service Worker for FORBASI PWA
const CACHE_NAME = 'forbasi-v1.0.0';
const RUNTIME_CACHE = 'forbasi-runtime';

// Detect environment based on location
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const basePath = isLocalhost ? '/forbasi' : '';

// Files to cache on install
const PRECACHE_URLS = [
  `${basePath}/`,
  `${basePath}/index.php`,
  `${basePath}/forbasi/assets/LOGO-FORBASI.png`,
  `${basePath}/forbasi/assets/indonesia-flag.png`,
  `${basePath}/forbasi/css/admin.css`,
  `${basePath}/forbasi/css/users.css`,
  `${basePath}/forbasi/css/pengcab.css`,
  `${basePath}/forbasi/css/pengda.css`,
  `${basePath}/forbasi/css/pb.css`,
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching essential files');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, {credentials: 'same-origin'})));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, falling back to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API calls - Network only (always fresh data)
  if (url.pathname.includes('/php/') || url.pathname.includes('.php')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Offline - Cannot connect to server',
              offline: true 
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Static assets - Cache first, falling back to network
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version and update cache in background
            fetch(request).then(response => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then(cache => {
                  cache.put(request, response);
                });
              }
            });
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request).then(response => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Fallback for images
          if (request.destination === 'image') {
            return caches.match(`${basePath}/forbasi/assets/LOGO-FORBASI.png`);
          }
        })
    );
    return;
  }

  // HTML pages - Network first, falling back to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful HTML responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page if available
          return caches.match(`${basePath}/index.php`);
        });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        return self.registration.unregister();
      })
    );
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-kta-data') {
    event.waitUntil(syncKTAData());
  }
});

async function syncKTAData() {
  // Get queued requests from IndexedDB and sync when online
  console.log('[SW] Syncing offline KTA data...');
  // Implementation would depend on your offline storage strategy
}

// Push notifications (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Update baru dari FORBASI',
    icon: `${basePath}/forbasi/assets/LOGO-FORBASI.png`,
    badge: `${basePath}/forbasi/assets/icon-72x72.png`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Lihat Detail',
        icon: `${basePath}/forbasi/assets/LOGO-FORBASI.png`
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: `${basePath}/forbasi/assets/LOGO-FORBASI.png`
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FORBASI', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(`${basePath}/`)
    );
  }
});
