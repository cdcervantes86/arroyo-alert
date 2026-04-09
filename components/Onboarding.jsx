"use client";
import { useState } from "react";

const slides = {
  es: [
    {
      icon: "🌊",
      title: "¿Qué es un arroyo?",
      text: "En Barranquilla, las calles se inundan con corrientes peligrosas cuando llueve. Se han cobrado más de 115 vidas desde 1933.",
    },
    {
      icon: "📍",
      title: "Reporta en tiempo real",
      text: "Si ves un arroyo activo, repórtalo en segundos. Tu alerta ayuda a proteger a miles de personas.",
    },
    {
      icon: "🔔",
      title: "Recibe alertas",
      text: "Suscríbete a las zonas que te importan y recibe notificaciones cuando se reporte un arroyo peligroso.",
    },
  ],
  en: [
    {
      icon: "🌊",
      title: "What is an arroyo?",
      text: "In Barranquilla, streets flood with dangerous currents when it rains. Over 115 lives lost since 1933.",
    },
    {
      icon: "📍",
      title: "Report in real time",
      text: "If you see an active arroyo, report it in seconds. Your alert helps protect thousands of people.",
    },
    {
      icon: "🔔",
      title: "Get alerts",
      text: "Subscribe to the zones you care about and get notified when a dangerous arroyo is reported.",
    },
  ],
};

export default function Onboarding({ lang, onComplete }) {
  const [step, setStep] = useState(0);
  const s = slides[lang] || slides.es;
  const current = s[step];
  const isLast = step === s.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.4s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 380, padding: "40px 32px",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          fontSize: "64px", marginBottom: "20px",
          animation: "successPulse 0.5s ease",
          key: step,
        }}>
          {current.icon}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: "22px", fontWeight: 700, color: "var(--text)",
          marginBottom: "10px", letterSpacing: "-0.3px",
          animation: "fadeIn 0.3s ease 0.1s both",
        }}>
          {current.title}
        </h2>

        {/* Text */}
        <p style={{
          fontSize: "15px", color: "var(--text-secondary)",
          lineHeight: 1.6, marginBottom: "32px",
          animation: "fadeIn 0.3s ease 0.2s both",
        }}>
          {current.text}
        </p>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
          {s.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8,
              borderRadius: "4px",
              background: i === step ? "var(--accent)" : "rgba(255,255,255,0.15)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* Button */}
        <button onClick={() => {
          if (isLast) {
            localStorage.setItem("arroyo-onboarded", "1");
            onComplete();
          } else {
            setStep(step + 1);
          }
        }} style={{
          width: "100%", padding: "16px",
          background: isLast ? "linear-gradient(135deg, #D42A2A, #c42222)" : "var(--accent)",
          color: "#fff", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "16px", fontWeight: 700,
          boxShadow: isLast ? "0 8px 24px rgba(212,42,42,0.3)" : "0 8px 24px rgba(96,165,250,0.2)",
        }}>
          {isLast ? (lang === "es" ? "Comenzar" : "Get started") : (lang === "es" ? "Siguiente" : "Next")}
        </button>

        {/* Skip */}
        {!isLast && (
          <button onClick={() => {
            localStorage.setItem("arroyo-onboarded", "1");
            onComplete();
          }} style={{
            background: "none", border: "none", color: "var(--text-faint)",
            fontSize: "13px", marginTop: "16px", cursor: "pointer",
          }}>
            {lang === "es" ? "Saltar" : "Skip"}
          </button>
        )}
      </div>
    </div>
  );
}
