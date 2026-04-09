"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { getDeviceId } from "./deviceId";

// Track how many users are viewing the app right now
// Uses Supabase Realtime Presence

export function useLiveWatchers() {
  const [totalWatchers, setTotalWatchers] = useState(0);
  const [zoneWatchers, setZoneWatchers] = useState({});
  const channelRef = useRef(null);
  const zoneChannelRef = useRef(null);

  // Global presence — track total app users
  useEffect(() => {
    const deviceId = getDeviceId() || `anon_${Math.random().toString(36).slice(2)}`;

    const channel = supabase.channel("app-presence", {
      config: { presence: { key: deviceId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setTotalWatchers(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Zone-specific presence
  const watchZone = useCallback((zoneId) => {
    // Unsubscribe from previous zone
    if (zoneChannelRef.current) {
      zoneChannelRef.current.unsubscribe();
      zoneChannelRef.current = null;
    }

    if (!zoneId) return;

    const deviceId = getDeviceId() || `anon_${Math.random().toString(36).slice(2)}`;

    const channel = supabase.channel(`zone-${zoneId}`, {
      config: { presence: { key: deviceId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setZoneWatchers((prev) => ({ ...prev, [zoneId]: count }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ zone_id: zoneId, online_at: new Date().toISOString() });
        }
      });

    zoneChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const unwatchZone = useCallback(() => {
    if (zoneChannelRef.current) {
      zoneChannelRef.current.unsubscribe();
      zoneChannelRef.current = null;
    }
  }, []);

  return { totalWatchers, zoneWatchers, watchZone, unwatchZone };
}
