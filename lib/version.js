// App version — bump this with each deploy
export const APP_VERSION = "0.4.0";

// Changelog shown after update (most recent first)
export const CHANGELOG = [
  {
    version: "0.4.0",
    date: "2025-04-10",
    title: { es: "Mapbox + nuevas funciones", en: "Mapbox + new features" },
    items: {
      es: [
        "🗺️ Mapa Mapbox — más fluido y preciso",
        "📍 12 zonas activas verificadas",
        "👤 Perfil de reportero con rangos",
        "⭐ Favoritos — marca tus zonas",
        "📊 Resumen semanal de actividad",
        "📱 Compartir por WhatsApp al reportar",
        "📸 Fotos visibles en lista de zonas",
        "🌧️ Radar de lluvia mejorado",
        "📜 Incidentes documentados en Info",
      ],
      en: [
        "🗺️ Mapbox map — smoother and sharper",
        "📍 12 verified active zones",
        "👤 Reporter profile with ranks",
        "⭐ Favorites — star your zones",
        "📊 Weekly activity digest",
        "📱 WhatsApp share after reporting",
        "📸 Photo thumbnails in zone list",
        "🌧️ Improved rain radar",
        "📜 Documented incidents in Info",
      ],
    },
  },
  {
    version: "0.3.0",
    date: "2025-04-09",
    title: { es: "Lanzamiento inicial", en: "Initial launch" },
    items: {
      es: [
        "📸 Fotos en reportes",
        "💬 Comentarios en reportes",
        "🔥 Mapa de calor histórico",
        "🔊 Alertas sonoras",
        "📍 Botón de ubicación",
      ],
      en: [
        "📸 Photos in reports",
        "💬 Comments on reports",
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
