/**
 * Service Worker cho 5S VPI Mobile PWA
 * Hỗ trợ cài đặt trên màn hình điện thoại & cập nhật tức thì mã nguồn mới
 *
 * V25:
 *  - Bỏ nạp sẵn Font Awesome & QRCode.js (app không sử dụng, tốn ~100KB 4G mỗi lần cài)
 *  - Nạp sẵn app.js, CSS, logo để mở app nhanh & dùng được khi mất mạng
 *  - Chỉ cache request GET (POST /api/sync không bao giờ bị cache)
 *  - Khi mất mạng, API trả về mã 503 (trước đây trả 200 khiến app tưởng đã đồng bộ thành công)
 */

const CACHE_NAME = "vpi-5s-cache-v29_20261125";
const STATIC_ASSETS = [
  "/",
  "/app.js?v=20261125_v29",
  "/app-v29.js?v=20261125_v29",
  "/style.css?v=20261120_v25",
  "/css/app.css?v=20261120_v25",
  "/manifest.json",
  "/logo-5s-vpi.png",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png"
];

// 1. Cài đặt Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  if (response && response.status === 200 && (response.type === "basic" || response.type === "cors")) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

// 3. Xử lý yêu cầu mạng
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // API, Uploads, Reports: Trực tiếp qua mạng 100%
  if (url.origin === self.location.origin &&
      (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/reports/"))) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Mất kết nối mạng tới máy chủ bệnh viện" }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Chỉ cache các request GET
  if (request.method !== "GET") return;

  // File mã nguồn ứng dụng (JS, HTML, CSS): Network-First, dự phòng cache khi mất mạng
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".html") || url.pathname.endsWith(".css") || url.pathname === "/" || request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(request, res))
        .catch(() => caches.match(request).then((r) => r || (request.mode === "navigate" ? caches.match("/") : undefined)))
    );
    return;
  }

  // Ảnh tĩnh & font: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((res) => putInCache(request, res))
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});
