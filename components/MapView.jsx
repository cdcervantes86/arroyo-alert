"use client";
import { useEffect, useRef, useCallback } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions, onMapReady }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const initRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (initRef.current || !mapContainerRef.current || !MAPBOX_TOKEN) return;
    initRef.current = true;

    const mapboxgl = require("mapbox-gl");

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
        background: ${col}; border: 2px solid rgba(255,255,255,0.6);
        box-shadow: 0 0 12px ${col}60;
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
      `}</style>
    </>
  );
}
