// Known arroyo-prone zones in Barranquilla
// Coordinates are approximate centers of each arroyo corridor

export const ZONES = [
  { id: 1,  name: "Calle 84",  area: "Country",       lat: 10.9965, lng: -74.8095, desc: "Desde Cra 51B hasta Cra 46", descEn: "From Cra 51B to Cra 46" },
  { id: 2,  name: "Calle 79",  area: "La Cumbre",      lat: 10.9928, lng: -74.8010, desc: "Desde Cra 53 hasta Cra 46", descEn: "From Cra 53 to Cra 46" },
  { id: 3,  name: "Calle 72",  area: "Jardín",         lat: 10.9878, lng: -74.7935, desc: "Desde Cra 65 hasta Cra 46", descEn: "From Cra 65 to Cra 46" },
  { id: 4,  name: "Calle 47",  area: "Rebolo",         lat: 10.9730, lng: -74.7810, desc: "Desde Cra 21 hasta Vía 40", descEn: "From Cra 21 to Vía 40" },
  { id: 5,  name: "Cra 21",    area: "San Roque",      lat: 10.9770, lng: -74.7780, desc: "Desde Calle 30 hasta Calle 45", descEn: "From Calle 30 to Calle 45" },
  { id: 6,  name: "Calle 92",  area: "La Castellana",  lat: 11.0020, lng: -74.8180, desc: "Desde Cra 51B hasta Cra 42", descEn: "From Cra 51B to Cra 42" },
  { id: 7,  name: "Calle 75",  area: "El Prado",       lat: 10.9900, lng: -74.7960, desc: "Desde Cra 54 hasta Cra 44", descEn: "From Cra 54 to Cra 44" },
  { id: 8,  name: "Cra 15",    area: "Barrio Abajo",   lat: 10.9810, lng: -74.7850, desc: "Desde Calle 50 hasta Calle 58", descEn: "From Calle 50 to Calle 58" },
  { id: 9,  name: "Calle 30",  area: "Centro",         lat: 10.9680, lng: -74.7820, desc: "Desde Cra 38 hasta Cra 27", descEn: "From Cra 38 to Cra 27" },
  { id: 10, name: "Calle 53",  area: "Boston",         lat: 10.9760, lng: -74.7900, desc: "Desde Cra 46 hasta Cra 27", descEn: "From Cra 46 to Cra 27" },
  { id: 11, name: "Calle 17",  area: "San José",       lat: 10.9620, lng: -74.7810, desc: "Desde Cra 25 hasta Vía 40", descEn: "From Cra 25 to Vía 40" },
  { id: 12, name: "Cra 38",    area: "Chiquinquirá",   lat: 10.9720, lng: -74.7920, desc: "Desde Calle 40 hasta Calle 30", descEn: "From Calle 40 to Calle 30" },
];

export const SEVERITY = {
  danger:  { label: "Peligroso",  labelEn: "Dangerous", emoji: "🔴", color: "#DC2626", bg: "#450a0a", hint: "Corriente fuerte, no cruzar", hintEn: "Strong current, do not cross" },
  caution: { label: "Precaución", labelEn: "Caution",   emoji: "🟡", color: "#D97706", bg: "#451a03", hint: "Agua corriendo, cuidado",     hintEn: "Water flowing, be careful" },
  safe:    { label: "Despejado",  labelEn: "Clear",     emoji: "🟢", color: "#16A34A", bg: "#052e16", hint: "El agua ya bajó",             hintEn: "Water has receded" },
};

// Helper to get zone description in the right language
export function getZoneDesc(zone, lang) {
  return lang === "en" ? zone.descEn : zone.desc;
}

// Helper to get severity label in right language
export function getSevLabel(key, lang) {
  const s = SEVERITY[key];
  return s ? (lang === "en" ? s.labelEn : s.label) : "";
}

// Helper to translate common database text
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
