"use client";
import { useEffect, useState } from "react";
import { ZONES, SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ShareCard from "./ShareCard";
import CommentThread from "./CommentThread";
import { SeverityIcon } from "./SeverityIcon";

function Countdown({ createdAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i); }, []);
  const remaining = Math.max(0, new Date(createdAt).getTime() + 4 * 3600000 - Date.now());
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const pct = remaining / (4 * 3600000);
  const color = pct > 0.5 ? "var(--text-faint)" : pct > 0.2 ? "var(--caution)" : "var(--danger)";
  return <span style={{ fontSize: "10px", color, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>⏱ {h}h {m}m</span>;
}

function VerifiedBadge({ lang }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(91,156,246,0.12)", letterSpacing: "0.3px" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{lang === "en" ? "Verified" : "Verificado"}</span>;
}

function EmptyState({ lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
        <svg width="36" height="36" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.2 }}>
          <path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="60" cy="40" r="4" fill="var(--accent)" />
        </svg>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "6px" }}>
        {lang === "es" ? "Sin actividad reciente" : "No recent activity"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-faint)", maxWidth: 240, lineHeight: 1.5 }}>
        {lang === "es" ? "Los reportes aparecerán aquí en tiempo real cuando alguien reporte un arroyo" : "Reports will appear here in real time when someone reports an arroyo"}
      </div>
    </div>
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

  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });

  if (!recentReports.length) return <EmptyState lang={lang} />;

  return (
    <>
      {shareData && <ShareCard {...shareData} lang={lang} onClose={() => setShareData(null)} />}
      <div style={{ overflowY: "auto", height: "100%", padding: "14px 14px 80px" }}>
        {/* Feed header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", padding: "0 2px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px" }}>
            {lang === "es" ? "En vivo" : "Live"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)" }}>·</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)" }}>
            {recentReports.length} {lang === "es" ? "reportes" : "reports"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentReports.map((r, i) => {
            const zone = ZONES.find((z) => z.id === r.zone_id);
            if (!zone) return null;
            const cfg = SEVERITY[r.severity];
            const isUpvoted = upvotedSet?.has(r.id);
            const isVerified = r.device_id && (deviceCounts[r.device_id] || 0) >= 5;
            const accentClass = `card-accent-${r.severity}`;

            return (
              <div key={r.id} className="card-interactive" style={{
                background: `${cfg.color}04`,
                border: `1px solid ${cfg.color}15`, borderRadius: "var(--radius-lg)",
                padding: "16px 16px 16px 18px",
                animation: `fadeIn 0.25s ease ${i * 0.04}s both`, cursor: "pointer",
                position: "relative", overflow: "hidden",
              }} onClick={() => onZoneClick?.(zone.id)}>
                {/* Accent bar */}
                <div style={{ position: "absolute", left: 0, top: "12%", bottom: "12%", width: 3, borderRadius: "0 2px 2px 0", background: cfg.color }} />

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${cfg.color}0a`, border: `1px solid ${cfg.color}18` }}>
                    <SeverityIcon severity={r.severity} size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>
                      {zone.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 1 }}>{zone.area}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                      {(r.severity === "danger" || r.severity === "caution") && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, animation: "blink 2s ease infinite" }} />}
                      {timeAgoLocalized(r.created_at, lang)}
                    </span>
                    <Countdown createdAt={r.created_at} />
                  </div>
                </div>

                {/* Severity + verified */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: r.text || r.photo_url ? "10px" : "10px" }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: "10px",
                    background: `${cfg.color}0a`, color: cfg.color,
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.2px",
                  }}>
                    {getSevLabel(r.severity, lang)}
                  </span>
                  {isVerified && <VerifiedBadge lang={lang} />}
                </div>

                {/* Content */}
                {r.text && <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                {r.photo_url && (
                  <div style={{ marginBottom: "12px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                    <img src={r.photo_url} alt="Reporte" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} loading="lazy" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={(e) => { e.stopPropagation(); if (!isUpvoted) { onUpvote?.(r.id, r.upvotes); onUpvoteLocal?.(r.id); if (navigator.vibrate) navigator.vibrate(50); } }} style={{
                    background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isUpvoted ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "var(--radius-sm)", padding: "6px 11px",
                    color: isUpvoted ? "var(--accent)" : "var(--text-dim)",
                    fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, cursor: "pointer",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={isUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg> {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none", fontVariantNumeric: "tabular-nums" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShareData({ zoneName: zone.name, zoneArea: zone.area, severity: r.severity, reportText: r.text, photoUrl: r.photo_url, zoneId: zone.id }); }} style={{
                    background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.1)",
                    borderRadius: "var(--radius-sm)", padding: "6px 11px",
                    color: "#25D366", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </button>
                  <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
