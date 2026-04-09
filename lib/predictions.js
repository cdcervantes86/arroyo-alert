// Emergency mode: triggers when many danger reports come in quickly
// Flood prediction: estimates probability based on history + weather

import { ZONES } from "./zones";

// EMERGENCY MODE
// Threshold: 5+ danger reports in the last 30 minutes
const EMERGENCY_THRESHOLD = 5;
const EMERGENCY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export function checkEmergencyMode(reports) {
  const now = Date.now();
  const recentDanger = reports.filter(
    (r) => r.severity === "danger" && (now - new Date(r.created_at).getTime()) < EMERGENCY_WINDOW_MS
  );
  return {
    active: recentDanger.length >= EMERGENCY_THRESHOLD,
    dangerCount: recentDanger.length,
    threshold: EMERGENCY_THRESHOLD,
  };
}

// FLOOD PREDICTION
// Combines historical frequency with current weather conditions
// Returns a prediction score 0-100 for each zone

export function getFloodPredictions(allReports, weather) {
  const predictions = {};

  // Count historical reports per zone (all time)
  const zoneTotals = {};
  const zoneRecentCounts = {};
  const now = Date.now();

  allReports.forEach((r) => {
    zoneTotals[r.zone_id] = (zoneTotals[r.zone_id] || 0) + 1;
    // Reports in last 24h
    if (now - new Date(r.created_at).getTime() < 86400000) {
      zoneRecentCounts[r.zone_id] = (zoneRecentCounts[r.zone_id] || 0) + 1;
    }
  });

  const maxTotal = Math.max(...Object.values(zoneTotals), 1);

  ZONES.forEach((zone) => {
    const total = zoneTotals[zone.id] || 0;
    const recent = zoneRecentCounts[zone.id] || 0;

    // Base score from historical frequency (0-40)
    const historyScore = (total / maxTotal) * 40;

    // Recent activity boost (0-30)
    const recentScore = Math.min(recent * 10, 30);

    // Weather factor (0-30)
    let weatherScore = 0;
    if (weather) {
      if (weather.isStormy) weatherScore = 30;
      else if (weather.isRaining) weatherScore = 25;
      else if (weather.maxProb >= 70) weatherScore = 20;
      else if (weather.maxProb >= 40) weatherScore = 10;
    }

    const rawScore = historyScore + recentScore + weatherScore;
    const score = Math.min(Math.round(rawScore), 99);

    predictions[zone.id] = {
      score,
      level: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
      label: score >= 70 ? "Alta" : score >= 40 ? "Media" : "Baja",
      labelEn: score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
    };
  });

  return predictions;
}
