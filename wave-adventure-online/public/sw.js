/* Service Worker — Offline Shell
   - แคชหน้าแอปและไฟล์ภาพ เพื่อเปิดแอปได้แม้สัญญาณหลุด
   - ไม่แคชการเรียก Firebase/Cloud Functions: การเล่นต้องออนไลน์เท่านั้น (ไม่จำลองว่าซิงก์สำเร็จ) */
const CACHE = 'wao-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/assets/board/board.webp', '/assets/board/board-preview.webp', '/assets/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                         // Firebase, fonts → network ปกติ
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('/index.html', copy)); return r; }).catch(() => caches.match('/index.html')));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
