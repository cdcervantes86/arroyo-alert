"use client";
import { useState, useEffect, useRef } from "react";
import { ZONES } from "@/lib/zones";
import { ARROYO_CORRIDORS } from "@/lib/arroyoCorridors";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function CoordEditor() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lineMarkersRef = useRef([]);
  const initRef = useRef(false);

  const [mode, setMode] = useState("zones"); // "zones" or "corridors"
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

  // Init map
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

    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  // Handle map clicks
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
        setCorridorPoints(prev => [...prev, [Math.round(lng * 10000) / 10000, Math.round(lat * 10000) / 10000]]);
      }
    };

    map.on("click", handler);
    return () => map.off("click", handler);
  }, [mode, editingZone, editingCorridor]);

  // Render zone markers
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

  // Render corridor lines + editing points
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const mapboxgl = require("mapbox-gl");

    lineMarkersRef.current.forEach(m => m.remove());
    lineMarkersRef.current = [];

    // Remove old line layers
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

          // Point markers for editing — draggable + midpoint inserts
          if (isEditing) {
            coords.forEach((coord, i) => {
              // === Main point marker (draggable) ===
              const el = document.createElement("div");
              el.style.cssText = `
                width: 14px; height: 14px; border-radius: 50%;
                background: #ef4444; border: 2px solid #fff; cursor: grab;
                box-shadow: 0 0 6px rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center;
                font-size: 8px; font-weight: 700; color: #fff; font-family: monospace;
              `;
              el.textContent = i + 1;
              el.title = `Point ${i + 1} — drag to move, right-click to delete`;

              const m = new mapboxgl.Marker({ element: el, anchor: "center", draggable: true })
                .setLngLat(coord)
                .addTo(map);

              // On drag end, update the point's coordinates
              m.on("dragend", () => {
                const lngLat = m.getLngLat();
                const newCoord = [Math.round(lngLat.lng * 10000) / 10000, Math.round(lngLat.lat * 10000) / 10000];
                setCorridorPoints(prev => prev.map((p, idx) => idx === i ? newCoord : p));
              });

              // Right-click to delete point
              el.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                setCorridorPoints(prev => prev.filter((_, idx) => idx !== i));
              });

              lineMarkersRef.current.push(m);

              // === Midpoint marker (insert point between i and i+1) ===
              if (i < coords.length - 1) {
                const next = coords[i + 1];
                const midLng = (coord[0] + next[0]) / 2;
                const midLat = (coord[1] + next[1]) / 2;

                const midEl = document.createElement("div");
                midEl.style.cssText = `
                  width: 10px; height: 10px; border-radius: 50%;
                  background: rgba(59,130,246,0.5); border: 2px solid rgba(255,255,255,0.6);
                  cursor: pointer; transition: all 0.15s ease;
                `;
                midEl.title = "Drag to insert a point here";
                midEl.addEventListener("mouseenter", () => {
                  midEl.style.background = "#3B82F6";
                  midEl.style.transform = "scale(1.3)";
                  midEl.style.borderColor = "#fff";
                });
                midEl.addEventListener("mouseleave", () => {
                  midEl.style.background = "rgba(59,130,246,0.5)";
                  midEl.style.transform = "scale(1)";
                  midEl.style.borderColor = "rgba(255,255,255,0.6)";
                });

                const midM = new mapboxgl.Marker({ element: midEl, anchor: "center", draggable: true })
                  .setLngLat([midLng, midLat])
                  .addTo(map);

                // On drag end, insert a new point between i and i+1
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
  }, [corridors, mode, editingCorridor, corridorPoints]);

  // Save corridor points
  const saveCorridor = () => {
    if (editingCorridor !== null && corridorPoints.length >= 2) {
      setCorridors(prev => prev.map(c =>
        c.id === editingCorridor ? { ...c, coords: corridorPoints } : c
      ));
    }
    setEditingCorridor(null);
    setCorridorPoints([]);
  };

  // Generate output code
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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #222", flexShrink: 0 }}>
        <h1 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>📍 Coordinate Editor</h1>
        <div style={{ flex: 1 }} />
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
        <div style={{ width: 280, borderRight: "1px solid #222", overflowY: "auto", flexShrink: 0, padding: "8px" }}>
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
              <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 8px 4px", fontWeight: 600 }}>
                Click map to add · Drag points to move · Right-click to delete
              </div>
              {corridors.map(c => (
                <div key={c.id} style={{ marginBottom: "4px" }}>
                  <button onClick={() => {
                    if (editingCorridor === c.id) {
                      saveCorridor();
                    } else {
                      saveCorridor();
                      setEditingCorridor(c.id);
                      setCorridorPoints([...c.coords]);
                    }
                  }} style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px", border: "none",
                    background: editingCorridor === c.id ? "rgba(239,68,68,0.15)" : "#111",
                    textAlign: "left", cursor: "pointer", color: "#fff",
                    outline: editingCorridor === c.id ? "2px solid #ef4444" : "1px solid #222",
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.name} <span style={{ fontWeight: 400, color: "#888" }}>({c.area})</span></div>
                    <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{c.coords.length} points</div>
                  </button>
                  {editingCorridor === c.id && (
                    <div style={{ padding: "6px 8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => setCorridorPoints([])} style={{ padding: "4px 10px", borderRadius: "6px", background: "#333", border: "none", color: "#fff", fontSize: "11px" }}>
                        Clear
                      </button>
                      <button onClick={() => setCorridorPoints(prev => prev.slice(0, -1))} style={{ padding: "4px 10px", borderRadius: "6px", background: "#333", border: "none", color: "#fff", fontSize: "11px" }}>
                        Undo
                      </button>
                      <button onClick={saveCorridor} style={{ padding: "4px 10px", borderRadius: "6px", background: "#22c55e", border: "none", color: "#fff", fontSize: "11px", fontWeight: 600 }}>
                        Save
                      </button>
                      <div style={{ width: "100%", fontSize: "10px", color: "#888" }}>{corridorPoints.length} points placed</div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Generate button */}
          <div style={{ padding: "8px", borderTop: "1px solid #222", marginTop: "8px" }}>
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

          {/* Editing indicator */}
          {(editingZone !== null || editingCorridor !== null) && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(239,68,68,0.9)", padding: "8px 16px", borderRadius: "20px",
              fontSize: "12px", fontWeight: 600, zIndex: 5, animation: "blink 1.5s ease infinite",
            }}>
              {editingZone !== null
                ? `Click map to set ${zones.find(z => z.id === editingZone)?.name} position`
                : `Editing ${corridors.find(c => c.id === editingCorridor)?.name} — click to add · drag to move · blue dots to insert`
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
    </div>
  );
}
