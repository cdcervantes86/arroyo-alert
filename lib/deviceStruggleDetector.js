"use client";
// Watches for excessive main-thread blocking within the first 15s of page load.
// If any single long task exceeds 3s, flags the device in localStorage so that
// future visits use lite map mode automatically.
//
// This is a self-healing heuristic: one bad first visit per device, then fast.

const STRUGGLE_KEY = "aa_device_struggles";
const THRESHOLD_MS = 3000;
const WINDOW_MS = 15000;

export function startDeviceStruggleDetector() {
  if (typeof window === "undefined") return;
  // If already flagged, no need to keep observing
  try {
    if (localStorage.getItem(STRUGGLE_KEY) === "true") return;
  } catch (e) { return; }

  let observer = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= THRESHOLD_MS) {
          try { localStorage.setItem(STRUGGLE_KEY, "true"); } catch (e) {}
          // Stop observing — we've made our decision
          if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
          return;
        }
      }
    });
    observer.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    // longtask API not supported — can't measure, give up silently
    return;
  }

  // Stop watching after the window ends
  setTimeout(() => {
    if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
  }, WINDOW_MS);
}

// Lets users manually clear the struggle flag (via a future "try high quality again" affordance)
export function clearDeviceStruggleFlag() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STRUGGLE_KEY); } catch (e) {}
}
