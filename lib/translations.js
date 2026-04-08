export const translations = {
  es: {
    // Header
    appName: "Arroyo",
    appNameAccent: "Alerta",

    // Status bar
    danger: "peligro",
    caution: "precaución",
    noActiveAlerts: "Sin alertas activas",
    expiresIn: "Expiran en 4h",

    // Map
    loadingMap: "Cargando mapa...",
    noReports: "Sin reportes",

    // List
    noRecentReports: "Sin reportes recientes",

    // FAB
    reportArroyo: "Reportar Arroyo",

    // Zone detail
    backToMap: "← Mapa",
    currentStatus: "Estado",
    notifyMe: "Notificarme",
    notificationsActive: "Notificaciones activas",
    recentReports: "Reportes recientes",
    noReportsForZone: "No hay reportes recientes para esta zona",
    confirm: "Confirmar",
    confirmed: "Confirmado",
    reportThisZone: "Reportar esta zona",

    // Report flow
    back: "← Atrás",
    step: "Paso",
    of: "de",
    whereIsArroyo: "¿Dónde está el arroyo?",
    selectZone: "Selecciona la zona afectada",
    howBad: "¿Qué tan grave está?",
    selectRisk: "Selecciona el nivel de riesgo",
    anythingElse: "¿Algo más que reportar?",
    optional: "Opcional — ayuda a otros a entender la situación",
    textPlaceholder: "Ej: El agua está subiendo rápido por la calle...",
    reportSummary: "Resumen del reporte",
    submitReport: "Enviar Reporte",
    sending: "Enviando...",
    reportSent: "¡Reporte enviado!",
    thankYou: "Gracias por proteger a tu comunidad",

    // Severity
    severityDanger: "Peligroso",
    severityCaution: "Precaución",
    severitySafe: "Despejado",
    hintDanger: "Corriente fuerte, no cruzar",
    hintCaution: "Agua corriendo, cuidado",
    hintSafe: "El agua ya bajó",
  },

  en: {
    // Header
    appName: "Arroyo",
    appNameAccent: "Alerta",

    // Status bar
    danger: "danger",
    caution: "caution",
    noActiveAlerts: "No active alerts",
    expiresIn: "Expire in 4h",

    // Map
    loadingMap: "Loading map...",
    noReports: "No reports",

    // List
    noRecentReports: "No recent reports",

    // FAB
    reportArroyo: "Report Arroyo",

    // Zone detail
    backToMap: "← Map",
    currentStatus: "Status",
    notifyMe: "Notify me",
    notificationsActive: "Notifications on",
    recentReports: "Recent reports",
    noReportsForZone: "No recent reports for this zone",
    confirm: "Confirm",
    confirmed: "Confirmed",
    reportThisZone: "Report this zone",

    // Report flow
    back: "← Back",
    step: "Step",
    of: "of",
    whereIsArroyo: "Where is the arroyo?",
    selectZone: "Select the affected zone",
    howBad: "How bad is it?",
    selectRisk: "Select the risk level",
    anythingElse: "Anything else to report?",
    optional: "Optional — helps others understand the situation",
    textPlaceholder: "E.g.: The water is rising fast...",
    reportSummary: "Report summary",
    submitReport: "Submit Report",
    sending: "Sending...",
    reportSent: "Report sent!",
    thankYou: "Thanks for protecting your community",

    // Severity
    severityDanger: "Dangerous",
    severityCaution: "Caution",
    severitySafe: "Clear",
    hintDanger: "Strong current, do not cross",
    hintCaution: "Water flowing, be careful",
    hintSafe: "Water has receded",
  },
};

export function timeAgoLocalized(dateStr, lang) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (lang === "en") {
    if (m < 1) return "now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}
