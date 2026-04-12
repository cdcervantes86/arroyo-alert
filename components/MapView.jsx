"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";
import { useLanguage } from "@/lib/LanguageContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions, onMapReady }) {
  const { lang } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const initRef = useRef(false);
  const [mapError, setMapError] = useState(false);

  // Initialize map
  useEffect(() => {
    if (initRef.current || !mapContainerRef.current || !MAPBOX_TOKEN) return;
    initRef.current = true;

    try {
      const mapboxgl = require("mapbox-gl");

      // Check WebGL support
      if (!mapboxgl.supported()) {
        setMapError(true);
        return;
      }

      // Check WebGL support
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("WebGL not supported");
        setMapError(true);
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: DARK_STYLE,
        center: [-74.805, 10.96],
        zoom: 12.5,
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
        antialias: false,
        fadeDuration: 0,
        preserveDrawingBuffer: false,
        maxTileCacheSize: 50,
        trackResize: true,
        failIfMajorPerformanceCaveat: false,
      });

      map.on("error", (e) => {
        console.error("Mapbox error:", e);
        if (e?.error?.status === 401 || e?.error?.message?.includes("WebGL")) {
          setMapError(true);
        }
      });

    // Add controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      // === CUSTOM MAP STYLE — match app's dark theme ===
      try {
      // Water — deep navy matching our bg
      map.setPaintProperty("water", "fill-color", "#080e1c");
      // Land background — slightly lighter than water
      try { map.setPaintProperty("land", "background-color", "#0c1322"); } catch(e) {}
      // Buildings — very subtle
      try {
        map.setPaintProperty("building", "fill-color", "rgba(255,255,255,0.02)");
        map.setPaintProperty("building", "fill-outline-color", "rgba(255,255,255,0.03)");
      } catch(e) {}
      // Roads — dim, just enough to navigate
      const roadLayers = map.getStyle().layers.filter(l => l.id.includes("road") && l.type === "line");
      roadLayers.forEach(l => {
        try {
          if (l.id.includes("major") || l.id.includes("trunk") || l.id.includes("primary")) {
            map.setPaintProperty(l.id, "line-color", "rgba(255,255,255,0.08)");
          } else if (l.id.includes("street") || l.id.includes("secondary")) {
            map.setPaintProperty(l.id, "line-color", "rgba(255,255,255,0.04)");
          } else {
            map.setPaintProperty(l.id, "line-color", "rgba(255,255,255,0.03)");
          }
        } catch(e) {}
      });
      // Labels — subtle, match our text colors
      const labelLayers = map.getStyle().layers.filter(l => l.type === "symbol" && l.id.includes("label"));
      labelLayers.forEach(l => {
        try {
          if (l.id.includes("place") || l.id.includes("poi")) {
            map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.25)");
            map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.95)");
            map.setPaintProperty(l.id, "text-halo-width", 1.5);
          }
          if (l.id.includes("road")) {
            map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.15)");
            map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.8)");
          }
          // Shrink city/town labels
          if (l.id.includes("place-city") || l.id.includes("place-town")) {
            map.setLayoutProperty(l.id, "text-size", ["interpolate", ["linear"], ["zoom"], 8, 12, 12, 16, 16, 20]);
          }
          // Dim neighborhood labels
          if (l.id.includes("place-neighborhood") || l.id.includes("place-suburb")) {
            map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.18)");
            map.setLayoutProperty(l.id, "text-size", ["interpolate", ["linear"], ["zoom"], 12, 9, 16, 12]);
          }
        } catch(e) {}
      });
      // Parks/green areas — very dark green
      const parkLayers = map.getStyle().layers.filter(l => l.id.includes("park") || l.id.includes("landuse"));
      parkLayers.forEach(l => {
        try {
          if (l.type === "fill") map.setPaintProperty(l.id, "fill-color", "rgba(34,197,94,0.03)");
        } catch(e) {}
      });

      // Add arroyo corridor lines
      map.addSource("arroyo-corridors", {
        type: "geojson",
        data: ARROYO_CORRIDORS,
      });

      // Outer glow — very subtle
      map.addLayer({
        id: "arroyo-corridors-glow",
        type: "line",
        source: "arroyo-corridors",
        paint: {
          "line-color": [
            "match", ["get", "risk"],
            "high", "rgba(96,165,250,0.06)",
            "medium", "rgba(96,165,250,0.04)",
            "rgba(96,165,250,0.02)",
          ],
          "line-width": 12,
          "line-blur": 8,
        },
      });

      // Main line — thinner, less contrast
      map.addLayer({
        id: "arroyo-corridors-line",
        type: "line",
        source: "arroyo-corridors",
        paint: {
          "line-color": [
            "match", ["get", "risk"],
            "high", "rgba(96,165,250,0.15)",
            "medium", "rgba(96,165,250,0.1)",
            "rgba(96,165,250,0.06)",
          ],
          "line-width": 2,
          "line-dasharray": [5, 4],
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });

      // Animated flow dots (using line pattern)
      map.addLayer({
        id: "arroyo-corridors-flow",
        type: "line",
        source: "arroyo-corridors",
        paint: {
          "line-color": "rgba(96,165,250,0.06)",
          "line-width": 1,
        },
        layout: {
          "line-cap": "round",
        },
      });
      } catch(styleErr) { console.warn("Map style customization failed:", styleErr); }
    });

    mapRef.current = map;
    if (onMapReady) onMapReady(map);

    // Timeout: if map hasn't loaded in 15s, something is wrong
    const loadTimeout = setTimeout(() => {
      if (!map.loaded()) {
        console.warn("Map load timeout");
        // Don't set error — map might still be loading slowly
      }
    }, 15000);
    map.on("load", () => clearTimeout(loadTimeout));

    return () => {
      clearTimeout(loadTimeout);
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      initRef.current = false;
    };
    } catch (e) {
      console.error("Map init error:", e);
      setMapError(true);
    }
  }, [onMapReady]);

  // Resize on panel toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.resize(), 100);
    return () => clearTimeout(t);
  }, [panelOpen]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const mapboxgl = require("mapbox-gl");

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const zr = getZoneReports(zone.id, reports);
      const count = zr.length;
      const pred = predictions?.[zone.id];
      const colors = { danger: "#ef4444", caution: "#eab308", safe: "#22c55e" };
      const col = sev ? colors[sev] : (pred?.score >= 40 ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.3)");
      const matchesFilter = !activeFilter || sev === activeFilter;
      const opacity = matchesFilter ? 1 : 0.12;

      // Sizes: refined, not oversized
      const dotSize = sev === "danger" ? 16 : sev === "caution" ? 14 : sev === "safe" ? 12 : 8;

      const el = document.createElement("div");
      el.style.cssText = `
        width: 44px; height: 44px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        opacity: ${opacity}; transition: opacity 0.3s ease;
        position: relative;
      `;

      // Soft ambient glow for active zones (not a pulse ring)
      if (sev && matchesFilter) {
        const glow = document.createElement("div");
        const glowSize = sev === "danger" ? 36 : 28;
        glow.style.cssText = `
          position: absolute; width: ${glowSize}px; height: ${glowSize}px;
          border-radius: 50%; background: ${col};
          opacity: ${sev === "danger" ? "0.12" : "0.08"};
          filter: blur(${sev === "danger" ? "6" : "4"}px);
          ${sev === "danger" ? "animation: markerGlow 3s ease-in-out infinite;" : ""}
        `;
        el.appendChild(glow);
      }

      // Prediction ring — dashed circle for predicted zones
      if (!sev && pred && pred.score >= 40 && matchesFilter) {
        const predRing = document.createElement("div");
        predRing.style.cssText = `
          position: absolute; width: 22px; height: 22px; border-radius: 50%;
          border: 1.5px dashed ${pred.score >= 70 ? "rgba(239,68,68,0.35)" : "rgba(234,179,8,0.25)"};
        `;
        el.appendChild(predRing);
      }

      // Main dot
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%;
        background: ${col};
        border: ${sev ? "1.5px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.15)"};
        box-shadow: 0 0 ${sev ? dotSize / 2 : 2}px ${col}${sev ? "40" : "20"};
        position: relative; z-index: 1;
        transition: transform 0.2s ease;
      `;
      el.appendChild(dot);

      // Count badge — show for 1+ reports
      if (count >= 1 && matchesFilter && sev) {
        const badge = document.createElement("div");
        badge.style.cssText = `
          position: absolute; top: 2px; right: 2px; z-index: 2;
          min-width: 16px; height: 16px; border-radius: 8px;
          background: ${col}; color: #fff; font-size: 9px;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 3px;
          border: 1.5px solid #0e1628;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.3px;
        `;
        badge.textContent = count;
        el.appendChild(badge);
      }

      // Popup
      const label = sev ? SEVERITY[sev].label : "Sin reportes";
      const predLabel = pred && pred.score >= 20 ?
        `<br/><span style="color:${pred.score >= 70 ? '#ef4444' : pred.score >= 40 ? '#eab308' : '#60a5fa'}">${pred.score}% probabilidad</span>` : '';
      const popupHtml = `
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;line-height:1.4;">
          <b>${zone.name}</b><br/>
          <span style="opacity:0.5">${zone.area}</span><br/>
          <span style="color:${col}">${label}</span>${count > 0 ? ` · ${count}` : ''}${predLabel}
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: false,
        closeOnClick: false,
        className: "arroyo-mapbox-popup",
        maxWidth: "220px",
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([zone.lng, zone.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("mouseenter", () => { marker.togglePopup(); dot.style.transform = "scale(1.2)"; });
      el.addEventListener("mouseleave", () => { marker.getPopup().remove(); dot.style.transform = "scale(1)"; });

      // Click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onZoneClick(zone.id);
      });

      markersRef.current.push(marker);
    });
  }, [reports, onZoneClick, activeFilter, predictions]);

  if (mapError) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>{lang === "es" ? "El mapa no pudo cargar" : "Map could not load"}</p>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.5, maxWidth: 260 }}>{lang === "es" ? "Tu navegador puede no soportar WebGL. Usa la vista de Zonas para ver las alertas." : "Your browser may not support WebGL. Use the Zones view to see alerts."}</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setMapError(false); initRef.current = false; }} style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-dim)", fontSize: "13px", fontWeight: 600 }}>{lang === "es" ? "Reintentar" : "Retry"}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainerRef} style={{
        width: "100%", height: "100%", background: "#070b14",
        touchAction: "none",
      }} />
      <style>{`
        @keyframes markerGlow {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.15); }
        }
        .arroyo-mapbox-popup .mapboxgl-popup-content {
          background: #0e1628 !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .arroyo-mapbox-popup .mapboxgl-popup-tip {
          border-top-color: #0e1628 !important;
        }
        .mapboxgl-ctrl-attrib {
          background: transparent !important;
          font-size: 8px !important;
          opacity: 0.3;
        }
        .mapboxgl-ctrl-attrib a {
          color: rgba(255,255,255,0.4) !important;
        }
        .mapboxgl-ctrl-group {
          background: #0e1628 !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
          overflow: hidden !important;
        }
        .mapboxgl-ctrl-group button {
          background: transparent !important;
          border-color: rgba(255,255,255,0.06) !important;
        }
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(255,255,255,0.06) !important;
        }
        .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon {
          filter: invert(1) brightness(0.6) !important;
        }
        .mapboxgl-ctrl-group button:hover .mapboxgl-ctrl-icon {
          filter: invert(1) brightness(0.9) !important;
        }
      `}</style>
    </>
  );
}
