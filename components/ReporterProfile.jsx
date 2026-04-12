"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { getReporterStats, getDeviceId } from "@/lib/deviceId";

function StatCard({ value, label, icon, color, delay = 0 }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, padding: "20px 16px", borderRadius: "var(--radius-md)",
      background: `${color}06`, border: `1px solid ${color}15`,
      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
      animation: `fadeIn 0.3s ease ${delay}s both`,
    }}>
      <span style={{ fontSize: "24px" }}>{icon}</span>
      <span style={{ fontSize: "28px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 500, textAlign: "center" }}>{label}</span>
    </div>
  );
}

function ProgressRing({ progress, size = 80, strokeWidth = 6, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </svg>
  );
}

export default function ReporterProfile({ onBack, onLogoClick, reports, onToggleLang }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [stats, setStats] = useState({ reportCount: 0, upvotesReceived: 0, verified: false });
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    setStats(getReporterStats());
    setDeviceId(getDeviceId());
  }, []);

  // Count reports from this device in the live data
  const myReports = deviceId ? reports.filter(r => r.device_id === deviceId) : [];
  const totalUpvotes = myReports.reduce((sum, r) => sum + (r.upvotes || 0), 0);
  const peopleProtected = Math.max(stats.reportCount * 23, 0);
  const verifiedProgress = Math.min(stats.reportCount / 5, 1);
  const nextMilestone = stats.reportCount < 5 ? 5 : stats.reportCount < 20 ? 20 : stats.reportCount < 50 ? 50 : 100;
  const milestoneProgress = stats.reportCount / nextMilestone;

  // Rank
  const rank = stats.reportCount >= 50 ? (es ? "Guardián" : "Guardian")
    : stats.reportCount >= 20 ? (es ? "Protector" : "Protector")
    : stats.reportCount >= 5 ? (es ? "Vigía Verificado" : "Verified Watcher")
    : stats.reportCount >= 1 ? (es ? "Reportero" : "Reporter")
    : (es ? "Nuevo" : "New");

  const rankColor = stats.reportCount >= 50 ? "#F5D033"
    : stats.reportCount >= 20 ? "#22c55e"
    : stats.reportCount >= 5 ? "var(--accent)"
    : "var(--text-dim)";

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--bg)" }}>
      {/* Header */}
      <div className="desktop-center-header" style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgP)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
        </button>
        <span style={{ flex: 1 }} />
        {onToggleLang && <button onClick={onToggleLang} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.045)", border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>{es ? "EN" : "ES"}</button>}
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>{es ? "Volver" : "Back"}</button>
      </div>

      <div className="desktop-center-content" style={{ padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 20px))" }}>
        {/* Profile header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px", animation: "fadeIn 0.3s ease" }}>
          {/* Rank ring */}
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <ProgressRing progress={milestoneProgress} size={90} strokeWidth={4} color={rankColor} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "32px" }}>
                {stats.reportCount >= 50 ? "🛡️" : stats.reportCount >= 20 ? "⭐" : stats.reportCount >= 5 ? "✓" : stats.reportCount >= 1 ? "📍" : "👋"}
              </span>
            </div>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: rankColor }}>{rank}</span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>
            {stats.reportCount}/{nextMilestone} {es ? "para siguiente rango" : "to next rank"}
          </span>
          {stats.verified && (
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", background: "var(--accent-glow)", border: "1px solid rgba(91,156,246,0.15)" }}>
              <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>✓ {es ? "Reportero Verificado" : "Verified Reporter"}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          <StatCard value={stats.reportCount} label={es ? "Reportes enviados" : "Reports sent"} icon="📍" color="var(--accent)" delay={0.1} />
          <StatCard value={totalUpvotes || stats.upvotesReceived} label={es ? "Confirmaciones" : "Confirmations"} icon="👍" color="var(--safe)" delay={0.15} />
          <StatCard value={peopleProtected} label={es ? "Personas protegidas" : "People protected"} icon="🛡️" color="var(--baq-yellow)" delay={0.2} />
        </div>

        {/* Impact message */}
        {stats.reportCount > 0 && (
          <div style={{
            padding: "20px", borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(91,156,246,0.04))",
            border: "1px solid rgba(34,197,94,0.1)", marginBottom: "24px",
            textAlign: "center", animation: "fadeIn 0.4s ease 0.25s both",
          }}>
            <p style={{ fontSize: "16px", color: "var(--text)", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
              {es
                ? `Has ayudado a proteger a ${peopleProtected} personas en Barranquilla con tus reportes.`
                : `You've helped protect ${peopleProtected} people in Barranquilla with your reports.`}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px" }}>
              {es ? "Cada reporte salva vidas. Gracias." : "Every report saves lives. Thank you."}
            </p>
          </div>
        )}

        {/* Ranks explained */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>
          {es ? "Rangos" : "Ranks"}
        </div>
        {[
          { min: 0, icon: "👋", name: es ? "Nuevo" : "New", desc: es ? "Bienvenido a AlertaArroyo" : "Welcome to AlertaArroyo", color: "var(--text-dim)" },
          { min: 1, icon: "📍", name: es ? "Reportero" : "Reporter", desc: es ? "1+ reportes enviados" : "1+ reports sent", color: "var(--text-secondary)" },
          { min: 5, icon: "✓", name: es ? "Vigía Verificado" : "Verified Watcher", desc: es ? "5+ reportes — tu insignia aparece en reportes" : "5+ reports — your badge shows on reports", color: "var(--accent)" },
          { min: 20, icon: "⭐", name: es ? "Protector" : "Protector", desc: es ? "20+ reportes — defensor de tu comunidad" : "20+ reports — community defender", color: "#22c55e" },
          { min: 50, icon: "🛡️", name: es ? "Guardián" : "Guardian", desc: es ? "50+ reportes — leyenda de Barranquilla" : "50+ reports — Barranquilla legend", color: "#F5D033" },
        ].map((r, i) => {
          const achieved = stats.reportCount >= r.min;
          return (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px",
              marginBottom: "6px", borderRadius: "var(--radius-md)",
              background: achieved ? `${r.color}06` : "var(--bg-card)",
              border: `1px solid ${achieved ? r.color + "15" : "var(--border)"}`,
              opacity: achieved ? 1 : 0.5,
              animation: `fadeIn 0.2s ease ${0.3 + i * 0.05}s both`,
            }}>
              <span style={{ fontSize: "20px" }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: achieved ? r.color : "var(--text-dim)" }}>{r.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{r.desc}</div>
              </div>
              {achieved && <span style={{ fontSize: "12px", color: r.color }}>✓</span>}
            </div>
          );
        })}

        <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{es ? "Hecho para Barranquilla" : "Made for Barranquilla"} <svg width="20" height="14" viewBox="0 0 30 20" style={{ borderRadius: "2px", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}><rect width="30" height="20" fill="#D42A2A"/><rect x="3" y="3" width="24" height="14" fill="#F5D033"/><rect x="6" y="6" width="18" height="8" fill="#2D8A2D"/><polygon points="15,7.5 15.9,9.3 17.8,9.6 16.4,11 16.7,12.9 15,12 13.3,12.9 13.6,11 12.2,9.6 14.1,9.3" fill="rgba(255,255,255,0.9)"/></svg></div>
        </div>
      </div>
    </div>
  );
}
