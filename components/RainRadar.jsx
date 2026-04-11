"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY;

export function useRainRadar(mapInstance) {
  const [enabled, setEnabled] = useState(false);
  const addedRef = useRef(false);

  const toggle = useCallback(() => {
    if (!mapInstance || !OWM_KEY) return;

    if (enabled) {
      if (mapInstance.getLayer("owm-rain")) mapInstance.removeLayer("owm-rain");
      if (mapInstance.getSource("owm-rain-src")) mapInstance.removeSource("owm-rain-src");
      addedRef.current = false;
      setEnabled(false);
    } else {
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
              "raster-opacity": 0.85,
              "raster-fade-duration": 300,
              "raster-brightness-min": 0.1,
              "raster-brightness-max": 1,
              "raster-contrast": 0.4,
              "raster-saturation": 0.3,
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
  const [showLegend, setShowLegend] = useState(false);
  const [legendClosing, setLegendClosing] = useState(false);

  useEffect(() => {
    if (enabled) {
      const t = setTimeout(() => setShowLegend(true), 80);
      return () => clearTimeout(t);
    } else {
      if (showLegend) {
        setLegendClosing(true);
        const t = setTimeout(() => { setShowLegend(false); setLegendClosing(false); }, 200);
        return () => clearTimeout(t);
      }
    }
  }, [enabled]);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={onToggle} style={{
        width: 40, height: 40, borderRadius: "50%",
        background: enabled ? "rgba(96,165,250,0.15)" : "rgba(10,15,26,0.9)",
        border: `1px solid ${enabled ? "rgba(96,165,250,0.3)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={enabled ? "#60a5fa" : "rgba(255,255,255,0.45)"}
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" />
          <line x1="8" y1="16" x2="8" y2="20" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="16" y1="16" x2="16" y2="20" />
        </svg>
      </button>
      {showLegend && (
        <div style={{
          position: "absolute", top: 0, right: "calc(100% + 8px)",
          background: "rgba(10,15,26,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          transformOrigin: "right center",
          animation: legendClosing ? "radarLegendOut 0.2s ease forwards" : "radarLegendIn 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: "9px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "6px", textTransform: "uppercase" }}>
            {es ? "Precipitación" : "Precipitation"}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 80, height: 8, borderRadius: 4, background: "linear-gradient(90deg, rgba(120,200,255,0.3), #60a5fa, #3b82f6, #facc15, #f97316, #ef4444)", border: "1px solid rgba(255,255,255,0.06)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
            <span style={{ fontSize: "8px", color: "var(--text-faint)" }}>{es ? "Leve" : "Light"}</span>
            <span style={{ fontSize: "8px", color: "var(--text-faint)" }}>{es ? "Fuerte" : "Heavy"}</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes radarLegendIn {
          from { opacity: 0; transform: scale(0.9) translateX(4px); }
          to { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes radarLegendOut {
          from { opacity: 1; transform: scale(1) translateX(0); }
          to { opacity: 0; transform: scale(0.9) translateX(4px); }
        }
      `}</style>
    </div>
  );
}
