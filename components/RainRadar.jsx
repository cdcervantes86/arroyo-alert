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
          // Ensure map is at a useful zoom for Barranquilla
          if (mapInstance.getZoom() < 10) {
            mapInstance.flyTo({ center: [-74.805, 10.96], zoom: 11, duration: 800 });
          }
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
              "raster-brightness-min": 0,
              "raster-brightness-max": 1,
              "raster-contrast": 0.85,
              "raster-saturation": 0.8,
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

// The toggle button in the top-right map controls cluster.
// Kept visually identical to the previous version, minus the nested legend.
export function RainRadarButton({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Rain radar"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: enabled ? "rgba(96,165,250,0.12)" : "rgba(10,15,26,0.2)",
        border: `1px solid ${enabled ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.13)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
        transition: "all 0.2s ease",
        backdropFilter: "blur(16px) saturate(1.6)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6)",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={enabled ? "#60a5fa" : "rgba(255,255,255,0.45)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" />
        <line x1="8" y1="16" x2="8" y2="20" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="16" y1="16" x2="16" y2="20" />
      </svg>
    </button>
  );
}

// Bottom-bar legend that sits above the Reportar button.
// Mobile-only — desktop has enough real estate that the color gradient is
// self-explanatory; we skip rendering there for now.
export function RainRadarLegend({ enabled, isDesktop }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (enabled) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
    if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  if (isDesktop || !visible) return null;

  return (
    <>
      <div
        role="img"
        aria-label={es ? "Leyenda de precipitación: leve a fuerte" : "Precipitation legend: light to heavy"}
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "calc(155px + env(safe-area-inset-bottom, 0px))",
          zIndex: 99,
          background: "rgba(10,14,26,0.72)",
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          transformOrigin: "bottom center",
          animation: closing
            ? "rainLegendOut 0.2s ease forwards"
            : "rainLegendIn 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#60a5fa",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {es ? "Lluvia" : "Rain"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 3,
              background: "linear-gradient(90deg, #1a3352, #1e4d8a, #2563eb, #3b82f6, #60a5fa)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
            <span>{es ? "Leve" : "Light"}</span>
            <span>{es ? "Fuerte" : "Heavy"}</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes rainLegendIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes rainLegendOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </>
  );
}
