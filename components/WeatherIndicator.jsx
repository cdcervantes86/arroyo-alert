"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function WeatherIndicator() {
  const { lang } = useLanguage();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=10.96&longitude=-74.78&current=temperature_2m,weather_code,precipitation&hourly=precipitation_probability&forecast_days=1&timezone=America/Bogota"
        );
        const data = await res.json();
        const current = data.current;
        const hourly = data.hourly;

        // Find next few hours precipitation probability
        const now = new Date();
        const currentHourIndex = now.getHours();
        const nextHoursProb = hourly.precipitation_probability
          .slice(currentHourIndex, currentHourIndex + 3)
          .filter(Boolean);
        const maxProb = Math.max(...nextHoursProb, 0);

        const isRaining = current.precipitation > 0;
        const code = current.weather_code;
        // WMO codes: 0-3 clear/cloudy, 51-67 drizzle/rain, 80-82 showers, 95-99 thunderstorms
        const isStormy = code >= 95;
        const isRainy = code >= 51;

        setWeather({
          temp: Math.round(current.temperature_2m),
          isRaining,
          isRainy,
          isStormy,
          maxProb,
          code,
        });
      } catch (e) {
        // Silently fail — weather is non-critical
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  const { temp, isRaining, isRainy, isStormy, maxProb } = weather;

  let icon, label, color, bg;
  if (isStormy) {
    icon = "⛈️"; color = "#ef4444"; bg = "var(--danger-bg)";
    label = lang === "es" ? "Tormenta" : "Storm";
  } else if (isRaining) {
    icon = "🌧️"; color = "#f59e0b"; bg = "var(--caution-bg)";
    label = lang === "es" ? "Lloviendo" : "Raining";
  } else if (maxProb >= 60) {
    icon = "🌦️"; color = "#f59e0b"; bg = "var(--caution-bg)";
    label = lang === "es" ? `Lluvia ${maxProb}%` : `Rain ${maxProb}%`;
  } else if (isRainy) {
    icon = "🌦️"; color = "var(--text-dim)"; bg = "rgba(255,255,255,0.03)";
    label = lang === "es" ? "Llovizna" : "Drizzle";
  } else {
    icon = "☀️"; color = "var(--text-dim)"; bg = "rgba(255,255,255,0.03)";
    label = `${temp}°C`;
  }

  const isAlert = isStormy || isRaining || maxProb >= 60;

  return (
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
  );
}
