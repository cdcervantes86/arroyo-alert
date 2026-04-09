"use client";
import { useEffect, useState } from "react";
import { ZONES, SEVERITY, getSevLabel, translateReportText } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";

export default function LiveFeed({ reports, onZoneClick, onUpvote, upvotedSet, onUpvoteLocal, activeFilter }) {
  const { lang, t } = useLanguage();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const cutoff = Date.now() - 4 * 3600000;
  const recentReports = reports
    .filter((r) => new Date(r.created_at).getTime() > cutoff)
    .filter((r) => !activeFilter || r.severity === activeFilter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (!recentReports.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", color: "var(--text-faint)", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>🌤️</div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "4px" }}>
          {activeFilter ? (lang === "es" ? "Sin reportes de este tipo" : "No reports of this type") : (lang === "es" ? "Sin actividad reciente" : "No recent activity")}
        </div>
        <div style={{ fontSize: "13px" }}>
          {lang === "es" ? "Los reportes aparecerán aquí en tiempo real" : "Reports will appear here in real time"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "12px 14px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", padding: "0 2px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite", flexShrink: 0 }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
          {lang === "es" ? "En vivo" : "Live"} · {recentReports.length} {lang === "es" ? "reportes" : "reports"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {recentReports.map((r, i) => {
          const zone = ZONES.find((z) => z.id === r.zone_id);
          if (!zone) return null;
          const cfg = SEVERITY[r.severity];
          const isUpvoted = upvotedSet?.has(r.id);

          return (
            <div key={r.id} style={{ background: `linear-gradient(135deg, ${cfg.bg}, var(--bg))`, border: `1px solid ${cfg.color}15`, borderRadius: "var(--radius-md)", padding: "14px", animation: `fadeIn 0.3s ease ${i * 0.04}s both`, cursor: "pointer" }} onClick={() => onZoneClick?.(zone.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px" }}>{cfg.emoji}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{zone.name}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 400 }}>{zone.area}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{timeAgoLocalized(r.created_at, lang)}</span>
              </div>
              <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", background: `${cfg.color}15`, color: cfg.color, fontSize: "11px", fontWeight: 600, marginBottom: "8px" }}>
                {getSevLabel(r.severity, lang)}
              </div>
              <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                {translateReportText(r.text, lang)}
              </p>
              <button onClick={(e) => { e.stopPropagation(); if (!isUpvoted) { onUpvote?.(r.id, r.upvotes); onUpvoteLocal?.(r.id); if (navigator.vibrate) navigator.vibrate(50); } }} style={{ background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.03)", border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "5px 10px", color: isUpvoted ? "var(--accent)" : "var(--text-dim)", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, cursor: "pointer" }}>
                👍 {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
