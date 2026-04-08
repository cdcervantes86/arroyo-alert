// ArroyoAlerta Service Worker — handles push notifications

self.addEventListener("push", (event) => {
  let data = { title: "ArroyoAlerta", body: "Nueva alerta de arroyo", zone: "" };

  try {
    data = event.data.json();
  } catch (e) {
    // fallback to defaults
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: `arroyo-${data.zoneId || "general"}`,
    renotify: true,
    data: {
      url: "/",
      zoneId: data.zoneId,
    },
    actions: [
      { action: "open", title: "Ver mapa" },
      { action: "dismiss", title: "Cerrar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes("arroyo-alert") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
