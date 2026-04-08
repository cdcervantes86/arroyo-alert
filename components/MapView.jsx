"use client";
import { useEffect, useRef } from "react";
import { ZONES, SEVERITY, getZoneSeverity } from "@/lib/zones";

export default function MapView({ reports, onZoneClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

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
        '&copy; <a href="https://openstreetmap.org/copyright" style="color:rgba(255,255,255,0.3)">OSM</a> &middot; CARTO'
      )
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require("leaflet");

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    ZONES.forEach((zone) => {
      const sev = getZoneSeverity(zone.id, reports);
      const colors = { danger: "#ef4444", caution: "#f59e0b", safe: "#22c55e" };
      const col = sev ? colors[sev] : "#555";
      const size = sev === "danger" ? 22 : sev ? 16 : 10;
      const pulse = sev === "danger";

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">' +
          (pulse
            ? '<div style="position:absolute;top:50%;left:50%;width:' +
              (size + 22) + "px;height:" + (size + 22) +
              'px;transform:translate(-50%,-50%);border-radius:50%;background:' +
              col + ';animation:danger-pulse 2s ease-in-out infinite;"></div>'
            : "") +
          '<div style="width:' + size + "px;height:" + size +
          "px;background:" + col +
          ";border-radius:50%;border:2px solid rgba(255,255,255,0.55);box-shadow:0 0 14px " +
          col + '70;cursor:pointer;position:relative;z-index:2;"></div></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon })
        .on("click", () => onZoneClick(zone.id))
        .addTo(map);

      const label = sev ? SEVERITY[sev].label : "Sin reportes";
      marker.bindTooltip(
        "<b>" + zone.name + "</b><br/><span style='opacity:0.6'>" + zone.area + "</span><br/>" + label,
        { className: "arroyo-tooltip", direction: "top", offset: [0, -14] }
      );

      markersRef.current.push(marker);
    });
  }, [reports, onZoneClick]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", background: "var(--bg)" }}
    />
  );
}
