"use client";
import { useState, useEffect } from "react";
import { SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ShareCard from "./ShareCard";
import CommentThread from "./CommentThread";

function Countdown({ createdAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i); }, []);
  const remaining = Math.max(0, new Date(createdAt).getTime() + 4 * 3600000 - Date.now());
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const pct = remaining / (4 * 3600000);
  const color = pct > 0.5 ? "var(--text-faint)" : pct > 0.2 ? "var(--caution)" : "var(--danger)";
  return <span style={{ fontSize: "10px", color, fontWeight: 500 }}>⏱ {h}h {m}m</span>;
}

function VerifiedBadge() {
  return <span style={{ display: "inline-flex", fontSize: "10px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(96,165,250,0.15)" }}>✓</span>;
}

export default function ZoneDetail({ zone, severity, reports, onBack, onReport, onUpvote, pushSupported, isSubscribed, onSubscribe, onUnsubscribe, onLogoClick }) {
  const { lang, t } = useLanguage();
  const [upvoted, setUpvoted] = useState(new Set());
  const [optimisticSubscribed, setOptimisticSubscribed] = useState(null);
  const [, forceUpdate] = useState(0);
  const [shareData, setShareData] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const subscribed = optimisticSubscribed !== null ? optimisticSubscribed : isSubscribed?.(zone.id);

  useEffect(() => { setOptimisticSubscribed(null); }, [isSubscribed?.(zone.id)]);
  useEffect(() => { const i = setInterval(() => forceUpdate((n) => n + 1), 30000); return () => clearInterval(i); }, []);

  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });

  const handleUpvote = (report) => { if (upvoted.has(report.id)) return; onUpvote(report.id, report.upvotes); setUpvoted((prev) => new Set([...prev, report.id])); if (navigator.vibrate) navigator.vibrate(50); };
  const handleToggleSubscribe = async () => { const ns = !subscribed; setOptimisticSubscribed(ns); if (navigator.vibrate) navigator.vibrate(50); if (ns) await onSubscribe?.(zone.id); else await onUnsubscribe?.(zone.id); };

  const sevColor = severity ? SEVERITY[severity].color : "var(--border)";

  return (
    <>
      {shareData && <ShareCard {...shareData} onClose={() => setShareData(null)} />}
      {expandedPhoto && <div onClick={() => setExpandedPhoto(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: "fadeIn 0.2s ease" }}><img src={expandedPhoto} alt="" style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain" }} /></div>}
      <div className="screen-enter" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)" }}>
          <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBg)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span></span>
            <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(96,165,250,0.15)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
          </button>
          <span style={{ flex: 1 }} />
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{t.backToMap}</button>
        </div>
        <div style={{ height: 3, background: sevColor, flexShrink: 0, opacity: 0.7 }} />
        <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "4px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0, background: severity ? `${SEVERITY[severity].color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${severity ? SEVERITY[severity].color + "20" : "var(--border)"}` }}>{severity ? SEVERITY[severity].emoji : "⚪"}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{zone.name}</h2>
              <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>{zone.area}</p>
              <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "12px" }}>{zone.desc}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "16px 0 24px", flexWrap: "wrap" }}>
            {severity && <div style={{ padding: "6px 14px", borderRadius: "20px", background: SEVERITY[severity].bg, color: SEVERITY[severity].color, fontSize: "12px", fontWeight: 600, border: `1px solid ${SEVERITY[severity].color}20` }}>{t.currentStatus}: {getSevLabel(severity, lang)}</div>}
            {pushSupported && <button onClick={handleToggleSubscribe} style={{ padding: "6px 14px", borderRadius: "20px", background: subscribed ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)", color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, border: `1px solid ${subscribed ? "rgba(96,165,250,0.2)" : "var(--border)"}`, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s ease" }}>{subscribed ? "🔔" : "🔕"} {subscribed ? t.notificationsActive : t.notifyMe}</button>}
            {severity && <button onClick={() => setShareData({ zoneName: zone.name, zoneArea: zone.area, severity, reportText: reports[0]?.text })} style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25D366", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>📤 {lang === "es" ? "Compartir" : "Share"}</button>}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</div>
          {!reports.length && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-faint)", fontSize: "13px" }}><svg width="80" height="50" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.25, marginBottom: "12px" }}><path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" /><circle cx="60" cy="40" r="3" fill="var(--accent)" /></svg><br />{t.noReportsForZone}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: 90 }}>
            {reports.map((r, i) => {
              const isUpvoted = upvoted.has(r.id);
              const isVerified = r.device_id && (deviceCounts[r.device_id] || 0) >= 5;
              return (
                <div key={r.id} className="card-interactive" style={{ background: "var(--bg-card)", border: `1px solid ${SEVERITY[r.severity].color}12`, borderRadius: "var(--radius-md)", padding: "14px 16px", animation: `fadeIn 0.25s ease ${i * 0.05}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                    <span style={{ fontSize: "14px" }}>{SEVERITY[r.severity].emoji}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: SEVERITY[r.severity].color }}>{getSevLabel(r.severity, lang)}</span>
                    {isVerified && <VerifiedBadge />}
                    <span style={{ flex: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{timeAgoLocalized(r.created_at, lang)}</span>
                      <Countdown createdAt={r.created_at} />
                    </div>
                  </div>
                  {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                  {r.photo_url && <div onClick={() => setExpandedPhoto(r.photo_url)} style={{ marginBottom: "10px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)", cursor: "pointer" }}><img src={r.photo_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} loading="lazy" /></div>}
                  {!r.text && !r.photo_url && <div style={{ marginBottom: "8px" }} />}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button onClick={() => handleUpvote(r)} style={{ background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.03)", border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: isUpvoted ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>👍 {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span></button>
                    <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "14px 20px", background: "rgba(8,13,24,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button onClick={onReport} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #D42A2A, #c42222)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)" }}>{t.reportThisZone}</button>
        </div>
      </div>
    </>
  );
}
