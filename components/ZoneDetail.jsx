"use client";
import { useState, useEffect } from "react";
import { SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ShareCard from "./ShareCard";
import CommentThread from "./CommentThread";
import { SeverityIcon, EmptyStateIllustration } from "./SeverityIcon";

function Countdown({ createdAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i); }, []);
  const remaining = Math.max(0, new Date(createdAt).getTime() + 4 * 3600000 - Date.now());
  const h = Math.floor(remaining / 3600000); const m = Math.floor((remaining % 3600000) / 60000);
  const pct = remaining / (4 * 3600000);
  const color = pct > 0.5 ? "var(--text-faint)" : pct > 0.2 ? "var(--caution)" : "var(--danger)";
  return <span style={{ fontSize: "10px", color, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>⏱ {h}h {m}m</span>;
}

function VerifiedBadge() {
  return <span style={{ display: "inline-flex", fontSize: "9px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(91,156,246,0.12)" }}>✓</span>;
}

export default function ZoneDetail({ zone, severity, reports, onBack, onReport, onUpvote, pushSupported, isSubscribed, onSubscribe, onUnsubscribe, onLogoClick, zoneWatchers, prediction, onWatchZone, onUnwatchZone, isSheet }) {
  const { lang, t } = useLanguage();
  const [upvoted, setUpvoted] = useState(new Set());
  const [optimisticSubscribed, setOptimisticSubscribed] = useState(null);
  const [, forceUpdate] = useState(0);
  const [shareData, setShareData] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const subscribed = optimisticSubscribed !== null ? optimisticSubscribed : isSubscribed?.(zone.id);
  const watcherCount = zoneWatchers?.[zone.id] || 0;
  const es = lang === "es";

  useEffect(() => { setOptimisticSubscribed(null); }, [isSubscribed?.(zone.id)]);
  useEffect(() => { const i = setInterval(() => forceUpdate((n) => n + 1), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { onWatchZone?.(zone.id); return () => { onUnwatchZone?.(); }; }, [zone.id, onWatchZone, onUnwatchZone]);

  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });

  const handleUpvote = (report) => { if (upvoted.has(report.id)) return; onUpvote(report.id, report.upvotes); setUpvoted((prev) => new Set([...prev, report.id])); if (navigator.vibrate) navigator.vibrate(50); };
  const handleToggleSubscribe = async () => { const ns = !subscribed; setOptimisticSubscribed(ns); if (navigator.vibrate) navigator.vibrate(50); if (ns) await onSubscribe?.(zone.id); else await onUnsubscribe?.(zone.id); };

  const sevColor = severity ? SEVERITY[severity].color : "var(--border)";
  const altRoutes = reports.filter(r => r.alt_route && r.alt_route.trim() && (r.severity === "danger" || r.severity === "caution"));

  const content = (
    <>
      {shareData && <ShareCard {...shareData} onClose={() => setShareData(null)} />}
      {expandedPhoto && <div onClick={() => setExpandedPhoto(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><img src={expandedPhoto} alt="" style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain" }} /></div>}

      {/* Sheet header — compact close + zone name */}
      {isSheet && (
        <div style={{ padding: "8px 20px 14px", display: "flex", alignItems: "center", gap: "10px", borderBottom: `2px solid ${sevColor}40` }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}><SeverityIcon severity={severity} size={26} /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{zone.name}</h2>
              <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{zone.area}</span>
            </div>
          </div>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text-dim)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      )}

      {/* Non-sheet: full header */}
      {!isSheet && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(7,11,20,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBg)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
            <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
          </button>
          <span style={{ flex: 1 }} />
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{t.backToMap}</button>
        </div>
      )}
      {!isSheet && <div style={{ height: 3, background: sevColor, opacity: 0.7 }} />}

      <div style={{ padding: isSheet ? "16px 20px calc(20px + env(safe-area-inset-bottom, 20px))" : "20px 20px calc(20px + env(safe-area-inset-bottom, 20px))" }}>
        {/* Zone info — only in non-sheet mode (sheet has it in header) */}
        {!isSheet && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "4px" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: severity ? `${SEVERITY[severity].color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${severity ? SEVERITY[severity].color + "15" : "var(--border)"}` }}><SeverityIcon severity={severity} size={28} /></div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{zone.name}</h2>
                <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>{zone.area}</p>
                <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "12px" }}>{zone.desc}</p>
              </div>
            </div>
          </>
        )}

        {/* Description — sheet only */}
        {isSheet && zone.desc && <p style={{ color: "var(--text-dim)", fontSize: "12px", marginBottom: "12px" }}>{zone.desc}</p>}

        {/* Live watchers + prediction */}
        <div style={{ display: "flex", gap: "10px", margin: "0 0 12px", flexWrap: "wrap" }}>
          {watcherCount > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
              {watcherCount} {es ? "personas monitoreando" : "people watching"}
            </div>
          )}
          {prediction && prediction.score >= 20 && !severity && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)" }}>
              🧠 {prediction.score}% {es ? "probabilidad de arroyo" : "flood probability"}
            </div>
          )}
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "0 0 16px", flexWrap: "wrap" }}>
          {severity && <div style={{ padding: "6px 14px", borderRadius: "20px", background: `${SEVERITY[severity].color}06`, color: SEVERITY[severity].color, fontSize: "12px", fontWeight: 600, border: `1px solid ${SEVERITY[severity].color}15` }}>{t.currentStatus}: {getSevLabel(severity, lang)}</div>}
          {pushSupported && <button onClick={handleToggleSubscribe} style={{ padding: "6px 14px", borderRadius: "20px", background: subscribed ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.02)", color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, border: `1px solid ${subscribed ? "rgba(91,156,246,0.15)" : "var(--border)"}`, display: "flex", alignItems: "center", gap: "5px" }}>{subscribed ? "🔔" : "🔕"} {subscribed ? t.notificationsActive : t.notifyMe}</button>}
          {severity && <button onClick={() => setShareData({ zoneName: zone.name, zoneArea: zone.area, severity, reportText: reports[0]?.text })} style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.1)", color: "#25D366", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>📤 {es ? "Compartir" : "Share"}</button>}
        </div>

        {/* Report button */}
        <button onClick={onReport} style={{ width: "100%", padding: "15px", marginBottom: "20px", background: "linear-gradient(135deg, #D42A2A, #b91c1c)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)" }}>{t.reportThisZone}</button>

        {/* Alt routes section */}
        {altRoutes.length > 0 && (
          <div style={{ marginBottom: "20px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "var(--radius-md)", padding: "14px 16px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: "11px", color: "var(--safe)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              🛣️ {es ? "Rutas alternas sugeridas" : "Suggested alternate routes"}
            </div>
            {altRoutes.map((r, i) => (
              <div key={r.id} style={{ padding: "8px 0", borderTop: i > 0 ? "1px solid rgba(34,197,94,0.08)" : "none", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "var(--safe)", fontWeight: 700, fontSize: "16px", lineHeight: "20px", flexShrink: 0 }}>↗</span>
                  <div style={{ flex: 1 }}>
                    <span>{r.alt_route}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "8px" }}>{timeAgoLocalized(r.created_at, lang)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</div>
        {!reports.length && (
          <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
            <EmptyStateIllustration />
            <p style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: 500 }}>{es ? "Todo tranquilo por aquí" : "All quiet here"}</p>
            <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "4px" }}>{es ? "No hay reportes en las últimas 4 horas" : "No reports in the last 4 hours"}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reports.map((r, i) => {
            const isUpvoted = upvoted.has(r.id);
            const isVerified = r.device_id && (deviceCounts[r.device_id] || 0) >= 5;
            const accentClass = `card-accent-${r.severity}`;
            return (
              <div key={r.id} className={`card-interactive ${accentClass}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 14px 14px 16px", animation: `fadeIn 0.25s ease ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                  <SeverityIcon severity={r.severity} size={16} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: SEVERITY[r.severity].color }}>{getSevLabel(r.severity, lang)}</span>
                  {isVerified && <VerifiedBadge />}
                  <span style={{ flex: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{timeAgoLocalized(r.created_at, lang)}</span>
                    <Countdown createdAt={r.created_at} />
                  </div>
                </div>
                {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                {r.alt_route && r.alt_route.trim() && (
                  <div style={{ margin: "0 0 10px", padding: "8px 12px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--safe)", display: "flex", alignItems: "center", gap: "6px" }}>
                    🛣️ {r.alt_route}
                  </div>
                )}
                {r.photo_url && <div onClick={() => setExpandedPhoto(r.photo_url)} style={{ marginBottom: "10px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)", cursor: "pointer" }}><img src={r.photo_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} loading="lazy" /></div>}
                {!r.text && !r.photo_url && !r.alt_route && <div style={{ marginBottom: "8px" }} />}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button onClick={() => handleUpvote(r)} style={{ background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.02)", border: `1px solid ${isUpvoted ? "rgba(91,156,246,0.15)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: isUpvoted ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>👍 {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span></button>
                  <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // If rendered inside a sheet, just return the content (sheet wrapper handles the container)
  if (isSheet) return content;

  // Otherwise, render with its own full-screen container
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--bg)" }}>
      {content}
    </div>
  );
}
