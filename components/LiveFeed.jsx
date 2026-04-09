"use client";
import { useEffect, useState } from "react";
import { ZONES, SEVERITY, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";

function EmptyIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.3 }}>
      <path d="M10 60 Q30 20 60 40 Q90 60 110 30" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="40" r="3" fill="var(--accent)" />
      <path d="M20 65 Q40 55 60 65 Q80 75 100 65" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ShareButton({ zone, severity, lang }) {
  const sevText = lang === "es"
    ? { danger: "PELIGROSO", caution: "Precaución", safe: "Despejado" }
    : { danger: "DANGEROUS", caution: "Caution", safe: "Clear" };

  const message = lang === "es"
    ? `⚠️ Arroyo ${sevText[severity]} en ${zone.name} (${zone.area}) — ArroyoAlerta\nhttps://arroyo-alert.vercel.app`
    : `⚠️ Arroyo ${sevText[severity]} at ${zone.name} (${zone.area}) — ArroyoAlerta\nhttps://arroyo-alert.vercel.app`;

  return (
    <button onClick={(e) => {
      e.stopPropagation();
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }} style={{
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
        <EmptyIllustration />
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-dim)", marginTop: "16px", marginBottom: "4px" }}>
          {activeFilter
            ? (lang === "es" ? "Sin reportes de este tipo" : "No reports of this type")
            : (lang === "es" ? "Sin actividad reciente" : "No recent activity")}
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
            <div key={r.id} className="card-interactive" style={{
              background: `linear-gradient(135deg, ${cfg.bg}, var(--bg))`,
              border: `1px solid ${cfg.color}15`, borderRadius: "var(--radius-md)",
              padding: "14px", animation: `fadeIn 0.3s ease ${i * 0.04}s both`, cursor: "pointer",
            }} onClick={() => onZoneClick?.(zone.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px" }}>{cfg.emoji}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{zone.name}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{zone.area}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{timeAgoLocalized(r.created_at, lang)}</span>
              </div>
              <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", background: `${cfg.color}15`, color: cfg.color, fontSize: "11px", fontWeight: 600, marginBottom: r.text ? "8px" : "10px" }}>
                {getSevLabel(r.severity, lang)}
              </div>
              {r.text ? (
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)" }}>{r.text}</p>
              ) : null}
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
                <ShareButton zone={zone} severity={r.severity} lang={lang} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
