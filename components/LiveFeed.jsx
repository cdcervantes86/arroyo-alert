"use client";
import { useEffect, useState } from "react";
import { ZONES, SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ShareCard from "./ShareCard";
import CommentThread from "./CommentThread";
import { SeverityIcon } from "./SeverityIcon";
import { getDeviceId } from "@/lib/deviceId";

function Countdown({ createdAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i); }, []);
  const remaining = Math.max(0, new Date(createdAt).getTime() + 4 * 3600000 - Date.now());
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const pct = remaining / (4 * 3600000);
  const color = pct > 0.5 ? "var(--text-faint)" : pct > 0.2 ? "var(--caution)" : "var(--danger)";
  return (
    <span style={{ fontSize: "10px", color, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
      {h}h {m}m
    </span>
  );
}

function VerifiedBadge({ lang }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 600, color: "var(--accent)", opacity: 0.7 }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      {lang === "en" ? "Verified" : "Verificado"}
    </span>
  );
}

function EmptyState({ lang, onReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
        {lang === "es" ? "Sin actividad reciente" : "No recent activity"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)", maxWidth: 220, lineHeight: 1.5, marginBottom: "20px" }}>
        {lang === "es" ? "Los reportes aparecerán aquí en tiempo real" : "Reports will appear here in real time"}
      </div>
      {onReport && (
        <button onClick={onReport} className="tap-target" style={{
          padding: "10px 24px", borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #D42A2A, #b91c1c)", border: "none",
          color: "#fff", fontSize: "13px", fontWeight: 700,
          boxShadow: "0 4px 16px rgba(212,42,42,0.2)",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {lang === "es" ? "Sé el primero en reportar" : "Be the first to report"}
        </button>
      )}
    </div>
  );
}

export default function LiveFeed({ reports, onZoneClick, onUpvote, upvotedSet, onUpvoteLocal, activeFilter, onPhotoClick, onReport }) {
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
  const myDeviceId = typeof window !== "undefined" ? getDeviceId() : null;

  if (!recentReports.length) return <EmptyState lang={lang} onReport={onReport} />;

  return (
    <>
      {shareData && <ShareCard {...shareData} lang={lang} onClose={() => setShareData(null)} />}
      <div style={{ overflowY: "auto", height: "100%", padding: "14px 0 80px" }}>
        {/* Feed header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", padding: "0 16px 10px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px" }}>
            {lang === "es" ? "En vivo" : "Live"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>·</span>
          <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>
            {recentReports.length} {lang === "es" ? "reportes" : "reports"}
          </span>
        </div>

        {recentReports.map((r, i) => {
          const zone = ZONES.find((z) => z.id === r.zone_id);
          if (!zone) return null;
          const cfg = SEVERITY[r.severity];
          const isUpvoted = upvotedSet?.has(r.id);
          const isVerified = r.device_id && (deviceCounts[r.device_id] || 0) >= 5;
          const isOwn = r.device_id && r.device_id === myDeviceId;

          return (
            <div key={r.id}
              onClick={(e) => { e.stopPropagation(); onZoneClick?.(zone.id); }}
              style={{
                padding: "14px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                {/* Severity icon — small, no background box */}
                <div style={{ marginTop: "2px", flexShrink: 0 }}>
                  <SeverityIcon severity={r.severity} size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: Name + time */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{zone.name}</span>
                      {isOwn && <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 5px", borderRadius: "3px", flexShrink: 0 }}>{lang === "es" ? "Tú" : "You"}</span>}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-faint)", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {timeAgoLocalized(r.created_at, lang)}
                    </span>
                  </div>

                  {/* Row 2: Area + severity + verified */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{zone.area}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>·</span>
                    <span style={{ fontSize: "11px", color: cfg.color, fontWeight: 500 }}>{getSevLabel(r.severity, lang)}</span>
                    {isVerified && <VerifiedBadge lang={lang} />}
                  </div>

                  {/* Report text */}
                  {r.text && r.text !== "Sin comentario" && (
                    <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.5, color: "var(--text-secondary)" }}>{r.text}</p>
                  )}

                  {/* Photo */}
                  {r.photo_url && (
                    <div onClick={(e) => { e.stopPropagation(); onPhotoClick?.(r.photo_url); }} style={{ marginTop: "10px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative", cursor: "zoom-in" }}>
                      <img src={r.photo_url} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block", aspectRatio: "16/9", background: "rgba(255,255,255,0.02)" }} loading="lazy" />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, background: "linear-gradient(transparent, rgba(0,0,0,0.3))" }} />
                    </div>
                  )}

                  {/* Actions row — minimal icon-only */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "10px" }}>
                    {/* Confirm */}
                    <button onClick={(e) => { e.stopPropagation(); if (!isUpvoted) { onUpvote?.(r.id, r.upvotes); onUpvoteLocal?.(r.id); if (navigator.vibrate) navigator.vibrate(50); } }} style={{
                      background: "none", border: "none", padding: "2px 0",
                      color: isUpvoted ? "var(--accent)" : "var(--text-faint)",
                      fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
                      transition: "color 0.15s ease",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={isUpvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.upvotes}</span>
                    </button>

                    {/* Comment */}
                    <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />

                    {/* Share */}
                    <button onClick={(e) => { e.stopPropagation(); setShareData({ zoneName: zone.name, zoneArea: zone.area, severity: r.severity, reportText: r.text, photoUrl: r.photo_url, zoneId: zone.id }); }} style={{
                      background: "none", border: "none", padding: "2px 0",
                      color: "var(--text-faint)", fontSize: "11px", display: "flex", alignItems: "center", cursor: "pointer",
                      transition: "color 0.15s ease",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    </button>

                    <div style={{ flex: 1 }} />

                    {/* Countdown */}
                    <Countdown createdAt={r.created_at} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
