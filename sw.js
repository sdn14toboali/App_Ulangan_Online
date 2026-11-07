/**
 * Service Worker Resmi SD NEGERI 14 TOBOALI
 * Versi Cache: zettcbt-sdn14-v3.78.0
 * Resilient Multi-Platform CBT PWA Engine
 */

const CACHE_NAME = 'zettcbt-sdn14-v3.78.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './db-config.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-192.png',
  './assets/icon-maskable-512.png',
  './assets/logo.js',
  './assets/xlsx.full.min.js',
  './assets/template_data_siswa.xls',
  './assets/template_data_siswa.csv',
  './assets/db-config.js'
];

// Install Event: Cache setiap aset secara individual (Non-Atomic)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res && res.status === 200) {
              await cache.put(url, res);
            }
          } catch (e) {
            console.warn('PWA: Aset opsional dilewati saat install:', url);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Bersihkan cache versi lama secara aman
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA: Menghapus cache usang:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Hybrid Resilient Handler
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || !req.url || !req.url.startsWith('http')) return;

  // JANGAN intercept panggilan database Neon Cloud, Supabase, atau API pihak ketiga
  if (
    req.url.includes('neon.tech') ||
    req.url.includes('supabase.co') ||
    req.url.includes('api.qrserver.com') ||
    req.url.includes('googleapis.com')
  ) {
    return;
  }

  const isNavigation = req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'));

  event.respondWith(
    (async () => {
      // 1. STRATEGI NAVIGASI / HALAMAN HTML (Network First dengan Offline Fallback)
      if (isNavigation) {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone).catch(() => {});
              cache.put('./index.html', clone.clone()).catch(() => {});
            });
            return networkResponse;
          }
        } catch (netErr) {
          console.warn('PWA: Network navigasi offline, memulihkan dari cache...', req.url);
        }

        const cachedDoc = await caches.match(req, { ignoreSearch: true }) ||
                          await caches.match('./index.html', { ignoreSearch: true }) ||
                          await caches.match('index.html', { ignoreSearch: true }) ||
                          await caches.match('/', { ignoreSearch: true }) ||
                          await caches.match('./', { ignoreSearch: true });
        if (cachedDoc) return cachedDoc;

        // SAFEGUARD ANTI ERR_FAILED: Jangan pernah melempar undefined ke respondWith
        return new Response(
          `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SD NEGERI 14 TOBOALI - Pemulihan Koneksi</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; box-sizing: border-box; }
    .card { background: #1e293b; border: 1.5px solid #334155; border-radius: 24px; padding: 2.25rem 1.75rem; max-width: 440px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); box-sizing: border-box; }
    .icon { font-size: 3.2rem; margin-bottom: 1rem; }
    h2 { font-size: 1.28rem; font-weight: 800; color: #38bdf8; margin: 0 0 0.6rem 0; line-height: 1.3; }
    p { font-size: 0.88rem; color: #94a3b8; line-height: 1.55; margin: 0 0 1.5rem 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2563eb; color: #ffffff; padding: 0.85rem 1.5rem; border-radius: 12px; font-weight: 800; font-size: 0.95rem; border: none; cursor: pointer; text-decoration: none; width: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔄</div>
    <h2>Menghubungkan ke Portal Ujian...</h2>
    <p>Aplikasi sedang menyinkronkan koneksi dengan server SD Negeri 14 Toboali. Klik tombol di bawah untuk memuat ulang:</p>
    <button class="btn" onclick="window.location.reload(true)">⚡ Muat Ulang Sekarang</button>
  </div>
</body>
</html>`,
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      }

      // 2. STRATEGI ASET STATIS (CSS, JS, Gambar)
      const cachedAsset = await caches.match(req, { ignoreSearch: true });
      if (cachedAsset) {
        fetch(req).then((freshResponse) => {
          if (freshResponse && freshResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, freshResponse).catch(() => {});
            });
          }
        }).catch(() => {});
        return cachedAsset;
      }

      try {
        const netResponse = await fetch(req);
        if (netResponse && netResponse.status === 200) {
          const clone = netResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone).catch(() => {});
          });
        }
        return netResponse;
      } catch (err) {
        return new Response('', { status: 404, statusText: 'Asset Not Found' });
      }
    })()
  );
});
