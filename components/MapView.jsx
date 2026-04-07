"use client";
import { useEffect, useRef } from "react";
import { ZONES, SEVERITY, getZoneSeverity } from "@/lib/zones";

export default function MapView({ reports, onZoneClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Dynamic require to avoid SSR "window is not defined" error
    const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "",
      iconUrl: "",
      shadowUrl: "",
    });

    const map = L.map(mapRef.current, {
      center: [10.96, -74.805],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, subdomains: "abcd" }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addAttribution(
        '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> &middot; CARTO'
      )
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require("leaflet");

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const colors = { danger: "#DC2626", caution: "#D97706", safe: "#16A34A" };
      const col = sev ? colors[sev] : "#555";
      const size = sev === "danger" ? 20 : sev ? 16 : 10;
      const pulse = sev === "danger";

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">' +
          (pulse
            ? '<div style="position:absolute;top:50%;left:50%;width:' +
              (size + 20) + "px;height:" + (size + 20) +
              'px;transform:translate(-50%,-50%);border-radius:50%;background:' +
              col + ';animation:danger-pulse 2s ease-in-out infinite;"></div>'
            : "") +
          '<div style="width:' + size + "px;height:" + size +
          "px;background:" + col +
          ";border-radius:50%;border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 12px " +
          col + '80;cursor:pointer;position:relative;z-index:2;"></div></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon })
        .on("click", () => onZoneClick(zone.id))
        .addTo(map);

      const label = sev ? SEVERITY[sev].label : "Sin reportes";
      marker.bindTooltip(
        "<b>" + zone.name + "</b> (" + zone.area + ")<br/>" + label,
        { className: "arroyo-tooltip", direction: "top", offset: [0, -12] }
      );

      markersRef.current.push(marker);
    });
  }, [reports, onZoneClick]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", background: "#0c1220" }}
    />
  );
}
