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
  const [closing, setClosing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target) && 
          (!dropdownRef.current || !dropdownRef.current.contains(e.target))) {
        handleClose();
      }
    };
    setTimeout(() => document.addEventListener("click", handler), 10);
    return () => document.removeEventListener("click", handler);
  }, [expanded]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setExpanded(false); setClosing(false); }, 200);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (expanded) handleClose();
    else setExpanded(true);
  };

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
          isRaining, isStormy, maxProb, code, lastRainHoursAgo,
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

  const animClass = closing ? "weather-card-exit" : "weather-card-enter";

  // Get button position for fixed dropdown
  const btnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  useEffect(() => {
    if (expanded && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [expanded]);

  return (
    <div ref={cardRef} style={{ position: "relative", zIndex: 1000 }}>
      {/* Pill — tappable with hover effect */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "4px 10px", borderRadius: "99px",
          background: expanded ? "rgba(255,255,255,0.08)" : hovered ? "rgba(255,255,255,0.06)" : pillBg,
          border: `1px solid ${expanded ? "rgba(255,255,255,0.15)" : isAlert ? pillColor + "30" : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
          fontSize: "11px", fontWeight: 600, color: pillColor,
          transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          transform: hovered && !expanded ? "scale(1.05)" : "scale(1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <span style={{
          fontSize: "13px",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          transform: expanded ? "scale(1.15)" : "scale(1)",
          display: "inline-block",
        }}>{icon}</span>
        {temp}°C
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{
          transition: "transform 0.25s ease, opacity 0.25s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          opacity: 0.5,
          marginLeft: "1px",
        }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {/* Expanded card */}
      {expanded && (
        <div ref={dropdownRef} className={animClass} style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right,
          width: 230, background: "rgba(12,18,32,0.35)",
          backdropFilter: "blur(20px) saturate(1.6)", WebkitBackdropFilter: "blur(20px) saturate(1.6)",
          borderRadius: "16px", border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          overflow: "hidden",
          transformOrigin: "top right",
          zIndex: 1001,
        }}>
          {/* Main weather */}
          <div style={{ padding: "22px 18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "52px", marginBottom: "8px", lineHeight: 1 }}>{icon}</div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "var(--text)", letterSpacing: "-1px" }}>{temp}°C</div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500, marginTop: "4px" }}>{weather.desc}</div>
            {lastRainText && (
              <div style={{
                marginTop: "10px", padding: "4px 12px", borderRadius: "12px", display: "inline-block",
                background: lastRainHoursAgo <= 2 ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${lastRainHoursAgo <= 2 ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.06)"}`,
                fontSize: "11px", fontWeight: 600,
                color: lastRainHoursAgo <= 2 ? "#f59e0b" : "var(--text-faint)",
              }}>
                {lastRainText}
              </div>
            )}
          </div>

          {/* Details row */}
          <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 0" }}>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{weather.humidity}%</div>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{es ? "Humedad" : "Humidity"}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
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
              padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(234,179,8,0.04)",
              fontSize: "12px", color: "#f59e0b", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {es ? "Lluvia probable — prepárate" : "Rain likely — be prepared"}
            </div>
          )}

          {/* Source + Barranquilla label */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 500 }}>Barranquilla</span>
            <span style={{ fontSize: "9px", color: "var(--text-faint)", opacity: 0.4 }}>Open-Meteo</span>
          </div>
        </div>
      )}

      <style>{`
        .weather-card-enter {
          animation: weatherExpand 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .weather-card-exit {
          animation: weatherCollapse 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        @keyframes weatherExpand {
          0% { opacity: 0; transform: scale(0.92) translateY(-6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes weatherCollapse {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.95) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
