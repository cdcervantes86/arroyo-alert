"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export function useRainRadar(mapInstance) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(null);
  const sourceAdded = useRef(false);

  const addRadar = useCallback(async () => {
    if (!mapInstance) return;
    setLoading(true);

    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await res.json();
      const latestFrame = data.radar?.past?.slice(-1)?.[0];
      if (!latestFrame) { setLoading(false); return; }

      const tileUrl = `https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      // Remove existing source/layer if any
      if (sourceAdded.current) {
        if (mapInstance.getLayer("radar-layer")) mapInstance.removeLayer("radar-layer");
        if (mapInstance.getSource("radar-source")) mapInstance.removeSource("radar-source");
      }

      // Add raster source
      mapInstance.addSource("radar-source", {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: 12,
      });

      mapInstance.addLayer({
        id: "radar-layer",
        type: "raster",
        source: "radar-source",
        paint: {
          "raster-opacity": 0.55,
          "raster-fade-duration": 300,
        },
      });

      sourceAdded.current = true;
      setTimestamp(new Date(latestFrame.time * 1000));
      setEnabled(true);
    } catch (e) {
      console.error("Rain radar error:", e);
    }
    setLoading(false);
  }, [mapInstance]);

  const removeRadar = useCallback(() => {
    if (mapInstance && sourceAdded.current) {
      if (mapInstance.getLayer("radar-layer")) mapInstance.removeLayer("radar-layer");
      if (mapInstance.getSource("radar-source")) mapInstance.removeSource("radar-source");
      sourceAdded.current = false;
    }
    setEnabled(false);
    setTimestamp(null);
  }, [mapInstance]);

  const toggle = useCallback(() => {
    if (enabled) removeRadar();
    else addRadar();
  }, [enabled, addRadar, removeRadar]);

  // Auto-refresh radar every 5 minutes
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(addRadar, 300000);
    return () => clearInterval(interval);
  }, [enabled, addRadar]);

  return { enabled, loading, timestamp, toggle };
}

export function RainRadarButton({ enabled, loading, timestamp, onToggle }) {
  const { lang } = useLanguage();
  const es = lang === "es";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <button onClick={onToggle} style={{
        width: 40, height: 40, borderRadius: "50%",
        background: enabled ? "rgba(96,165,250,0.15)" : "rgba(8,13,24,0.9)",
        border: `1px solid ${enabled ? "rgba(96,165,250,0.25)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease",
      }}>
        {loading ? (
          <span style={{ fontSize: "14px", animation: "blink 1s ease infinite" }}>🌧️</span>
        ) : (
          <span style={{ fontSize: "16px", opacity: enabled ? 1 : 0.5 }}>🌧️</span>
        )}
      </button>
      {enabled && (
        <div style={{
          fontSize: "9px", color: "var(--accent)", fontWeight: 600,
          background: "rgba(8,13,24,0.9)", padding: "3px 8px",
          borderRadius: "6px", whiteSpace: "nowrap",
          border: "1px solid rgba(96,165,250,0.15)",
        }}>
          {es ? "Radar activo" : "Radar on"}
          {timestamp && <span style={{ color: "var(--text-faint)", marginLeft: 4 }}>{timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      )}
    </div>
  );
}
