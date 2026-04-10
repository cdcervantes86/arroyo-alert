"use client";
import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY;

export function useRainRadar(mapInstance) {
  const [enabled, setEnabled] = useState(false);
  const addedRef = useRef(false);

  const toggle = useCallback(() => {
    if (!mapInstance || !OWM_KEY) return;

    if (enabled) {
      // Remove layer
      if (mapInstance.getLayer("owm-rain")) mapInstance.removeLayer("owm-rain");
      if (mapInstance.getSource("owm-rain-src")) mapInstance.removeSource("owm-rain-src");
      addedRef.current = false;
      setEnabled(false);
    } else {
      // Add precipitation tile layer
      const add = () => {
        if (addedRef.current) return;
        try {
          mapInstance.addSource("owm-rain-src", {
            type: "raster",
            tiles: [
              `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
            ],
            tileSize: 256,
            maxzoom: 14,
          });
          mapInstance.addLayer({
            id: "owm-rain",
            type: "raster",
            source: "owm-rain-src",
            paint: {
              "raster-opacity": 0.6,
              "raster-fade-duration": 300,
            },
          });
          addedRef.current = true;
          setEnabled(true);
        } catch (e) {
          console.error("Rain overlay error:", e);
        }
      };

      if (mapInstance.isStyleLoaded()) add();
      else mapInstance.on("load", add);
    }
  }, [mapInstance, enabled]);

  return { enabled, toggle };
}

export function RainRadarButton({ enabled, onToggle }) {
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
        <span style={{ fontSize: "16px", opacity: enabled ? 1 : 0.5 }}>🌧️</span>
      </button>
      {enabled && (
        <div style={{
          fontSize: "9px", color: "var(--accent)", fontWeight: 600,
          background: "rgba(8,13,24,0.9)", padding: "3px 8px",
          borderRadius: "6px", whiteSpace: "nowrap",
          border: "1px solid rgba(96,165,250,0.15)",
        }}>
          {es ? "Lluvia activa" : "Rain active"}
        </div>
      )}
    </div>
  );
}
