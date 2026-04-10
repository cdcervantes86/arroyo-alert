"use client";
import { useState, useEffect, useRef } from "react";
import { ZONES, SEVERITY, getZoneSeverity } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
    <div style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "20px", overflowY: "auto", maxHeight: "50vh", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px", padding: "16px", borderRadius: "var(--radius-lg)", background: result.safe ? "var(--safe-bg)" : result.hasDanger ? "var(--danger-bg)" : "var(--caution-bg)", border: `1px solid ${result.safe ? "var(--safe-border)" : result.hasDanger ? "var(--danger-border)" : "var(--caution-border)"}` }}>
        <span style={{ fontSize: "36px" }}>{result.safe ? "✅" : result.hasDanger ? "🚫" : "⚠️"}</span>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px", color: result.safe ? "var(--safe)" : result.hasDanger ? "var(--danger)" : "var(--caution)" }}>
            {result.safe ? (es ? "¡Ruta segura!" : "Safe route!") : result.hasDanger ? (es ? "¡Ruta peligrosa!" : "Dangerous route!") : (es ? "Precaución en la ruta" : "Caution on route")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>{result.distKm.toFixed(1)} km · {result.zones.length} {es ? "arroyos cercanos" : "nearby arroyos"}</div>
        </div>
      </div>
      {result.zones.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "8px" }}>{es ? "Arroyos en tu ruta" : "Arroyos on your route"}</div>
          {result.zones.map((z, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < result.zones.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: "14px" }}>{z.severity === "danger" ? "🔴" : "🟡"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>{z.area}</span></div>
                <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: 2 }}>{z.distance.toFixed(1)} km {es ? "de tu ruta" : "from route"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.15)", color: "#4285F4", textDecoration: "none", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Google Maps</a>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(51,171,255,0.08)", border: "1px solid rgba(51,171,255,0.15)", color: "#33ABFF", textDecoration: "none", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Waze</a>
        <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Apple Maps</a>
      </div>
      <button onClick={onReset} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-dim)", fontSize: "13px", fontWeight: 600 }}>{es ? "Nueva ruta" : "New route"}</button>
    </div>
  );
}

export default function RouteChecker({ reports, onBack, onLogoClick }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lineSourceAdded = useRef(false);
  const initRef = useRef(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [step, setStep] = useState("origin");
  const [result, setResult] = useState(null);

  // Init map
  useEffect(() => {
    if (initRef.current || !mapRef.current || !MAPBOX_TOKEN) return;
    initRef.current = true;
    const mapboxgl = require("mapbox-gl");
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({ container: mapRef.current, style: "mapbox://styles/mapbox/dark-v11", center: [-74.805, 10.96], zoom: 12.5, attributionControl: false, pitchWithRotate: false, dragRotate: false });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; initRef.current = false; };
  }, []);

  // Handle map clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const handler = (e) => {
      const ll = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      if (step === "origin") { setOrigin(ll); setStep("destination"); }
      else if (step === "destination") { setDestination(ll); }
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [step]);

  // Update markers and route line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const mapboxgl = require("mapbox-gl");

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Zone dots
    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const colors = { danger: "#ef4444", caution: "#f59e0b", safe: "#22c55e" };
      const col = sev ? colors[sev] : "#555";
      const size = sev ? 14 : 8;
      const el = document.createElement("div");
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 10px ${col}50;`;
      const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, closeOnClick: false, className: "arroyo-mapbox-popup" })
        .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#fff;"><b>${zone.name}</b><br/>${sev ? SEVERITY[sev].label : "Sin reportes"}</div>`);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([zone.lng, zone.lat]).setPopup(popup).addTo(map);
      el.addEventListener("mouseenter", () => marker.togglePopup());
      el.addEventListener("mouseleave", () => marker.getPopup().remove());
      markersRef.current.push(marker);
    });

    // Origin marker
    if (origin) {
      const oel = document.createElement("div");
      oel.style.cssText = "width:24px;height:24px;background:#3B82F6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;";
      oel.textContent = "A";
      markersRef.current.push(new mapboxgl.Marker({ element: oel, anchor: "center" }).setLngLat([origin.lng, origin.lat]).addTo(map));
    }

    // Destination marker
    if (destination) {
      const del2 = document.createElement("div");
      del2.style.cssText = "width:24px;height:24px;background:#22C55E;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(34,197,94,0.6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;";
      del2.textContent = "B";
      markersRef.current.push(new mapboxgl.Marker({ element: del2, anchor: "center" }).setLngLat([destination.lng, destination.lat]).addTo(map));
    }

    // Route line + analysis
    if (origin && destination) {
      // Remove old line
      if (lineSourceAdded.current) {
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getSource("route-source")) map.removeSource("route-source");
      }

      // Wait for map style to be loaded
      const addLine = () => {
        map.addSource("route-source", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [[origin.lng, origin.lat], [destination.lng, destination.lat]] } } });
        map.addLayer({ id: "route-line", type: "line", source: "route-source", paint: { "line-color": "#60a5fa", "line-width": 3, "line-dasharray": [3, 2] } });
        lineSourceAdded.current = true;
      };
      if (map.isStyleLoaded()) addLine();
      else map.on("load", addLine);

      // Check nearby zones
      const RADIUS = 0.4;
      const nearbyZones = [];
      ZONES.forEach((zone) => {
        const sev = getZoneSeverity(zone.id, reports);
        if (!sev || sev === "safe") return;
        const dist = pointToSegmentDist(zone.lat, zone.lng, origin.lat, origin.lng, destination.lat, destination.lng);
        if (dist <= RADIUS) {
          nearbyZones.push({ ...zone, severity: sev, distance: dist });
          // Warning circle
          const wEl = document.createElement("div");
          const wSize = 60;
          const wColor = sev === "danger" ? "#ef4444" : "#f59e0b";
          wEl.style.cssText = `width:${wSize}px;height:${wSize}px;border-radius:50%;border:2px dashed ${wColor}60;background:${wColor}10;pointer-events:none;`;
          markersRef.current.push(new mapboxgl.Marker({ element: wEl, anchor: "center" }).setLngLat([zone.lng, zone.lat]).addTo(map));
        }
      });

      nearbyZones.sort((a, b) => a.distance - b.distance);
      setResult({ safe: nearbyZones.length === 0, zones: nearbyZones, hasDanger: nearbyZones.some((z) => z.severity === "danger"), distKm: distanceKm(origin.lat, origin.lng, destination.lat, destination.lng) });
      setStep("result");

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([origin.lng, origin.lat]);
      bounds.extend([destination.lng, destination.lat]);
      map.fitBounds(bounds, { padding: 60, duration: 500 });
    }
  }, [origin, destination, reports]);

  const handleReset = () => {
    setOrigin(null); setDestination(null); setResult(null); setStep("origin");
    const map = mapInstanceRef.current;
    if (map && lineSourceAdded.current) {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route-source")) map.removeSource("route-source");
      lineSourceAdded.current = false;
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 50, flexShrink: 0 }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBgR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBgR)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-dim)" }}>🛣️ {es ? "Ruta segura" : "Safe route"}</span>
        <span style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{es ? "← Volver" : "← Back"}</button>
      </div>
      {step !== "result" && (
        <div style={{ padding: "10px 20px", textAlign: "center", flexShrink: 0, background: step === "origin" ? "rgba(59,130,246,0.08)" : "rgba(34,197,94,0.08)", borderBottom: "1px solid var(--border)", fontSize: "14px", fontWeight: 600, color: step === "origin" ? "#3B82F6" : "#22C55E" }}>
          {step === "origin" && `📍 ${es ? "Toca el mapa: tu punto de origen (A)" : "Tap the map: your starting point (A)"}`}
          {step === "destination" && `📍 ${es ? "Ahora toca tu destino (B)" : "Now tap your destination (B)"}`}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#070b14", touchAction: "none" }} />
      </div>
      {result && origin && destination && <ResultPanel result={result} origin={origin} destination={destination} onReset={handleReset} es={es} />}
    </div>
  );
}
