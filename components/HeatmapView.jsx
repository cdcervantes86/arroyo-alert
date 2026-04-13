"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ZONES, SEVERITY } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function HeatmapView({ onBack, onLogoClick, onToggleLang }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const initRef = useRef(false);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [stats, setStats] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("reports").select("zone_id, severity, created_at").order("created_at", { ascending: false }).limit(2000);
      if (!error && data) {
        setHistoryData(data);
        const zoneCounts = {}, hourCounts = Array(24).fill(0), sevCounts = { danger: 0, caution: 0, safe: 0 };
        data.forEach((r) => { zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1; hourCounts[new Date(r.created_at).getHours()]++; sevCounts[r.severity] = (sevCounts[r.severity] || 0) + 1; });
        const topZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => { const zone = ZONES.find((z) => z.id === parseInt(id)); return { name: zone?.name || `Zone ${id}`, area: zone?.area || "", count }; });
        setStats({ totalReports: data.length, topZones, peakHour: hourCounts.indexOf(Math.max(...hourCounts)), hourCounts, sevCounts });
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const getFilteredData = useCallback(() => {
    if (timeRange === "all") return historyData;
    const ms = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    return historyData.filter((r) => new Date(r.created_at).getTime() > Date.now() - (ms[timeRange] || 0));
  }, [historyData, timeRange]);

  useEffect(() => {
    if (initRef.current || !mapRef.current || !MAPBOX_TOKEN) return;
    initRef.current = true;
    const mapboxgl = require("mapbox-gl");
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapRef.current, style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.805, 10.96], zoom: 12.5,
      attributionControl: false, pitchWithRotate: false, dragRotate: false,
      antialias: false, fadeDuration: 0, failIfMajorPerformanceCaveat: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      try {
        map.setPaintProperty("water", "fill-color", "#080e1c");
        try { map.setPaintProperty("land", "background-color", "#0c1322"); } catch(e) {}
        try { map.setPaintProperty("building", "fill-color", "rgba(255,255,255,0.02)"); } catch(e) {}
        const roadLayers = map.getStyle().layers.filter(l => l.id.includes("road") && l.type === "line");
        roadLayers.forEach(l => { try { map.setPaintProperty(l.id, "line-color", l.id.includes("major") || l.id.includes("trunk") || l.id.includes("primary") ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"); } catch(e) {} });
        const labelLayers = map.getStyle().layers.filter(l => l.type === "symbol" && l.id.includes("label"));
        labelLayers.forEach(l => { try { map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.25)"); map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.95)"); } catch(e) {} });
      } catch(e) {}
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const updateLayers = () => {
      ["heatmap-glow", "heatmap-inner", "heatmap-dot", "heatmap-count"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("heatmap-zones")) map.removeSource("heatmap-zones");

      const filtered = getFilteredData();
      const zoneCounts = {};
      filtered.forEach((r) => { zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1; });
      const maxCount = Math.max(...Object.values(zoneCounts), 1);

      const features = ZONES.filter(z => zoneCounts[z.id] > 0).map(zone => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [zone.lng, zone.lat] },
        properties: { count: zoneCounts[zone.id], intensity: zoneCounts[zone.id] / maxCount, name: zone.name, area: zone.area },
      }));

      map.addSource("heatmap-zones", { type: "geojson", data: { type: "FeatureCollection", features } });

      map.addLayer({
        id: "heatmap-glow", type: "circle", source: "heatmap-zones",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "intensity"], 0, 20, 0.5, 30, 1, 45],
          "circle-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.12)", 0.4, "rgba(245,158,11,0.15)", 0.7, "rgba(239,68,68,0.18)"],
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "heatmap-inner", type: "circle", source: "heatmap-zones",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "intensity"], 0, 10, 0.5, 14, 1, 20],
          "circle-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.4)", 0.4, "rgba(245,158,11,0.5)", 0.7, "rgba(239,68,68,0.6)"],
          "circle-stroke-width": 1,
          "circle-stroke-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.3)", 0.4, "rgba(245,158,11,0.4)", 0.7, "rgba(239,68,68,0.5)"],
        },
      });

      map.addLayer({
        id: "heatmap-dot", type: "circle", source: "heatmap-zones",
        paint: {
          "circle-radius": 5, "circle-color": "#ffffff", "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "#60a5fa", 0.4, "#f59e0b", 0.7, "#ef4444"],
        },
      });

      map.addLayer({
        id: "heatmap-count", type: "symbol", source: "heatmap-zones",
        layout: { "text-field": ["get", "count"], "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-offset": [0, -2], "text-allow-overlap": true },
        paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.7)", "text-halo-width": 1.5 },
      });
    };

    // Register click/hover handlers only once
    if (!map._heatmapHandlersAdded) {
      map._heatmapHandlersAdded = true;
      map.on("click", "heatmap-dot", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        const mapboxgl = require("mapbox-gl");
        new mapboxgl.Popup({ offset: 15, closeButton: false, className: "arroyo-mapbox-popup", maxWidth: "200px" })
          .setLngLat(coords)
          .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;"><b>${props.name}</b><br/><span style="opacity:0.5">${props.area}</span><br/>${props.count} ${es ? "reportes" : "reports"}</div>`)
          .addTo(map);
      });
      map.on("mouseenter", "heatmap-dot", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "heatmap-dot", () => { map.getCanvas().style.cursor = ""; });
    }

    if (map.isStyleLoaded()) updateLayers();
    else map.on("load", updateLayers);
  }, [historyData, timeRange, getFilteredData, es]);

  const timeRanges = [{ key: "24h", label: "24h" }, { key: "7d", label: es ? "7 días" : "7 days" }, { key: "30d", label: es ? "30 días" : "30 days" }, { key: "all", label: es ? "Todo" : "All" }];
  const filtered = getFilteredData();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0f1a", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={onBack} className="tap-target" style={{ background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)" }}>{es ? "Historial" : "History"}</span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{filtered.length} {es ? "reportes" : "reports"}</span>
        {onToggleLang && <button onClick={onToggleLang} className="tap-target" style={{ padding: "5px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-dim)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.3px" }}>{es ? "EN" : "ES"}</button>}
      </div>

      {/* Time range filter */}
      <div style={{ padding: "10px 16px", display: "flex", gap: "6px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, background: "#0a0f1a" }}>
        {timeRanges.map((tr) => (
          <button key={tr.key} onClick={() => setTimeRange(tr.key)} className="tap-target" style={{
            padding: "6px 14px", borderRadius: "20px",
            background: timeRange === tr.key ? "rgba(91,156,246,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${timeRange === tr.key ? "rgba(91,156,246,0.25)" : "rgba(255,255,255,0.06)"}`,
            color: timeRange === tr.key ? "var(--accent)" : "var(--text-dim)",
            fontSize: "12px", fontWeight: timeRange === tr.key ? 700 : 500,
            transition: "all 0.2s ease",
          }}>
            {tr.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#070b14", touchAction: "none" }} />

        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,11,20,0.8)", zIndex: 5 }}>
            <span style={{ fontSize: "14px", color: "var(--text-dim)", animation: "blink 1s ease infinite" }}>{es ? "Cargando historial..." : "Loading history..."}</span>
          </div>
        )}

        {/* Stats panel — collapsible */}
        {stats && !loading && (
          <div style={{
            position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 900,
            background: "#0e1628", borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
            overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)",
            maxHeight: panelOpen ? "45vh" : "56px",
          }}>
            {/* Panel header — always visible, tappable to collapse */}
            <button onClick={() => setPanelOpen(!panelOpen)} style={{
              width: "100%", padding: "16px 18px", background: "none", border: "none",
              display: "flex", alignItems: "center", gap: "10px", textAlign: "left",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
              <span style={{ flex: 1, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{es ? "Estadísticas" : "Statistics"}</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{stats.totalReports}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>

            {/* Panel content — scrollable */}
            <div style={{ padding: "0 18px 18px", overflowY: "auto", maxHeight: "calc(45vh - 56px)", opacity: panelOpen ? 1 : 0, transition: "opacity 0.2s ease" }}>
              {/* Severity breakdown */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {[
                  { label: es ? "Peligro" : "Danger", value: stats.sevCounts.danger, color: "var(--danger)" },
                  { label: es ? "Precaución" : "Caution", value: stats.sevCounts.caution, color: "var(--caution)" },
                  { label: es ? "Despejado" : "Clear", value: stats.sevCounts.safe, color: "var(--safe)" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: "12px 10px", borderRadius: "var(--radius-lg)", background: `${s.color}06`, border: `1px solid ${s.color}15`, textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: "var(--text-faint)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Peak hour */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", marginBottom: "14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{es ? "Hora pico" : "Peak hour"}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginLeft: "auto" }}>{stats.peakHour}:00 - {stats.peakHour + 1}:00</span>
              </div>

              {/* Top zones */}
              <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{es ? "Zonas más afectadas" : "Most affected zones"}</div>
              {stats.topZones.map((z, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < stats.topZones.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: i === 0 ? "rgba(239,68,68,0.08)" : i === 1 ? "rgba(234,179,8,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(239,68,68,0.15)" : i === 1 ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: i === 0 ? "var(--danger)" : i === 1 ? "var(--caution)" : "var(--text-faint)", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{z.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", marginLeft: "6px" }}>{z.area}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: i === 0 ? "var(--danger)" : i === 1 ? "var(--caution)" : "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{z.count}</span>
                </div>
              ))}

              {/* Hour chart */}
              <div style={{ marginTop: "16px", fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{es ? "Actividad por hora" : "Activity by hour"}</div>
              <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: 44, padding: "0 2px" }}>
                {stats.hourCounts.map((count, h) => {
                  const maxH = Math.max(...stats.hourCounts, 1);
                  const isPeak = count === Math.max(...stats.hourCounts);
                  return (
                    <div key={h} title={`${h}:00 — ${count}`} style={{
                      flex: 1, height: Math.max((count / maxH) * 44, 2),
                      borderRadius: "2px 2px 0 0",
                      background: isPeak ? "var(--danger)" : count > maxH * 0.5 ? "var(--caution)" : "rgba(96,165,250,0.35)",
                      opacity: count === 0 ? 0.15 : 1,
                      transition: "height 0.3s ease",
                    }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", padding: "0 2px" }}>
                {["0", "6", "12", "18", "23"].map(l => <span key={l} style={{ fontSize: "8px", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{l}h</span>)}
              </div>
            </div>
          </div>
        )}

        {/* Map controls styling */}
        <style>{`
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
          .mapboxgl-ctrl-group button + button { border-top: 1px solid rgba(255,255,255,0.06) !important; }
          .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon { filter: invert(1) brightness(0.6); }
          .mapboxgl-ctrl-attrib { background: transparent !important; font-size: 8px !important; opacity: 0.3; }
          .mapboxgl-ctrl-attrib a { color: rgba(255,255,255,0.4) !important; }
        `}</style>
      </div>
    </div>
  );
}
