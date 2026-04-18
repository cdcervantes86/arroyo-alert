// Map quality preference resolution.
// Priority order:
//   1. URL override (?lite=1 or ?lite=0) — for debugging
//   2. User preference from More menu (high / lite)
//   3. Auto mode: reads struggle flag written by deviceStruggleDetector

const PREF_KEY = "aa_map_quality";
const STRUGGLE_KEY = "aa_device_struggles";

export function getMapQuality() {
  if (typeof window === "undefined") return "auto";
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === "high" || v === "lite" || v === "auto") return v;
  } catch (e) {}
  return "auto";
}

export function setMapQuality(value) {
  if (typeof window === "undefined") return;
  if (!["auto", "high", "lite"].includes(value)) return;
  try { localStorage.setItem(PREF_KEY, value); } catch (e) {}
}

// Returns "high" or "lite" — the actual quality that will render.
export function getEffectiveMapQuality() {
  if (typeof window === "undefined") return "high";
  // 1. URL override
  const params = new URLSearchParams(window.location.search);
  if (params.get("lite") === "1") return "lite";
  if (params.get("lite") === "0") return "high";
  // 2. Explicit user preference
  const pref = getMapQuality();
  if (pref === "high") return "high";
  if (pref === "lite") return "lite";
  // 3. Auto — check if this device has been flagged as struggling
  try {
    if (localStorage.getItem(STRUGGLE_KEY) === "true") return "lite";
  } catch (e) {}
  return "high";
}
