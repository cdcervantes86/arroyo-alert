"use client";
import { useState, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";

// Windy.com embed — uses ECMWF model with excellent global precipitation coverage
const WINDY_URL = "https://embed.windy.com/embed.html?type=map&location=coordinates" +
  "&lat=10.96&lon=-74.80&detailLat=10.96&detailLon=-74.80" +
  "&zoom=8&level=surface&overlay=rain&product=ecmwf" +
  "&menu=&message=true&marker=true&calendar=now&pressure=&type=map" +
  "&radarRange=-1&metricWind=default&metricTemp=°C";

export function useRainRadar() {
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  return { enabled, toggle };
}

export function RainRadarButton({ enabled, onToggle }) {
  return (
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
  );
}

export function RadarPanel({ onClose }) {
  const { lang } = useLanguage();
  const es = lang === "es";

  return (
    <div style={{
      position: "absolute", top: 60, right: 16, zIndex: 800,
      background: "rgba(8,13,24,0.95)", backdropFilter: "blur(12px)",
      borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
      overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "fadeIn 0.2s ease",
      width: 280, 
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: "14px" }}>🌧️</span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", flex: 1 }}>
          {es ? "Radar de lluvia" : "Rain radar"}
        </span>
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
          border: "none", color: "var(--text-dim)", fontSize: "11px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      {/* Windy embed */}
      <div style={{ width: 280, height: 240, position: "relative", background: "#0a0e1a" }}>
        <iframe
          src={WINDY_URL}
          width="280"
          height="240"
          frameBorder="0"
          style={{ border: "none", display: "block" }}
          title="Rain radar"
          loading="lazy"
          allow="geolocation"
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: "6px 12px", display: "flex", alignItems: "center",
        borderTop: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: "9px", color: "var(--text-faint)", opacity: 0.5 }}>
          {es ? "Datos: ECMWF vía Windy.com" : "Data: ECMWF via Windy.com"}
        </span>
      </div>
    </div>
  );
}
