"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { ZONES, SEVERITY } from "@/lib/zones";

export default function WeeklyDigest({ onClose, onZoneClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeekly() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const { data: reports, error } = await supabase
        .from("reports")
        .select("*")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false });

      if (error || !reports) { setLoading(false); return; }

      // Compute stats
      const totalReports = reports.length;
      const dangerCount = reports.filter(r => r.severity === "danger").length;
      const cautionCount = reports.filter(r => r.severity === "caution").length;
      const safeCount = reports.filter(r => r.severity === "safe").length;
      const totalUpvotes = reports.reduce((s, r) => s + (r.upvotes || 0), 0);
      const uniqueReporters = new Set(reports.map(r => r.device_id).filter(Boolean)).size;

      // Most active zone
      const zoneCounts = {};
      reports.forEach(r => { zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1; });
      const topZoneId = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topZone = ZONES.find(z => z.id === Number(topZoneId));

      // Reports by day
      const dayNames = es
        ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      reports.forEach(r => {
        const day = new Date(r.created_at).getDay();
        dayCounts[day]++;
      });
      const maxDay = Math.max(...dayCounts, 1);

      setData({
        totalReports, dangerCount, cautionCount, safeCount,
        totalUpvotes, uniqueReporters,
        topZone, topZoneCount: zoneCounts[topZoneId] || 0,
        dayCounts, dayNames, maxDay,
      });
      setLoading(false);
    }
    fetchWeekly();
  }, [es]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Persistent backdrop — never re-mounts */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", animation: "fadeIn 0.2s ease" }} />

      {loading ? (
        <div style={{ position: "relative", zIndex: 1, color: "var(--text-dim)", fontSize: "14px", animation: "blink 1s ease infinite" }}>
          {es ? "Cargando resumen..." : "Loading digest..."}
        </div>
      ) : !data || data.totalReports === 0 ? (
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", animation: "fadeIn 0.2s ease" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px", opacity: 0.5 }}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>{es ? "Sin actividad esta semana" : "No activity this week"}</h3>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "24px" }}>
            {es ? "No se han registrado reportes en los últimos 7 días" : "No reports recorded in the last 7 days"}
          </p>
          <button onClick={onClose} style={{ padding: "12px 32px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600 }}>
            {es ? "Cerrar" : "Close"}
          </button>
        </div>
      ) : (
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, background: "#0e1628", borderRadius: "var(--radius-xl)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", animation: "modalScaleIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", willChange: "transform, opacity" }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", background: "linear-gradient(135deg, rgba(91,156,246,0.06), rgba(34,197,94,0.04))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
              {es ? "Resumen semanal" : "Weekly digest"}
            </span>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg></button>
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.3px", margin: "8px 0 0" }}>
            {data.totalReports} {es ? "reportes" : "reports"}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: "4px 0 0" }}>
            {es ? "Últimos 7 días" : "Last 7 days"} · {data.uniqueReporters} {es ? "reporteros" : "reporters"}
          </p>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Severity breakdown */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[
              { count: data.dangerCount, label: es ? "Peligro" : "Danger", color: "var(--danger)" },
              { count: data.cautionCount, label: es ? "Precaución" : "Caution", color: "var(--caution)" },
              { count: data.safeCount, label: es ? "Despejado" : "Clear", color: "var(--safe)" },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: "12px 8px", borderRadius: "var(--radius-sm)",
                background: `${s.color}08`, border: `1px solid ${s.color}15`,
                textAlign: "center",
              }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.count}</div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: 500, marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "10px" }}>
            {es ? "Actividad por día" : "Activity by day"}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: 60, marginBottom: "20px" }}>
            {data.dayCounts.map((count, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 2px 2px",
                  height: Math.max(4, (count / data.maxDay) * 48),
                  background: count > 0 ? "var(--accent)" : "rgba(255,255,255,0.04)",
                  opacity: count > 0 ? 0.7 : 1,
                  transition: "height 0.5s ease",
                }} />
                <span style={{ fontSize: "9px", color: "var(--text-faint)", fontWeight: 500 }}>{data.dayNames[i]}</span>
              </div>
            ))}
          </div>

          {/* Top zone */}
          {data.topZone && (
            <>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "10px" }}>
                {es ? "Zona más activa" : "Most active zone"}
              </div>
              <button onClick={() => { onClose(); setTimeout(() => onZoneClick(data.topZone.id), 200); }} style={{
                width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
                marginBottom: "16px",
              }}>
                <span style={{ fontSize: "24px" }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{data.topZone.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>{data.topZone.area} · {data.topZoneCount} {es ? "reportes" : "reports"}</div>
                </div>
                <span style={{ color: "var(--text-faint)", fontSize: "14px" }}>›</span>
              </button>
            </>
          )}

          {/* Upvotes */}
          <div style={{
            padding: "14px 16px", borderRadius: "var(--radius-md)",
            background: "rgba(245,208,51,0.04)", border: "1px solid rgba(245,208,51,0.1)",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--baq-yellow)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
            <div>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--baq-yellow)" }}>{data.totalUpvotes}</span>
              <span style={{ fontSize: "13px", color: "var(--text-dim)", marginLeft: "6px" }}>
                {es ? "confirmaciones esta semana" : "confirmations this week"}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
