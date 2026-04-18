"use client";
// Watches for excessive main-thread blocking within the first 15s of page load.
// If any single long task exceeds 3s, flags the device in localStorage and —
// if currently rendering in "high" mode with no explicit user pref — triggers
// a one-shot reload so the user gets into lite mode without having to do anything.
//
// This is a self-healing heuristic: one bad first visit per device, then fast.

import { getMapQuality } from "./mapQuality";

const STRUGGLE_KEY = "aa_device_struggles";
const AUTO_RELOADED_KEY = "aa_auto_reloaded";
const THRESHOLD_MS = 3000;
const WINDOW_MS = 15000;

export function startDeviceStruggleDetector() {
  if (typeof window === "undefined") return;

  // If already flagged, no need to keep observing
  try {
    if (localStorage.getItem(STRUGGLE_KEY) === "true") return;
  } catch (e) { return; }

  let observer = null;
  const cleanup = () => {
    if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
  };

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= THRESHOLD_MS) {
          // Write the struggle flag
          try { localStorage.setItem(STRUGGLE_KEY, "true"); } catch (e) {}

          // Check if we should auto-reload. Three conditions:
          // 1. User hasn't explicitly set high/lite (pref is "auto")
          // 2. We haven't already auto-reloaded this session (avoid loops)
          // 3. We\'re currently rendering in high mode (otherwise no point)
          let shouldReload = false;
          try {
            const pref = getMapQuality();
            const alreadyReloaded = sessionStorage.getItem(AUTO_RELOADED_KEY) === "true";
            const params = new URLSearchParams(window.location.search);
            const urlOverride = params.get("lite");
            if (pref === "auto" && !alreadyReloaded && urlOverride !== "0" && urlOverride !== "1") {
              shouldReload = true;
            }
          } catch (e) {}

          if (shouldReload) {
            try { sessionStorage.setItem(AUTO_RELOADED_KEY, "true"); } catch (e) {}
            // Brief banner so the user understands what\'s happening
            showReloadBanner();
            setTimeout(() => { window.location.reload(); }, 1200);
          }

          cleanup();
          return;
        }
      }
    });
    observer.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    // longtask API not supported — give up silently
    return;
  }

  // Stop watching after the window ends
  setTimeout(cleanup, WINDOW_MS);
}

function showReloadBanner() {
  try {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.style.cssText = [
      "position: fixed",
      "top: 50%",
      "left: 50%",
      "transform: translate(-50%, -50%)",
      "z-index: 99999",
      "background: rgba(10,15,26,0.95)",
      "color: rgba(255,255,255,0.9)",
      "border: 1px solid rgba(255,255,255,0.14)",
      "border-radius: 14px",
      "padding: 14px 18px",
      "font-family: -apple-system, system-ui, sans-serif",
      "font-size: 13px",
      "font-weight: 500",
      "letter-spacing: -0.1px",
      "box-shadow: 0 8px 32px rgba(0,0,0,0.5)",
      "backdrop-filter: blur(20px)",
      "-webkit-backdrop-filter: blur(20px)",
      "text-align: center",
      "max-width: 280px",
    ].join("; ");
    const lang = (navigator.language || "en").startsWith("es") ? "es" : "en";
    el.textContent = lang === "es"
      ? "Optimizando para este dispositivo…"
      : "Optimizing for this device…";
    document.body.appendChild(el);
  } catch (e) {}
}

// Lets users manually clear the struggle flag (via a future "try high quality again" affordance)
export function clearDeviceStruggleFlag() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STRUGGLE_KEY); } catch (e) {}
  try { sessionStorage.removeItem(AUTO_RELOADED_KEY); } catch (e) {}
}
