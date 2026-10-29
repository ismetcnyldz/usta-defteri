// Usta Defteri - çevrimdışı çalışma. Güncelleme yaptığınızda sürüm adını değiştirin (usta-v3 gibi).
const CACHE = 'usta-v24';
const SHELL = ['./', 'giris/', 'index.html', 'config.js', 'manifest.json', 'logo.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const LIB_HOSTS = /(^|\.)(gstatic\.com|jsdelivr\.net|googleapis\.com|projectnaptha\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase veri ve giriş istekleri hiçbir zaman önbelleğe alınmaz
  if (/firestore\.googleapis\.com|identitytoolkit|securetoken/.test(url.hostname)) return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('giris/'))));
  } else if (LIB_HOSTS.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
// Bildirime tıklayınca uygulamayı aç
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('giris/', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.startsWith(url)); if (w) return w.focus();
    return clients.openWindow(url);
  }));
});
