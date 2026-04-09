"use client";
import { useEffect, useRef, useState } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { useRainRadar, RainRadarButton } from "./RainRadar";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);

  const radar = useRainRadar(mapInstanceRef.current);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" });
    const map = L.map(mapRef.current, { center: [10.96, -74.805], zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addAttribution('&copy; <a href="https://openstreetmap.org/copyright" style="color:rgba(255,255,255,0.3)">OSM</a>').addTo(map);
    mapInstanceRef.current = map;
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); map.remove(); mapInstanceRef.current = null; };
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current; const L = require("leaflet");
    setLocating(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mapInstanceRef.current) return;
        const { latitude, longitude } = pos.coords;
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        const icon = L.divIcon({ className: "", html: '<div style="position:relative;width:18px;height:18px;"><div style="position:absolute;inset:-6px;background:rgba(59,130,246,0.15);border-radius:50%;"></div><div style="width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(59,130,246,0.5);"></div></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
        userMarkerRef.current = L.marker([latitude, longitude], { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
        userMarkerRef.current.bindTooltip("Tú", { className: "arroyo-tooltip", direction: "top", offset: [0, -12] });
        if (!located) { map.setView([latitude, longitude], 14); setLocated(true); }
        setLocating(false);
      }, () => { setLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => { const map = mapInstanceRef.current; if (!map) return; const t = setTimeout(() => map.invalidateSize(), 100); return () => clearTimeout(t); }, [panelOpen]);

  useEffect(() => {
    const map = mapInstanceRef.current; if (!map) return;
    const L = require("leaflet");
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const zr = getZoneReports(zone.id, reports);
      const count = zr.length;
      const pred = predictions?.[zone.id];
      const colors = { danger: "#ef4444", caution: "#eab308", safe: "#22c55e" };
      const col = sev ? colors[sev] : (pred?.score >= 40 ? "#60a5fa40" : "#555");
      const size = sev === "danger" ? 22 : sev ? 16 : 10;
      const pulse = sev === "danger";
      const matchesFilter = !activeFilter || sev === activeFilter;
      const opacity = matchesFilter ? 1 : 0.15;

      const badge = count >= 2 && matchesFilter
        ? '<div style="position:absolute;top:-8px;right:-8px;min-width:18px;height:18px;background:#fff;color:#000;border-radius:9px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:DM Sans,sans-serif;z-index:5;box-shadow:0 2px 8px rgba(0,0,0,0.4);">' + count + '</div>'
        : '';

      // Prediction ring for inactive zones with high prediction
      const predRing = !sev && pred && pred.score >= 40 && matchesFilter
        ? '<div style="position:absolute;inset:-6px;border:2px dashed ' + (pred.score >= 70 ? '#ef444460' : '#eab30840') + ';border-radius:50%;"></div>'
        : '';

      const icon = L.divIcon({
        className: "",
        html: '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">' + badge + predRing +
          '<div style="width:' + size + "px;height:" + size + "px;background:" + col +
          ";border-radius:50%;border:2px solid rgba(255,255,255,0.55);box-shadow:0 0 14px " + col + "70;cursor:pointer;opacity:" + opacity + ";" +
          (pulse && matchesFilter ? "animation:danger-pulse 2s ease-in-out infinite;" : "") + '"></div></div>',
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon }).on("click", () => onZoneClick(zone.id)).addTo(map);
      const label = sev ? SEVERITY[sev].label : "Sin reportes";
      const predLabel = pred && pred.score >= 20 ? `<br/><span style="color:${pred.score >= 70 ? '#ef4444' : pred.score >= 40 ? '#eab308' : '#60a5fa'}">${pred.score}% probabilidad</span>` : '';
      marker.bindTooltip("<b>" + zone.name + "</b><br/><span style='opacity:0.6'>" + zone.area + "</span><br/>" + label +
        (count > 0 ? " · " + count + " reporte" + (count > 1 ? "s" : "") : "") + predLabel,
        { className: "arroyo-tooltip", direction: "top", offset: [0, -14] });
      markersRef.current.push(marker);
    });
  }, [reports, onZoneClick, activeFilter, predictions]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", background: "var(--bg)" }} />
      {/* Map controls — right side */}
      <div style={{ position: "absolute", bottom: 90, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
        <RainRadarButton enabled={radar.enabled} loading={radar.loading} timestamp={radar.timestamp} onToggle={radar.toggle} />
        <button onClick={handleLocate} style={{
          width: 40, height: 40, borderRadius: "50%",
          background: located ? "rgba(96,165,250,0.15)" : "rgba(8,13,24,0.9)",
          border: `1px solid ${located ? "rgba(96,165,250,0.25)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          {locating ? <span style={{ fontSize: "14px", animation: "blink 1s ease infinite" }}>📍</span>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={located ? "var(--accent)" : "rgba(255,255,255,0.5)"} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>}
        </button>
      </div>
    </div>
  );
}
