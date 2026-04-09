// App version — bump this with each deploy
export const APP_VERSION = "0.3.0";

// Changelog shown after update (most recent first)
export const CHANGELOG = [
  {
    version: "0.3.0",
    date: "2025-04-09",
    title: { es: "¡Gran actualización!", en: "Big update!" },
    items: {
      es: [
        "📸 Fotos en reportes",
        "💬 Comentarios en reportes",
        "🛣️ Verificador de ruta segura",
        "🔥 Mapa de calor histórico",
        "🔊 Alertas sonoras",
        "📍 Botón de ubicación",
      ],
      en: [
        "📸 Photos in reports",
        "💬 Comments on reports",
        "🛣️ Safe route checker",
        "🔥 Historical heatmap",
        "🔊 Audio alerts",
        "📍 Location button",
      ],
    },
  },
];

// Check if there's a new version since last visit
export function checkForUpdate() {
  try {
    const lastVersion = localStorage.getItem("arroyo-app-version");
    if (!lastVersion) {
      // First visit — save version, no update banner
      localStorage.setItem("arroyo-app-version", APP_VERSION);
      return { isNew: false, isUpdate: false };
    }
    if (lastVersion !== APP_VERSION) {
      return { isNew: false, isUpdate: true, fromVersion: lastVersion };
    }
    return { isNew: false, isUpdate: false };
  } catch (e) {
    return { isNew: false, isUpdate: false };
  }
}

// Mark current version as seen
export function markVersionSeen() {
  try {
    localStorage.setItem("arroyo-app-version", APP_VERSION);
  } catch (e) {}
}
