"use client";
import { useEffect, useState } from "react";
import { ZONES, SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ShareCard from "./ShareCard";

function VerifiedBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(96,165,250,0.15)" }}>
      ✓
    </span>
  );
}

function EmptyIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.3 }}>
      <path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="40" r="3" fill="var(--accent)" />
    </svg>
  );
}

export default function LiveFeed({ reports, onZoneClick, onUpvote, upvotedSet, onUpvoteLocal, activeFilter }) {
  const { lang, t } = useLanguage();
  const [, forceUpdate] = useState(0);
  const [shareData, setShareData] = useState(null);

  useEffect(() => { const i = setInterval(() => forceUpdate((n) => n + 1), 30000); return () => clearInterval(i); }, []);

  const cutoff = Date.now() - 4 * 3600000;
  const recentReports = reports
    .filter((r) => new Date(r.created_at).getTime() > cutoff)
    .filter((r) => !activeFilter || r.severity === activeFilter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Count reports per device_id to identify verified reporters
  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });

  if (!recentReports.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", color: "var(--text-faint)", textAlign: "center" }}>
        <EmptyIllustration />
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-dim)", marginTop: "16px", marginBottom: "4px" }}>
          {activeFilter ? (lang === "es" ? "Sin reportes de este tipo" : "No reports of this type") : (lang === "es" ? "Sin actividad reciente" : "No recent activity")}
        </div>
        <div style={{ fontSize: "13px" }}>{lang === "es" ? "Los reportes aparecerán aquí en tiempo real" : "Reports will appear here in real time"}</div>
      </div>
    );
  }

  return (
    <>
      {shareData && <ShareCard {...shareData} onClose={() => setShareData(null)} />}
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
            const isVerified = r.device_id && (deviceCounts[r.device_id] || 0) >= 5;

            return (
              <div key={r.id} className="card-interactive" style={{
                background: `linear-gradient(135deg, ${cfg.bg}, var(--bg))`,
                border: `1px solid ${cfg.color}15`, borderRadius: "var(--radius-md)",
                padding: "14px", animation: `fadeIn 0.3s ease ${i * 0.04}s both`, cursor: "pointer",
              }} onClick={() => onZoneClick?.(zone.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{cfg.emoji}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{zone.name}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{zone.area}</span>
                  {isVerified && <VerifiedBadge />}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                    {(r.severity === "danger" || r.severity === "caution") && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, animation: "blink 2s ease infinite", flexShrink: 0 }} />}
                    {timeAgoLocalized(r.created_at, lang)}
                  </span>
                </div>
                <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", background: `${cfg.color}15`, color: cfg.color, fontSize: "11px", fontWeight: 600, marginBottom: r.text || r.photo_url ? "8px" : "10px" }}>
                  {getSevLabel(r.severity, lang)}
                </div>
                {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)" }}>{r.text}</p>}
                {r.photo_url && (
                  <div style={{ marginBottom: "10px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={r.photo_url} alt="Reporte" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} loading="lazy" />
                  </div>
                )}
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button onClick={(e) => { e.stopPropagation(); if (!isUpvoted) { onUpvote?.(r.id, r.upvotes); onUpvoteLocal?.(r.id); if (navigator.vibrate) navigator.vibrate(50); } }} style={{
                    background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", padding: "5px 10px",
                    color: isUpvoted ? "var(--accent)" : "var(--text-dim)",
                    fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, cursor: "pointer",
                  }}>
                    👍 {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShareData({ zoneName: zone.name, zoneArea: zone.area, severity: r.severity, reportText: r.text }); }} style={{
                    background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)",
                    borderRadius: "var(--radius-sm)", padding: "5px 10px",
                    color: "#25D366", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
                  }}>
                    📤 {lang === "es" ? "Compartir" : "Share"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
