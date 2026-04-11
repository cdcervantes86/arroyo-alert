"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions, onMapReady }) {
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

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: DARK_STYLE,
        center: [-74.805, 10.96],
        zoom: 12.5,
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
      });

    // Add controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      // === CUSTOM MAP STYLE — match app's dark theme ===
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
            map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.35)");
            map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.9)");
            map.setPaintProperty(l.id, "text-halo-width", 1.5);
          } else if (l.id.includes("road")) {
            map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.2)");
            map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.8)");
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

      // Outer glow
      map.addLayer({
        id: "arroyo-corridors-glow",
        type: "line",
        source: "arroyo-corridors",
        paint: {
          "line-color": [
            "match", ["get", "risk"],
            "high", "rgba(96,165,250,0.12)",
            "medium", "rgba(96,165,250,0.08)",
            "rgba(96,165,250,0.05)",
          ],
          "line-width": 14,
          "line-blur": 8,
        },
      });

      // Main line
      map.addLayer({
        id: "arroyo-corridors-line",
        type: "line",
        source: "arroyo-corridors",
        paint: {
          "line-color": [
            "match", ["get", "risk"],
            "high", "rgba(96,165,250,0.3)",
            "medium", "rgba(96,165,250,0.2)",
            "rgba(96,165,250,0.12)",
          ],
          "line-width": 3,
          "line-dasharray": [4, 3],
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
          "line-color": "rgba(96,165,250,0.15)",
          "line-width": 1.5,
        },
        layout: {
          "line-cap": "round",
        },
      });
    });

    mapRef.current = map;
    if (onMapReady) onMapReady(map);

    return () => {
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
      const col = sev ? colors[sev] : (pred?.score >= 40 ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.25)");
      const size = sev === "danger" ? 24 : sev ? 18 : 12;
      const pulse = sev === "danger";
      const matchesFilter = !activeFilter || sev === activeFilter;
      const opacity = matchesFilter ? 1 : 0.15;

      // Create marker element — fixed 40x40 wrapper prevents anchor drift
      const el = document.createElement("div");
      el.style.cssText = `
        width: 40px; height: 40px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        opacity: ${opacity}; transition: opacity 0.3s ease;
      `;

      // Pulse ring for danger
      if (pulse && matchesFilter) {
        const pulseEl = document.createElement("div");
        pulseEl.style.cssText = `
          position: absolute; width: ${size + 16}px; height: ${size + 16}px; border-radius: 50%;
          border: 2px solid ${col}; opacity: 0;
          animation: markerPulse 2s ease-in-out infinite;
        `;
        el.appendChild(pulseEl);
      }

      // Prediction ring
      if (!sev && pred && pred.score >= 40 && matchesFilter) {
        const predEl = document.createElement("div");
        predEl.style.cssText = `
          position: absolute; width: ${size + 12}px; height: ${size + 12}px; border-radius: 50%;
          border: 2px dashed ${pred.score >= 70 ? "rgba(239,68,68,0.4)" : "rgba(234,179,8,0.3)"};
        `;
        el.appendChild(predEl);
      }

      // Main dot
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${col}; border: 1.5px solid rgba(255,255,255,0.5);
        box-shadow: 0 0 ${size}px ${col}50, 0 0 ${size * 2}px ${col}20;
        position: relative;
      `;
      el.appendChild(dot);

      // Badge for multiple reports
      if (count >= 2 && matchesFilter) {
        const badge = document.createElement("div");
        badge.style.cssText = `
          position: absolute; top: 0; right: 0;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: #fff; color: #000; font-size: 10px;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          font-family: 'DM Sans', sans-serif;
        `;
        badge.textContent = count;
        el.appendChild(badge);
      }

      // Create popup
      const label = sev ? SEVERITY[sev].label : "Sin reportes";
      const predLabel = pred && pred.score >= 20 ?
        `<br/><span style="color:${pred.score >= 70 ? '#ef4444' : pred.score >= 40 ? '#eab308' : '#60a5fa'}">${pred.score}% probabilidad</span>` : '';
      const popupHtml = `
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;line-height:1.4;">
          <b>${zone.name}</b><br/>
          <span style="opacity:0.6">${zone.area}</span><br/>
          ${label}${count > 0 ? ` · ${count} reporte${count > 1 ? 's' : ''}` : ''}${predLabel}
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

      // Show popup on hover
      el.addEventListener("mouseenter", () => marker.togglePopup());
      el.addEventListener("mouseleave", () => marker.getPopup().remove());

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
      <div style={{ width: "100%", height: "100%", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px" }}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>Map could not load on this device</p>
        <p style={{ fontSize: "12px", color: "var(--text-faint)" }}>Switch to the Zones tab to see arroyo alerts</p>
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
        @keyframes markerPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        .arroyo-mapbox-popup .mapboxgl-popup-content {
          background: rgba(8,13,24,0.94) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .arroyo-mapbox-popup .mapboxgl-popup-tip {
          border-top-color: rgba(8,13,24,0.94) !important;
        }
        .mapboxgl-ctrl-attrib {
          background: rgba(0,0,0,0.4) !important;
          font-size: 9px !important;
        }
        .mapboxgl-ctrl-attrib a {
          color: rgba(255,255,255,0.3) !important;
        }
        .mapboxgl-ctrl-group {
          background: rgba(10,15,26,0.85) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
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
