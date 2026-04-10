"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export function useRainRadar(mapInstance) {
  const [radarLayer, setRadarLayer] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(null);
  const prevZoom = useRef(null);

  const addRadar = useCallback(async () => {
    if (!mapInstance) return;
    const L = require("leaflet");
    setLoading(true);

    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await res.json();

      const latestFrame = data.radar?.past?.slice(-1)?.[0];
      if (!latestFrame) { setLoading(false); return; }

      // Use 512px tiles for better quality at lower zooms
      const tileUrl = `https://tilecache.rainviewer.com${latestFrame.path}/512/{z}/{x}/{y}/2/1_1.png`;

      if (radarLayer) mapInstance.removeLayer(radarLayer);

      const layer = L.tileLayer(tileUrl, {
        tileSize: 512,
        zoomOffset: -1,
        opacity: 0.6,
        zIndex: 5,
        maxZoom: 12,
        errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        attribution: '<a href="https://rainviewer.com" style="color:rgba(255,255,255,0.3)">RainViewer</a>',
      }).addTo(mapInstance);

      // Save current zoom and zoom out to see radar
      if (!prevZoom.current) prevZoom.current = mapInstance.getZoom();
      if (mapInstance.getZoom() > 10) mapInstance.setZoom(10);

      setRadarLayer(layer);
      setTimestamp(new Date(latestFrame.time * 1000));
      setEnabled(true);
    } catch (e) {
      console.error("Rain radar error:", e);
    }
    setLoading(false);
  }, [mapInstance, radarLayer]);

  const removeRadar = useCallback(() => {
    if (radarLayer && mapInstance) {
      mapInstance.removeLayer(radarLayer);
      setRadarLayer(null);
    }
    // Restore previous zoom
    if (prevZoom.current && mapInstance) {
      mapInstance.setZoom(prevZoom.current);
      prevZoom.current = null;
    }
    setEnabled(false);
    setTimestamp(null);
  }, [radarLayer, mapInstance]);

  const toggle = useCallback(() => {
    if (enabled) removeRadar();
    else addRadar();
  }, [enabled, addRadar, removeRadar]);

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
