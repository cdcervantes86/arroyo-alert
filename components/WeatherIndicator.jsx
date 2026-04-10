"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const WMO_ICONS = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌧️", 55: "🌧️",
  56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  66: "🌧️", 67: "🌧️",
  71: "❄️", 73: "❄️", 75: "❄️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const WMO_DESC = {
  es: {
    0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado",
    45: "Niebla", 48: "Niebla",
    51: "Llovizna ligera", 53: "Llovizna", 55: "Llovizna fuerte",
    61: "Lluvia ligera", 63: "Lluvia moderada", 65: "Lluvia fuerte",
    80: "Chubascos ligeros", 81: "Chubascos", 82: "Chubascos fuertes",
    95: "Tormenta eléctrica", 96: "Tormenta con granizo", 99: "Tormenta severa",
  },
  en: {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Foggy",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    80: "Light showers", 81: "Showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  },
};

export default function WeatherIndicator() {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [weather, setWeather] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setExpanded(false);
    };
    setTimeout(() => document.addEventListener("click", handler), 10);
    return () => document.removeEventListener("click", handler);
  }, [expanded]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=10.96&longitude=-74.78&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m&hourly=precipitation_probability,precipitation&past_days=1&forecast_days=1&timezone=America/Bogota"
        );
        const data = await res.json();
        const current = data.current;
        const hourly = data.hourly;

        const now = new Date();
        const currentHourIndex = now.getHours() + 24;
        const nextHoursProb = hourly.precipitation_probability
          .slice(currentHourIndex, currentHourIndex + 3)
          .filter(Boolean);
        const maxProb = Math.max(...nextHoursProb, 0);

        // Find last rain
        let lastRainHoursAgo = null;
        const precip = hourly.precipitation || [];
        for (let i = currentHourIndex; i >= 0; i--) {
          if (precip[i] > 0) { lastRainHoursAgo = currentHourIndex - i; break; }
        }

        const isRaining = current.precipitation > 0;
        const code = current.weather_code;
        const isStormy = code >= 95;

        setWeather({
          temp: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          isRaining,
          isStormy,
          maxProb,
          code,
          lastRainHoursAgo,
          icon: WMO_ICONS[code] || "🌤️",
          desc: (es ? WMO_DESC.es : WMO_DESC.en)[code] || (es ? "Despejado" : "Clear"),
        });
      } catch (e) {}
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [es]);

  if (!weather) return null;

  const { temp, isRaining, isStormy, maxProb, icon, lastRainHoursAgo } = weather;

  let pillColor, pillBg;
  if (isStormy) { pillColor = "#ef4444"; pillBg = "var(--danger-bg)"; }
  else if (isRaining) { pillColor = "#f59e0b"; pillBg = "var(--caution-bg)"; }
  else if (maxProb >= 60) { pillColor = "#f59e0b"; pillBg = "var(--caution-bg)"; }
  else { pillColor = "var(--text-dim)"; pillBg = "rgba(255,255,255,0.045)"; }

  const isAlert = isStormy || isRaining || maxProb >= 60;

  let lastRainText = null;
  if (!isRaining && lastRainHoursAgo !== null && lastRainHoursAgo <= 6) {
    lastRainText = lastRainHoursAgo === 0
      ? (es ? "Dejó de llover" : "Rain just stopped")
      : (es ? `Última lluvia: ${lastRainHoursAgo}h` : `Last rain: ${lastRainHoursAgo}h ago`);
  }

  return (
    <div ref={cardRef} style={{ position: "relative" }}>
      {/* Pill — tappable */}
      <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "16px",
        background: pillBg, border: `1px solid ${isAlert ? pillColor + "30" : "var(--border)"}`,
        fontSize: "11px", fontWeight: 600, color: pillColor,
      }}>
        <span style={{ fontSize: "13px" }}>{icon}</span>
        {temp}°C
      </button>

      {/* Expanded card */}
      {expanded && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 220, background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          animation: "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "hidden", zIndex: 900,
        }}>
          {/* Main weather */}
          <div style={{ padding: "20px 18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px", lineHeight: 1 }}>{icon}</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", letterSpacing: "-1px" }}>{temp}°C</div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500, marginTop: "4px" }}>{weather.desc}</div>
            {lastRainText && (
              <div style={{
                marginTop: "8px", padding: "4px 12px", borderRadius: "12px", display: "inline-block",
                background: lastRainHoursAgo <= 2 ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${lastRainHoursAgo <= 2 ? "rgba(234,179,8,0.12)" : "var(--border)"}`,
                fontSize: "11px", fontWeight: 600,
                color: lastRainHoursAgo <= 2 ? "#f59e0b" : "var(--text-faint)",
              }}>
                {lastRainText}
              </div>
            )}
          </div>

          {/* Details row */}
          <div style={{
            display: "flex", borderTop: "1px solid var(--border)",
            padding: "12px 0",
          }}>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{weather.humidity}%</div>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{es ? "Humedad" : "Humidity"}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{weather.windSpeed} <span style={{ fontSize: "10px", fontWeight: 400 }}>km/h</span></div>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{es ? "Viento" : "Wind"}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: maxProb >= 60 ? "#f59e0b" : "var(--text)" }}>{maxProb}%</div>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{es ? "Lluvia" : "Rain"}</div>
            </div>
          </div>

          {/* Alert if rain likely */}
          {maxProb >= 50 && !isRaining && (
            <div style={{
              padding: "10px 14px", borderTop: "1px solid var(--border)",
              background: "rgba(234,179,8,0.04)",
              fontSize: "12px", color: "#f59e0b", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ fontSize: "14px" }}>⚠️</span>
              {es ? "Lluvia probable — prepárate" : "Rain likely — be prepared"}
            </div>
          )}

          {/* Source */}
          <div style={{ padding: "6px 14px", borderTop: "1px solid var(--border)", textAlign: "right" }}>
            <span style={{ fontSize: "9px", color: "var(--text-faint)", opacity: 0.5 }}>Open-Meteo</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
