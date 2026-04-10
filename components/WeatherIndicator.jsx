"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function WeatherIndicator() {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=10.96&longitude=-74.78&current=temperature_2m,weather_code,precipitation&hourly=precipitation_probability,precipitation&past_days=1&forecast_days=1&timezone=America/Bogota"
        );
        const data = await res.json();
        const current = data.current;
        const hourly = data.hourly;

        const now = new Date();
        const currentHourIndex = now.getHours() + 24; // +24 because past_days=1
        const nextHoursProb = hourly.precipitation_probability
          .slice(currentHourIndex, currentHourIndex + 3)
          .filter(Boolean);
        const maxProb = Math.max(...nextHoursProb, 0);

        // Find last rain: scan backwards through hourly precipitation
        let lastRainHoursAgo = null;
        const precip = hourly.precipitation || [];
        for (let i = currentHourIndex; i >= 0; i--) {
          if (precip[i] > 0) {
            lastRainHoursAgo = currentHourIndex - i;
            break;
          }
        }

        const isRaining = current.precipitation > 0;
        const code = current.weather_code;
        const isStormy = code >= 95;
        const isRainy = code >= 51;

        setWeather({
          temp: Math.round(current.temperature_2m),
          isRaining, isRainy, isStormy, maxProb, code,
          lastRainHoursAgo,
        });
      } catch (e) {}
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  const { temp, isRaining, isRainy, isStormy, maxProb, lastRainHoursAgo } = weather;

  let icon, label, color, bg;
  if (isStormy) {
    icon = "⛈️"; color = "#ef4444"; bg = "var(--danger-bg)";
    label = es ? "Tormenta" : "Storm";
  } else if (isRaining) {
    icon = "🌧️"; color = "#f59e0b"; bg = "var(--caution-bg)";
    label = es ? "Lloviendo" : "Raining";
  } else if (maxProb >= 60) {
    icon = "🌦️"; color = "#f59e0b"; bg = "var(--caution-bg)";
    label = es ? `Lluvia ${maxProb}%` : `Rain ${maxProb}%`;
  } else if (isRainy) {
    icon = "🌦️"; color = "var(--text-dim)"; bg = "rgba(255,255,255,0.03)";
    label = es ? "Llovizna" : "Drizzle";
  } else {
    icon = "☀️"; color = "var(--text-dim)"; bg = "rgba(255,255,255,0.03)";
    label = `${temp}°C`;
  }

  // Last rain subtitle
  let lastRainText = null;
  if (!isRaining && lastRainHoursAgo !== null) {
    if (lastRainHoursAgo === 0) lastRainText = es ? "Dejó de llover" : "Rain just stopped";
    else if (lastRainHoursAgo <= 24) lastRainText = es ? `Última lluvia: ${lastRainHoursAgo}h` : `Last rain: ${lastRainHoursAgo}h ago`;
  }

  const isAlert = isStormy || isRaining || maxProb >= 60;
  const showLastRain = lastRainText && lastRainHoursAgo <= 6; // Only show if recent

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "16px",
        background: bg, border: `1px solid ${isAlert ? color + "30" : "var(--border)"}`,
        fontSize: "11px", fontWeight: 600, color,
        animation: isAlert ? "fadeIn 0.3s ease" : "none",
      }}>
        <span style={{ fontSize: "13px" }}>{icon}</span>
        {label}
      </div>
      {showLastRain && (
        <span style={{
          fontSize: "8px", color: lastRainHoursAgo <= 2 ? "#f59e0b" : "var(--text-faint)",
          fontWeight: 600, letterSpacing: "0.3px",
        }}>
          {lastRainText}
        </span>
      )}
    </div>
  );
}
