"use client";
import { useState, useEffect, useRef } from "react";
import { ZONES, SEVERITY, getZoneSeverity } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceKm(px, py, x1, y1);
  let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return distanceKm(px, py, x1 + t * dx, y1 + t * dy);
}

function ResultPanel({ result, origin, destination, onReset, es }) {
  const googleMapsUrl = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`;

  return (
    <div style={{
      background: "var(--bg-elevated)",
      borderTop: "1px solid var(--border)",
      padding: "20px", overflowY: "auto", maxHeight: "50vh",
      flexShrink: 0,
    }}>
      {/* Verdict */}
      <div style={{
        display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px",
        padding: "16px", borderRadius: "var(--radius-lg)",
        background: result.safe ? "var(--safe-bg)" : result.hasDanger ? "var(--danger-bg)" : "var(--caution-bg)",
        border: `1px solid ${result.safe ? "var(--safe-border)" : result.hasDanger ? "var(--danger-border)" : "var(--caution-border)"}`,
      }}>
        <span style={{ fontSize: "36px" }}>
          {result.safe ? "✅" : result.hasDanger ? "🚫" : "⚠️"}
        </span>
        <div>
          <div style={{
            fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px",
            color: result.safe ? "var(--safe)" : result.hasDanger ? "var(--danger)" : "var(--caution)",
          }}>
            {result.safe
              ? (es ? "¡Ruta segura!" : "Safe route!")
              : result.hasDanger
                ? (es ? "¡Ruta peligrosa!" : "Dangerous route!")
                : (es ? "Precaución en la ruta" : "Caution on route")}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: 2 }}>
            {result.safe
              ? (es ? "No hay arroyos activos en tu camino" : "No active arroyos on your path")
              : (es
                  ? `${result.zones.length} arroyo${result.zones.length > 1 ? "s" : ""} activo${result.zones.length > 1 ? "s" : ""} cerca de tu ruta`
                  : `${result.zones.length} active arroyo${result.zones.length > 1 ? "s" : ""} near your route`)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 3 }}>📏 {result.distKm.toFixed(1)} km</div>
        </div>
      </div>

      {/* Affected zones */}
      {result.zones.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "10px" }}>
            {es ? "Arroyos en tu ruta" : "Arroyos on your route"}
          </div>
          {result.zones.map((z, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 0",
              borderBottom: i < result.zones.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: "16px" }}>{SEVERITY[z.severity].emoji}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{z.name}</span>
                <span style={{ fontSize: "13px", color: "var(--text-dim)", marginLeft: 6 }}>{z.area}</span>
              </div>
              <span style={{
                fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px",
                background: `${SEVERITY[z.severity].color}15`, color: SEVERITY[z.severity].color,
              }}>
                ~{Math.round(z.distance * 1000)}m
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Navigate buttons */}
      <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "10px" }}>
        {es ? "Navegar con" : "Navigate with"}
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, padding: "13px", borderRadius: "var(--radius-md)",
          background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.2)",
          color: "#4285F4", fontSize: "13px", fontWeight: 700,
          textDecoration: "none", textAlign: "center",
        }}>
          📍 Google Maps
        </a>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, padding: "13px", borderRadius: "var(--radius-md)",
          background: "rgba(51,204,255,0.08)", border: "1px solid rgba(51,204,255,0.15)",
          color: "#33CCFF", fontSize: "13px", fontWeight: 700,
          textDecoration: "none", textAlign: "center",
        }}>
          🚗 Waze
        </a>
        <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, padding: "13px", borderRadius: "var(--radius-md)",
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", fontSize: "13px", fontWeight: 700,
          textDecoration: "none", textAlign: "center",
        }}>
          🗺️ Apple
        </a>
      </div>

      {/* Reset */}
      <button onClick={onReset} style={{
        width: "100%", padding: "13px",
        background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", color: "var(--accent)",
        fontSize: "14px", fontWeight: 600, cursor: "pointer",
      }}>
        🔄 {es ? "Verificar otra ruta" : "Check another route"}
      </button>
    </div>
  );
}

export default function RouteChecker({ reports, onBack, onLogoClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [step, setStep] = useState("origin");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" });
    const map = L.map(mapRef.current, { center: [10.96, -74.805], zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const handler = (e) => {
      const ll = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (step === "origin") { setOrigin(ll); setStep("destination"); }
      else if (step === "destination") { setDestination(ll); }
    };
    map.off("click"); map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [step]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const colors = { danger: "#ef4444", caution: "#f59e0b", safe: "#22c55e" };
      const col = sev ? colors[sev] : "#555";
      const size = sev ? 14 : 8;
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:' + size + "px;height:" + size + "px;background:" + col + ";border-radius:50%;border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 10px " + col + '50;"></div>',
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      const m = L.marker([zone.lat, zone.lng], { icon, interactive: false }).addTo(map);
      m.bindTooltip("<b>" + zone.name + "</b><br/>" + (sev ? SEVERITY[sev].label : "Sin reportes"), { className: "arroyo-tooltip", direction: "top", offset: [0, -10] });
      layersRef.current.push(m);
    });

    if (origin) {
      const oi = L.divIcon({ className: "", html: '<div style="width:24px;height:24px;background:#3B82F6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">A</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
      layersRef.current.push(L.marker([origin.lat, origin.lng], { icon: oi, interactive: false }).addTo(map));
    }

    if (destination) {
      const di = L.divIcon({ className: "", html: '<div style="width:24px;height:24px;background:#22C55E;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(34,197,94,0.6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">B</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
      layersRef.current.push(L.marker([destination.lat, destination.lng], { icon: di, interactive: false }).addTo(map));

      const line = L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], { color: "#60a5fa", weight: 3, dashArray: "10,8", opacity: 0.6 }).addTo(map);
      layersRef.current.push(line);

      const RADIUS = 0.4;
      const nearbyZones = [];
      ZONES.forEach((zone) => {
        const sev = getZoneSeverity(zone.id, reports);
        if (!sev || sev === "safe") return;
        const dist = pointToSegmentDist(zone.lat, zone.lng, origin.lat, origin.lng, destination.lat, destination.lng);
        if (dist <= RADIUS) {
          nearbyZones.push({ ...zone, severity: sev, distance: dist });
          const wc = L.circleMarker([zone.lat, zone.lng], {
            radius: 30, fillColor: sev === "danger" ? "#ef4444" : "#f59e0b",
            fillOpacity: 0.12, color: sev === "danger" ? "#ef4444" : "#f59e0b",
            weight: 2, opacity: 0.4, dashArray: "6,4",
          }).addTo(map);
          layersRef.current.push(wc);
        }
      });

      nearbyZones.sort((a, b) => a.distance - b.distance);
      setResult({
        safe: nearbyZones.length === 0,
        zones: nearbyZones,
        hasDanger: nearbyZones.some((z) => z.severity === "danger"),
        distKm: distanceKm(origin.lat, origin.lng, destination.lat, destination.lng),
      });
      setStep("result");
      map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [60, 60] });
    }
  }, [origin, destination, reports]);

  const handleReset = () => { setOrigin(null); setDestination(null); setResult(null); setStep("origin"); };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 50, flexShrink: 0 }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5, flexShrink: 0 }}>
            <defs><linearGradient id="lBgR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
            <rect width="512" height="512" rx="112" fill="url(#lBgR)" />
            <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
            <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
            <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span></span>
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>🛣️ {es ? "Ruta segura" : "Safe route"}</span>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>
          {es ? "← Volver" : "← Back"}
        </button>
      </div>

      {/* Instruction pill - OUTSIDE map, between header and map */}
      {step !== "result" && (
        <div style={{
          padding: "10px 20px", textAlign: "center", flexShrink: 0,
          background: step === "origin" ? "rgba(59,130,246,0.08)" : "rgba(34,197,94,0.08)",
          borderBottom: "1px solid var(--border)",
          fontSize: "14px", fontWeight: 600,
          color: step === "origin" ? "#3B82F6" : "#22C55E",
        }}>
          {step === "origin" && `📍 ${es ? "Toca el mapa: tu punto de origen (A)" : "Tap the map: your starting point (A)"}`}
          {step === "destination" && `📍 ${es ? "Ahora toca tu destino (B)" : "Now tap your destination (B)"}`}
        </div>
      )}

      {/* Map — takes remaining space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "var(--bg)" }} />
      </div>

      {/* Result panel — OUTSIDE map, at bottom of flex column */}
      {result && origin && destination && (
        <ResultPanel result={result} origin={origin} destination={destination} onReset={handleReset} es={es} />
      )}
    </div>
  );
}
