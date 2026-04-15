/**
 * Zone Images — contextual backgrounds based on time of day + severity
 * 
 * Each zone can have up to 12 images:
 *   {timeOfDay}-{severity}.jpg
 *   where timeOfDay = dawn | day | sunset | night
 *   and severity = calm | caution | danger
 * 
 * Images live in /public/zones/{zoneSlug}/
 * 
 * To add images for a new zone:
 * 1. Create folder: public/zones/{slug}/
 * 2. Add images following the naming convention
 * 3. Add the slug to ZONES_WITH_IMAGES below
 */

// Zones that have contextual images available
const ZONES_WITH_IMAGES = new Set([
  "coltabaco",
]);

// Map zone names to their image folder slugs
const ZONE_SLUG_MAP = {
  "Coltabaco": "coltabaco",
  // Add more as images are created:
  // "Don Juan": "don-juan",
  // "El Salao": "el-salao",
  // etc.
};

/**
 * Determine the current time-of-day period for Barranquilla
 * Barranquilla is UTC-5, near the equator so sunrise/sunset is fairly consistent
 */
function getTimeOfDay() {
  const now = new Date();
  // Convert to Barranquilla time (UTC-5)
  const utcHour = now.getUTCHours();
  const baqHour = (utcHour - 5 + 24) % 24;

  if (baqHour >= 5 && baqHour < 7) return "dawn";
  if (baqHour >= 7 && baqHour < 17) return "day";
  if (baqHour >= 17 && baqHour < 19) return "sunset";
  return "night";
}

/**
 * Map report severity to image severity level
 * "safe" reports → calm, "caution" → caution, "danger" → danger
 * No reports → calm (default peaceful state)
 */
function mapSeverity(severity) {
  if (!severity || severity === "safe") return "calm";
  if (severity === "caution") return "caution";
  return "danger";
}

/**
 * Get the contextual image URL for a zone
 * @param {string} zoneName - The zone name (e.g. "Coltabaco")
 * @param {string|null} severity - Current severity: "danger", "caution", "safe", or null
 * @returns {string|null} Image URL path or null if no images exist for this zone
 */
export function getZoneImage(zoneName, severity) {
  const slug = ZONE_SLUG_MAP[zoneName];
  if (!slug || !ZONES_WITH_IMAGES.has(slug)) return null;

  const timeOfDay = getTimeOfDay();
  const imgSeverity = mapSeverity(severity);

  return `/zones/${slug}/${timeOfDay}-${imgSeverity}.jpg`;
}

/**
 * Check if a zone has contextual images
 * @param {string} zoneName - The zone name
 * @returns {boolean}
 */
export function hasZoneImages(zoneName) {
  const slug = ZONE_SLUG_MAP[zoneName];
  return slug ? ZONES_WITH_IMAGES.has(slug) : false;
}

/**
 * Get all available image paths for a zone (for preloading)
 * @param {string} zoneName - The zone name
 * @returns {string[]} Array of image URLs
 */
export function getAllZoneImages(zoneName) {
  const slug = ZONE_SLUG_MAP[zoneName];
  if (!slug || !ZONES_WITH_IMAGES.has(slug)) return [];

  const times = ["dawn", "day", "sunset", "night"];
  const severities = ["calm", "caution", "danger"];
  const images = [];

  for (const t of times) {
    for (const s of severities) {
      images.push(`/zones/${slug}/${t}-${s}.jpg`);
    }
  }
  return images;
}

/**
 * Preload the current contextual image for smooth display
 * @param {string} zoneName - The zone name
 * @param {string|null} severity - Current severity
 */
export function preloadZoneImage(zoneName, severity) {
  const url = getZoneImage(zoneName, severity);
  if (!url) return;

  const img = new Image();
  img.src = url;
}
