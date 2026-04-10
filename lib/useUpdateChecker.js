"use client";
import { useState, useEffect, useCallback } from "react";
import { APP_VERSION } from "@/lib/version";

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        setUpdateAvailable(true);
        setNewVersion(data.version);
      }
    } catch (e) {
      // Offline or error — ignore
    }
  }, []);

  useEffect(() => {
    // Check on load (with small delay to not block initial render)
    const t = setTimeout(checkForUpdate, 5000);

    // Check when app comes back to foreground
    const handleFocus = () => checkForUpdate();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Also check every 30 minutes
    const interval = setInterval(checkForUpdate, 30 * 60 * 1000);

    // Listen for SW update messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SW_UPDATED") {
          setUpdateAvailable(true);
          setNewVersion(event.data.version);
        }
      });
    }

    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkForUpdate]);

  const doUpdate = useCallback(() => {
    // Unregister old SW, clear caches, then reload
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.update());
      });
    }
    // Clear all arroyo caches
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.filter((k) => k.startsWith("arroyo-")).forEach((k) => caches.delete(k));
      });
    }
    // Hard reload
    window.location.reload(true);
  }, []);

  return { updateAvailable, newVersion, doUpdate };
}
