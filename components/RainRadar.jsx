"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

// Barranquilla tile coordinates at different zoom levels
// z=6: x=18, y=30 — ~150km radius
// z=7: x=37, y=60 — ~75km radius
const RADAR_ZOOM = 6;
const TILE_X = 18;
const TILE_Y = 30;
const TILE_SIZE = 256;
// 3x3 grid for more context
const GRID = [-1, 0, 1];

export function useRainRadar(mapInstance) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [radarPath, setRadarPath] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [frames, setFrames] = useState([]);
  const [frameIndex, setFrameIndex] = useState(-1);
  const intervalRef = useRef(null);

  const fetchFrames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await res.json();
      const past = data.radar?.past || [];
      if (past.length > 0) {
        setFrames(past);
        const latest = past[past.length - 1];
        setRadarPath(latest.path);
        setFrameIndex(past.length - 1);
        setTimestamp(new Date(latest.time * 1000));
        setEnabled(true);
      }
    } catch (e) {
      console.error("Radar fetch error:", e);
    }
    setLoading(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      setRadarPath(null);
      setTimestamp(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      fetchFrames();
    }
  }, [enabled, fetchFrames]);

  // Auto-refresh every 5 min
  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(fetchFrames, 300000);
    return () => clearInterval(intervalRef.current);
  }, [enabled, fetchFrames]);

  // Animate through frames
  const playAnimation = useCallback(() => {
    if (frames.length < 2) return;
    let i = 0;
    const anim = setInterval(() => {
      setFrameIndex(i);
      setRadarPath(frames[i].path);
      setTimestamp(new Date(frames[i].time * 1000));
      i++;
      if (i >= frames.length) {
        clearInterval(anim);
        // Stay on latest
        const latest = frames[frames.length - 1];
        setFrameIndex(frames.length - 1);
        setRadarPath(latest.path);
        setTimestamp(new Date(latest.time * 1000));
      }
    }, 400);
    return () => clearInterval(anim);
  }, [frames]);

  return { enabled, loading, radarPath, timestamp, toggle, frames, frameIndex, playAnimation };
}

function RadarTile({ path, z, x, y, size }) {
  const url = `https://tilecache.rainviewer.com${path}/${TILE_SIZE}/${z}/${x}/${y}/2/1_1.png`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      style={{ display: "block", opacity: 0.85 }}
      draggable={false}
    />
  );
}

export function RainRadarButton({ enabled, loading, onToggle }) {
  const { lang } = useLanguage();
  const es = lang === "es";

  return (
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
  );
}

export function RadarPanel({ radarPath, timestamp, frames, frameIndex, onClose, onPlay }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const tileSize = 80; // px per tile in the 3x3 grid

  if (!radarPath) return null;

  return (
    <div style={{
      position: "absolute", top: 60, right: 16, zIndex: 800,
      background: "rgba(8,13,24,0.95)", backdropFilter: "blur(12px)",
      borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
      overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "fadeIn 0.2s ease",
      width: tileSize * 3 + 2,
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

      {/* Radar image — 3x3 tile grid */}
      <div style={{
        width: tileSize * 3, height: tileSize * 3,
        position: "relative", background: "#0a0e1a",
        overflow: "hidden",
      }}>
        {/* Base map tiles (dark) */}
        {GRID.map(dy => GRID.map(dx => (
          <img
            key={`base-${dx}-${dy}`}
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/${RADAR_ZOOM}/${TILE_X + dx}/${TILE_Y + dy}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            width={tileSize}
            height={tileSize}
            alt=""
            style={{
              position: "absolute",
              left: (dx + 1) * tileSize,
              top: (dy + 1) * tileSize,
              display: "block",
            }}
            draggable={false}
          />
        )))}
        {/* Radar overlay tiles */}
        {GRID.map(dy => GRID.map(dx => (
          <div
            key={`radar-${dx}-${dy}`}
            style={{
              position: "absolute",
              left: (dx + 1) * tileSize,
              top: (dy + 1) * tileSize,
              width: tileSize,
              height: tileSize,
            }}
          >
            <RadarTile path={radarPath} z={RADAR_ZOOM} x={TILE_X + dx} y={TILE_Y + dy} size={tileSize} />
          </div>
        )))}
        {/* Barranquilla marker */}
        <div style={{
          position: "absolute",
          left: tileSize * 1.5 - 4,
          top: tileSize * 1.5 - 4,
          width: 8, height: 8, borderRadius: "50%",
          background: "#fff", border: "2px solid var(--accent)",
          boxShadow: "0 0 8px rgba(91,156,246,0.5)",
          zIndex: 2,
        }} />
        <div style={{
          position: "absolute",
          left: tileSize * 1.5 + 8,
          top: tileSize * 1.5 - 6,
          fontSize: "10px", fontWeight: 700, color: "#fff",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          zIndex: 2,
        }}>BAQ</div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px",
        borderTop: "1px solid var(--border)",
      }}>
        {frames.length > 1 && (
          <button onClick={onPlay} style={{
            padding: "4px 10px", borderRadius: "6px",
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
            color: "var(--text-dim)", fontSize: "11px", fontWeight: 600,
          }}>
            ▶ {es ? "Animar" : "Animate"}
          </button>
        )}
        <div style={{ flex: 1 }} />
        {timestamp && (
          <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <span style={{ fontSize: "9px", color: "var(--text-faint)", opacity: 0.5 }}>RainViewer</span>
      </div>
    </div>
  );
}
