"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { isAudioEnabled, setAudioEnabled, playDangerAlert } from "@/lib/audioAlerts";
import { APP_VERSION, CHANGELOG } from "@/lib/version";
import { INCIDENTS } from "@/lib/incidents";

const months = {
  es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
function monthName(m, es) { return (es ? months.es : months.en)[m - 1] || ""; }

export default function AboutPage({ onBack, onLogoClick, onToggleLang, lang: langProp }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [audioOn, setAudioOn] = useState(true);
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showBugfixes, setShowBugfixes] = useState(false);
  const incidents = INCIDENTS;
  useEffect(() => { setAudioOn(isAudioEnabled()); }, []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--bg)" }}>
      {/* Sticky header */}
      <div className="desktop-center-header" style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgA)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1 }} />
        {onToggleLang && <button onClick={onToggleLang} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-dim)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>{lang === "es" ? "EN" : "ES"}</button>}
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>{es ? "Volver" : "Back"}</button>
      </div>

      <div className="desktop-center-content" style={{ padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 20px))" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.3px" }}>{es ? "Sobre AlertaArroyo" : "About AlertaArroyo"}</h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "32px" }}>
          {es ? "AlertaArroyo es una herramienta comunitaria para reportar y monitorear arroyos peligrosos en Barranquilla en tiempo real. Los arroyos han cobrado más de 115 vidas desde 1933. Juntos podemos proteger a nuestra comunidad." : "AlertaArroyo is a community tool to report and monitor dangerous street floods in Barranquilla in real time. Arroyos have claimed over 115 lives since 1933. Together we can protect our community."}
        </p>

        {/* Audio settings */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>{es ? "Configuración" : "Settings"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "rgba(91,156,246,0.06)", border: "1px solid rgba(91,156,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>{es ? "Alerta sonora" : "Sound alerts"}</div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{es ? "Sonido al recibir reportes de peligro" : "Sound on danger reports"}</div>
            </div>
          </div>
          <button onClick={() => { const n = !audioOn; setAudioOn(n); setAudioEnabled(n); if (n) playDangerAlert(); }} style={{
            width: 48, height: 28, borderRadius: 14, border: "none",
            background: audioOn ? "var(--accent)" : "rgba(255,255,255,0.08)",
            position: "relative", cursor: "pointer", transition: "background 0.2s ease", flexShrink: 0,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: audioOn ? 23 : 3, transition: "left 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
          </button>
        </div>

        {/* Safety tips */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>{es ? "Consejos de seguridad" : "Safety tips"}</div>
        {[
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, es: "NUNCA cruce un arroyo, sin importar su tamaño", en: "NEVER cross an arroyo, regardless of size" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>, es: "No intente cruzar en vehículo — los carros son arrastrados fácilmente", en: "Don't try to cross by car — vehicles are easily swept away" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, es: "Si está lloviendo fuerte, quédese donde está hasta que pase", en: "If it's raining heavily, stay where you are until it passes" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, es: "Si ve un arroyo, repórtelo inmediatamente para alertar a otros", en: "If you see an arroyo, report it immediately to alert others" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>, es: "Comparta las alertas con familiares y vecinos por WhatsApp", en: "Share alerts with family and neighbors via WhatsApp" },
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", marginBottom: "6px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
            <div style={{ flexShrink: 0, marginTop: "2px", width: 32, height: 32, borderRadius: "var(--radius-sm)", background: i === 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{tip.icon}</div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{es ? tip.es : tip.en}</p>
          </div>
        ))}

        {/* Recent incidents */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>{es ? "Incidentes recientes" : "Recent incidents"}</div>
        <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5, marginBottom: "12px" }}>
          {es ? "Los arroyos de Barranquilla han cobrado más de 115 vidas desde 1933. Estos son algunos incidentes recientes:" : "Barranquilla's arroyos have claimed over 115 lives since 1933. These are some recent incidents:"}
        </p>
        {incidents.slice(0, showAllIncidents ? incidents.length : 3).map((inc, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", marginBottom: "6px", background: "rgba(212,42,42,0.03)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(212,42,42,0.08)", position: "relative", overflow: "hidden", animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
            <div style={{ position: "absolute", left: 0, top: "12%", bottom: "12%", width: 3, borderRadius: "0 2px 2px 0", background: "rgba(212,42,42,0.5)" }} />
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: 36 }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--danger)" }}>{inc.year}</div>
              <div style={{ fontSize: "9px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{monthName(inc.month, es)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{inc.zone} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>· {inc.area}</span></div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{es ? inc.es : inc.en}</p>
            </div>
          </div>
        ))}
        {incidents.length > 3 && (
          <button onClick={() => setShowAllIncidents(!showAllIncidents)} style={{ width: "100%", padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-lg)", color: "var(--accent)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
            {showAllIncidents ? (es ? "Ver menos" : "Show less") : (es ? `Ver ${incidents.length - 3} más` : `Show ${incidents.length - 3} more`)}
          </button>
        )}

        {/* Emergency numbers */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>{es ? "Números de emergencia" : "Emergency numbers"}</div>
        {[
          { label: es ? "Línea de emergencia" : "Emergency line", number: "123", color: "#ef4444" },
          { label: es ? "Bomberos Barranquilla" : "Fire Department", number: "119", color: "#D97706" },
          { label: es ? "Defensa Civil" : "Civil Defense", number: "144", color: "#5b9cf6" },
          { label: es ? "Cruz Roja" : "Red Cross", number: "132", color: "#DC2626" },
        ].map((item, i) => (
          <a key={i} href={`tel:${item.number}`} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", marginBottom: "6px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: `${item.color}08`, border: `1px solid ${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <span style={{ flex: 1, fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: item.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>{item.number}</span>
          </a>
        ))}

        {/* What's New */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>{es ? "Novedades" : "What's new"}</div>
        <button onClick={() => setShowChangelog(!showChangelog)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "14px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", marginBottom: "6px",
        }}>
          <span style={{ flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>AlertaArroyo v{APP_VERSION}</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{CHANGELOG[0]?.title?.[lang] || CHANGELOG[0]?.title?.es}</div>
          </div>
          <span style={{ color: "var(--text-faint)", fontSize: "14px", transform: showChangelog ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>›</span>
        </button>
        {showChangelog && CHANGELOG[0] && (
          <div style={{ padding: "0 0 6px", animation: "fadeIn 0.2s ease" }}>
            {(CHANGELOG[0].items[lang] || CHANGELOG[0].items.es).map((item, i) => (
              <div key={i} style={{ padding: "8px 14px", fontSize: "13px", color: "var(--text-secondary)", display: "flex", gap: "8px" }}>
                <span style={{ flexShrink: 0 }}>{item.split(" ")[0]}</span>
                <span>{item.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
            {CHANGELOG[0].bugfixes && (
              <>
                <button onClick={() => setShowBugfixes(!showBugfixes)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 14px", background: "none", border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px",
                }}>
                  <span style={{ flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"><path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 016 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/><path d="M5 11H1M23 11h-4M5 17H2M22 17h-3"/></svg></span>
                  <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 600, flex: 1, textAlign: "left" }}>
                    {es ? `${(CHANGELOG[0].bugfixes[lang] || CHANGELOG[0].bugfixes.es).length} correcciones` : `${(CHANGELOG[0].bugfixes[lang] || CHANGELOG[0].bugfixes.es).length} bug fixes`}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", transform: showBugfixes ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>▾</span>
                </button>
                {showBugfixes && (CHANGELOG[0].bugfixes[lang] || CHANGELOG[0].bugfixes.es).map((fix, i) => (
                  <div key={i} style={{ padding: "6px 14px", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--safe)", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                    {fix}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{es ? "Hecho para Barranquilla" : "Made for Barranquilla"} <svg width="20" height="14" viewBox="0 0 30 20" style={{ borderRadius: "2px", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}><rect width="30" height="20" fill="#D42A2A"/><rect x="3" y="3" width="24" height="14" fill="#F5D033"/><rect x="6" y="6" width="18" height="8" fill="#2D8A2D"/><polygon points="15,7.5 15.9,9.3 17.8,9.6 16.4,11 16.7,12.9 15,12 13.3,12.9 13.6,11 12.2,9.6 14.1,9.3" fill="rgba(255,255,255,0.9)"/></svg></div>
          <br /><span style={{ fontSize: "11px", opacity: 0.5 }}>v{APP_VERSION} Beta</span>
        </div>
      </div>
    </div>
  );
}
