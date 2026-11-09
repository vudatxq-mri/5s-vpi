/**
 * Service Worker cho 5S VPI Mobile PWA
 * Hỗ trợ cài đặt trên màn hình điện thoại & cập nhật tức thì mã nguồn mới
 */

const CACHE_NAME = "vpi-5s-cache-v23_20261109";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

// 1. Cài đặt Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Nạp sẵn tài nguyên PWA V22...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[Service Worker] Cache prefill warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Kích hoạt & dọn sạch toàn bộ cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Xóa sạch cache cũ:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu mạng: Luôn Network First cho JS, HTML, CSS, API để không bao giờ bị lưu bản cũ
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API, Uploads, Reports: Trực tiếp qua mạng 100%
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

  // File mã nguồn ứng dụng (JS, HTML, CSS): Network-First tuyệt đối
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".html") || url.pathname.endsWith(".css") || url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Ảnh tĩnh & font: Stale-While-Revalidate
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
