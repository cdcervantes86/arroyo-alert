"use client";
import { useState, useEffect } from "react";
import { SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";

function ShareButton({ zoneName, zoneArea, severity, lang }) {
  const sevText = { danger: "PELIGROSO", caution: "Precaución", safe: "Despejado" };
  const message = `⚠️ Arroyo ${sevText[severity]} en ${zoneName} (${zoneArea}) — ArroyoAlerta\nhttps://arroyo-alert.vercel.app`;
  return (
    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")} style={{
      background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)",
      borderRadius: "var(--radius-sm)", padding: "5px 10px",
      color: "#25D366", fontSize: "11px", fontWeight: 600,
      display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.103 1.518 5.833L0 24l6.336-1.49A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.535-5.446-1.475l-.39-.232-3.758.884.923-3.642-.256-.404A9.72 9.72 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" /></svg>
      WhatsApp
    </button>
  );
}

export default function ZoneDetail({ zone, severity, reports, onBack, onReport, onUpvote, pushSupported, isSubscribed, onSubscribe, onUnsubscribe, onLogoClick }) {
  const { lang, t } = useLanguage();
  const [upvoted, setUpvoted] = useState(new Set());
  const [optimisticSubscribed, setOptimisticSubscribed] = useState(null);
  const [, forceUpdate] = useState(0);
  const subscribed = optimisticSubscribed !== null ? optimisticSubscribed : isSubscribed?.(zone.id);

  useEffect(() => { setOptimisticSubscribed(null); }, [isSubscribed?.(zone.id)]);
  useEffect(() => { const i = setInterval(() => forceUpdate((n) => n + 1), 30000); return () => clearInterval(i); }, []);

  const handleUpvote = (report) => {
    if (upvoted.has(report.id)) return;
    onUpvote(report.id, report.upvotes);
    setUpvoted((prev) => new Set([...prev, report.id]));
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleToggleSubscribe = async () => {
    const newState = !subscribed;
    setOptimisticSubscribed(newState);
    if (navigator.vibrate) navigator.vibrate(50);
    if (newState) await onSubscribe?.(zone.id);
    else await onUnsubscribe?.(zone.id);
  };

  const sevColor = severity ? SEVERITY[severity].color : "var(--border)";

  return (
    <div className="screen-slide" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5, flexShrink: 0 }}>
            <defs><linearGradient id="lBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
            <rect width="512" height="512" rx="112" fill="url(#lBg)" />
            <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
            <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
            <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span></span>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(96,165,250,0.15)", marginLeft: "-4px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{t.backToMap}</button>
      </div>

      <div style={{ height: 3, background: sevColor, flexShrink: 0, opacity: 0.7 }} />

      <div style={{ padding: "24px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "4px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0, background: severity ? `${SEVERITY[severity].color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${severity ? SEVERITY[severity].color + "20" : "var(--border)"}` }}>
            {severity ? SEVERITY[severity].emoji : "⚪"}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>{zone.name}</h2>
            <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>{zone.area}</p>
            <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "12px" }}>{zone.desc}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "16px 0 24px", flexWrap: "wrap" }}>
          {severity && (
            <div style={{ padding: "6px 14px", borderRadius: "20px", background: SEVERITY[severity].bg, color: SEVERITY[severity].color, fontSize: "12px", fontWeight: 600, border: `1px solid ${SEVERITY[severity].color}20` }}>
              {t.currentStatus}: {getSevLabel(severity, lang)}
            </div>
          )}
          {pushSupported && (
            <button onClick={handleToggleSubscribe} style={{
              padding: "6px 14px", borderRadius: "20px",
              background: subscribed ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)",
              color: subscribed ? "var(--accent)" : "var(--text-dim)",
              fontSize: "12px", fontWeight: 600,
              border: `1px solid ${subscribed ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
              display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s ease",
            }}>
              {subscribed ? "🔔" : "🔕"} {subscribed ? t.notificationsActive : t.notifyMe}
            </button>
          )}
          {severity && <ShareButton zoneName={zone.name} zoneArea={zone.area} severity={severity} lang={lang} />}
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px", fontWeight: 600 }}>
          {t.recentReports} ({reports.length})
        </div>

        {!reports.length && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-faint)", fontSize: "13px" }}>
            <svg width="80" height="50" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.25, marginBottom: "12px" }}>
              <path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="60" cy="40" r="3" fill="var(--accent)" />
            </svg>
            <br />{t.noReportsForZone}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: 90 }}>
          {reports.map((r, i) => {
            const isUpvoted = upvoted.has(r.id);
            return (
              <div key={r.id} className="card-interactive" style={{
                background: "var(--bg-card)", border: `1px solid ${SEVERITY[r.severity].color}12`,
                borderRadius: "var(--radius-md)", padding: "14px 16px",
                animation: `fadeIn 0.25s ease ${i * 0.05}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                  <span style={{ fontSize: "14px" }}>{SEVERITY[r.severity].emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: SEVERITY[r.severity].color }}>{getSevLabel(r.severity, lang)}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{timeAgoLocalized(r.created_at, lang)}</span>
                </div>
                {r.text ? (
                  <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>
                ) : <div style={{ marginBottom: "8px" }} />}
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button onClick={() => handleUpvote(r)} style={{
                    background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", padding: "6px 12px",
                    color: isUpvoted ? "var(--accent)" : "var(--text-dim)",
                    fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500,
                  }}>
                    👍 {isUpvoted ? t.confirmed : t.confirm} · <span style={{ display: "inline-block", animation: isUpvoted ? "countUp 0.3s ease" : "none" }}>{r.upvotes + (isUpvoted ? 1 : 0)}</span>
                  </button>
                  <ShareButton zoneName={zone.name} zoneArea={zone.area} severity={r.severity} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "14px 20px", background: "rgba(8,13,24,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={onReport} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #D42A2A, #c42222)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)", letterSpacing: "-0.2px" }}>
          {t.reportThisZone}
        </button>
      </div>
    </div>
  );
}
