"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ZONES, SEVERITY } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function HeatmapView({ onBack, onLogoClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
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
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const mapboxgl = require("mapbox-gl");
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const filtered = getFilteredData();
    const zoneCounts = {};
    filtered.forEach((r) => { zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1; });
    const maxCount = Math.max(...Object.values(zoneCounts), 1);

    ZONES.forEach((zone) => {
      const count = zoneCounts[zone.id] || 0;
      if (count === 0) return;
      const intensity = count / maxCount;
      const outerSize = 40 + intensity * 80;
      const innerSize = 24 + intensity * 16;
      const color = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f59e0b" : "#60a5fa";
      const el = document.createElement("div");
      el.style.cssText = `position:relative;width:${outerSize}px;height:${outerSize}px;pointer-events:none;`;
      const glow = document.createElement("div");
      glow.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};opacity:${0.12 + intensity * 0.15};filter:blur(8px);`;
      el.appendChild(glow);
      const inner = document.createElement("div");
      inner.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${innerSize}px;height:${innerSize}px;border-radius:50%;background:${color};opacity:${0.35 + intensity * 0.35};border:1px solid ${color}80;`;
      el.appendChild(inner);
      const dot = document.createElement("div");
      dot.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#fff;opacity:0.9;border:2px solid ${color};pointer-events:auto;cursor:pointer;`;
      el.appendChild(dot);
      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, closeOnClick: false, className: "arroyo-mapbox-popup", maxWidth: "200px" })
        .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;"><b>${zone.name}</b><br/><span style="opacity:0.6">${zone.area}</span><br/>${count} ${es ? "reportes" : "reports"}</div>`);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([zone.lng, zone.lat]).setPopup(popup).addTo(map);
      dot.addEventListener("mouseenter", () => marker.togglePopup());
      dot.addEventListener("mouseleave", () => marker.getPopup().remove());
      markersRef.current.push(marker);
    });
  }, [historyData, timeRange, getFilteredData, es]);

  const timeRanges = [{ key: "24h", label: "24h" }, { key: "7d", label: es ? "7 días" : "7 days" }, { key: "30d", label: es ? "30 días" : "30 days" }, { key: "all", label: es ? "Todo" : "All" }];
  const filtered = getFilteredData();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgH)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>🔥 {es ? "Historial" : "History"}</span>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{es ? "← Volver" : "← Back"}</button>
      </div>
      <div style={{ padding: "10px 16px", display: "flex", gap: "6px", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {timeRanges.map((tr) => (<button key={tr.key} onClick={() => setTimeRange(tr.key)} style={{ padding: "5px 12px", borderRadius: "16px", background: timeRange === tr.key ? "var(--accent-glow)" : "rgba(255,255,255,0.03)", border: `1px solid ${timeRange === tr.key ? "rgba(96,165,250,0.3)" : "var(--border)"}`, color: timeRange === tr.key ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600 }}>{tr.label}</button>))}
        <span style={{ flex: 1 }} /><span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{filtered.length} {es ? "reportes" : "reports"}</span>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#070b14", touchAction: "none" }} />
        {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,13,24,0.7)", zIndex: 5 }}><span style={{ fontSize: "14px", color: "var(--text-dim)" }}>{es ? "Cargando historial..." : "Loading history..."}</span></div>}
        {stats && !loading && (
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 900, background: "rgba(8,13,24,0.92)", backdropFilter: "blur(12px)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "16px", maxHeight: "40vh", overflowY: "auto" }}>
            <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>{es ? "Estadísticas" : "Statistics"}</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{stats.totalReports}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>Total</div></div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--danger)" }}>{stats.sevCounts.danger}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Peligro" : "Danger"}</div></div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--caution)" }}>{stats.sevCounts.caution}</div><div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Precaución" : "Caution"}</div></div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>⏰ {es ? "Hora pico" : "Peak hour"}: <span style={{ fontWeight: 700, color: "var(--text)" }}>{stats.peakHour}:00 - {stats.peakHour + 1}:00</span></div>
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
