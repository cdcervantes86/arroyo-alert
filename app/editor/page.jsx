"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ZONES } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STORAGE_KEY = "arroyo-editor-state";

// Haversine distance in km between two [lng, lat] coords
function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function corridorLength(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i - 1], coords[i]);
  return total;
}

function getBounds(coords) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function CoordEditor() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lineMarkersRef = useRef([]);
  const initRef = useRef(false);

  const [mode, setMode] = useState("zones");
  const [editingZone, setEditingZone] = useState(null);
  const [editingCorridor, setEditingCorridor] = useState(null);
  const [zones, setZones] = useState(ZONES.map(z => ({ ...z })));
  const [corridors, setCorridors] = useState(
    ARROYO_CORRIDORS.features.map(f => ({
      id: f.properties.id,
      name: f.properties.name,
      area: f.properties.area,
      risk: f.properties.risk,
      coords: f.geometry.coordinates.map(c => [...c]),
    }))
  );
  const [corridorPoints, setCorridorPoints] = useState([]);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [mouseCoord, setMouseCoord] = useState(null);
  const [mapStyle, setMapStyle] = useState("satellite");
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  // ====== AUTO-SAVE to localStorage ======
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.zones) setZones(data.zones);
        if (data.corridors) setCorridors(data.corridors);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ zones, corridors }));
    } catch (e) {}
  }, [zones, corridors]);

  // ====== INIT MAP ======
  useEffect(() => {
    if (initRef.current || !mapRef.current || !MAPBOX_TOKEN) return;
    initRef.current = true;
    const mapboxgl = require("mapbox-gl");
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-74.805, 10.96],
      zoom: 13,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapInstanceRef.current = map;

    map.on("mousemove", (e) => {
      setMouseCoord({ lat: e.lngLat.lat.toFixed(4), lng: e.lngLat.lng.toFixed(4) });
    });
    map.on("mouseout", () => setMouseCoord(null));

    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  // ====== MAP STYLE TOGGLE ======
  const toggleMapStyle = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const newStyle = mapStyle === "satellite" ? "streets" : "satellite";
    setMapStyle(newStyle);
    map.setStyle(
      newStyle === "satellite"
        ? "mapbox://styles/mapbox/satellite-streets-v12"
        : "mapbox://styles/mapbox/dark-v11"
    );
  }, [mapStyle]);

  // ====== AUTO-ZOOM on corridor select ======
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || editingCorridor === null) return;
    const c = corridors.find(x => x.id === editingCorridor);
    if (!c || c.coords.length < 2) return;
    const bounds = getBounds(c.coords);
    map.fitBounds(bounds, { padding: 80, duration: 800 });
  }, [editingCorridor]);

  // ====== KEYBOARD SHORTCUTS ======
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (editingCorridor !== null) saveCorridor();
        setEditingZone(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && editingCorridor !== null) {
        e.preventDefault();
        setCorridorPoints(prev => {
          if (prev.length === 0) return prev;
          setUndoStack(stack => [...stack, prev[prev.length - 1]]);
          return prev.slice(0, -1);
        });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey)) && editingCorridor !== null) {
        e.preventDefault();
        setUndoStack(stack => {
          if (stack.length === 0) return stack;
          const point = stack[stack.length - 1];
          setCorridorPoints(prev => [...prev, point]);
          return stack.slice(0, -1);
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingCorridor]);

  // ====== MAP CLICK HANDLER ======
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handler = (e) => {
      const { lng, lat } = e.lngLat;
      if (mode === "zones" && editingZone !== null) {
        setZones(prev => prev.map(z =>
          z.id === editingZone ? { ...z, lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 } : z
        ));
        setEditingZone(null);
      } else if (mode === "corridors" && editingCorridor !== null) {
        setUndoStack([]);
        setCorridorPoints(prev => [...prev, [Math.round(lng * 10000) / 10000, Math.round(lat * 10000) / 10000]]);
      }
    };

    map.on("click", handler);
    return () => map.off("click", handler);
  }, [mode, editingZone, editingCorridor]);

  // ====== ZONE MARKERS ======
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const mapboxgl = require("mapbox-gl");

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (mode === "zones") {
      zones.forEach((z) => {
        const isEditing = editingZone === z.id;
        const el = document.createElement("div");
        el.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: ${isEditing ? "#ef4444" : "#3B82F6"};
          border: 2px solid #fff; cursor: pointer;
          box-shadow: 0 0 8px ${isEditing ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)"};
        `;
        el.title = `${z.name} (${z.area})`;

        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML(`<div style="font-family:sans-serif;font-size:12px;padding:2px;"><b>${z.name}</b><br/>${z.area}<br/><span style="opacity:0.6">${z.lat}, ${z.lng}</span></div>`);

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([z.lng, z.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => marker.togglePopup());
        el.addEventListener("mouseleave", () => marker.getPopup().remove());

        markersRef.current.push(marker);
      });
    }
  }, [zones, mode, editingZone]);

  // ====== CORRIDOR LINES + DRAGGABLE POINTS + MIDPOINTS ======
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const mapboxgl = require("mapbox-gl");

    lineMarkersRef.current.forEach(m => m.remove());
    lineMarkersRef.current = [];

    corridors.forEach((c) => {
      if (map.getLayer(`corridor-${c.id}`)) map.removeLayer(`corridor-${c.id}`);
      if (map.getSource(`corridor-src-${c.id}`)) map.removeSource(`corridor-src-${c.id}`);
    });
    if (map.getLayer("editing-line")) map.removeLayer("editing-line");
    if (map.getSource("editing-src")) map.removeSource("editing-src");

    if (mode === "corridors") {
      const addLines = () => {
        corridors.forEach((c) => {
          const isEditing = editingCorridor === c.id;
          const coords = isEditing ? corridorPoints : c.coords;
          if (coords.length < 2) return;

          try {
            map.addSource(`corridor-src-${c.id}`, {
              type: "geojson",
              data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } },
            });
            map.addLayer({
              id: `corridor-${c.id}`,
              type: "line",
              source: `corridor-src-${c.id}`,
              paint: {
                "line-color": isEditing ? "#ef4444" : "#3B82F6",
                "line-width": isEditing ? 4 : 2,
                "line-dasharray": isEditing ? [1, 0] : [4, 3],
              },
              layout: { "line-cap": "round" },
            });
          } catch (e) {}

          if (isEditing) {
            coords.forEach((coord, i) => {
              const el = document.createElement("div");
              const isHl = highlightedPoint === i;
              el.style.cssText = `
                width: ${isHl ? 18 : 14}px; height: ${isHl ? 18 : 14}px; border-radius: 50%;
                background: ${isHl ? "#f59e0b" : "#ef4444"}; border: 2px solid #fff; cursor: grab;
                box-shadow: 0 0 ${isHl ? 12 : 6}px ${isHl ? "rgba(245,158,11,0.7)" : "rgba(0,0,0,0.5)"};
                display: flex; align-items: center; justify-content: center;
                font-size: 8px; font-weight: 700; color: #fff; font-family: monospace;
                transition: width 0.15s, height 0.15s, box-shadow 0.15s;
              `;
              el.textContent = i + 1;
              el.title = `Point ${i + 1} — drag to move, right-click to delete`;

              const m = new mapboxgl.Marker({ element: el, anchor: "center", draggable: true })
                .setLngLat(coord)
                .addTo(map);

              m.on("dragend", () => {
                const lngLat = m.getLngLat();
                const newCoord = [Math.round(lngLat.lng * 10000) / 10000, Math.round(lngLat.lat * 10000) / 10000];
                setCorridorPoints(prev => prev.map((p, idx) => idx === i ? newCoord : p));
              });

              el.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                setCorridorPoints(prev => prev.filter((_, idx) => idx !== i));
              });

              lineMarkersRef.current.push(m);

              // === Midpoint marker ===
              if (i < coords.length - 1) {
                const next = coords[i + 1];
                const midEl = document.createElement("div");
                midEl.style.cssText = `
                  width: 10px; height: 10px; border-radius: 50%;
                  background: rgba(59,130,246,0.4); border: 2px solid rgba(255,255,255,0.5);
                  cursor: pointer; transition: width 0.15s, height 0.15s, background 0.15s, border-color 0.15s;
                `;
                midEl.title = "Drag to insert a point";
                midEl.addEventListener("mouseenter", () => {
                  midEl.style.background = "#3B82F6";
                  midEl.style.width = "14px";
                  midEl.style.height = "14px";
                  midEl.style.borderColor = "#fff";
                });
                midEl.addEventListener("mouseleave", () => {
                  midEl.style.background = "rgba(59,130,246,0.4)";
                  midEl.style.width = "10px";
                  midEl.style.height = "10px";
                  midEl.style.borderColor = "rgba(255,255,255,0.5)";
                });

                const midM = new mapboxgl.Marker({ element: midEl, anchor: "center", draggable: true })
                  .setLngLat([(coord[0] + next[0]) / 2, (coord[1] + next[1]) / 2])
                  .addTo(map);

                midM.on("dragend", () => {
                  const lngLat = midM.getLngLat();
                  const newCoord = [Math.round(lngLat.lng * 10000) / 10000, Math.round(lngLat.lat * 10000) / 10000];
                  setCorridorPoints(prev => {
                    const updated = [...prev];
                    updated.splice(i + 1, 0, newCoord);
                    return updated;
                  });
                });

                lineMarkersRef.current.push(midM);
              }
            });
          }
        });
      };

      if (map.isStyleLoaded()) addLines();
      else map.on("load", addLines);
    }
  }, [corridors, mode, editingCorridor, corridorPoints, highlightedPoint]);

  // ====== SAVE / REVERSE / RESET ======
  const saveCorridor = () => {
    if (editingCorridor !== null && corridorPoints.length >= 2) {
      setCorridors(prev => prev.map(c =>
        c.id === editingCorridor ? { ...c, coords: corridorPoints } : c
      ));
    }
    setEditingCorridor(null);
    setCorridorPoints([]);
    setUndoStack([]);
    setHighlightedPoint(null);
  };

  const reverseCorridor = () => setCorridorPoints(prev => [...prev].reverse());

  const resetAll = () => {
    if (!confirm("Reset all edits to original data? This cannot be undone.")) return;
    setZones(ZONES.map(z => ({ ...z })));
    setCorridors(ARROYO_CORRIDORS.features.map(f => ({
      id: f.properties.id, name: f.properties.name, area: f.properties.area,
      risk: f.properties.risk, coords: f.geometry.coordinates.map(c => [...c]),
    })));
    setEditingCorridor(null); setEditingZone(null); setCorridorPoints([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  };

  // ====== GENERATE OUTPUT ======
  const generateOutput = () => {
    if (mode === "zones") {
      const code = zones.map(z =>
        `  { id: ${z.id}, name: "${z.name}", area: "${z.area}", lat: ${z.lat}, lng: ${z.lng}, desc: "${z.desc}" },`
      ).join("\n");
      setOutput(`export const ZONES = [\n${code}\n];`);
    } else {
      const features = corridors.map(c => `    {
      type: "Feature",
      properties: { id: ${c.id}, name: "${c.name}", area: "${c.area}", risk: "${c.risk}" },
      geometry: { type: "LineString", coordinates: [\n${c.coords.map(coord => `        [${coord[0]}, ${coord[1]}]`).join(",\n")}\n      ] },
    }`).join(",\n");
      setOutput(`export const ARROYO_CORRIDORS = {\n  type: "FeatureCollection",\n  features: [\n${features}\n  ],\n};`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLength = corridorPoints.length >= 2 ? corridorLength(corridorPoints) : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #222", flexShrink: 0 }}>
        <h1 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>📍 Coordinate Editor</h1>
        <div style={{ flex: 1 }} />
        <button onClick={resetAll} style={{
          padding: "5px 10px", borderRadius: "6px", background: "transparent",
          border: "1px solid #333", color: "#666", fontSize: "11px", fontWeight: 600,
        }}>Reset</button>
        <div style={{ display: "flex", gap: "4px", background: "#111", borderRadius: "8px", padding: "3px", border: "1px solid #333" }}>
          <button onClick={() => { setMode("zones"); setEditingCorridor(null); setCorridorPoints([]); }} style={{
            padding: "6px 14px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600,
            background: mode === "zones" ? "#3B82F6" : "transparent",
            color: mode === "zones" ? "#fff" : "#888",
          }}>Zones</button>
          <button onClick={() => { setMode("corridors"); setEditingZone(null); }} style={{
            padding: "6px 14px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600,
            background: mode === "corridors" ? "#3B82F6" : "transparent",
            color: mode === "corridors" ? "#fff" : "#888",
          }}>Corridors</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 300, borderRight: "1px solid #222", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {mode === "zones" ? (
              <>
                <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 8px 4px", fontWeight: 600 }}>
                  Click a zone, then click the map to reposition
                </div>
                {zones.map(z => (
                  <button key={z.id} onClick={() => setEditingZone(editingZone === z.id ? null : z.id)} style={{
                    width: "100%", padding: "10px 12px", marginBottom: "4px", borderRadius: "8px", border: "none",
                    background: editingZone === z.id ? "rgba(239,68,68,0.15)" : "#111",
                    textAlign: "left", cursor: "pointer", color: "#fff",
                    outline: editingZone === z.id ? "2px solid #ef4444" : "1px solid #222",
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{z.name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{z.area}</div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px", fontFamily: "monospace" }}>{z.lat}, {z.lng}</div>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 8px 4px", fontWeight: 600, lineHeight: 1.6 }}>
                  Click to add · Drag to move · Blue dots to insert · Right-click delete · ⌘Z undo
                </div>
                {corridors.map(c => {
                  const isEditing = editingCorridor === c.id;
                  const pts = isEditing ? corridorPoints : c.coords;
                  const len = pts.length >= 2 ? corridorLength(pts) : 0;
                  return (
                    <div key={c.id} style={{ marginBottom: "4px" }}>
                      <button onClick={() => {
                        if (isEditing) { saveCorridor(); }
                        else { saveCorridor(); setEditingCorridor(c.id); setCorridorPoints([...c.coords]); }
                      }} style={{
                        width: "100%", padding: "10px 12px", borderRadius: "8px", border: "none",
                        background: isEditing ? "rgba(239,68,68,0.15)" : "#111",
                        textAlign: "left", cursor: "pointer", color: "#fff",
                        outline: isEditing ? "2px solid #ef4444" : "1px solid #222",
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.name} <span style={{ fontWeight: 400, color: "#888" }}>({c.area})</span></div>
                        <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", display: "flex", gap: "10px" }}>
                          <span>{pts.length} pts</span>
                          <span>{len.toFixed(2)} km</span>
                        </div>
                      </button>
                      {isEditing && (
                        <div style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
                            <button onClick={() => { setUndoStack([]); setCorridorPoints([]); }} style={{ padding: "4px 10px", borderRadius: "6px", background: "#333", border: "none", color: "#fff", fontSize: "11px" }}>Clear</button>
                            <button onClick={() => setCorridorPoints(prev => prev.slice(0, -1))} style={{ padding: "4px 10px", borderRadius: "6px", background: "#333", border: "none", color: "#fff", fontSize: "11px" }}>Undo</button>
                            <button onClick={reverseCorridor} style={{ padding: "4px 10px", borderRadius: "6px", background: "#333", border: "none", color: "#fff", fontSize: "11px" }} title="Reverse point order">⇄ Flip</button>
                            <button onClick={saveCorridor} style={{ padding: "4px 10px", borderRadius: "6px", background: "#22c55e", border: "none", color: "#fff", fontSize: "11px", fontWeight: 600 }}>Save</button>
                          </div>
                          {/* Point list */}
                          <div style={{ maxHeight: "35vh", overflowY: "auto", borderRadius: "6px", border: "1px solid #222", background: "#080808" }}>
                            {corridorPoints.map((pt, i) => (
                              <div
                                key={`${i}-${pt[0]}-${pt[1]}`}
                                onMouseEnter={() => setHighlightedPoint(i)}
                                onMouseLeave={() => setHighlightedPoint(null)}
                                onClick={() => {
                                  const map = mapInstanceRef.current;
                                  if (map) map.flyTo({ center: pt, zoom: 17, duration: 500 });
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  padding: "5px 8px", cursor: "pointer",
                                  background: highlightedPoint === i ? "rgba(245,158,11,0.12)" : "transparent",
                                  borderBottom: "1px solid #191919",
                                  transition: "background 0.1s",
                                }}
                              >
                                <span style={{ fontSize: "9px", fontWeight: 700, color: highlightedPoint === i ? "#f59e0b" : "#ef4444", width: 18, textAlign: "right", fontFamily: "monospace", flexShrink: 0 }}>{i + 1}</span>
                                <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace", flex: 1 }}>{pt[1]}, {pt[0]}</span>
                                <button onClick={(e) => { e.stopPropagation(); setCorridorPoints(prev => prev.filter((_, idx) => idx !== i)); }} style={{ background: "none", border: "none", color: "#555", fontSize: "11px", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }} title="Delete">✕</button>
                              </div>
                            ))}
                            {corridorPoints.length === 0 && (
                              <div style={{ padding: "12px", textAlign: "center", fontSize: "11px", color: "#444" }}>No points — click the map to start</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ padding: "8px", borderTop: "1px solid #222", flexShrink: 0 }}>
            <button onClick={generateOutput} style={{
              width: "100%", padding: "12px", borderRadius: "8px",
              background: "#3B82F6", border: "none", color: "#fff",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
            }}>
              Generate Code
            </button>
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />

          {/* Mouse coordinates */}
          {mouseCoord && (
            <div style={{
              position: "absolute", bottom: 12, left: 12, zIndex: 5,
              background: "rgba(0,0,0,0.75)", padding: "6px 10px", borderRadius: "6px",
              fontSize: "11px", fontFamily: "monospace", color: "#aaa",
              backdropFilter: "blur(8px)",
            }}>
              {mouseCoord.lat}, {mouseCoord.lng}
            </div>
          )}

          {/* Map style toggle */}
          <button onClick={toggleMapStyle} style={{
            position: "absolute", bottom: 12, right: 12, zIndex: 5,
            background: "rgba(0,0,0,0.75)", border: "1px solid #444",
            padding: "6px 12px", borderRadius: "6px",
            fontSize: "11px", fontWeight: 600, color: "#ccc", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}>
            {mapStyle === "satellite" ? "🗺️ Streets" : "🛰️ Satellite"}
          </button>

          {/* Corridor stats when editing */}
          {editingCorridor !== null && corridorPoints.length >= 2 && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 5,
              background: "rgba(0,0,0,0.75)", padding: "6px 14px", borderRadius: "20px",
              fontSize: "12px", fontWeight: 600, color: "#fff", fontFamily: "monospace",
              backdropFilter: "blur(8px)", display: "flex", gap: "12px",
            }}>
              <span>{corridorPoints.length} pts</span>
              <span style={{ color: "#22c55e" }}>{currentLength.toFixed(2)} km</span>
            </div>
          )}

          {/* Editing indicator */}
          {(editingZone !== null || editingCorridor !== null) && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(239,68,68,0.9)", padding: "8px 16px", borderRadius: "20px",
              fontSize: "12px", fontWeight: 600, zIndex: 5,
            }}>
              {editingZone !== null
                ? `Click map to set ${zones.find(z => z.id === editingZone)?.name} position`
                : `Editing ${corridors.find(c => c.id === editingCorridor)?.name}`
              }
            </div>
          )}
        </div>
      </div>

      {/* Output panel */}
      {output && (
        <div style={{ maxHeight: "30vh", borderTop: "1px solid #222", overflow: "auto", background: "#080808" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", gap: "10px", borderBottom: "1px solid #222" }}>
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 600 }}>Generated Code</span>
            <div style={{ flex: 1 }} />
            <button onClick={handleCopy} style={{ padding: "4px 12px", borderRadius: "6px", background: copied ? "#22c55e" : "#333", border: "none", color: "#fff", fontSize: "11px", fontWeight: 600 }}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => setOutput("")} style={{ padding: "4px 8px", borderRadius: "6px", background: "#333", border: "none", color: "#888", fontSize: "11px" }}>✕</button>
          </div>
          <pre style={{ padding: "12px 16px", fontSize: "11px", color: "#aaa", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{output}</pre>
        </div>
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
