"use client";
import { useState, useCallback } from "react";

function FloodIllustration() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      {/* Rain drops */}
      {[20, 55, 90, 125, 40, 75, 110].map((x, i) => (
        <line key={i} x1={x} y1={10 + i * 3} x2={x - 4} y2={22 + i * 3}
          stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" strokeLinecap="round"
          style={{ animation: `rainFall 1.2s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
      {/* Buildings silhouette */}
      <rect x="15" y="55" width="22" height="45" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="20" y="60" width="5" height="6" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="28" y="60" width="5" height="6" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="20" y="72" width="5" height="6" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="28" y="72" width="5" height="6" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="42" y="40" width="18" height="60" rx="2" fill="rgba(255,255,255,0.08)" />
      <rect x="46" y="46" width="4" height="5" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="52" y="46" width="4" height="5" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="46" y="56" width="4" height="5" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="52" y="56" width="4" height="5" rx="1" fill="rgba(96,165,250,0.12)" />
      <rect x="100" y="50" width="25" height="50" rx="2" fill="rgba(255,255,255,0.07)" />
      <rect x="130" y="60" width="18" height="40" rx="2" fill="rgba(255,255,255,0.05)" />
      {/* Street */}
      <rect x="0" y="100" width="160" height="60" rx="0" fill="rgba(96,165,250,0.04)" />
      {/* Water waves — animated */}
      <path d="M0 108 Q20 100 40 108 Q60 116 80 108 Q100 100 120 108 Q140 116 160 108"
        fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="d"
          values="M0 108 Q20 100 40 108 Q60 116 80 108 Q100 100 120 108 Q140 116 160 108;M0 108 Q20 116 40 108 Q60 100 80 108 Q100 116 120 108 Q140 100 160 108;M0 108 Q20 100 40 108 Q60 116 80 108 Q100 100 120 108 Q140 116 160 108"
          dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M0 120 Q20 112 40 120 Q60 128 80 120 Q100 112 120 120 Q140 128 160 120"
        fill="none" stroke="rgba(96,165,250,0.25)" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="d"
          values="M0 120 Q20 112 40 120 Q60 128 80 120 Q100 112 120 120 Q140 128 160 120;M0 120 Q20 128 40 120 Q60 112 80 120 Q100 128 120 120 Q140 112 160 120;M0 120 Q20 112 40 120 Q60 128 80 120 Q100 112 120 120 Q140 128 160 120"
          dur="2.5s" repeatCount="indefinite" />
      </path>
      <path d="M0 132 Q20 126 40 132 Q60 138 80 132 Q100 126 120 132 Q140 138 160 132"
        fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="2" strokeLinecap="round" />
      {/* Danger sign */}
      <g transform="translate(72, 82)">
        <path d="M8 0 L16 14 L0 14 Z" fill="#D42A2A" opacity="0.8" />
        <line x1="8" y1="4" x2="8" y2="9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.8" fill="#fff" />
      </g>
    </svg>
  );
}

function ReportIllustration({ lang }) {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      {/* Phone outline */}
      <rect x="45" y="20" width="70" height="120" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <rect x="70" y="24" width="20" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      {/* Map inside phone */}
      <rect x="51" y="34" width="58" height="80" rx="4" fill="rgba(96,165,250,0.04)" />
      {/* Map grid lines */}
      <line x1="51" y1="55" x2="109" y2="55" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="51" y1="75" x2="109" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="70" y1="34" x2="70" y2="114" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <line x1="90" y1="34" x2="90" y2="114" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      {/* Zone dots */}
      <circle cx="65" cy="50" r="3" fill="#ef4444" opacity="0.8">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="85" cy="65" r="2.5" fill="#eab308" opacity="0.6" />
      <circle cx="75" cy="85" r="2" fill="#22c55e" opacity="0.5" />
      <circle cx="95" cy="48" r="2" fill="rgba(255,255,255,0.15)" />
      <circle cx="60" cy="95" r="2" fill="rgba(255,255,255,0.15)" />
      {/* Tap ripple */}
      <circle cx="65" cy="50" r="8" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="8;16" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Report button on phone */}
      <rect x="58" y="120" width="44" height="14" rx="7" fill="#D42A2A" opacity="0.8" />
      <text x="80" y="130" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="sans-serif">{lang === "en" ? "REPORT" : "REPORTAR"}</text>
      {/* Finger tap */}
      <circle cx="65" cy="50" r="10" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

function AlertIllustration() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      {/* Bell — full, rounded shape */}
      <g transform="translate(80, 55)">
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="-4 0 0;4 0 0;-4 0 0" dur="1.2s" repeatCount="indefinite" />
          {/* Bell body */}
          <path d="M0 -28 C0 -32 4 -35 4 -35 C4 -35 0 -38 0 -38 C0 -38 -4 -35 -4 -35 C-4 -35 0 -32 0 -28 Z"
            fill="rgba(245,208,51,0.6)" />
          <path d="M-22 10 C-22 -8 -16 -22 0 -28 C16 -22 22 -8 22 10 L22 14 C22 14 26 18 28 20 L-28 20 C-26 18 -22 14 -22 14 Z"
            fill="rgba(245,208,51,0.15)" stroke="rgba(245,208,51,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Bell opening — thicker bottom */}
          <rect x="-30" y="18" width="60" height="5" rx="2.5" fill="rgba(245,208,51,0.25)" />
          {/* Highlight */}
          <path d="M-12 -10 C-12 -20 -4 -24 0 -26 C-8 -22 -10 -14 -10 -4"
            fill="none" stroke="rgba(245,208,51,0.2)" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Clapper */}
        <circle cx="0" cy="28" r="5" fill="rgba(245,208,51,0.3)" stroke="rgba(245,208,51,0.4)" strokeWidth="1" />
      </g>
      {/* Notification badge */}
      <circle cx="105" cy="35" r="10" fill="#D42A2A" opacity="0.9" />
      <text x="105" y="39" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800" fontFamily="sans-serif">!</text>
      {/* Signal arcs — left */}
      <path d="M48 40 Q42 48 48 56" fill="none" stroke="rgba(245,208,51,0.2)" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 35 Q32 48 40 61" fill="none" stroke="rgba(245,208,51,0.12)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Signal arcs — right */}
      <path d="M112 40 Q118 48 112 56" fill="none" stroke="rgba(245,208,51,0.2)" strokeWidth="2" strokeLinecap="round" />
      <path d="M120 35 Q128 48 120 61" fill="none" stroke="rgba(245,208,51,0.12)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Notification cards */}
      <g style={{ animation: "fadeIn 0.5s ease 0.3s both" }}>
        <rect x="25" y="95" width="110" height="24" rx="6" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.15)" strokeWidth="1" />
        <circle cx="38" cy="107" r="4" fill="#ef4444" opacity="0.7" />
        <rect x="48" y="102" width="45" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
        <rect x="48" y="109" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.05)" />
      </g>
      <g style={{ animation: "fadeIn 0.5s ease 0.5s both" }}>
        <rect x="30" y="123" width="100" height="22" rx="6" fill="rgba(234,179,8,0.06)" stroke="rgba(234,179,8,0.12)" strokeWidth="1" />
        <circle cx="42" cy="134" r="3.5" fill="#eab308" opacity="0.6" />
        <rect x="50" y="130" width="40" height="3.5" rx="1.5" fill="rgba(255,255,255,0.08)" />
        <rect x="50" y="136" width="25" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
      </g>
    </svg>
  );
}

const slides = {
  es: [
    { Illustration: FloodIllustration, title: "¿Qué es un arroyo?", text: "En Barranquilla, las calles se convierten en ríos peligrosos cuando llueve. Más de 115 vidas perdidas desde 1933." },
    { Illustration: ReportIllustration, title: "Reporta en tiempo real", text: "¿Ves un arroyo activo? Repórtalo en segundos. Tu alerta protege a miles de personas en tu comunidad." },
    { Illustration: AlertIllustration, title: "Recibe alertas", text: "Suscríbete a tus zonas y recibe notificaciones cuando se reporte un arroyo peligroso cerca de ti." },
  ],
  en: [
    { Illustration: FloodIllustration, title: "What is an arroyo?", text: "In Barranquilla, streets become dangerous rivers when it rains. Over 115 lives lost since 1933." },
    { Illustration: ReportIllustration, title: "Report in real time", text: "See an active arroyo? Report it in seconds. Your alert protects thousands of people in your community." },
    { Illustration: AlertIllustration, title: "Get alerts", text: "Subscribe to your zones and get notified when a dangerous arroyo is reported near you." },
  ],
};

export default function Onboarding({ lang, onComplete, onToggleLang }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const s = slides[lang] || slides.es;
  const current = s[step];
  const isLast = step === s.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      try { localStorage.setItem("arroyo-onboarded", "1"); } catch(e) {}
      onComplete();
    } else {
      setDirection(1);
      setStep(step + 1);
    }
  }, [isLast, step, onComplete]);

  const handleSkip = useCallback(() => {
    try { localStorage.setItem("arroyo-onboarded", "1"); } catch(e) {}
    onComplete();
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #070b14 0%, #0a1220 50%, #070b14 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.4s ease", overflow: "hidden",
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, borderRadius: "50%",
        background: step === 0 ? "rgba(96,165,250,0.03)" : step === 1 ? "rgba(212,42,42,0.03)" : "rgba(245,208,51,0.03)",
        filter: "blur(60px)", transition: "background 0.6s ease",
        pointerEvents: "none",
      }} />

      {/* Language toggle */}
      {onToggleLang && (
        <button onClick={onToggleLang} style={{
          position: "absolute", top: 20, right: 20,
          padding: "5px 12px", borderRadius: "8px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.5px", cursor: "pointer", zIndex: 10,
        }}>
          {lang === "es" ? "EN" : "ES"}
        </button>
      )}

      <div style={{ width: "100%", maxWidth: 340, padding: "0 28px", textAlign: "center" }}>
        {/* Illustration */}
        <div key={`ill-${step}`} style={{
          marginBottom: "32px",
          animation: "slideIllustration 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
        }}>
          <current.Illustration lang={lang} />
        </div>

        {/* Text */}
        <div key={`txt-${step}`} style={{ animation: "slideText 0.45s cubic-bezier(0.32, 0.72, 0, 1)" }}>
          <h2 style={{
            fontSize: "24px", fontWeight: 800, color: "var(--text)",
            marginBottom: "12px", letterSpacing: "-0.4px",
          }}>
            {current.title}
          </h2>
          <p style={{
            fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7,
            marginBottom: "40px",
          }}>
            {current.text}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          {s.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 28 : 8, height: 8, borderRadius: "4px",
              background: i === step ? (step === 0 ? "var(--accent)" : step === 1 ? "var(--baq-red)" : "var(--baq-yellow)") : "rgba(255,255,255,0.08)",
              transition: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
            }} />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {step > 0 && (
            <button onClick={() => { setDirection(-1); setStep(step - 1); }} style={{
              width: 52, padding: "17px 0",
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s ease",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <button onClick={goNext} style={{
            flex: 1, padding: "17px",
            background: isLast
              ? "linear-gradient(135deg, #D42A2A, #b91c1c)"
              : step === 0 ? "var(--accent)" : "rgba(255,255,255,0.08)",
            color: "#fff", border: "none", borderRadius: "var(--radius-md)",
            fontSize: "16px", fontWeight: 700, letterSpacing: "-0.2px",
            boxShadow: isLast ? "0 8px 24px rgba(212,42,42,0.25)" : step === 0 ? "0 8px 24px rgba(91,156,246,0.15)" : "none",
          }}>
            {isLast ? (lang === "es" ? "Comenzar" : "Get started") : (lang === "es" ? "Siguiente" : "Next")}
          </button>
        </div>

        {!isLast && (
          <button onClick={handleSkip} style={{
            background: "none", border: "none", color: "var(--text-faint)",
            fontSize: "13px", marginTop: "16px", cursor: "pointer", padding: "8px",
          }}>
            {lang === "es" ? "Saltar" : "Skip"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideIllustration {
          from { opacity: 0; transform: translateX(${direction > 0 ? '30px' : '-30px'}); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideText {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rainFall {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}
