"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ZONES, SEVERITY } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

export default function HeatmapView({ onBack, onLogoClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // "24h", "7d", "30d", "all"
  const [stats, setStats] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);

  // Fetch all historical reports
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select("zone_id, severity, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (!error && data) {
        setHistoryData(data);

        // Compute stats
        const zoneCounts = {};
        const hourCounts = Array(24).fill(0);
        const sevCounts = { danger: 0, caution: 0, safe: 0 };

        data.forEach((r) => {
          zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1;
          const hour = new Date(r.created_at).getHours();
          hourCounts[hour]++;
          sevCounts[r.severity] = (sevCounts[r.severity] || 0) + 1;
        });

        const topZones = Object.entries(zoneCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => {
            const zone = ZONES.find((z) => z.id === parseInt(id));
            return { name: zone?.name || `Zone ${id}`, area: zone?.area || "", count };
          });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

        setStats({ totalReports: data.length, topZones, peakHour, hourCounts, sevCounts });
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  // Filter data by time range
  const getFilteredData = useCallback(() => {
    if (timeRange === "all") return historyData;
    const ms = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    const cutoff = Date.now() - (ms[timeRange] || 0);
    return historyData.filter((r) => new Date(r.created_at).getTime() > cutoff);
  }, [historyData, timeRange]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" });

    const map = L.map(mapRef.current, {
      center: [10.96, -74.805], zoom: 13, zoomControl: false, attributionControl: false,
      tap: false, dragging: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Update heatmap when data/filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");

    // Remove old layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const filtered = getFilteredData();

    // Count reports per zone
    const zoneCounts = {};
    filtered.forEach((r) => {
      zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(zoneCounts), 1);

    // Create circle markers as heatmap (since leaflet.heat requires extra dep)
    const heatGroup = L.layerGroup();

    ZONES.forEach((zone) => {
      const count = zoneCounts[zone.id] || 0;
      if (count === 0) return;

      const intensity = count / maxCount;
      const radius = 20 + intensity * 60;
      const color = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f59e0b" : "#60a5fa";

      // Glow circle
      L.circleMarker([zone.lat, zone.lng], {
        radius: radius,
        fillColor: color,
        fillOpacity: 0.15 + intensity * 0.2,
        stroke: false,
        interactive: false,
      }).addTo(heatGroup);

      // Inner circle
      L.circleMarker([zone.lat, zone.lng], {
        radius: 12 + intensity * 8,
        fillColor: color,
        fillOpacity: 0.4 + intensity * 0.3,
        color: color,
        weight: 1,
        opacity: 0.5,
        interactive: false,
      }).addTo(heatGroup);

      // Label
      const tooltipContent =
        `<b>${zone.name}</b><br/>` +
        `<span style="opacity:0.6">${zone.area}</span><br/>` +
        `${count} ${es ? "reportes" : "reports"}`;

      L.circleMarker([zone.lat, zone.lng], {
        radius: 6,
        fillColor: "#fff",
        fillOpacity: 0.9,
        color: color,
        weight: 2,
      }).bindTooltip(tooltipContent, {
        className: "arroyo-tooltip",
        direction: "top",
        offset: [0, -10],
      }).addTo(heatGroup);
    });

    heatGroup.addTo(map);
    heatLayerRef.current = heatGroup;
  }, [historyData, timeRange, getFilteredData, es]);

  const timeRanges = [
    { key: "24h", label: "24h" },
    { key: "7d", label: es ? "7 días" : "7 days" },
    { key: "30d", label: es ? "30 días" : "30 days" },
    { key: "all", label: es ? "Todo" : "All" },
  ];

  const filtered = getFilteredData();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5, flexShrink: 0 }}>
            <defs><linearGradient id="lBgH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
            <rect width="512" height="512" rx="112" fill="url(#lBgH)" />
            <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
            <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
            <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>
          🔥 {es ? "Historial" : "History"}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>
          {es ? "← Volver" : "← Back"}
        </button>
      </div>

      {/* Time range filter */}
      <div style={{ padding: "10px 16px", display: "flex", gap: "6px", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {timeRanges.map((tr) => (
          <button key={tr.key} onClick={() => setTimeRange(tr.key)} style={{
            padding: "5px 12px", borderRadius: "16px",
            background: timeRange === tr.key ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${timeRange === tr.key ? "rgba(96,165,250,0.3)" : "var(--border)"}`,
            color: timeRange === tr.key ? "var(--accent)" : "var(--text-dim)",
            fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease",
          }}>
            {tr.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>
          {filtered.length} {es ? "reportes" : "reports"}
        </span>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "var(--bg)", touchAction: "none" }} />

        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,13,24,0.7)", zIndex: 800 }}>
            <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>{es ? "Cargando historial..." : "Loading history..."}</span>
          </div>
        )}

        {/* Stats toggle button */}
        {stats && !loading && !statsOpen && (
          <button onClick={() => setStatsOpen(true)} style={{
            position: "absolute", bottom: 16, left: 16, zIndex: 5,
            padding: "10px 16px", borderRadius: "var(--radius-md)",
            background: "rgba(8,13,24,0.92)", backdropFilter: "blur(12px)",
            border: "1px solid var(--border)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}>
            <span style={{ fontSize: "14px" }}>📊</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {stats.totalReports} {es ? "reportes" : "reports"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>›</span>
          </button>
        )}

        {/* Stats panel — collapsible */}
        {stats && !loading && statsOpen && (
          <div style={{
            position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 900,
            background: "rgba(8,13,24,0.92)", backdropFilter: "blur(12px)",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
            padding: "16px", maxHeight: "40vh", overflowY: "auto",
            animation: "slideUp 0.25s ease",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, flex: 1 }}>
                {es ? "Estadísticas" : "Statistics"}
              </div>
              <button onClick={() => setStatsOpen(false)} style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "none",
                color: "var(--text-dim)", fontSize: "14px",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>✕</button>
            </div>

            {/* Quick stats row */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{stats.totalReports}</div>
                <div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Total" : "Total"}</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--danger)" }}>{stats.sevCounts.danger}</div>
                <div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Peligro" : "Danger"}</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--caution)" }}>{stats.sevCounts.caution}</div>
                <div style={{ fontSize: "10px", color: "var(--text-faint)" }}>{es ? "Precaución" : "Caution"}</div>
              </div>
            </div>

            {/* Peak hour */}
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              ⏰ {es ? "Hora pico" : "Peak hour"}: <span style={{ fontWeight: 700, color: "var(--text)" }}>{stats.peakHour}:00 - {stats.peakHour + 1}:00</span>
            </div>

            {/* Top zones */}
            <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>
              {es ? "Zonas más afectadas" : "Most affected zones"}
            </div>
            {stats.topZones.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: i < stats.topZones.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-faint)", width: 20 }}>#{i + 1}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", flex: 1 }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>{z.area}</span></span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>{z.count}</span>
              </div>
            ))}

            {/* Hour chart */}
            <div style={{ marginTop: "14px", fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>
              {es ? "Actividad por hora" : "Activity by hour"}
            </div>
            <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: 50 }}>
              {stats.hourCounts.map((count, h) => {
                const maxH = Math.max(...stats.hourCounts, 1);
                const height = (count / maxH) * 50;
                return (
                  <div key={h} title={`${h}:00 — ${count}`} style={{
                    flex: 1, height: Math.max(height, 2), borderRadius: "2px 2px 0 0",
                    background: count === Math.max(...stats.hourCounts) ? "var(--danger)" :
                      count > maxH * 0.5 ? "var(--caution)" : "rgba(96,165,250,0.4)",
                    transition: "height 0.3s ease",
                    cursor: "pointer",
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "9px", color: "var(--text-faint)" }}>0h</span>
              <span style={{ fontSize: "9px", color: "var(--text-faint)" }}>6h</span>
              <span style={{ fontSize: "9px", color: "var(--text-faint)" }}>12h</span>
              <span style={{ fontSize: "9px", color: "var(--text-faint)" }}>18h</span>
              <span style={{ fontSize: "9px", color: "var(--text-faint)" }}>23h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
