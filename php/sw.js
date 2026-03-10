/**
 * FORBASI Service Worker
 * Handles caching and offline functionality
 */

const CACHE_VERSION = 'forbasi-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Files to cache immediately
const STATIC_ASSETS = [
    '/forbasi/index.php',
    '/forbasi/forbasi/assets/LOGO-FORBASI.png',
    '/forbasi/forbasi/assets/indonesia-flag.png',
    '/forbasi/forbasi/css/admin.css',
    '/forbasi/forbasi/css/pb.css',
    '/forbasi/forbasi/css/pengda.css',
    '/forbasi/forbasi/css/pengcab.css',
    '/forbasi/forbasi/css/users.css',
    '/forbasi/forbasi/js/kejurnas.js',
    '/forbasi/forbasi/js/kejurnas_pb.js',
    '/forbasi/forbasi/js/kta.js',
    '/forbasi/forbasi/js/users.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[Service Worker] Installation failed:', err);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            return name.startsWith('forbasi-') && 
                                   name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE &&
                                   name !== IMAGE_CACHE;
                        })
                        .map(name => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Handle API requests (PHP files)
    if (url.pathname.endsWith('.php')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Handle images
    if (request.destination === 'image') {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
        return;
    }
    
    // Handle CSS/JS
    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }
    
    // Default: network first
    event.respondWith(networkFirstStrategy(request));
});

// Network first strategy (for dynamic content)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error response
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 503
            }
        );
    }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
    }
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-kta-data') {
        event.waitUntil(syncKTAData());
    }
});

async function syncKTAData() {
    console.log('[Service Worker] Syncing KTA data...');
    // Implement background sync logic here
}

// Push Notification Handler - FORBASI
self.addEventListener('push', event => {
    console.log('[Service Worker] 📬 Push notification diterima');
    
    // Default notification data
    let data = {
        title: '🏐 FORBASI',
        body: 'Notifikasi baru dari Federasi Olahraga Baris Berbaris Seluruh Indonesia',
        icon: '/forbasi/forbasi/assets/icon-192x192.png',
        badge: '/forbasi/forbasi/assets/icon-72x72.png',
        url: '/forbasi/index.php',
        tag: 'forbasi-notification-' + Date.now(),
        requireInteraction: false,
        image: null,
        vibrate: [200, 100, 200, 100, 200],
        sound: '/forbasi/forbasi/assets/notification-sound.mp3'
    };
    
    // Parse data dari server
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[Service Worker] 📦 Payload:', payload);
            data = { ...data, ...payload };
        } catch (e) {
            console.warn('[Service Worker] ⚠️ Gagal parse JSON, gunakan text');
            data.body = event.data.text();
        }
    }
    
    // Notification options dengan action buttons
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        image: data.image,
        vibrate: data.vibrate,
        tag: data.tag,
        requireInteraction: data.requireInteraction,
        silent: false,
        renotify: true,
        timestamp: Date.now(),
        data: {
            url: data.url || '/forbasi/index.php',
            dateOfArrival: Date.now(),
            primaryKey: data.tag
        },
        actions: [
            {
                action: 'open',
                title: '👁️ Lihat Sekarang',
                icon: '/forbasi/forbasi/assets/icon-72x72.png'
            },
            {
                action: 'close',
                title: '❌ Tutup',
                icon: '/forbasi/forbasi/assets/icon-72x72.png'
            }
        ]
    };
    
    // Tampilkan notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => {
                console.log('[Service Worker] ✅ Notification ditampilkan');
            })
            .catch(err => {
                console.error('[Service Worker] ❌ Gagal tampilkan notification:', err);
            })
    );
});

// Notification Click Handler - FORBASI
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] 🖱️ Notification diklik:', event.action);
    
    event.notification.close(); // Tutup notification
    
    const urlToOpen = event.notification.data.url || '/forbasi/index.php';
    const notificationTag = event.notification.tag;
    
    // Handle action buttons
    if (event.action === 'close') {
        console.log('[Service Worker] ❌ User menutup notification');
        // Hanya tutup, tidak perlu action lain
        return;
    }
    
    // Action 'open' atau default (klik notification body)
    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        })
        .then(clientList => {
            console.log('[Service Worker] 🔍 Mencari window yang sudah terbuka...');
            
            // Cek apakah ada window FORBASI yang sudah terbuka
            for (const client of clientList) {
                if (client.url.includes('/forbasi/') && 'focus' in client) {
                    console.log('[Service Worker] ✅ Window ditemukan, fokus & navigate');
                    return client.focus().then(() => client.navigate(urlToOpen));
                }
            }
            
            // Buka window baru jika tidak ada yang terbuka
            if (clients.openWindow) {
                console.log('[Service Worker] 🆕 Buka window baru');
                return clients.openWindow(urlToOpen);
            }
        })
        .then(() => {
            // Log click ke database
            console.log('[Service Worker] 📝 Log notification click ke database');
            return fetch('/forbasi/forbasi/php/track_notification_click.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    tag: notificationTag,
                    action: event.action || 'open',
                    timestamp: Date.now(),
                    url: urlToOpen
                })
            });
        })
        .then(response => {
            if (response && response.ok) {
                console.log('[Service Worker] ✅ Click tracking berhasil');
            }
        })
        .catch(err => {
            console.error('[Service Worker] ❌ Error saat handle notification click:', err);
        })
    );
});

console.log('[Service Worker] Loaded successfully');
