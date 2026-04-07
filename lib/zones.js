// Arroyo zones in Barranquilla — corrected coordinates
// Sources: OpenStreetMap, Alcaldía, El Heraldo, arroyosdebarranquilla.co
//
// CANALIZED (not listed): Calle 84, 79, 75/76, 91/92, Cra 21, Cra 65,
// Hospital, La María, La Felicidad I+II

export const ZONES = [
  // === NORTE ===
  { id: 1,  name: "Calle 85",        area: "El Golf",           lat: 10.9985, lng: -74.8110, desc: "Uno de los más peligrosos del norte, sin canalizar" },
  { id: 2,  name: "El Salao II",     area: "La Pradera / Edén", lat: 10.9740, lng: -74.8280, desc: "Av Circunvalar hasta Calle 83 — en proceso" },

  // === SUROCCIDENTE ===
  { id: 3,  name: "El Bosque",       area: "El Bosque",         lat: 10.9528, lng: -74.8166, desc: "Red de arroyos del suroccidente" },
  { id: 4,  name: "Las Malvinas",    area: "Las Malvinas",      lat: 10.9470, lng: -74.8210, desc: "Inundaciones recurrentes" },
  { id: 5,  name: "Las Américas",    area: "Las Américas",      lat: 10.9430, lng: -74.8230, desc: "Arroyos tributarios activos" },
  { id: 6,  name: "Villa San Carlos",area: "Suroccidente",      lat: 10.9390, lng: -74.8260, desc: "Desbordamientos afectan familias" },
  { id: 7,  name: "Don Juan",        area: "Sur / Soledad",     lat: 10.9320, lng: -74.8050, desc: "Múltiples muertes registradas — muy peligroso" },
  { id: 8,  name: "Nueva Colombia",  area: "Suroccidente",      lat: 10.9560, lng: -74.8250, desc: "Identificado en Plan Maestro" },
  { id: 9,  name: "Los Ángeles",     area: "Los Ángeles",       lat: 10.9590, lng: -74.8300, desc: "Corrientes peligrosas en lluvia" },
  { id: 10, name: "Por Fin",         area: "Suroccidente",      lat: 10.9610, lng: -74.8270, desc: "Inundaciones documentadas" },
  { id: 11, name: "La Sierrita",     area: "La Sierrita",       lat: 10.9500, lng: -74.8140, desc: "Intervención parcial solamente" },
  { id: 12, name: "Cuchilla de Villate", area: "Suroccidente",  lat: 10.9510, lng: -74.8100, desc: "Zona propensa a inundaciones" },

  // === SURORIENTE ===
  { id: 13, name: "Rebolo",          area: "Rebolo",            lat: 10.9650, lng: -74.7860, desc: "Mayor caudal de la ciudad: 150 m³/s" },
  { id: 14, name: "La Chinita",      area: "La Chinita",        lat: 10.9550, lng: -74.7900, desc: "Zona del caño de la Ahuyama" },
  { id: 15, name: "La Luz",          area: "La Luz",            lat: 10.9600, lng: -74.7830, desc: "Caño de la Ahuyama — en canalización" },

  // === SUR ===
  { id: 16, name: "7 de Abril",      area: "Metropolitana",     lat: 10.9400, lng: -74.8100, desc: "Identificado en Plan Maestro" },
  { id: 17, name: "Santa María",     area: "Metropolitana",     lat: 10.9420, lng: -74.8050, desc: "Identificado en Plan Maestro" },

  // === SOLEDAD ===
  { id: 18, name: "El Platanal",     area: "Soledad",           lat: 10.9150, lng: -74.7950, desc: "Dos muertes en octubre 2025" },
];

export const SEVERITY = {
  danger:  { label: "Peligroso",  emoji: "🔴", color: "#DC2626", bg: "#450a0a", hint: "Corriente fuerte, no cruzar" },
  caution: { label: "Precaución", emoji: "🟡", color: "#D97706", bg: "#451a03", hint: "Agua corriendo, cuidado" },
  safe:    { label: "Despejado",  emoji: "🟢", color: "#16A34A", bg: "#052e16", hint: "El agua ya bajó" },
};

export function getZoneSeverity(zoneId, reports) {
  const cutoff = Date.now() - 4 * 3600000;
  const zoneReports = reports.filter(
    (r) => r.zone_id === zoneId && new Date(r.created_at).getTime() > cutoff
  );
  if (!zoneReports.length) return null;
  if (zoneReports.some((r) => r.severity === "danger")) return "danger";
  if (zoneReports.some((r) => r.severity === "caution")) return "caution";
  return "safe";
}

export function getZoneReports(zoneId, reports) {
  const cutoff = Date.now() - 4 * 3600000;
  return reports
    .filter((r) => r.zone_id === zoneId && new Date(r.created_at).getTime() > cutoff)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function timeAgo(dateStr) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}
