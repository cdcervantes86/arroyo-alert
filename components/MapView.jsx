"use client";
import { useEffect, useRef } from "react";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";

export default function MapView({ reports, onZoneClick, panelOpen, activeFilter, predictions, onMapReady }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

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
    if (onMapReady) onMapReady(map);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [onMapReady]);

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
      const badge = count >= 2 && matchesFilter ? '<div style="position:absolute;top:-8px;right:-8px;min-width:18px;height:18px;background:#fff;color:#000;border-radius:9px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:DM Sans,sans-serif;z-index:5;box-shadow:0 2px 8px rgba(0,0,0,0.4);">' + count + '</div>' : '';
      const predRing = !sev && pred && pred.score >= 40 && matchesFilter ? '<div style="position:absolute;inset:-6px;border:2px dashed ' + (pred.score >= 70 ? '#ef444460' : '#eab30840') + ';border-radius:50%;"></div>' : '';

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
      const predLabel = pred && pred.score >= 20 ? '<br/><span style="color:' + (pred.score >= 70 ? '#ef4444' : pred.score >= 40 ? '#eab308' : '#60a5fa') + '">' + pred.score + '% probabilidad</span>' : '';
      marker.bindTooltip("<b>" + zone.name + "</b><br/><span style='opacity:0.6'>" + zone.area + "</span><br/>" + label +
        (count > 0 ? " · " + count + " reporte" + (count > 1 ? "s" : "") : "") + predLabel,
        { className: "arroyo-tooltip", direction: "top", offset: [0, -14] });
      markersRef.current.push(marker);
    });
  }, [reports, onZoneClick, activeFilter, predictions]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", background: "var(--bg)" }} />;
}
