// Active arroyo-prone zones in Barranquilla (2025)
// ONLY arroyos that are still active — canalized ones removed
// Coordinates are approximate — use /editor to refine

export const ZONES = [
  // === HIGH DANGER — recent deaths ===
  { id: 1,  name: "Don Juan",       area: "Sur / Soledad",       lat: 10.9444, lng: -74.7664, desc: "7.9 km — Caudal 85 m³/s — Desemboca cerca del Ferry", descEn: "7.9 km — Flow 85 m³/s — Empties near El Ferry" },
  { id: 2,  name: "El Salao",       area: "Villa Angelita",      lat: 10.9549, lng: -74.8150, desc: "9.2 km — El más largo de la ciudad", descEn: "9.2 km — Longest in the city" },
  { id: 3,  name: "Platanal",       area: "Soledad",             lat: 10.9350, lng: -74.7951, desc: "6.8 km — Ciudadela Metropolitana / Cinco Bocas", descEn: "6.8 km — Ciudadela Metropolitana / Cinco Bocas", photos: { clear: "/zones/3-clear.jpg", caution: "/zones/3-caution.jpg", danger: "/zones/3-danger.jpg" } },
  { id: 4,  name: "El Bosque",      area: "Suroccidente",        lat: 10.9598, lng: -74.8105, desc: "Red de arroyos del suroccidente", descEn: "Southwest arroyo network" },

  // === ACTIVE — still dangerous ===
  { id: 5,  name: "Santo Domingo",  area: "Suroccidente",        lat: 10.9586, lng: -74.8177, desc: "Afluente del arroyo León", descEn: "Tributary of arroyo León" },
  { id: 6,  name: "Coltabaco",      area: "Centro-Oeste",        lat: 10.9750, lng: -74.7996, desc: "3.8 km — Caudal 28 m³/s", descEn: "3.8 km — Flow 28 m³/s" },
  { id: 7,  name: "La Paz",         area: "Cra 40",              lat: 10.9715, lng: -74.7933, desc: "2.9 km — Caudal 21 m³/s", descEn: "2.9 km — Flow 21 m³/s" },
  { id: 8,  name: "Carrera 8",      area: "Barrio Abajo",        lat: 10.9796, lng: -74.7829, desc: "3.4 km — Hacia Vía 40", descEn: "3.4 km — Toward Vía 40" },
  { id: 9,  name: "Calle 94",       area: "Norte",               lat: 11.0019, lng: -74.8144, desc: "1.4 km — Zona norte", descEn: "1.4 km — Northern zone", photos: {
    clear:   { day: "/zones/9-clear-day.jpg",   sunset: "/zones/9-clear-sunset.jpg",   night: "/zones/9-clear-night.jpg" },
    caution: { day: "/zones/9-caution-day.jpg", sunset: "/zones/9-caution-sunset.jpg", night: "/zones/9-caution-night.jpg" },
    danger:  { day: "/zones/9-danger-day.jpg",  sunset: "/zones/9-danger-sunset.jpg",  night: "/zones/9-danger-night.jpg" },
  } },

  // === SUROCCIDENTE NETWORK ===
  { id: 10, name: "Las Américas",   area: "Suroccidente",        lat: 10.9556, lng: -74.8110, desc: "Red barrial — Las Américas, La Ceibita", descEn: "Neighborhood network — Las Américas, La Ceibita" },
  { id: 11, name: "La Chinita",     area: "Caño La Ahuyama",     lat: 10.9502, lng: -74.8047, desc: "Zona inundable cerca del caño", descEn: "Flood-prone area near the canal" },
  { id: 12, name: "Los Ángeles",    area: "Suroccidente",        lat: 10.9547, lng: -74.8203, desc: "Calle 115 con Cra 16 — Escorrentías barriales", descEn: "Calle 115 & Cra 16 — Neighborhood runoff" },
];

export const SEVERITY = {
  danger:  { label: "Peligroso",  labelEn: "Dangerous", emoji: "🔴", color: "#DC2626", bg: "#450a0a", hint: "Corriente fuerte, no cruzar", hintEn: "Strong current, do not cross" },
  caution: { label: "Precaución", labelEn: "Caution",   emoji: "🟡", color: "#D97706", bg: "#451a03", hint: "Agua corriendo, cuidado",     hintEn: "Water flowing, be careful" },
  safe:    { label: "Despejado",  labelEn: "Clear",     emoji: "🟢", color: "#16A34A", bg: "#052e16", hint: "El agua ya bajó",             hintEn: "Water has receded" },
};

export function getZoneDesc(zone, lang) {
  return lang === "en" ? zone.descEn : zone.desc;
}

export function getSevLabel(key, lang) {
  const s = SEVERITY[key];
  return s ? (lang === "en" ? s.labelEn : s.label) : "";
}

export function translateReportText(text, lang) {
  if (lang !== "en") return text;
  const map = {
    "Sin comentario": "No comment",
    "Arroyo peligroso, no cruzar": "Dangerous arroyo, do not cross",
    "Agua corriendo por la calle": "Water flowing on the street",
    "Ya se puede pasar, zona despejada": "Clear to pass, zone is safe",
    "Ya se puede pasar está despejado": "Clear to pass, it's safe",
  };
  return map[text] || text;
}

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

// Pick the right zone photo based on severity and time of day
// Handles both simple format { clear: "/path.jpg" } and time-aware { clear: { day, sunset, night } }
export function getZonePhoto(zone, severity) {
  if (!zone.photos) return null;
  const sev = severity || "clear";
  const entry = zone.photos[sev] || zone.photos.clear;
  if (!entry) return null;
  // Simple format: entry is a string
  if (typeof entry === "string") return entry;
  // Time-aware format: pick based on current hour (Barranquilla UTC-5)
  const utcH = new Date().getUTCHours();
  const localH = (utcH - 5 + 24) % 24; // Barranquilla is UTC-5
  if (localH >= 6 && localH < 17) return entry.day || entry.sunset || entry.night;
  if (localH >= 17 && localH < 19) return entry.sunset || entry.night || entry.day;
  return entry.night || entry.sunset || entry.day;
}
