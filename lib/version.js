// App version — bump this with each deploy
export const APP_VERSION = "0.10.1";

// Changelog shown after update (most recent first)
export const CHANGELOG = [
  {
    version: "0.10.1",
    date: "2026-04-13",
    title: { es: "Listo para temporada de lluvias", en: "Ready for rainy season" },
    items: {
      es: [
        "🌧️ Alertas de lluvia — aviso proactivo cuando se detecta o espera lluvia",
        "📍 Zonas cercanas primero — la lista se ordena por distancia a ti",
        "📊 Estadísticas comunitarias — reportes totales, reporteros activos",
        "📸 Visor de fotos — toca cualquier foto para verla en pantalla completa",
        "🔔 Notificaciones inteligentes — aviso cuando confirman tu reporte",
        "📜 Historial por zona — reportes totales y de los últimos 30 días",
        "⭐ Celebración de rango — animación al subir de nivel",
        "📲 Instalar app — aviso para agregar a pantalla de inicio",
        "🤝 Invitar amigos — comparte AlertaArroyo fácilmente",
      ],
      en: [
        "🌧️ Rain alerts — proactive warning when rain is detected or expected",
        "📍 Nearby zones first — list sorts by distance from you",
        "📊 Community stats — total reports, active reporters",
        "📸 Photo viewer — tap any report photo for full-screen view",
        "🔔 Smart notifications — get notified when someone confirms your report",
        "📜 Zone history — all-time and 30-day report counts per zone",
        "⭐ Rank-up celebration — animation when you level up",
        "📲 Install app — prompt to add to home screen",
        "🤝 Invite friends — easily share AlertaArroyo",
      ],
    },
    bugfixes: {
      es: [
        "Animación de salida en todos los modales",
        "Popup del mapa se mantiene abierto al hacer clic",
        "Restauración instantánea del mapa al cerrar panel",
        "Explicación de expiración de reportes (4 horas)",
        "Progreso visual en temporizador de reportes",
      ],
      en: [
        "Exit animations on all modals",
        "Map popup stays open when clicked",
        "Instant map restore when closing panel",
        "Report expiry explanation (4 hours)",
        "Visual progress bar on report countdown",
      ],
    },
  },
  {
    version: "0.9.0",
    date: "2026-04-11",
    title: { es: "Rediseño visual completo", en: "Complete visual redesign" },
    items: {
      es: [
        "🎨 Iconos SVG — reemplazados todos los emoji por iconos profesionales",
        "📱 Tarjeta deslizable — peek, medio, completo con animación de rebote",
        "🗺️ Mapa personalizado — colores oscuros que combinan con la app",
        "🔗 Enlaces directos — compartir por WhatsApp abre la zona específica",
        "💬 Sistema de comentarios renovado",
        "🖥️ Modales de escritorio — About y Perfil como ventanas flotantes",
        "🖥️ Panel lateral en mapa de escritorio",
        "🌧️ Radar de lluvia mejorado con leyenda de colores",
      ],
      en: [
        "🎨 SVG icons — all emoji replaced with professional icons",
        "📱 Multi-snap sheet — peek, half, full with spring bounce",
        "🗺️ Custom map style — dark theme matching the app",
        "🔗 Deep links — WhatsApp shares open specific zones",
        "💬 Revamped comment system",
        "🖥️ Desktop modals — About and Profile as floating dialogs",
        "🖥️ Side panel for desktop map view",
        "🌧️ Improved rain radar with color legend",
      ],
    },
    bugfixes: {
      es: [
        "Corregido el flash al abrir modales en escritorio",
        "Corregido el color del texto 'Alerta' en el logo",
        "Menú 'Más' ahora se cierra suavemente",
        "Comentarios visibles sobre la barra de Safari",
        "Historial ya no mueve los puntos al hacer zoom",
        "Botón de confirmar ya no se estira al abrir comentarios",
      ],
      en: [
        "Fixed flash when opening desktop modals",
        "Fixed 'Alerta' text color in logo",
        "More menu now closes smoothly",
        "Comments visible above Safari bottom bar",
        "History dots no longer drift on zoom",
        "Confirm button no longer stretches when comments open",
      ],
    },
  },
  {
    version: "0.4.1",
    date: "2025-04-10",
    title: { es: "Mejoras y correcciones", en: "Improvements & fixes" },
    items: {
      es: [
        "🗺️ Mapa Mapbox — más fluido y preciso",
        "📍 12 zonas activas verificadas",
        "👤 Perfil de reportero con rangos",
        "⭐ Favoritos — marca tus zonas",
        "📊 Resumen semanal de actividad",
        "📱 Compartir por WhatsApp al reportar",
        "📸 Fotos visibles en lista de zonas",
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
        "📜 Documented incidents in Info",
      ],
    },
    bugfixes: {
      es: [
        "Corregidas las zonas de arroyos — eliminados los canalizados, solo arroyos activos",
        "Los marcadores del mapa ya no se mueven al hacer zoom",
        "Mejor contraste y legibilidad en todas las pantallas",
        "Traducciones al inglés corregidas en toda la app",
        "Botón de ubicación ahora se puede desactivar",
        "Nombres de la app corregidos a AlertaArroyo",
        "Radar de lluvia mejorado con OpenWeatherMap",
        "Compatibilidad mejorada en iPhones antiguos",
      ],
      en: [
        "Corrected arroyo zones — removed canalized, only active arroyos",
        "Map markers no longer drift when zooming",
        "Better contrast and readability on all screens",
        "English translations fixed throughout the app",
        "Location button now toggles off",
        "App naming corrected to AlertaArroyo",
        "Rain radar improved with OpenWeatherMap",
        "Better compatibility on older iPhones",
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
