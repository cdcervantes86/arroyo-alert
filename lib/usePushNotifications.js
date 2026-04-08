"use client";
import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);
  const [subscribedZones, setSubscribedZones] = useState(new Set());
  const [supported, setSupported] = useState(false);

  // Check support and register service worker
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setSupported(true);
    setPermission(Notification.permission);

    // Load subscribed zones from localStorage
    try {
      const saved = localStorage.getItem("arroyo-subscribed-zones");
      if (saved) setSubscribedZones(new Set(JSON.parse(saved)));
    } catch (e) {}

    // Register service worker
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  // Save subscribed zones to localStorage
  useEffect(() => {
    if (subscribedZones.size > 0) {
      localStorage.setItem("arroyo-subscribed-zones", JSON.stringify([...subscribedZones]));
    }
  }, [subscribedZones]);

  const getSubscription = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      // Request permission and subscribe
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return null;

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    setSubscription(sub);
    return sub;
  }, []);

  const subscribeToZone = useCallback(async (zoneId) => {
    try {
      const sub = await getSubscription();
      if (!sub) return false;

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          subscription: sub.toJSON(),
        }),
      });

      if (res.ok) {
        setSubscribedZones((prev) => new Set([...prev, zoneId]));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Subscribe error:", err);
      return false;
    }
  }, [getSubscription]);

  const unsubscribeFromZone = useCallback(async (zoneId) => {
    try {
      const sub = subscription || (await getSubscription());
      if (!sub) return false;

      const res = await fetch("/api/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          endpoint: sub.endpoint,
        }),
      });

      if (res.ok) {
        setSubscribedZones((prev) => {
          const next = new Set(prev);
          next.delete(zoneId);
          return next;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Unsubscribe error:", err);
      return false;
    }
  }, [subscription, getSubscription]);

  const isSubscribed = useCallback((zoneId) => {
    return subscribedZones.has(zoneId);
  }, [subscribedZones]);

  return {
    supported,
    permission,
    subscribedZones,
    subscribeToZone,
    unsubscribeFromZone,
    isSubscribed,
  };
}

// Trigger notifications for a new report
export async function notifyZone({ zoneId, zoneName, severity, text }) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId, zoneName, severity, text }),
    });
  } catch (err) {
    console.error("Notify error:", err);
  }
}
