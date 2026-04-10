// AlertaArroyo Service Worker
// Version — bump this with each deploy to trigger update
const SW_VERSION = "0.4.1";
const CACHE_NAME = "arroyo-v" + SW_VERSION;

// Install — take over immediately
self.addEventListener("install", function() {
  self.skipWaiting();
});

// Activate — clean old caches and notify all clients
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key.startsWith("arroyo-") && key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() { return self.clients.claim(); })
  );

  // Notify all open windows about the update
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: "SW_UPDATED", version: SW_VERSION });
      });
    })
  );
});

// Fetch — network first, never cache API/version endpoints
self.addEventListener("fetch", function(event) {
  var url = new URL(event.request.url);

  // Never cache version checks or API calls
  if (url.pathname.startsWith("/api/")) return;

  // Skip non-GET
  if (event.request.method !== "GET") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Network first for navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.ok) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});

// Push notifications
self.addEventListener("push", function(event) {
  var data = { title: "AlertaArroyo", body: "Nueva alerta de arroyo", zone: "" };
  try { data = event.data.json(); } catch (e) {}

  var options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: "arroyo-" + (data.zoneId || "general"),
    renotify: true,
    data: { url: "/", zoneId: data.zoneId },
    actions: [
      { action: "open", title: "Ver mapa" },
      { action: "dismiss", title: "Cerrar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf("arroyo-alert") !== -1 && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
