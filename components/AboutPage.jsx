"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { isAudioEnabled, setAudioEnabled, playDangerAlert } from "@/lib/audioAlerts";
import { APP_VERSION } from "@/lib/version";

export default function AboutPage({ onBack, onLogoClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [audioOn, setAudioOn] = useState(true);
  useEffect(() => { setAudioOn(isAudioEnabled()); }, []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--bg)" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(7,11,20,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgA)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{es ? "← Volver" : "← Back"}</button>
      </div>

      <div style={{ padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 20px))" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.3px" }}>{es ? "Sobre AlertaArroyo" : "About AlertaArroyo"}</h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "32px" }}>
          {es ? "AlertaArroyo es una herramienta comunitaria para reportar y monitorear arroyos peligrosos en Barranquilla en tiempo real. Los arroyos han cobrado más de 115 vidas desde 1933. Juntos podemos proteger a nuestra comunidad." : "AlertaArroyo is a community tool to report and monitor dangerous street floods in Barranquilla in real time. Arroyos have claimed over 115 lives since 1933. Together we can protect our community."}
        </p>

        {/* Audio settings */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "12px" }}>{es ? "Configuración" : "Settings"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "32px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>🔊 {es ? "Alerta sonora" : "Sound alerts"}</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{es ? "Sonido al recibir reportes de peligro" : "Sound on danger reports"}</div>
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
          { icon: "🚫", es: "NUNCA cruce un arroyo, sin importar su tamaño", en: "NEVER cross an arroyo, regardless of size" },
          { icon: "🚗", es: "No intente cruzar en vehículo — los carros son arrastrados fácilmente", en: "Don't try to cross by car — vehicles are easily swept away" },
          { icon: "🏠", es: "Si está lloviendo fuerte, quédese donde está hasta que pase", en: "If it's raining heavily, stay where you are until it passes" },
          { icon: "👀", es: "Si ve un arroyo, repórtelo inmediatamente para alertar a otros", en: "If you see an arroyo, report it immediately to alert others" },
          { icon: "📱", es: "Comparta las alertas con familiares y vecinos por WhatsApp", en: "Share alerts with family and neighbors via WhatsApp" },
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "13px 14px", marginBottom: "6px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>{tip.icon}</span>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{es ? tip.es : tip.en}</p>
          </div>
        ))}

        {/* Emergency numbers */}
        <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginTop: "32px", marginBottom: "12px" }}>{es ? "Números de emergencia" : "Emergency numbers"}</div>
        {[
          { label: es ? "Línea de emergencia" : "Emergency line", number: "123" },
          { label: "Bomberos Barranquilla", number: "119" },
          { label: "Defensa Civil", number: "144" },
          { label: "Cruz Roja", number: "132" },
        ].map((item, i) => (
          <a key={i} href={`tel:${item.number}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", marginBottom: "6px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", textDecoration: "none" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{item.label}</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--baq-red)", fontVariantNumeric: "tabular-nums" }}>{item.number}</span>
          </a>
        ))}

        <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)" }}>
          {es ? "Hecho para Barranquilla 🇨🇴" : "Made for Barranquilla 🇨🇴"}
          <br /><span style={{ fontSize: "11px", opacity: 0.5 }}>v{APP_VERSION} Beta</span>
        </div>
      </div>
    </div>
  );
}
