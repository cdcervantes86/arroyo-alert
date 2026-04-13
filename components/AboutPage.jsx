"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { isAudioEnabled, setAudioEnabled, playDangerAlert } from "@/lib/audioAlerts";
import { APP_VERSION, CHANGELOG } from "@/lib/version";
import { INCIDENTS } from "@/lib/incidents";

const mnths = {
  es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
function monthName(m, es) { return (es ? mnths.es : mnths.en)[m - 1] || ""; }

function SectionLabel({ children, style }) {
  return <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px", ...style }}>{children}</div>;
}

export default function AboutPage({ onBack, onLogoClick, onToggleLang, lang: langProp, onShowOnboarding, communityStats }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [audioOn, setAudioOn] = useState(true);
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showBugfixes, setShowBugfixes] = useState(false);
  const incidents = INCIDENTS;
  useEffect(() => { setAudioOn(isAudioEnabled()); }, []);

  const cardStyle = { padding: "16px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "6px" };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#0a0f1a" }}>
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

        {/* ── MISSION ── */}
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.3px" }}>{es ? "Sobre AlertaArroyo" : "About AlertaArroyo"}</h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "12px" }}>
          {es
            ? "AlertaArroyo es una herramienta comunitaria gratuita para reportar y monitorear arroyos peligrosos en Barranquilla en tiempo real."
            : "AlertaArroyo is a free community tool to report and monitor dangerous street floods (arroyos) in Barranquilla in real time."}
        </p>
        <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, marginBottom: "28px" }}>
          {es
            ? "Los arroyos han cobrado más de 115 vidas desde 1933. Creemos que la tecnología y la solidaridad pueden cambiar eso. Cada reporte que haces ayuda a proteger a alguien que no sabe lo que pasa en la calle."
            : "Arroyos have claimed over 115 lives since 1933. We believe technology and solidarity can change that. Every report you make helps protect someone who doesn't know what's happening on the street."}
        </p>

        {/* ── WHAT IS AN ARROYO ── */}
        <SectionLabel>{es ? "¿Qué es un arroyo?" : "What is an arroyo?"}</SectionLabel>
        <div style={{ ...cardStyle, marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "rgba(91,156,246,0.06)", border: "1px solid rgba(91,156,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/>
                <line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/>
              </svg>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              {es
                ? "En Barranquilla, un \"arroyo\" es una corriente de agua violenta que se forma en las calles durante lluvias fuertes. Algunas calles se convierten en ríos peligrosos en minutos — arrastrando carros, motos y personas. Son impredecibles y mortales. A diferencia de inundaciones normales, los arroyos tienen corriente fuerte y pueden alcanzar más de un metro de profundidad."
                : "In Barranquilla, an \"arroyo\" is a violent water current that forms in the streets during heavy rainfall. Some streets turn into dangerous rivers within minutes — sweeping away cars, motorcycles, and people. They're unpredictable and deadly. Unlike typical flooding, arroyos have powerful currents and can reach over a meter deep."}
            </p>
          </div>
        </div>

        {/* ── COMMUNITY STATS ── */}
        {communityStats && (
          <>
            <SectionLabel>{es ? "Comunidad" : "Community"}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "28px" }}>
              {[
                { value: communityStats.zones, label: es ? "Zonas" : "Zones", color: "var(--accent)" },
                { value: communityStats.reports, label: es ? "Reportes" : "Reports", color: "var(--baq-yellow)" },
                { value: communityStats.reporters, label: es ? "Reporteros" : "Reporters", color: "var(--safe)" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "16px 12px", background: "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── HOW IT WORKS ── */}
        <SectionLabel>{es ? "¿Cómo funciona?" : "How does it work?"}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
          {[
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--baq-yellow)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
              color: "var(--baq-yellow)",
              es: "Personas reales en el terreno reportan arroyos activos con nivel de severidad, fotos y texto.",
              en: "Real people on the ground report active arroyos with severity level, photos, and text.",
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              color: "var(--accent)",
              es: "Los reportes expiran después de 4 horas, así siempre ves la situación actual — nunca datos viejos.",
              en: "Reports expire after 4 hours, so you always see the current situation — never stale data.",
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
              color: "var(--safe)",
              es: "Otros confirman los reportes con upvotes, creando confianza colectiva. Cualquiera puede contribuir.",
              en: "Others confirm reports with upvotes, building collective trust. Anyone can contribute.",
            },
          ].map((step, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: `${step.color}08`, border: `1px solid ${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${step.color}10`, border: `1px solid ${step.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: step.color, marginBottom: "6px" }}>{i + 1}</div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{es ? step.es : step.en}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── WHO BUILT THIS ── */}
        <SectionLabel>{es ? "¿Quién está detrás?" : "Who's behind this?"}</SectionLabel>
        <div style={{ ...cardStyle, marginBottom: "28px", background: "rgba(91,156,246,0.03)", border: "1px solid rgba(91,156,246,0.08)" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(91,156,246,0.15), rgba(91,156,246,0.05))", border: "1px solid rgba(91,156,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Carlos D. Cervantes</div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                {es
                  ? "Me mudé a Barranquilla hace poco más de un año. La primera vez que vi un arroyo, no podía creer lo peligroso que era — y lo poco que la gente sabía sobre cuáles calles estaban activas en ese momento. Construí AlertaArroyo para que la comunidad pueda protegerse entre sí en tiempo real. No soy una empresa — soy un vecino que quiere que todos lleguen a casa seguros."
                  : "I moved to Barranquilla a little over a year ago. The first time I saw an arroyo, I couldn't believe how dangerous it was — and how little people knew about which streets were active at that moment. I built AlertaArroyo so the community can protect each other in real time. I'm not a company — I'm a neighbor who wants everyone to get home safe."}
              </p>
            </div>
          </div>
        </div>

        {/* ── PRIVACY ── */}
        <SectionLabel>{es ? "Privacidad y datos" : "Privacy & data"}</SectionLabel>
        <div style={{ ...cardStyle, marginBottom: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                es: "Los reportes son anónimos. Usamos un ID de dispositivo para tus estadísticas, pero nunca recopilamos tu nombre, correo ni información personal.",
                en: "Reports are anonymous. We use a device ID for your stats, but we never collect your name, email, or personal information.",
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                es: "Tu ubicación solo se usa cuando tú decides compartirla, para ordenar las zonas por cercanía.",
                en: "Your location is only used when you choose to share it, to sort zones by proximity.",
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
                es: "Ningún dato se vende ni se comparte con terceros. AlertaArroyo es gratuito y sin publicidad.",
                en: "No data is sold or shared with third parties. AlertaArroyo is free and ad-free.",
              },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(34,197,94,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  {item.icon}
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{es ? item.es : item.en}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SETTINGS ── */}
        <SectionLabel>{es ? "Configuración" : "Settings"}</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...cardStyle }}>
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
        {onShowOnboarding && (
          <button onClick={onShowOnboarding} className="card-interactive" style={{
            width: "100%", display: "flex", alignItems: "center", gap: "14px",
            ...cardStyle, textAlign: "left", marginBottom: "28px",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "rgba(245,208,51,0.06)", border: "1px solid rgba(245,208,51,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--baq-yellow)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{es ? "Guía de la app" : "App guide"}</div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{es ? "Volver a ver la introducción" : "Watch the intro again"}</div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, opacity: 0.15 }}><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {/* ── SAFETY TIPS ── */}
        <SectionLabel>{es ? "Consejos de seguridad" : "Safety tips"}</SectionLabel>
        {[
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, es: "NUNCA cruce un arroyo, sin importar su tamaño", en: "NEVER cross an arroyo, regardless of size", highlight: true },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>, es: "No intente cruzar en vehículo — los carros son arrastrados fácilmente", en: "Don't try to cross by car — vehicles are easily swept away" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, es: "Si está lloviendo fuerte, quédese donde está hasta que pase", en: "If it's raining heavily, stay where you are until it passes" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, es: "Si ve un arroyo, repórtelo inmediatamente para alertar a otros", en: "If you see an arroyo, report it immediately to alert others" },
          { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>, es: "Comparta las alertas con familiares y vecinos por WhatsApp", en: "Share alerts with family and neighbors via WhatsApp" },
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", marginBottom: "6px", background: tip.highlight ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.025)", borderRadius: "var(--radius-lg)", border: `1px solid ${tip.highlight ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)"}`, animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
            <div style={{ flexShrink: 0, marginTop: "2px", width: 32, height: 32, borderRadius: "var(--radius-sm)", background: tip.highlight ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${tip.highlight ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{tip.icon}</div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, fontWeight: tip.highlight ? 700 : 400 }}>{es ? tip.es : tip.en}</p>
          </div>
        ))}

        {/* ── RECENT INCIDENTS ── */}
        <SectionLabel style={{ marginTop: "32px" }}>{es ? "Incidentes recientes" : "Recent incidents"}</SectionLabel>
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

        {/* ── EMERGENCY NUMBERS ── */}
        <SectionLabel style={{ marginTop: "32px" }}>{es ? "Números de emergencia" : "Emergency numbers"}</SectionLabel>
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

        {/* ── CONTACT ── */}
        <SectionLabel style={{ marginTop: "32px" }}>{es ? "Contacto y sugerencias" : "Contact & feedback"}</SectionLabel>
        <div style={cardStyle}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 14px" }}>
            {es
              ? "¿Conoces una zona de arroyo que falta? ¿Encontraste un error? ¿Tienes ideas para mejorar la app? Me encantaría escucharte."
              : "Know an arroyo zone we're missing? Found a bug? Have ideas to improve the app? I'd love to hear from you."}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a href="mailto:alertaarroyo@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "var(--radius-sm)", background: "rgba(91,156,246,0.06)", border: "1px solid rgba(91,156,246,0.12)", color: "var(--accent)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email
            </a>
            <a href="https://instagram.com/alertaarroyo" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "var(--radius-sm)", background: "rgba(225,48,108,0.06)", border: "1px solid rgba(225,48,108,0.12)", color: "#E1306C", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              @alertaarroyo
            </a>
          </div>
        </div>

        {/* ── SHARE ── */}
        <button onClick={async () => {
          const shareText = es
            ? "AlertaArroyo — Alertas de arroyos en tiempo real para Barranquilla. Protege a tu familia.\nhttps://arroyo-alert.vercel.app"
            : "AlertaArroyo — Real-time arroyo flood alerts for Barranquilla. Protect your family.\nhttps://arroyo-alert.vercel.app";
          if (navigator.share) {
            try { await navigator.share({ title: "AlertaArroyo", text: shareText, url: "https://arroyo-alert.vercel.app" }); } catch(e) {}
          } else {
            try { await navigator.clipboard.writeText(shareText); } catch(e) {}
          }
        }} className="tap-target" style={{
          width: "100%", padding: "16px", marginTop: "24px",
          background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))",
          border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-lg)",
          display: "flex", alignItems: "center", gap: "14px", textAlign: "left",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--safe)" }}>{es ? "Invitar amigos" : "Invite friends"}</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{es ? "Comparte AlertaArroyo con tu comunidad" : "Share AlertaArroyo with your community"}</div>
          </div>
        </button>

        {/* ── WHAT'S NEW ── */}
        <SectionLabel style={{ marginTop: "32px" }}>{es ? "Novedades" : "What's new"}</SectionLabel>
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showChangelog ? "rotate(90deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showBugfixes ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
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

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{es ? "Hecho para Barranquilla" : "Made for Barranquilla"} <svg width="20" height="14" viewBox="0 0 30 20" style={{ borderRadius: "2px", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}><rect width="30" height="20" fill="#D42A2A"/><rect x="3" y="3" width="24" height="14" fill="#F5D033"/><rect x="6" y="6" width="18" height="8" fill="#2D8A2D"/><polygon points="15,7.5 15.9,9.3 17.8,9.6 16.4,11 16.7,12.9 15,12 13.3,12.9 13.6,11 12.2,9.6 14.1,9.3" fill="rgba(255,255,255,0.9)"/></svg></div>
          <br /><span style={{ fontSize: "11px", opacity: 0.5 }}>v{APP_VERSION} Beta</span>
        </div>
      </div>
    </div>
  );
}
