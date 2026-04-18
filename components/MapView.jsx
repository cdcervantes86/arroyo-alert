"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";
import { useLanguage } from "@/lib/LanguageContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Douglas-Peucker line simplification for glow layers
function dpSimplify(coords, tolerance) {
  if (coords.length <= 2) return coords;
  let maxDist = 0, maxIdx = 0;
  const [x1, y1] = coords[0], [x2, y2] = coords[coords.length - 1];
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  for (let i = 1; i < coords.length - 1; i++) {
    const [px, py] = coords[i];
    let dist;
    if (lenSq === 0) { dist = Math.sqrt((px-x1)**2 + (py-y1)**2); }
    else {
      const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / lenSq));
      dist = Math.sqrt((px - (x1 + t*dx))**2 + (py - (y1 + t*dy))**2);
    }
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = dpSimplify(coords.slice(0, maxIdx + 1), tolerance);
    const right = dpSimplify(coords.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [coords[0], coords[coords.length - 1]];
}

function simplifyGeometry(geom, tol) {
  if (geom.type === "MultiLineString") {
    return { type: "MultiLineString", coordinates: geom.coordinates.map(c => dpSimplify(c, tol)) };
  }
  return { type: "LineString", coordinates: dpSimplify(geom.coordinates, tol) };
}

const GLOW_SIMPLIFY_TOL = 0.0002;
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions, onMapReady }) {
  const { lang } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const initRef = useRef(false);
  const [mapError, setMapError] = useState(false);
  const [mapLayersReady, setMapLayersReady] = useState(false);

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
      let flowInterval = null;

      const liteMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lite") === "1";
      const liteStyle = {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
          },
        },
        layers: [{ id: "carto-dark-layer", type: "raster", source: "carto-dark" }],
      };
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: liteMode ? liteStyle : DARK_STYLE,
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
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // Reset any stale padding from previous sessions
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });

      // === CUSTOM MAP STYLE — match app's dark theme ===
      // Skip in lite mode (raster tiles have no vector layers to customize)
      if (!liteMode) try {
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


      // Main source — full detail for core lines
      const corridorData = {
        ...ARROYO_CORRIDORS,
        features: ARROYO_CORRIDORS.features.map(f => ({
          ...f,
          properties: { ...f.properties, status: "inactive" },
        })),
      };
      map.addSource("arroyo-corridors", {
        type: "geojson",
        data: corridorData,
        lineMetrics: true,
      });

      // Simplified source — for glow + mouth layers (prevents blur overlap artifacts)
      const glowData = {
        ...ARROYO_CORRIDORS,
        features: ARROYO_CORRIDORS.features.map(f => ({
          ...f,
          properties: { ...f.properties, status: "inactive" },
          geometry: simplifyGeometry(f.geometry, GLOW_SIMPLIFY_TOL),
        })),
      };
      map.addSource("arroyo-corridors-glow", {
        type: "geojson",
        data: glowData,
        lineMetrics: true,
      });

      // Helper: gradient that fades at both ends of the line
      const mkFade = (r, g, b, peakA) => [
        "interpolate", ["linear"], ["line-progress"],
        0, `rgba(${r},${g},${b},0)`,
        0.12, `rgba(${r},${g},${b},${peakA})`,
        0.78, `rgba(${r},${g},${b},${peakA})`,
        1, `rgba(${r},${g},${b},0)`,
      ];

      // Helper: bloom visible only near the mouth (last 25%)
      const mkMouth = (r, g, b, peakA) => [
        "interpolate", ["linear"], ["line-progress"],
        0, `rgba(${r},${g},${b},0)`,
        0.65, `rgba(${r},${g},${b},0)`,
        0.82, `rgba(${r},${g},${b},${peakA})`,
        0.94, `rgba(${r},${g},${b},${peakA * 0.5})`,
        1, `rgba(${r},${g},${b},0)`,
      ];

      // Status configs: [r, g, b, glowA, coreA, dispersalA]
      const statuses = {
        inactive: { rgb: [96, 165, 250], glow: 0.08, core: 0.22, mouth: 0.06, filter: ["any", ["==", ["get", "status"], "inactive"], ["==", ["get", "status"], "safe"]] },
        caution:  { rgb: [234, 179, 8],  glow: 0.2,  core: 0.55, mouth: 0.18, filter: ["==", ["get", "status"], "caution"] },
        danger:   { rgb: [239, 68, 68],  glow: 0.25, core: 0.7,  mouth: 0.22, filter: ["==", ["get", "status"], "danger"] },
      };

      const glowW = ["interpolate", ["linear"], ["zoom"], 10, 8, 14, 14, 17, 20];
      const glowB = ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 10, 17, 14];
      const coreW = ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 2.5, 17, 3.5];
      const mouthW = ["interpolate", ["linear"], ["zoom"], 10, 24, 14, 50, 17, 80];
      const mouthB = ["interpolate", ["linear"], ["zoom"], 10, 16, 14, 30, 17, 50];

      // Create per-status layers: glow + core + mouth dispersal
      Object.entries(statuses).forEach(([key, s]) => {
        const [r, g, b] = s.rgb;

        // Outer glow — wide atmospheric halo with fade
        map.addLayer({
          id: `corridors-glow-${key}`,
          type: "line",
          source: "arroyo-corridors-glow",
          filter: s.filter,
          paint: {
            "line-gradient": mkFade(r, g, b, s.glow),
            "line-width": glowW,
            "line-blur": glowB,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });

        // Core stream — the main visible line with fade
        map.addLayer({
          id: `corridors-core-${key}`,
          type: "line",
          source: "arroyo-corridors",
          filter: s.filter,
          paint: {
            "line-gradient": mkFade(r, g, b, s.core),
            "line-width": coreW,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });

        // Mouth dispersal — very wide, heavily blurred, only near the end
        map.addLayer({
          id: `corridors-mouth-${key}`,
          type: "line",
          source: "arroyo-corridors-glow",
          filter: s.filter,
          paint: {
            "line-gradient": mkMouth(r, g, b, s.mouth),
            "line-width": mouthW,
            "line-blur": mouthB,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      });

      // Trimmed corridor source — excludes first/last 12% of points
      // so inner glow + animated dashes don't show at the faded endpoints
      const trimGeometry = (geom) => {
        const trimLine = (c) => {
          const skip = Math.max(1, Math.round(c.length * 0.12));
          return c.slice(skip, c.length - skip);
        };
        if (geom.type === "MultiLineString") {
          const trimmed = geom.coordinates.map(trimLine).filter(c => c.length >= 2);
          return { type: "MultiLineString", coordinates: trimmed };
        }
        return { type: "LineString", coordinates: trimLine(geom.coordinates) };
      };
      const trimmedFeatures = ARROYO_CORRIDORS.features.map(f => ({
        ...f,
        properties: { ...f.properties, status: "inactive" },
        geometry: trimGeometry(f.geometry),
      }));
      map.addSource("arroyo-corridors-trimmed", {
        type: "geojson",
        data: { type: "FeatureCollection", features: trimmedFeatures },
      });

      // Inner glow — uses trimmed source so it stops where the fade begins
      map.addLayer({
        id: "arroyo-corridors-inner",
        type: "line",
        source: "arroyo-corridors-trimmed",
        paint: {
          "line-color": [
            "match", ["get", "status"],
            "danger", "#f87171",
            "caution", "#fbbf24",
            "safe", "#4ade80",
            "#93c5fd",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4, 14, 7, 17, 10],
          "line-blur": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 5, 17, 7],
          "line-opacity": [
            "match", ["get", "status"],
            "danger", 0.3,
            "caution", 0.22,
            "safe", 0.1,
            0.08,
          ],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      // Animated flow — uses trimmed source, only for danger/caution
      map.addLayer({
        id: "arroyo-corridors-flow",
        type: "line",
        source: "arroyo-corridors-trimmed",
        paint: {
          "line-color": [
            "match", ["get", "status"],
            "danger", "#fecaca",
            "caution", "#fef08a",
            "rgba(0,0,0,0)",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 14, 1.5, 17, 2],
          "line-dasharray": [0, 4, 3],
          "line-opacity": [
            "match", ["get", "status"],
            "danger", 0.7,
            "caution", 0.5,
            0,
          ],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      // Animate flow
      const dashSteps = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
        [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
        [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2],
        [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
      ];
      let flowStep = 0;
      flowInterval = setInterval(() => {
        if (!mapRef.current) return;
        try {
          flowStep = (flowStep + 1) % dashSteps.length;
          mapRef.current.setPaintProperty("arroyo-corridors-flow", "line-dasharray", dashSteps[flowStep]);
        } catch(e) {}
      }, 80);
      } catch(styleErr) { console.warn("Map style customization failed:", styleErr); }
      setMapLayersReady(true);
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
      clearInterval(flowInterval);
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      initRef.current = false;
      setMapLayersReady(false);
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

      const el = document.createElement("div");
      el.style.cssText = `width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:${opacity};`;

      if (sev && count >= 1 && matchesFilter) {
        // ACTIVE ZONE — single circle with count inside
        const size = sev === "danger" ? 32 : sev === "caution" ? 28 : 24;
        const glowSize = sev === "danger" ? 14 : 10;
        const rgbVal = sev === "danger" ? "239,68,68" : sev === "caution" ? "234,179,8" : "34,197,94";
        const marker = document.createElement("div");
        marker.style.cssText = `
          width:${size}px;height:${size}px;border-radius:50%;
          background:${col};
          border:2px solid rgba(255,255,255,0.5);
          box-shadow:0 0 ${glowSize}px rgba(${rgbVal},0.4), 0 0 ${glowSize * 2.5}px rgba(${rgbVal},0.15);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:${count > 9 ? 10 : 11}px;font-weight:800;
          font-family:'DM Sans',sans-serif;letter-spacing:-0.3px;
          text-shadow:0 1px 2px rgba(0,0,0,0.3);
          ${sev === "danger" ? "animation:markerPulse 2s ease-in-out infinite;" : ""}
        `;
        marker.textContent = count;
        el.appendChild(marker);
      } else {
        // INACTIVE / NO REPORTS — small dot
        const dotSize = pred?.score >= 40 ? 10 : 8;
        const dot = document.createElement("div");
        const glowSpread = pred?.score >= 40 ? 4 : 2;
        dot.style.cssText = `
          width:${dotSize}px;height:${dotSize}px;border-radius:50%;
          background:${col};
          border:1px solid rgba(255,255,255,0.15);
          box-shadow:0 0 ${glowSpread}px rgba(255,255,255,0.15);
        `;
        el.appendChild(dot);
      }

      // Prediction ring — only on inactive zones
      if (!sev && pred && pred.score >= 40 && matchesFilter) {
        const predRing = document.createElement("div");
        predRing.style.cssText = `position:absolute;width:22px;height:22px;border-radius:50%;border:1.5px dashed ${pred.score >= 70 ? "rgba(239,68,68,0.35)" : "rgba(234,179,8,0.25)"};`;
        el.appendChild(predRing);
      }

      // Popup
      const es = lang === "es";
      const label = sev ? (es ? SEVERITY[sev].label : { danger: "Danger", caution: "Caution", safe: "Clear" }[sev] || sev) : "";
      const predLabel = pred && pred.score >= 20 && !sev ?
        `<div style="margin-top:4px;font-size:11px;color:${pred.score >= 70 ? '#ef4444' : pred.score >= 40 ? '#eab308' : '#60a5fa'};font-weight:600">${pred.score}% ${es ? 'probabilidad' : 'probability'}</div>` : '';
      const latestReport = getZoneReports(zone.id, reports)[0];
      const timeAgo = latestReport ? (() => {
        const m = Math.round((Date.now() - new Date(latestReport.created_at).getTime()) / 60000);
        if (m < 1) return es ? "ahora" : "now";
        if (m < 60) return `${m}m`;
        return `${Math.floor(m / 60)}h ${m % 60}m`;
      })() : '';
      const popupHtml = `
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;line-height:1.5;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            ${sev ? `<span style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0"></span>` : ''}
            <b style="font-size:13px;font-weight:700">${zone.name}</b>
          </div>
          <span style="opacity:0.45;font-size:11px">${zone.area}</span>
          ${sev ? `<div style="margin-top:4px;display:flex;align-items:center;gap:6px"><span style="color:${col};font-weight:600;font-size:11px">${label}</span><span style="opacity:0.3">·</span><span style="opacity:0.5;font-size:11px">${timeAgo}</span></div>` : ''}
          ${predLabel}
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

      let pinned = false;
      el.addEventListener("mouseenter", () => { if (!pinned) marker.togglePopup(); });
      el.addEventListener("mouseleave", () => { if (!pinned) marker.getPopup().remove(); });

      // Click handler — pin popup open + trigger zone detail
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Close all other pinned popups
        markersRef.current.forEach(m => { try { m._pinned = false; m.getPopup().remove(); } catch(e) {} });
        pinned = true;
        marker._pinned = true;
        if (!marker.getPopup().isOpen()) marker.togglePopup();
        onZoneClick(zone.id);
      });

      markersRef.current.push(marker);
    });

    // Close pinned popups when clicking empty map space
    const clearPinned = () => {
      markersRef.current.forEach(m => { try { m._pinned = false; m.getPopup().remove(); } catch(e) {} });
    };
    map.on("click", clearPinned);
    return () => { map.off("click", clearPinned); };
  }, [reports, onZoneClick, activeFilter, predictions]);

  // Update corridor status based on active reports.
  // Depends on mapLayersReady so it re-runs once map.on("load") finishes
  // adding the sources — otherwise on first load map exists but sources don't.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLayersReady) return;
    const src = map.getSource("arroyo-corridors");
    const glowSrc = map.getSource("arroyo-corridors-glow");
    const trimSrc = map.getSource("arroyo-corridors-trimmed");
    if (!src) return;

    const features = ARROYO_CORRIDORS.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        status: getZoneSeverity(f.properties.id, reports) || "inactive",
      },
    }));
    src.setData({ ...ARROYO_CORRIDORS, features });

    // Update simplified glow source
    if (glowSrc) {
      const glowFeatures = features.map(f => ({
        ...f,
        geometry: simplifyGeometry(f.geometry, GLOW_SIMPLIFY_TOL),
      }));
      glowSrc.setData({ type: "FeatureCollection", features: glowFeatures });
    }

    // Also update trimmed source (inner glow + flow dashes)
    if (trimSrc) {
      const trimLine = (c) => {
        const skip = Math.max(1, Math.round(c.length * 0.12));
        return c.slice(skip, c.length - skip);
      };
      const trimmed = features.map(f => {
        const geom = f.geometry;
        const trimmedGeom = geom.type === "MultiLineString"
          ? { type: "MultiLineString", coordinates: geom.coordinates.map(trimLine).filter(c => c.length >= 2) }
          : { type: "LineString", coordinates: trimLine(geom.coordinates) };
        return { ...f, geometry: trimmedGeom };
      });
      trimSrc.setData({ type: "FeatureCollection", features: trimmed });
    }
  }, [reports, mapLayersReady]);

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
        .mapboxgl-ctrl-bottom-right {
          bottom: 180px !important;
          right: ${panelOpen ? 392 : 12}px !important;
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .mapboxgl-ctrl-group {
          background: rgba(10,15,26,0.2) !important;
          backdrop-filter: blur(16px) saturate(1.6) !important;
          -webkit-backdrop-filter: blur(16px) saturate(1.6) !important;
          border: 1px solid rgba(255,255,255,0.13) !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1) !important;
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
        .mapboxgl-ctrl-group button:active {
          background: rgba(255,255,255,0.08) !important;
        }
        .mapboxgl-ctrl-group button:hover .mapboxgl-ctrl-icon {
          filter: invert(1) brightness(0.9) !important;
        }
      `}</style>
    </>
  );
}
