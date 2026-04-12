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
    const map = new mapboxgl.Map({ container: mapRef.current, style: "mapbox://styles/mapbox/dark-v11", center: [-74.805, 10.96], zoom: 12.5, attributionControl: false, pitchWithRotate: false, dragRotate: false });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      // Match main map dark theme
      try { map.setPaintProperty("water", "fill-color", "#080e1c"); } catch(e) {}
      try { map.setPaintProperty("land", "background-color", "#0c1322"); } catch(e) {}
      try { map.setPaintProperty("building", "fill-color", "rgba(255,255,255,0.02)"); } catch(e) {}
      const roadLayers = map.getStyle().layers.filter(l => l.id.includes("road") && l.type === "line");
      roadLayers.forEach(l => { try { map.setPaintProperty(l.id, "line-color", l.id.includes("major") || l.id.includes("trunk") || l.id.includes("primary") ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"); } catch(e) {} });
      const labelLayers = map.getStyle().layers.filter(l => l.type === "symbol" && l.id.includes("label"));
      labelLayers.forEach(l => { try { map.setPaintProperty(l.id, "text-color", "rgba(255,255,255,0.3)"); map.setPaintProperty(l.id, "text-halo-color", "rgba(8,14,28,0.9)"); } catch(e) {} });
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const updateLayers = () => {
      // Remove old layers/source
      ["heatmap-glow", "heatmap-inner", "heatmap-dot", "heatmap-count"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("heatmap-zones")) map.removeSource("heatmap-zones");

      const filtered = getFilteredData();
      const zoneCounts = {};
      filtered.forEach((r) => { zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1; });
      const maxCount = Math.max(...Object.values(zoneCounts), 1);

      const features = ZONES.filter(z => zoneCounts[z.id] > 0).map(zone => {
        const count = zoneCounts[zone.id];
        const intensity = count / maxCount;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [zone.lng, zone.lat] },
          properties: { count, intensity, name: zone.name, area: zone.area },
        };
      });

      map.addSource("heatmap-zones", { type: "geojson", data: { type: "FeatureCollection", features } });

      // Glow layer — large, blurred circle
      map.addLayer({
        id: "heatmap-glow",
        type: "circle",
        source: "heatmap-zones",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "intensity"], 0, 20, 0.5, 30, 1, 45],
          "circle-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.12)", 0.4, "rgba(245,158,11,0.15)", 0.7, "rgba(239,68,68,0.18)"],
          "circle-blur": 1,
        },
      });

      // Inner circle — semi-transparent fill
      map.addLayer({
        id: "heatmap-inner",
        type: "circle",
        source: "heatmap-zones",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "intensity"], 0, 10, 0.5, 14, 1, 20],
          "circle-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.4)", 0.4, "rgba(245,158,11,0.5)", 0.7, "rgba(239,68,68,0.6)"],
          "circle-stroke-width": 1,
          "circle-stroke-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "rgba(96,165,250,0.3)", 0.4, "rgba(245,158,11,0.4)", 0.7, "rgba(239,68,68,0.5)"],
        },
      });

      // Center dot — small, bright
      map.addLayer({
        id: "heatmap-dot",
        type: "circle",
        source: "heatmap-zones",
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["interpolate", ["linear"], ["get", "intensity"], 0, "#60a5fa", 0.4, "#f59e0b", 0.7, "#ef4444"],
        },
      });

      // Count labels
      map.addLayer({
        id: "heatmap-count",
        type: "symbol",
        source: "heatmap-zones",
        layout: {
          "text-field": ["get", "count"],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, -2],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.7)",
          "text-halo-width": 1.5,
        },
      });

      // Click handler for popup
      map.on("click", "heatmap-dot", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        const mapboxgl = require("mapbox-gl");
        new mapboxgl.Popup({ offset: 15, closeButton: false, className: "arroyo-mapbox-popup", maxWidth: "200px" })
          .setLngLat(coords)
          .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;"><b>${props.name}</b><br/><span style="opacity:0.6">${props.area}</span><br/>${props.count} ${es ? "reportes" : "reports"}</div>`)
          .addTo(map);
      });
      map.on("mouseenter", "heatmap-dot", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "heatmap-dot", () => { map.getCanvas().style.cursor = ""; });
    };

    if (map.isStyleLoaded()) updateLayers();
    else map.on("load", updateLayers);
  }, [historyData, timeRange, getFilteredData, es]);

  const timeRanges = [{ key: "24h", label: "24h" }, { key: "7d", label: es ? "7 días" : "7 days" }, { key: "30d", label: es ? "30 días" : "30 days" }, { key: "all", label: es ? "Todo" : "All" }];
  const filtered = getFilteredData();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgH)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{es ? "Historial" : "History"}</span>
        <span style={{ flex: 1 }} />
        {onToggleLang && <button onClick={onToggleLang} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.045)", border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>{es ? "EN" : "ES"}</button>}
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>{es ? "Volver" : "Back"}</button>
      </div>
      <div style={{ padding: "10px 16px", display: "flex", gap: "6px", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {timeRanges.map((tr) => (<button key={tr.key} onClick={() => setTimeRange(tr.key)} style={{ padding: "5px 12px", borderRadius: "16px", background: timeRange === tr.key ? "var(--accent-glow)" : "rgba(255,255,255,0.03)", border: `1px solid ${timeRange === tr.key ? "rgba(96,165,250,0.3)" : "var(--border)"}`, color: timeRange === tr.key ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600 }}>{tr.label}</button>))}
        <span style={{ flex: 1 }} /><span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{filtered.length} {es ? "reportes" : "reports"}</span>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#070b14", touchAction: "none" }} />
        {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,15,26,0.7)", zIndex: 5 }}><span style={{ fontSize: "14px", color: "var(--text-dim)" }}>{es ? "Cargando historial..." : "Loading history..."}</span></div>}
        {stats && !loading && (
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 900, background: "#0e1628", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", maxHeight: "40vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>{es ? "Estadísticas" : "Statistics"}</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{stats.totalReports}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>Total</div></div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--danger)" }}>{stats.sevCounts.danger}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Peligro" : "Danger"}</div></div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--caution)" }}>{stats.sevCounts.caution}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Precaución" : "Caution"}</div></div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{es ? "Hora pico" : "Peak hour"}: <span style={{ fontWeight: 700, color: "var(--text)" }}>{stats.peakHour}:00 - {stats.peakHour + 1}:00</span></div>
            <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{es ? "Zonas más afectadas" : "Most affected zones"}</div>
            {stats.topZones.map((z, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: i < stats.topZones.length - 1 ? "1px solid var(--border)" : "none" }}><span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-faint)", width: 20 }}>#{i + 1}</span><span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", flex: 1 }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>{z.area}</span></span><span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>{z.count}</span></div>))}
            <div style={{ marginTop: "14px", fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{es ? "Actividad por hora" : "Activity by hour"}</div>
            <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: 50 }}>
              {stats.hourCounts.map((count, h) => { const maxH = Math.max(...stats.hourCounts, 1); return (<div key={h} title={`${h}:00 — ${count}`} style={{ flex: 1, height: Math.max((count / maxH) * 50, 2), borderRadius: "2px 2px 0 0", background: count === Math.max(...stats.hourCounts) ? "var(--danger)" : count > maxH * 0.5 ? "var(--caution)" : "rgba(96,165,250,0.4)", cursor: "pointer" }} />); })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>{["0h","6h","12h","18h","23h"].map(l => <span key={l} style={{ fontSize: "9px", color: "var(--text-faint)" }}>{l}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
