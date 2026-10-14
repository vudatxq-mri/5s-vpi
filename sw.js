/**
 * Service Worker cho 5S VPI Mobile PWA
 * Hỗ trợ cài đặt trên màn hình điện thoại & cache ứng dụng
 */

const CACHE_NAME = "vpi-5s-cache-v3";
const STATIC_ASSETS = [
  "/",
  "/static/css/app.css",
  "/static/js/app.js",
  "/static/manifest.json",
  "/static/images/logo-5s-vpi.svg",
  "/static/images/logo-5s-vpi.png",
  "/static/images/icon-192.png",
  "/static/images/icon-512.png",
  "/static/images/favicon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

// 1. Cài đặt Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Đang nạp sẵn tài nguyên PWA...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[Service Worker] Cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Kích hoạt & dọn cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Xóa cache cũ:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Xử lý yêu cầu mạng (Network First cho API, Cache First cho static assets)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Đối với API và Upload: Luôn dùng Network trực tiếp
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/reports/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: "Mất kết nối mạng tới máy chủ bệnh viện" }), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Đối với Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
