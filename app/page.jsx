"use client";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useReports } from "@/lib/useReports";
import { getMapQuality, setMapQuality } from "@/lib/mapQuality";
import { supabase } from "@/lib/supabase";
import { usePushNotifications, notifyZone } from "@/lib/usePushNotifications";
import { getReporterStats, getDeviceId } from "@/lib/deviceId";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports, getSevLabel, getZonePhoto } from "@/lib/zones";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import { checkEmergencyMode, getFloodPredictions } from "@/lib/predictions";
import { useLiveWatchers } from "@/lib/useLiveWatchers";
import ReportFlow from "@/components/ReportFlow";
import LiveFeed from "@/components/LiveFeed";
import WeatherIndicator from "@/components/WeatherIndicator";
import Onboarding from "@/components/Onboarding";
import AboutPage from "@/components/AboutPage";
import HeatmapView from "@/components/HeatmapView";
import UpdateBanner from "@/components/UpdateBanner";
import { SeverityIcon } from "@/components/SeverityIcon";
import { MapIcon, ListIcon, LiveIcon, MoreIcon, ProfileIcon, ChartIcon, FlameIcon, InfoIcon, StarIcon, AlertTriangleIcon, BellIcon } from "@/components/Icons";
import { useRainRadar, RainRadarButton, RainRadarLegend } from "@/components/RainRadar";
import PullToRefresh from "@/components/PullToRefresh";
import CommentThread from "@/components/CommentThread";
import ReporterProfile from "@/components/ReporterProfile";
import BottomNav from "@/components/BottomNav";
import WeeklyDigest from "@/components/WeeklyDigest";
import { useFavorites } from "@/lib/useFavorites";
import { useUpdateChecker } from "@/lib/useUpdateChecker";
import { APP_VERSION } from "@/lib/version";
import { usePerformanceMode } from "@/lib/usePerformanceMode";

const MapView = lazy(() => import("@/components/MapView"));

// Haversine distance in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

import React from "react";
class MapErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error("MapView crash:", err); }
  render() {
    if (this.state.hasError) return (
      <div style={{ width: "100%", height: "100%", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px" }}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Map could not load</p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Switch to Zones tab</p>
      </div>
    );
    return this.props.children;
  }
}

function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
      <defs><linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
      <rect width="512" height="512" rx="112" fill="url(#logoBg)" />
      <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
      <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
      <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
      <circle cx="400" cy="115" r="40" fill="#fff" /><text x="400" y="133" textAnchor="middle" fill="#D42A2A" fontSize="52" fontWeight="900" fontFamily="sans-serif">!</text>
    </svg>
  );
}

function SkeletonCard({ i }) {
  return <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 16px", marginBottom: "6px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}><div className="skeleton" style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="skeleton" style={{ width: "45%", height: 14, marginBottom: 8, borderRadius: 4 }} /><div className="skeleton" style={{ width: "30%", height: 10, borderRadius: 3 }} /></div></div>;
}

function AnimatedScreen({ closing, children }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => { if (!closing) { const t = setTimeout(() => setSettled(true), 400); return () => clearTimeout(t); } }, [closing]);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, background: "#070b14",
      ...(closing
        ? { animation: "screenSlideOut 0.25s ease forwards" }
        : settled
          ? {}
          : { animation: "screenSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }
      ),
    }}>
      {children}
    </div>
  );
}

function OfflineBanner({ lang }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => { const off = () => setOffline(true); const on = () => setOffline(false); window.addEventListener("offline", off); window.addEventListener("online", on); setOffline(!navigator.onLine); return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); }; }, []);
  if (!offline) return null;
  return <div style={{ padding: "8px 16px", background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.1)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg><span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{lang === "es" ? "Sin conexión" : "Offline"}</span></div>;
}

function EmergencyBanner({ emergency, lang }) {
  if (!emergency.active) return null;
  const es = lang === "es";
  return (
    <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.12)", borderBottom: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, animation: "fadeIn 0.3s ease" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "blink 1s ease infinite", flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fca5a5" }}>{es ? "ALERTA MÁXIMA" : "MAXIMUM ALERT"}</div>
        <div style={{ fontSize: "12px", color: "rgba(252,165,165,0.7)", marginTop: 1 }}>{es ? `${emergency.dangerCount} reportes de peligro en los últimos 30 min` : `${emergency.dangerCount} danger reports in the last 30 min`}</div>
      </div>
    </div>
  );
}

function MapQualitySelector({ lang }) {
  const es = lang === "es";
  const [value, setValue] = useState(() => getMapQuality());
  const [reloading, setReloading] = useState(false);

  const handleChange = (next) => {
    if (next === value) return;
    setValue(next);
    setMapQuality(next);
    setReloading(true);
    setTimeout(() => window.location.reload(), 250);
  };

  const options = [
    { key: "auto", label: es ? "Auto" : "Auto" },
    { key: "high", label: es ? "Alta" : "High" },
    { key: "lite", label: es ? "Ligera" : "Lite" },
  ];

  return (
    <div style={{ padding: "10px 12px 6px", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "4px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, letterSpacing: "-0.1px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{es ? "Calidad del mapa" : "Map quality"}</span>
        {reloading && <span style={{ fontSize: "10px", color: "var(--text-faint)", fontWeight: 500 }}>{es ? "Recargando..." : "Reloading..."}</span>}
      </div>
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "3px", border: "1px solid rgba(255,255,255,0.06)" }}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button key={o.key} onClick={() => handleChange(o.key)} disabled={reloading} style={{
              flex: 1, padding: "7px 6px", borderRadius: "8px", border: "none",
              fontSize: "12px", fontWeight: active ? 700 : 500,
              background: active ? "rgba(91,156,246,0.14)" : "transparent",
              color: active ? "#6ba6ff" : "var(--text-dim)",
              cursor: reloading ? "wait" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: active ? "inset 0 1px 0 rgba(91,156,246,0.1)" : "none",
            }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function MoreMenu({ onSelect, lang, onClose, isLowEnd }) {
  const es = lang === "es";
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleShare = async () => {
    const shareText = es
      ? "AlertaArroyo — Alertas de arroyos en tiempo real para Barranquilla. Protege a tu familia.\nhttps://arroyo-alert.vercel.app"
      : "AlertaArroyo — Real-time arroyo flood alerts for Barranquilla. Protect your family.\nhttps://arroyo-alert.vercel.app";
    if (navigator.share) {
      try { await navigator.share({ title: "AlertaArroyo", text: shareText, url: "https://arroyo-alert.vercel.app" }); } catch(e) {}
    } else {
      try { await navigator.clipboard.writeText(shareText); } catch(e) {}
    }
    handleClose();
  };

  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.4)", animation: closing ? "menuBackdropOut 0.2s ease forwards" : "fadeIn 0.15s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 80, right: 16, left: 16, maxWidth: 300, marginLeft: "auto", background: "rgba(12,18,32,0.6)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "20px", padding: "6px", animation: closing ? "menuSlideOut 0.2s ease forwards" : "slideUp 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)", boxShadow: "0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)", transformOrigin: "bottom right" }}>
        {[
          { key: "profile", Icon: ProfileIcon, label: es ? "Mi perfil" : "My profile", desc: es ? "Estadísticas y rango" : "Stats and rank" },
          { key: "digest", Icon: ChartIcon, label: es ? "Resumen semanal" : "Weekly digest", desc: es ? "Últimos 7 días" : "Last 7 days" },
          { key: "heatmap", Icon: FlameIcon, label: es ? "Historial" : "History", desc: es ? "Zonas más afectadas" : "Most affected zones" },
          { key: "about", Icon: InfoIcon, label: es ? "Info y seguridad" : "Info & safety", desc: es ? "Consejos y emergencias" : "Tips & emergencies" },
        ].map((item, i) => (
          <button key={item.key} onClick={() => { onSelect(item.key); handleClose(); }} className="more-menu-item" style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 14px", background: "none", border: "none", textAlign: "left", borderRadius: "14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}><item.Icon size={17} color="var(--text-secondary)" /></div>
            <div><div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.1px" }}>{item.label}</div><div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: 2 }}>{item.desc}</div></div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, opacity: 0.12, marginLeft: "auto" }}><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ))}
        <MapQualitySelector lang={lang} />
        {/* Share button */}
        <button onClick={handleShare} className="more-menu-item" style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 14px", background: "none", border: "none", textAlign: "left", borderRadius: "14px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </div>
          <div><div style={{ fontSize: "14px", fontWeight: 700, color: "var(--safe)", letterSpacing: "-0.1px" }}>{es ? "Invitar amigos" : "Invite friends"}</div><div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: 2 }}>{es ? "Comparte AlertaArroyo" : "Share AlertaArroyo"}</div></div>
        </button>
      </div>
    </div>
  );
}

/* ====== MULTI-SNAP BOTTOM SHEET — peek / half / full ====== */
function ZoneSheet({ zone, severity, reports, onClose, onReport, onUpvote, push, zoneWatchers, prediction, watchZone, unwatchZone, onLogoClick, isDesktop, desktopView, mapInstance, favs, initialSnap = "peek", mapRestoreRef, onPhotoClick, onDelete, userLocation, closeRef, isLowEnd }) {
  const { lang, t } = useLanguage();
  const es = lang === "es";
  const sevColor = severity ? SEVERITY[severity].color : "rgba(255,255,255,0.06)";

  // ALL state and refs declared first — before any useEffect
  const SNAPS = { peek: 19, half: 50, full: 88 };
  const [snap, setSnap] = useState(initialSnap);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [upvoted, setUpvoted] = useState(new Set());
  const [zoneHistory, setZoneHistory] = useState(null);
  const touchRef = useRef({ startY: 0, startSnap: 0, lastY: 0, lastTime: 0, velocity: 0 });
  const contentRef = useRef(null);
  const sheetRef = useRef(null);
  const desktopRestoreRef = useRef(null);
  const prevZoneRef = useRef(zone?.id);

  // When switching zones (e.g. tapping another card in list), reset to initialSnap
  useEffect(() => {
    if (zone && zone.id !== prevZoneRef.current) {
      prevZoneRef.current = zone.id;
      setSnap(initialSnap);
      setClosing(false);
      setEntered(false);
      setUpvoted(new Set());
      setZoneHistory(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }
  }, [zone?.id, initialSnap]);

  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });
  const handleUpvote = (r) => { if (upvoted.has(r.id)) return; onUpvote(r.id, r.upvotes); setUpvoted(prev => new Set([...prev, r.id])); if (navigator.vibrate) navigator.vibrate(50); };

  // Center map on zone when in desktop map view
  useEffect(() => {
    if (isDesktop && desktopView === "map" && mapInstance && zone) {
      if (!desktopRestoreRef.current) {
        desktopRestoreRef.current = {
          center: mapInstance.getCenter().toArray(),
          zoom: mapInstance.getZoom(),
        };
      }
      mapInstance.easeTo({ center: [zone.lng, zone.lat], zoom: 14, duration: 600 });
    }
  }, [isDesktop, desktopView, mapInstance, zone]);

  // Restore map position instantly when closing begins
  useEffect(() => {
    if (closing && desktopRestoreRef.current && mapInstance && isDesktop) {
      mapInstance.easeTo({
        center: desktopRestoreRef.current.center,
        zoom: desktopRestoreRef.current.zoom,
        duration: 350,
      });
      desktopRestoreRef.current = null;
    }
  }, [closing, mapInstance, isDesktop]);

  // Effects — all state is declared above, safe to reference

  useEffect(() => {
    if (!isDesktop) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }
  }, [isDesktop]);

  // Close animation — must be above desktop early return for hooks ordering
  const animateClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    if (mapInstance && !isDesktop) {
      const restore = mapRestoreRef?.current;
      if (restore) {
        mapInstance.easeTo({
          center: restore.center,
          zoom: restore.zoom,
          duration: 350,
        });
      }
    }
    setTimeout(onClose, 380);
  }, [closing, onClose, mapInstance, isDesktop, mapRestoreRef]);

  // Expose animateClose to parent via ref
  useEffect(() => {
    if (closeRef) closeRef.current = animateClose;
  }, [closeRef, animateClose]);

  // Fetch zone history stats (cached per zone)
  useEffect(() => {
    if (!zone) return;
    const cacheKey = `zh_${zone.id}`;
    const cached = typeof window !== "undefined" && window[cacheKey];
    if (cached && Date.now() - cached._ts < 300000) { setZoneHistory(cached); return; } // 5 min cache
    const fetchHistory = async () => {
      try {
        const { count: total } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("zone_id", zone.id);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { count: recent } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("zone_id", zone.id).gte("created_at", thirtyDaysAgo);
        const result = { total: total || 0, recent: recent || 0, _ts: Date.now() };
        if (typeof window !== "undefined") window[cacheKey] = result;
        setZoneHistory(result);
      } catch(e) {}
    };
    fetchHistory();
  }, [zone]);

  // Map click to dismiss — works for both desktop and mobile
  useEffect(() => {
    if (!mapInstance) return;
    const handleMapClick = () => {
      if (closing) return;
      setClosing(true);
      // Restore map position immediately (mobile)
      if (!isDesktop && mapRestoreRef?.current) {
        mapInstance.easeTo({
          center: mapRestoreRef.current.center,
          zoom: mapRestoreRef.current.zoom,
          duration: 350,
        });
      }
      setTimeout(onClose, isDesktop ? 280 : 380);
    };
    mapInstance.on("click", handleMapClick);
    return () => { mapInstance.off("click", handleMapClick); };
  }, [mapInstance, closing, onClose, isDesktop, mapRestoreRef]);

  // === DESKTOP: Side panel (map view) or centered modal (list view) ===
  if (isDesktop) {
    const isSidePanel = desktopView === "map";
    const handleDesktopClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 280); };

    const subscribed = push.isSubscribed?.(zone.id);
    const watcherCount = zoneWatchers?.[zone.id] || 0;
    const altRoutes = reports.filter(r => r.alt_route && r.alt_route.trim() && (r.severity === "danger" || r.severity === "caution"));

    const panelContent = (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${sevColor}20`, flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: `linear-gradient(90deg, transparent, ${sevColor}30, transparent)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: severity ? `${sevColor}10` : "rgba(255,255,255,0.04)", border: `1px solid ${severity ? sevColor + "20" : "rgba(255,255,255,0.08)"}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <SeverityIcon severity={severity} size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px" }}>{zone.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{zone.area}</span>
                {userLocation && (() => { const d = getDistanceKm(userLocation[0], userLocation[1], zone.lat, zone.lng); return <span style={{ fontSize: "11px", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", gap: "3px" }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}</span>; })()}
                {severity && <span style={{ fontSize: "11px", fontWeight: 600, color: sevColor, background: `${sevColor}0c`, padding: "2px 8px", borderRadius: "99px", border: `1px solid ${sevColor}18` }}>{getSevLabel(severity, lang)}</span>}
              </div>
            </div>
            <button onClick={handleDesktopClose} className="tap-target" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
            </button>
          </div>
        </div>

        {/* Photo hero */}
        {zone.photos && (
          <div style={{ position: "relative", height: 160, flexShrink: 0, overflow: "hidden" }}>
            <img src={getZonePhoto(zone, severity)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(12,18,32,0.95) 0%, rgba(12,18,32,0.4) 50%, ${severity ? sevColor + "12" : "rgba(12,18,32,0.15)"} 100%)` }} />
            {severity && <div style={{ position: "absolute", bottom: 12, left: 24, display: "flex", alignItems: "center", gap: "8px" }}>
              <SeverityIcon severity={severity} size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: sevColor, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{getSevLabel(severity, lang)}</span>
            </div>}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 24px 24px" }}>
          {zone.desc && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>{es ? zone.desc : (zone.descEn || zone.desc)}</p>}

          {/* Zone history context */}
          {zoneHistory && zoneHistory.total > 0 && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>{zoneHistory.total}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "4px" }}>{es ? "total" : "all time"}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)", background: zoneHistory.recent > 5 ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${zoneHistory.recent > 5 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)"}`, display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={zoneHistory.recent > 5 ? "var(--danger)" : "var(--text-faint)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: zoneHistory.recent > 5 ? "var(--danger)" : "var(--text)" }}>{zoneHistory.recent}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "4px" }}>{es ? "últimos 30d" : "last 30d"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Watchers + prediction */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            {watcherCount > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
                {watcherCount} {es ? "monitoreando" : "watching"}
              </div>
            )}
            {prediction && prediction.score >= 20 && !severity && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)", fontWeight: 600 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/></svg>
                {prediction.score}%
              </div>
            )}
          </div>

          {/* Prediction card */}
          {prediction && prediction.score >= 30 && !severity && (
            <div style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "var(--radius-lg)", background: prediction.score >= 70 ? "rgba(239,68,68,0.04)" : prediction.score >= 40 ? "rgba(234,179,8,0.04)" : "rgba(91,156,246,0.04)", border: `1px solid ${prediction.score >= 70 ? "rgba(239,68,68,0.1)" : prediction.score >= 40 ? "rgba(234,179,8,0.08)" : "rgba(91,156,246,0.08)"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{es ? "Predicción de arroyo" : "Arroyo prediction"}</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)" }}>{prediction.score}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ width: `${prediction.score}%`, height: "100%", borderRadius: 2, background: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)", transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.4 }}>
                {prediction.score >= 70 ? (es ? "Alto riesgo de inundación. Evita esta zona." : "High flood risk. Avoid this zone.") : prediction.score >= 40 ? (es ? "Riesgo moderado. Mantente alerta." : "Moderate risk. Stay alert.") : (es ? "Riesgo bajo. Condiciones normales." : "Low risk. Normal conditions.")}
              </div>
            </div>
          )}

          <button onClick={onReport} style={{ width: "100%", padding: "13px", marginBottom: "12px", background: "linear-gradient(135deg, #D42A2A, #b91c1c)", color: "#fff", border: "none", borderRadius: "var(--radius-lg)", fontSize: "14px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)" }}>{t.reportThisZone}</button>

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {push.supported && (
              <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); if (!subscribed) push.subscribeToZone?.(zone.id); else push.unsubscribeFromZone?.(zone.id); }} className="tap-target" style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", background: subscribed ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${subscribed ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`, color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <BellIcon size={14} color={subscribed ? "var(--accent)" : "var(--text-dim)"} />
                {subscribed ? (es ? "Suscrito" : "Subscribed") : (es ? "Notificarme" : "Notify me")}
              </button>
            )}
            <button onClick={() => {
              const sevLabel = severity ? getSevLabel(severity, lang) : (es ? "Despejado" : "Clear");
              const text = es
                ? `${zone.name} (${zone.area}) — ${sevLabel}\nhttps://arroyo-alert.vercel.app?zone=${zone.id}`
                : `${zone.name} (${zone.area}) — ${sevLabel}\nhttps://arroyo-alert.vercel.app?zone=${zone.id}`;
              if (navigator.share) { try { navigator.share({ title: zone.name, text, url: `https://arroyo-alert.vercel.app?zone=${zone.id}` }); } catch(e) {} }
              else { try { navigator.clipboard.writeText(text); } catch(e) {} }
            }} className="tap-target" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>

          {/* Alt routes */}
          {altRoutes.length > 0 && (
            <div style={{ marginBottom: "20px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "var(--safe)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>{es ? "Rutas alternas" : "Alternate routes"}</div>
              {altRoutes.slice(0, 3).map((r, i) => (
                <div key={r.id} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid rgba(34,197,94,0.08)" : "none", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: "4px" }}><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-8a3.5 3.5 0 010-7H12"/></svg>{r.alt_route}
                </div>
              ))}
            </div>
          )}

          {/* Reports */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: "10px", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: "3px", opacity: 0.6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {es ? "expiran en 4h" : "expire in 4h"}
              </span>
            </div>
          {!reports.length && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p style={{ color: "var(--text)", fontSize: "15px", fontWeight: 700 }}>{es ? "Todo tranquilo por aquí" : "All quiet here"}</p>
              <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "6px" }}>{es ? "No hay reportes en las últimas 4 horas" : "No reports in the last 4 hours"}</p>
            </div>
          )}
          {reports.map((r, i) => {
            const cfg = SEVERITY[r.severity];
            return (
              <div key={r.id} className="card-interactive" style={{ background: `${cfg.color}04`, border: `1px solid ${cfg.color}12`, borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: "8px", position: "relative", overflow: "hidden", animation: `fadeIn 0.2s ease ${i * 0.04}s both`, opacity: Math.max(0.45, Math.min(1, (new Date(r.created_at).getTime() + 4 * 3600000 - Date.now()) / (4 * 3600000))) }}>
                <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: 3, borderRadius: "0 2px 2px 0", background: cfg.color, opacity: 0.5 }} />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: `${cfg.color}0a`, border: `1px solid ${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SeverityIcon severity={r.severity} size={15} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: cfg.color }}>{getSevLabel(r.severity, lang)}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{timeAgoLocalized(r.created_at, lang)}</span>
                </div>
                {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                {r.photo_url && <div onClick={(e) => { e.stopPropagation(); onPhotoClick?.(r.photo_url); }} style={{ marginBottom: "10px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", cursor: "zoom-in", position: "relative" }}><img src={r.photo_url} alt="Report photo" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", aspectRatio: "16/9", background: "rgba(255,255,255,0.02)" }} loading="lazy" /><div style={{ position: "absolute", bottom: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div></div>}
                {!r.text && !r.photo_url && <div style={{ marginBottom: "8px" }} />}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => handleUpvote(r)} className="tap-target" style={{ background: upvoted.has(r.id) ? "var(--accent-glow)" : "rgba(255,255,255,0.02)", border: `1px solid ${upvoted.has(r.id) ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: upvoted.has(r.id) ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 500, flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={upvoted.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>{upvoted.has(r.id) ? (es ? "Confirmado" : "Confirmed") : (es ? "Confirmar" : "Confirm")} · {r.upvotes + (upvoted.has(r.id) ? 1 : 0)}</button>
                  <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                  {r.device_id === getDeviceId() && (
                    <button onClick={() => { if (confirm(es ? "¿Eliminar este reporte?" : "Delete this report?")) onDelete?.(r.id); }} className="tap-target" style={{ marginLeft: "auto", padding: "6px", borderRadius: "var(--radius-sm)", background: "none", border: "1px solid rgba(255,255,255,0.04)", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    // SIDE PANEL — map view (no backdrop - map stays interactive)
    if (isSidePanel) {
      return (
        <div style={{
          position: "fixed", top: 10, right: 10, bottom: 10, width: 390, zIndex: 1001,
          background: "rgba(12,18,32,0.72)",
          backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06)",
          animation: closing ? "desktopPanelOut 0.25s ease forwards" : "desktopPanelIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex", flexDirection: "column",
        }}>
          {panelContent}
        </div>
      );
    }

    // MODAL — list view
    return (
      <div onClick={handleDesktopClose} style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: closing ? "transparent" : "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.25s ease",
        animation: closing ? "none" : "fadeIn 0.2s ease",
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: "100%", maxWidth: 480, maxHeight: "80vh",
          background: "rgba(12,18,32,0.78)",
          backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          animation: closing ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {panelContent}
        </div>
      </div>
    );
  }

  // === MOBILE: Multi-snap bottom sheet ===

  const snapPx = (key) => (SNAPS[key] / 100) * (typeof window !== "undefined" ? window.innerHeight : 800);
  const targetHeight = entered ? (closing ? 0 : snapPx(snap) + dragOffset) : 0;
  const heightPx = Math.max(0, Math.min(snapPx("full") + 40, targetHeight));

  const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";
  const DURATION = "0.45s";

  const handleTouchStart = (e) => {
    const scrollTop = contentRef.current?.scrollTop || 0;
    // Allow scrolling when content is scrolled down (both full and half snaps)
    if ((snap === "full" || snap === "half") && scrollTop > 5) return;
    const y = e.touches[0].clientY;
    touchRef.current = { startY: y, startSnap: snapPx(snap), lastY: y, lastTime: Date.now(), velocity: 0 };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const y = e.touches[0].clientY;
    const now = Date.now();
    const dt = now - touchRef.current.lastTime;
    if (dt > 0) {
      const newVel = (touchRef.current.lastY - y) / dt * 1000;
      touchRef.current.velocity = touchRef.current.velocity * 0.3 + newVel * 0.7; // smoothed
    }
    touchRef.current.lastY = y;
    touchRef.current.lastTime = now;
    const delta = touchRef.current.startY - y;
    const newH = touchRef.current.startSnap + delta;
    const maxH = snapPx("full");
    // Rubber band effect beyond bounds
    const overMax = newH - maxH;
    const underMin = -newH;
    let clampedH;
    if (overMax > 0) clampedH = maxH + overMax * 0.2;
    else if (underMin > 0) clampedH = -underMin * 0.2;
    else clampedH = newH;
    setDragOffset(clampedH - snapPx(snap));
    if (delta > 0 || snap !== "full") e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const finalH = heightPx;
    const velocity = touchRef.current.velocity;

    if (finalH < snapPx("peek") * 0.4) {
      setDragOffset(0); animateClose(); return;
    }

    // Flick thresholds
    if (velocity > 500) {
      if (snap === "peek") { setSnap("half"); setDragOffset(0); return; }
      if (snap === "half") { setSnap("full"); setDragOffset(0); return; }
    }
    if (velocity < -500) {
      if (snap === "full") { setSnap("half"); setDragOffset(0); return; }
      if (snap === "half") { setSnap("peek"); setDragOffset(0); return; }
      if (snap === "peek") { setDragOffset(0); animateClose(); return; }
    }

    // Nearest snap with velocity bias
    const bias = velocity * 0.12;
    const targets = [
      { key: "peek", dist: Math.abs(finalH + bias - snapPx("peek")) },
      { key: "half", dist: Math.abs(finalH + bias - snapPx("half")) },
      { key: "full", dist: Math.abs(finalH + bias - snapPx("full")) },
    ];
    targets.sort((a, b) => a.dist - b.dist);
    setSnap(targets[0].key);
    setDragOffset(0);
  };

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const progress = heightPx / vh;
  const backdropOpacity = closing ? 0 : Math.max(0.15, Math.min(0.55, progress * 0.7));
  const backdropBlur = 0; // removed to prevent Safari flicker
  const canScroll = (snap === "full" || snap === "half") && !isDragging;
  const contentOpacity = snap === "peek" && !isDragging ? 0 : Math.min(1, (heightPx - snapPx("peek")) / (snapPx("half") - snapPx("peek")));

  const subscribed = push.isSubscribed?.(zone.id);
  const watcherCount = zoneWatchers?.[zone.id] || 0;
  const altRoutes = reports.filter(r => r.alt_route && r.alt_route.trim() && (r.severity === "danger" || r.severity === "caution"));

  // Width progression: floating card at peek → edge-to-edge at full
  const peekH = snapPx("peek"), fullH = snapPx("full");
  const expansion = Math.max(0, Math.min(1, (heightPx - peekH) / (fullH - peekH)));
  const sheetMargin = Math.round(12 * (1 - expansion));
  const sheetRadius = Math.round(32 - expansion * 20);

  return (
    <>
      {/* Backdrop — desktop only (mobile uses map click to dismiss) */}
      {isDesktop && (
        <div
          onClick={animateClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: `rgba(0,0,0,${backdropOpacity})`,
            transition: isDragging ? "none" : `all ${DURATION} ${SPRING}`,
            pointerEvents: closing ? "none" : "auto",
          }}
        />
      )}

      {/* Sheet */}
      <div ref={sheetRef}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed", left: sheetMargin, right: sheetMargin, bottom: 0, zIndex: 1001,
          height: `${heightPx}px`,
          maxHeight: "92vh",
          background: "rgba(12,18,32,0.82)",
          backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          borderRadius: `${sheetRadius}px ${sheetRadius}px 0 0`,
          boxShadow: `0 -12px 48px rgba(0,0,0,0.5), 0 -2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          display: "flex", flexDirection: "column",
          transition: isDragging ? "none" : `height ${DURATION} ${SPRING}, left ${DURATION} ${SPRING}, right ${DURATION} ${SPRING}, border-radius ${DURATION} ${SPRING}`,
          overflow: "hidden",
          willChange: "height",
        }}>

        {/* Handle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0, cursor: "grab" }}>
          <div style={{ width: 36, height: 4, borderRadius: 3, background: "rgba(255,255,255,0.25)", boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.1)" }} />
        </div>

        {/* PEEK CONTENT — always visible */}
        <div style={{ padding: "6px 20px 12px", flexShrink: 0, borderBottom: snap !== "peek" ? `1px solid ${sevColor}25` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: severity ? `${sevColor}10` : "rgba(255,255,255,0.04)", border: `1px solid ${severity ? sevColor + "20" : "rgba(255,255,255,0.08)"}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <SeverityIcon severity={severity} size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.4px" }}>{zone.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{zone.area}</span>
                {userLocation && (() => { const d = getDistanceKm(userLocation[0], userLocation[1], zone.lat, zone.lng); return <span style={{ fontSize: "11px", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", gap: "3px" }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}</span>; })()}
                {severity && <span style={{ fontSize: "11px", fontWeight: 600, color: sevColor, background: `${sevColor}0c`, padding: "2px 8px", borderRadius: "99px", border: `1px solid ${sevColor}18` }}>{getSevLabel(severity, lang)}</span>}
                {reports.length > 0 && <span style={{ fontSize: "11px", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{reports.length} {reports.length === 1 ? "report" : es ? "reportes" : "reports"}</span>}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); favs.toggle(zone.id); if (navigator.vibrate) navigator.vibrate(30); }} style={{ width: 32, height: 32, borderRadius: "50%", background: favs.isFavorite(zone.id) ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${favs.isFavorite(zone.id) ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <StarIcon size={14} color={favs.isFavorite(zone.id) ? "#facc15" : "rgba(255,255,255,0.35)"} filled={favs.isFavorite(zone.id)} />
            </button>
            <button onClick={animateClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <svg width="11" height="11" viewBox="0 0 10 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
            </button>
          </div>
          {/* Peek actions removed — button teasers below */}
        </div>

        {/* REPORT BUTTON — always visible, gets clipped at peek to tease swiping up */}
        <div style={{ padding: "12px 20px 14px", flexShrink: 0 }}>
          <button onClick={onReport} style={{ width: "100%", padding: "15px", background: "linear-gradient(145deg, #e53e3e, #b91c1c)", color: "#fff", border: "none", borderRadius: "24px", fontSize: "15px", fontWeight: 700, boxShadow: "0 2px 8px rgba(212,42,42,0.3), 0 8px 24px rgba(212,42,42,0.15), inset 0 1px 0 rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <AlertTriangleIcon size={16} color="#fff" />
            {t.reportThisZone}
          </button>
        </div>

        {/* Bottom fade — visible at peek to hint "swipe up", fades away when expanded */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(to top, rgba(12,18,32,0.95) 0%, rgba(12,18,32,0.6) 40%, transparent 100%)",
          pointerEvents: "none", zIndex: 5,
          opacity: Math.max(0, 1 - expansion * 3),
          transition: isDragging ? "none" : "opacity 0.3s ease",
          display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "10px",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "peekBounce 2s ease-in-out infinite" }}>
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </div>

        {/* HALF + FULL CONTENT — visible above peek */}
        <div ref={contentRef} style={{
          flex: 1, minHeight: 0, overflowY: canScroll ? "auto" : "hidden",
          WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
          opacity: contentOpacity,
          transition: isDragging ? "none" : `opacity 0.3s ease`,
          pointerEvents: contentOpacity < 0.1 ? "none" : "auto",
        }}>
          {/* Photo hero */}
          {zone.photos && (
            <div style={{ position: "relative", height: 140, overflow: "hidden", marginBottom: -4 }}>
              <img src={getZonePhoto(zone, severity)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(12,18,32,0.95) 0%, rgba(12,18,32,0.3) 50%, ${severity ? sevColor + "10" : "rgba(12,18,32,0.1)"} 100%)` }} />
              {severity && <div style={{ position: "absolute", bottom: 10, left: 20, display: "flex", alignItems: "center", gap: "6px" }}>
                <SeverityIcon severity={severity} size={16} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: sevColor, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{getSevLabel(severity, lang)}</span>
              </div>}
            </div>
          )}
          <div style={{ padding: "14px 20px calc(20px + env(safe-area-inset-bottom, 20px))" }}>
            {/* Description */}
            {zone.desc && <p style={{ color: "var(--text-dim)", fontSize: "12px", marginBottom: "14px", lineHeight: 1.5 }}>{es ? zone.desc : (zone.descEn || zone.desc)}</p>}

            {/* Zone history context */}
            {zoneHistory && zoneHistory.total > 0 && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>{zoneHistory.total}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-faint)", marginLeft: "4px" }}>{es ? "total" : "all time"}</span>
                  </div>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)", background: zoneHistory.recent > 5 ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${zoneHistory.recent > 5 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)"}`, display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={zoneHistory.recent > 5 ? "var(--danger)" : "var(--text-faint)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: zoneHistory.recent > 5 ? "var(--danger)" : "var(--text)" }}>{zoneHistory.recent}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-faint)", marginLeft: "4px" }}>{es ? "últimos 30d" : "last 30d"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Watchers + prediction */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              {watcherCount > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
                  {watcherCount} {es ? "monitoreando" : "watching"}
                </div>
              )}
              {prediction && prediction.score >= 20 && !severity && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)", fontWeight: 600 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/></svg>
                  {prediction.score}%
                </div>
              )}
            </div>

            {/* Prediction card */}
            {prediction && prediction.score >= 30 && !severity && (
              <div style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "var(--radius-lg)", background: prediction.score >= 70 ? "rgba(239,68,68,0.04)" : prediction.score >= 40 ? "rgba(234,179,8,0.04)" : "rgba(91,156,246,0.04)", border: `1px solid ${prediction.score >= 70 ? "rgba(239,68,68,0.1)" : prediction.score >= 40 ? "rgba(234,179,8,0.08)" : "rgba(91,156,246,0.08)"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{es ? "Predicción de arroyo" : "Arroyo prediction"}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)" }}>{prediction.score}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ width: `${prediction.score}%`, height: "100%", borderRadius: 2, background: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)", transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.4 }}>
                  {prediction.score >= 70 ? (es ? "Alto riesgo de inundación. Evita esta zona." : "High flood risk. Avoid this zone.") : prediction.score >= 40 ? (es ? "Riesgo moderado. Mantente alerta." : "Moderate risk. Stay alert.") : (es ? "Riesgo bajo. Condiciones normales." : "Low risk. Normal conditions.")}
                </div>
              </div>
            )}

            {/* Subscribe + Share */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {push.supported && (
                <button onClick={() => { const ns = !subscribed; if (navigator.vibrate) navigator.vibrate(50); if (ns) push.subscribeToZone?.(zone.id); else push.unsubscribeFromZone?.(zone.id); }} className="tap-target" style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", background: subscribed ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${subscribed ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`, color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <BellIcon size={14} color={subscribed ? "var(--accent)" : "var(--text-dim)"} />
                  {subscribed ? (es ? "Suscrito" : "Subscribed") : (es ? "Notificarme" : "Notify me")}
                </button>
              )}
              <button onClick={() => {
                const sevLabel = severity ? getSevLabel(severity, lang) : (es ? "Despejado" : "Clear");
                const text = es
                  ? `${zone.name} (${zone.area}) — ${sevLabel}\nhttps://arroyo-alert.vercel.app?zone=${zone.id}`
                  : `${zone.name} (${zone.area}) — ${sevLabel}\nhttps://arroyo-alert.vercel.app?zone=${zone.id}`;
                if (navigator.share) { try { navigator.share({ title: zone.name, text, url: `https://arroyo-alert.vercel.app?zone=${zone.id}` }); } catch(e) {} }
                else { try { navigator.clipboard.writeText(text); } catch(e) {} }
              }} className="tap-target" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            </div>

            {/* Alt routes */}
            {altRoutes.length > 0 && (
              <div style={{ marginBottom: "20px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--safe)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>
                  {es ? "Rutas alternas" : "Alternate routes"}
                </div>
                {altRoutes.slice(0, 3).map((r, i) => (
                  <div key={r.id} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid rgba(34,197,94,0.08)" : "none", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: "4px" }}><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-8a3.5 3.5 0 010-7H12"/></svg>{r.alt_route}
                  </div>
                ))}
              </div>
            )}

            {/* Reports */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: "10px", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: "3px", opacity: 0.6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {es ? "expiran en 4h" : "expire in 4h"}
              </span>
            </div>
            {!reports.length && (
              <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ color: "var(--text)", fontSize: "15px", fontWeight: 700 }}>{es ? "Todo tranquilo por aquí" : "All quiet here"}</p>
                <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "6px" }}>{es ? "No hay reportes en las últimas 4 horas" : "No reports in the last 4 hours"}</p>
              </div>
            )}
            {reports.map((r, i) => {
              const cfg = SEVERITY[r.severity];
              return (
                <div key={r.id} className="card-interactive" style={{ background: `${cfg.color}04`, border: `1px solid ${cfg.color}12`, borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: "8px", position: "relative", overflow: "hidden", animation: `fadeIn 0.2s ease ${i * 0.04}s both`, opacity: Math.max(0.45, Math.min(1, (new Date(r.created_at).getTime() + 4 * 3600000 - Date.now()) / (4 * 3600000))) }}>
                  <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: 3, borderRadius: "0 2px 2px 0", background: cfg.color, opacity: 0.5 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: `${cfg.color}0a`, border: `1px solid ${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SeverityIcon severity={r.severity} size={15} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: cfg.color }}>{getSevLabel(r.severity, lang)}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{timeAgoLocalized(r.created_at, lang)}</span>
                  </div>
                  {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                  {r.photo_url && <div onClick={(e) => { e.stopPropagation(); onPhotoClick?.(r.photo_url); }} style={{ marginBottom: "10px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", cursor: "zoom-in", position: "relative" }}><img src={r.photo_url} alt="Report photo" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", aspectRatio: "16/9", background: "rgba(255,255,255,0.02)" }} loading="lazy" /><div style={{ position: "absolute", bottom: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div></div>}
                  {!r.text && !r.photo_url && <div style={{ marginBottom: "8px" }} />}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => handleUpvote(r)} className="tap-target" style={{ background: upvoted.has(r.id) ? "var(--accent-glow)" : "rgba(255,255,255,0.02)", border: `1px solid ${upvoted.has(r.id) ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: upvoted.has(r.id) ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 500, flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={upvoted.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>{upvoted.has(r.id) ? (es ? "Confirmado" : "Confirmed") : (es ? "Confirmar" : "Confirm")} · {r.upvotes + (upvoted.has(r.id) ? 1 : 0)}</button>
                    <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                    {r.device_id === getDeviceId() && (
                      <button onClick={() => { if (confirm(es ? "¿Eliminar este reporte?" : "Delete this report?")) onDelete?.(r.id); }} className="tap-target" style={{ marginLeft: "auto", padding: "6px", borderRadius: "var(--radius-sm)", background: "none", border: "1px solid rgba(255,255,255,0.04)", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { lang, toggleLang, t } = useLanguage();
  const { isLowEnd, webGLSupported } = usePerformanceMode();
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, color) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, msg, color }]); // Max 3 toasts visible
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const lastToastRef = useRef(0);
  const handleRealtimeEvent = useCallback((type, report, oldReport) => {
    const deviceId = typeof window !== "undefined" ? getDeviceId() : null;
    const zone = ZONES.find(z => z.id === report.zone_id);
    if (type === "upvote" && report.device_id === deviceId) {
      // Own report confirmed — always show
      addToast(lang === "es" ? `Alguien confirmó tu reporte en ${zone?.name || ""}` : `Someone confirmed your report at ${zone?.name || ""}`, "var(--accent)");
    } else if (type === "insert" && report.device_id !== deviceId) {
      // New report from others — throttle to 1 per 30s
      const now = Date.now();
      if (now - lastToastRef.current < 30000) return;
      lastToastRef.current = now;
      const sevLabel = report.severity === "danger" ? (lang === "es" ? "Peligro" : "Danger") : report.severity === "caution" ? (lang === "es" ? "Precaución" : "Caution") : (lang === "es" ? "Despejado" : "Clear");
      addToast(`${sevLabel} — ${zone?.name || ""} (${zone?.area || ""})`, report.severity === "danger" ? "var(--danger)" : report.severity === "caution" ? "var(--caution)" : "var(--safe)");
    }
  }, [addToast, lang]);

  const { reports, loading, lastUpdated, submitReport, upvoteReport, deleteReport, refetch } = useReports(handleRealtimeEvent);
  const push = usePushNotifications();
  const { totalWatchers, zoneWatchers, watchZone, unwatchZone } = useLiveWatchers();
  const [screen, setScreen] = useState("main");
  const [selectedZone, setSelectedZone] = useState(null);
  const [mobileView, setMobileView] = useState("map");
  const [desktopView, setDesktopView] = useState("map");
  const [showPanel, setShowPanel] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mapDeferred, setMapDeferred] = useState(true);

  const [upvotedSet, setUpvotedSet] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState(null);
  const [zoneSearch, setZoneSearch] = useState("");
  const [mapSearchOpen, setMapSearchOpen] = useState(false);
  const [mapSearchClosing, setMapSearchClosing] = useState(false);
  const mapSearchClosingTimer = useRef(null);
  const closeSearch = useCallback(() => {
    if (mapSearchClosingTimer.current) clearTimeout(mapSearchClosingTimer.current);
    setMapSearchClosing(true);
    mapSearchClosingTimer.current = setTimeout(() => {
      setMapSearchOpen(false);
      setMapSearchQuery("");
      setMapSearchClosing(false);
      mapSearchClosingTimer.current = null;
    }, 180);
  }, []);
  const openSearch = useCallback(() => {
    if (mapSearchClosingTimer.current) {
      clearTimeout(mapSearchClosingTimer.current);
      mapSearchClosingTimer.current = null;
      setMapSearchClosing(false);
    }
    setMapSearchOpen(true);
  }, []);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const mapSearchRef = useRef(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show install banner after some engagement (3rd zone view)
  const zoneViewCount = useRef(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [weather, setWeather] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [communityStats, setCommunityStats] = useState(null);

  // Fetch community stats once on mount
  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        const { count: totalReports } = await supabase.from("reports").select("*", { count: "exact", head: true });
        // Get unique reporters count - fetch only device_id column
        const { data: reporters } = await supabase.from("reports").select("device_id");
        const uniqueReporters = reporters ? new Set(reporters.map(r => r.device_id).filter(Boolean)).size : 0;
        setCommunityStats({ totalReports: totalReports || 0, reporters: uniqueReporters });
      } catch(e) {}
    };
    fetchCommunityStats();
  }, []);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const manualLocateRef = useRef(false);

  // Location is only requested when user taps the locate button
  const [locationMarker, setLocationMarker] = useState(null);
  const [showDigest, setShowDigest] = useState(false);
  const [closingScreen, setClosingScreen] = useState(null);
  const [closingWhatsApp, setClosingWhatsApp] = useState(false);
  const [closingDigest, setClosingDigest] = useState(false);
  const [closingMobile, setClosingMobile] = useState(null);
  const [lastReport, setLastReport] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [rankUp, setRankUp] = useState(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Auto-dismiss hint after 8 seconds
  useEffect(() => {
    if (hintDismissed) return;
    const timer = setTimeout(() => setHintDismissed(true), 8000);
    return () => clearTimeout(timer);
  }, [hintDismissed]);
  const radar = useRainRadar(mapInstance);
  const favs = useFavorites();
  const pwaUpdate = useUpdateChecker();

  useEffect(() => { const c = () => setIsDesktop(window.innerWidth >= 900); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
    const handle = idle(() => setMapDeferred(false), { timeout: 1500 });
    return () => { if (window.cancelIdleCallback) window.cancelIdleCallback(handle); };
  }, []);
  const [statusTick, setStatusTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStatusTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { try { if (!localStorage.getItem("arroyo-onboarded")) setShowOnboarding(true); } catch(e) {} }, []);

  // Deep link: ?zone=ID opens that zone's detail
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const zoneId = params.get("zone");
      if (zoneId) {
        const id = parseInt(zoneId);
        const zone = ZONES.find(z => z.id === id);
        if (zone) {
          setTimeout(() => { setSelectedZone(id); setZoneClickSource("list"); setScreen("detail"); }, 500);
          // Clean URL without reload
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    const f = async () => { try {
      const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.96&longitude=-74.78&current=temperature_2m,weather_code,precipitation&hourly=precipitation_probability&forecast_days=1&timezone=America/Bogota");
      const d = await r.json(); const c = d.current; const h = d.hourly;
      const idx = new Date().getHours(); const probs = h.precipitation_probability.slice(idx, idx+6).filter(Boolean);
      const maxProb = Math.max(...probs, 0);
      // Find hours until high probability rain
      let hoursUntilRain = null;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] >= 60) { hoursUntilRain = i; break; }
      }
      setWeather({ isRaining: c.precipitation > 0, isStormy: c.weather_code >= 95, maxProb, hoursUntilRain });
    } catch(e) {} };
    f(); const i = setInterval(f, 600000); return () => clearInterval(i);
  }, []);

  useEffect(() => { if (reports.length > 0) setPredictions(getFloodPredictions(reports, weather)); }, [reports, weather]);

  const emergency = checkEmergencyMode(reports);
  const dangerCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "danger").length;
  const cautionCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "caution").length;
  const cutoff = Date.now() - 4 * 3600000;
  const liveCount = reports.filter((r) => new Date(r.created_at).getTime() > cutoff).length;
  const es = lang === "es";

  const [zoneClickSource, setZoneClickSource] = useState("map");
  const mapRestoreRef = useRef(null);

  const handleZoneClick = useCallback((zoneId, source = "map") => {
    if (source === "map" && mapInstance && !isDesktop) {
      // Only save on first click — don't overwrite when switching zones
      if (!mapRestoreRef.current) {
        mapRestoreRef.current = {
          center: mapInstance.getCenter().toArray(),
          zoom: mapInstance.getZoom(),
        };
      }
      const zone = ZONES.find(z => z.id === zoneId);
      if (zone) {
        const sheetOffset = 0.003;
        mapInstance.easeTo({
          center: [zone.lng, zone.lat + sheetOffset],
          duration: 500,
        });
      }
    }
    setSelectedZone(zoneId); setZoneClickSource(source); setScreen("detail");
    // Show install banner after 3rd zone view
    zoneViewCount.current++;
    if (zoneViewCount.current === 3 && installPrompt && !window.matchMedia("(display-mode: standalone)").matches) {
      try { if (!localStorage.getItem("arroyo-install-prompted")) { localStorage.setItem("arroyo-install-prompted", "1"); setTimeout(() => setShowInstallBanner(true), 1000); } } catch(e) {}
    }
  }, [mapInstance, isDesktop, installPrompt]);
  const handleReport = useCallback(async ({ zoneId, severity, text, photo, altRoute }) => { await submitReport({ zoneId, severity, text, photo, altRoute }); const zone = ZONES.find((z) => z.id === zoneId); if (zone) notifyZone({ zoneId, zoneName: `${zone.name} (${zone.area})`, severity, text }); }, [submitReport]);
  const handleUpvoteLocal = useCallback((id) => { setUpvotedSet((prev) => new Set([...prev, id])); }, []);
  const handleLogoClick = () => { setScreen("main"); setSelectedZone(null); setActiveFilter(null); setShowMoreMenu(false); if (isDesktop) setDesktopView("map"); else setMobileView("map"); };
  const handleFilterClick = (filter) => { setActiveFilter((prev) => prev === filter ? null : filter); };
  const handleMobileTab = (key) => { if (navigator.vibrate) navigator.vibrate(10); if (key === "more") { setShowMoreMenu(true); return; } setMobileView(key); };
  const handleDesktopTab = (key) => { if (key === "live") setShowPanel((p) => !p); else setDesktopView(key); };
  const sheetCloseRef = useRef(null);
  const closeSheet = () => {
    mapRestoreRef.current = null;
    setScreen("main"); setSelectedZone(null);
    // Show notification prompt once after first zone view
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default" && !localStorage.getItem("arroyo-notif-prompted")) {
        localStorage.setItem("arroyo-notif-prompted", "1");
        setTimeout(() => setShowNotifPrompt(true), 600);
      }
    } catch(e) {}
  };

  const closeScreenAnimated = useCallback(() => {
    setClosingScreen(screen);
    setTimeout(() => { setScreen("main"); setClosingScreen(null); }, 250);
  }, [screen]);

  const closeMobileScreen = useCallback(() => {
    setClosingMobile(screen);
    setTimeout(() => { setScreen("main"); setClosingMobile(null); }, 250);
  }, [screen]);
  const handleMapReady = useCallback((map) => { setMapInstance(map); }, []);
  const handleLocate = useCallback(() => {
    if (!mapInstance) return;
    // Toggle off if already located
    if (userLocation) {
      if (locationMarker) locationMarker.remove();
      setLocationMarker(null);
      manualLocateRef.current = false;
      setUserLocation(null);
      mapInstance.flyTo({ center: [-74.805, 10.96], zoom: 12.5, duration: 800 });
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const mapboxgl = require("mapbox-gl");
      if (locationMarker) locationMarker.remove();
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);margin:4px;"></div>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([longitude, latitude])
        .addTo(mapInstance);
      setLocationMarker(marker);
      manualLocateRef.current = true;
      setUserLocation([latitude, longitude]);
      mapInstance.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
    }, null, { enableHighAccuracy: true });
  }, [mapInstance, locationMarker, userLocation]);

  // Restore location marker when map remounts (e.g., switching back from list view)
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;
  useEffect(() => {
    if (!mapInstance) return;
    const loc = userLocationRef.current;
    if (!loc) return;
    // Small delay to let map initialize
    const timer = setTimeout(() => {
      const mapboxgl = require("mapbox-gl");
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);margin:4px;"></div>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([loc[1], loc[0]])
        .addTo(mapInstance);
      setLocationMarker(marker);
    }, 200);
    return () => clearTimeout(timer);
  }, [mapInstance]);

  const currentMainView = isDesktop ? desktopView : mobileView;
  const panelVisible = isDesktop && showPanel;
  const headerGlow = dangerCount > 0 ? "header-glow-danger" : cautionCount > 0 ? "header-glow-caution" : liveCount > 0 ? "header-glow-safe" : "header-glow-neutral";
  const isRaining = weather?.isRaining || false;

  if (showOnboarding) return <Onboarding lang={lang} onComplete={() => setShowOnboarding(false)} onToggleLang={toggleLang} />;
  if ((screen === "about" || closingMobile === "about") && !isDesktop) return <AnimatedScreen closing={closingMobile === "about"}><AboutPage onBack={closeMobileScreen} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} onShowOnboarding={() => { setScreen("main"); setShowOnboarding(true); }} communityStats={{ reporters: communityStats?.reporters || 0, reports: communityStats?.totalReports || 0, zones: ZONES.length }} /></AnimatedScreen>;
  if ((screen === "heatmap" || closingMobile === "heatmap") && !isDesktop) return <AnimatedScreen closing={closingMobile === "heatmap"}><HeatmapView onBack={closeMobileScreen} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} /></AnimatedScreen>;
  if ((screen === "profile" || closingMobile === "profile") && !isDesktop) return <AnimatedScreen closing={closingMobile === "profile"}><ReporterProfile reports={reports} onBack={closeMobileScreen} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} /></AnimatedScreen>;
  if ((screen === "report" || closingMobile === "report") && !isDesktop) return <AnimatedScreen closing={closingMobile === "report"}><ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} userLocation={userLocation} onSubmit={async (data) => {
    const prevCount = getReporterStats().reportCount;
    await handleReport(data);
    const newCount = getReporterStats().reportCount;
    const milestones = [1, 5, 20, 50];
    const crossedMilestone = milestones.find(m => prevCount < m && newCount >= m);
    if (crossedMilestone) {
      const ranks = { 1: es ? "Reportero" : "Reporter", 5: es ? "Vigía Verificado" : "Verified Watcher", 20: es ? "Protector" : "Protector", 50: es ? "Guardián" : "Guardian" };
      setRankUp(ranks[crossedMilestone]);
      setTimeout(() => setRankUp(null), 4500);
    }
    const zone = ZONES.find(z => z.id === data.zoneId);
    setLastReport({ zoneId: data.zoneId, zoneName: zone?.name, zoneArea: zone?.area, severity: data.severity, text: data.text });
    setScreen("main");
  }} onBack={closeMobileScreen} onLogoClick={handleLogoClick} /></AnimatedScreen>;

  const desktopTabs = [{ key: "map", Icon: MapIcon }, { key: "live", Icon: LiveIcon }];

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#070b14", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", background: "linear-gradient(180deg, rgba(10,15,26,0.75) 0%, rgba(10,15,26,0.6) 100%)", backdropFilter: "blur(16px) saturate(1.6)", WebkitBackdropFilter: "blur(16px) saturate(1.6)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 -0.5px 0 rgba(0,0,0,0.1)", flexShrink: 0, position: "relative", zIndex: 900 }}>
        <div className={headerGlow} style={{ position: "absolute", top: -30, left: "10%", right: "10%", height: 80, borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
        <button onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <Logo size={26} />
          <div style={{ display: "flex", alignItems: "baseline", gap: "0" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
            <span style={{ fontSize: "7px", fontWeight: 700, color: "var(--accent)", marginLeft: "4px", opacity: 0.6, letterSpacing: "0.5px" }}>BETA</span>
          </div>
        </button>
        <div style={{ flex: 1 }} />
        {totalWatchers > 1 && <div title={es ? `${totalWatchers} personas viendo la app ahora` : `${totalWatchers} people viewing the app now`} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span style={{ fontVariantNumeric: "tabular-nums" }}>{totalWatchers}</span>{isDesktop && <span style={{ opacity: 0.7 }}>{es ? "viendo" : "watching"}</span>}</div>}
        {!totalWatchers && lastUpdated && <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-faint)", fontWeight: 500, opacity: 0.6 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--safe)" }} />{es ? "En línea" : "Live"}</div>}
        <WeatherIndicator />
        {isDesktop && (
          <button className="header-icon-btn" onClick={() => setShowMoreMenu(true)} aria-label={es ? "Más opciones" : "More options"} title={es ? "Más opciones" : "More options"} style={{ width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.25" fill="var(--text-dim)"/><circle cx="12" cy="5" r="1.25" fill="var(--text-dim)"/><circle cx="12" cy="19" r="1.25" fill="var(--text-dim)"/></svg>
          </button>
        )}
        <button onClick={toggleLang} className="tap-target" aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"} style={{ padding: "5px 10px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-dim)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.3px", flexShrink: 0, transition: "all 0.15s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>{lang === "es" ? "EN" : "ES"}</button>
        {isDesktop && (
          <button onClick={() => setScreen("report")} style={{ padding: "7px 16px", borderRadius: "99px", background: "linear-gradient(145deg, #e53e3e, #b91c1c)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(212,42,42,0.3), 0 6px 16px rgba(212,42,42,0.15), inset 0 1px 0 rgba(255,255,255,0.2)", flexShrink: 0, letterSpacing: "0.2px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {es ? "Reportar" : "Report"}
          </button>
        )}

      </div>

      <EmergencyBanner emergency={emergency} lang={lang} />
      <OfflineBanner lang={lang} />

      {/* Proactive rain alert */}
      {weather && (weather.isRaining || (weather.maxProb >= 70 && weather.hoursUntilRain !== null)) && !emergency.active && (
        <div style={{
          padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
          background: weather.isRaining ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.06)",
          borderBottom: `1px solid ${weather.isRaining ? "rgba(239,68,68,0.12)" : "rgba(234,179,8,0.1)"}`,
          animation: "fadeIn 0.3s ease", flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "var(--radius-sm)",
            background: weather.isRaining ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.08)",
            border: `1px solid ${weather.isRaining ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.12)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={weather.isRaining ? "#fca5a5" : "#fde047"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/>
              <line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: weather.isRaining ? "#fca5a5" : "#fde047" }}>
              {weather.isRaining
                ? (es ? "Lluvia detectada" : "Rain detected")
                : weather.hoursUntilRain === 0
                  ? (es ? "Lluvia inminente" : "Rain imminent")
                  : (es ? `Lluvia probable en ~${weather.hoursUntilRain}h` : `Rain likely in ~${weather.hoursUntilRain}h`)}
            </div>
            <div style={{ fontSize: "11px", color: weather.isRaining ? "rgba(252,165,165,0.6)" : "rgba(253,224,71,0.5)", marginTop: "1px" }}>
              {weather.isRaining
                ? (es ? "Evita cruzar arroyos — reporta si ves uno" : "Avoid crossing arroyos — report if you see one")
                : (es ? "Prepárate y revisa las zonas cercanas" : "Be prepared and check nearby zones")}
            </div>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: weather.isRaining ? "#fca5a5" : "#fde047", fontVariantNumeric: "tabular-nums" }}>{weather.maxProb}%</span>
        </div>
      )}
      {/* PWA update available */}
      {pwaUpdate.updateAvailable && (
        <div style={{
          padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px",
          background: "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(34,197,94,0.15)",
          animation: "fadeIn 0.3s ease", flexShrink: 0,
        }}>
          <span style={{ opacity: 0.7 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 105.64-12.36L1 10" /></svg></span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "13px", color: "var(--safe)", fontWeight: 600 }}>
              {es ? "Nueva versión disponible" : "New version available"}
            </span>
            {pwaUpdate.newVersion && <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "6px" }}>v{pwaUpdate.newVersion}</span>}
          </div>
          <button onClick={pwaUpdate.doUpdate} style={{
            padding: "7px 16px", borderRadius: "20px",
            background: "var(--safe)", border: "none", color: "#fff",
            fontSize: "12px", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(34,197,94,0.2)",
          }}>
            {es ? "Actualizar" : "Update"}
          </button>
        </div>
      )}
      <UpdateBanner />

      {/* STATUS BAR — Option D: single-line status with live timestamp */}
      {(() => {
        const hasDanger = dangerCount > 0;
        const hasCaution = cautionCount > 0;
        const hasAlerts = hasDanger || hasCaution;
        const iconBg = hasDanger ? "rgba(239,68,68,0.12)" : hasCaution ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.10)";
        const iconBorder = hasDanger ? "rgba(239,68,68,0.28)" : hasCaution ? "rgba(234,179,8,0.28)" : "rgba(34,197,94,0.22)";
        const iconStroke = hasDanger ? "#fca5a5" : hasCaution ? "#fde047" : "#86efac";
        const primaryText = hasDanger
          ? <>{dangerCount} {dangerCount === 1 ? (es ? "arroyo peligroso" : "dangerous arroyo") : (es ? "arroyos peligrosos" : "dangerous arroyos")}</>
          : hasCaution
          ? <>{cautionCount} {cautionCount === 1 ? (es ? "arroyo con precaución" : "arroyo with caution") : (es ? "arroyos con precaución" : "arroyos with caution")}</>
          : t.noActiveAlerts;
        const primaryColor = hasDanger ? "#fca5a5" : hasCaution ? "#fde047" : "#86efac";
        const metaParts = [];
        if (hasDanger && hasCaution) metaParts.push(`${cautionCount} ${es ? "precaución" : "caution"}`);
        if (lastUpdated) {
          void statusTick;
          metaParts.push((es ? "actualizado " : "updated ") + timeAgoLocalized(lastUpdated.toISOString(), lang));
        }
        const handleRowClick = () => {
          if (hasAlerts) {
            if (isDesktop) { setShowPanel(p => !p); }
            else { handleMobileTab(currentMainView === "live" ? "map" : "live"); }
          }
        };
        return (
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(10,15,26,0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <button
              onClick={handleRowClick}
              disabled={!hasAlerts}
              className={hasAlerts ? "tap-target" : ""}
              style={{
                display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0,
                background: "none", border: "none", padding: 0,
                cursor: hasAlerts ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
                textAlign: "left",
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: "8px", background: iconBg, border: `0.5px solid ${iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {hasAlerts ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: primaryColor, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{primaryText}</span>
                {metaParts.length > 0 && (
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {metaParts.join(" · ")}
                  </span>
                )}
              </span>
            </button>
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="tap-target" aria-label={es ? "Quitar filtro" : "Clear filter"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(255,255,255,0.06)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.15s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
              </button>
            )}
          </div>
        );
      })()}

      {/* CONTENT */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", position: "relative" }}>
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {/* Map — always visible on desktop, conditional on mobile */}
          {(isDesktop || currentMainView === "map") && (
            <>
            {mapDeferred ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", background: "#070b14", color: "var(--text-dim)", fontSize: "13px" }}>
                {t.loadingMap}
              </div>
            ) : (
              <MapErrorBoundary>
                <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>{t.loadingMap}</div>}>
                  <MapView reports={reports} onZoneClick={handleZoneClick} panelOpen={panelVisible} activeFilter={activeFilter} predictions={predictions} onMapReady={handleMapReady} />
                </Suspense>
              </MapErrorBoundary>
            )}
            {isRaining && <div className="rain-overlay" />}
            {/* Floating map controls */}
            <div style={{ position: "absolute", top: 12, right: panelVisible ? 396 : 12, zIndex: 800, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
              <RainRadarButton enabled={radar.enabled} onToggle={radar.toggle} />
              <button onClick={handleLocate} aria-label={es ? "Mi ubicación" : "My location"} className="tap-target" style={{
                width: 40, height: 40, borderRadius: "50%",
                background: userLocation ? "rgba(66,133,244,0.12)" : "rgba(10,15,26,0.2)",
                border: `1px solid ${userLocation ? "rgba(66,133,244,0.25)" : "rgba(255,255,255,0.13)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                backdropFilter: "blur(16px) saturate(1.6)", WebkitBackdropFilter: "blur(16px) saturate(1.6)",
                transition: "all 0.2s ease",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={userLocation ? "#4285F4" : "rgba(255,255,255,0.45)"} strokeWidth="1.75" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </button>
            </div>
            </>
          )}

          {/* Floating zone search — overlays the map */}
          {(isDesktop || currentMainView === "map") && (
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 800, width: isDesktop ? 340 : "calc(100% - 72px)" }}>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 2 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  ref={mapSearchRef}
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => { setMapSearchQuery(e.target.value); openSearch(); }}
                  onFocus={openSearch}
                  placeholder={es ? "Buscar zona..." : "Search zones..."}
                  style={{
                    width: "100%", padding: "11px 14px 11px 40px",
                    background: "rgba(10,15,26,0.6)", backdropFilter: "blur(20px) saturate(1.6)", WebkitBackdropFilter: "blur(20px) saturate(1.6)",
                    border: mapSearchOpen ? "1px solid rgba(91,156,246,0.3)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: mapSearchOpen ? "16px 16px 0 0" : "99px",
                    color: "var(--text)", fontSize: "13px", outline: "none", fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
                    transition: "border-radius 0.22s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.22s ease",
                  }}
                />
                {mapSearchQuery && (
                  <button onClick={closeSearch} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2,
                  }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/></svg>
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              {mapSearchOpen && (() => {
                const q = mapSearchQuery.toLowerCase();
                let results = ZONES.filter(z => {
                  if (!q) return true;
                  return z.name.toLowerCase().includes(q) || z.area.toLowerCase().includes(q);
                });
                // Sort: favorites first, then active severity, then alphabetical
                results = favs.sortZones(results);
                const favIds = new Set(results.filter(z => favs.isFavorite(z.id)).map(z => z.id));
                const favZones = results.filter(z => favIds.has(z.id));
                const restZones = results.filter(z => !favIds.has(z.id));
                results = [...favZones, ...restZones];

                return (
                  <div style={{
                    background: "rgba(10,15,26,0.85)", backdropFilter: "blur(20px) saturate(1.6)", WebkitBackdropFilter: "blur(20px) saturate(1.6)",
                    border: "1px solid rgba(91,156,246,0.2)", borderTop: "none",
                    borderRadius: "0 0 16px 16px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    maxHeight: 320, overflowY: "auto", overflowX: "hidden", transformOrigin: "top center", animation: mapSearchClosing ? "searchDropdownOut 0.18s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "searchDropdownIn 0.22s cubic-bezier(0.32, 0.72, 0, 1) forwards",
                  }}>
                    {results.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "var(--text-faint)" }}>
                        {es ? "No se encontró zona" : "No zone found"}
                      </div>
                    ) : results.map((z) => {
                      const sv = getZoneSeverity(z.id, reports);
                      const c = sv ? SEVERITY[sv] : null;
                      const isFav = favs.isFavorite(z.id);
                      return (
                        <button key={z.id} onClick={() => {
                          closeSearch();
                          mapSearchRef.current?.blur();
                          handleZoneClick(z.id);
                          // Fly map to zone
                          if (mapInstance) mapInstance.flyTo({ center: [z.lng, z.lat], zoom: 15, duration: 800 });
                        }} style={{
                          width: "100%", padding: "10px 14px", background: "transparent",
                          border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                          textAlign: "left", cursor: "pointer", color: "var(--text)",
                          display: "flex", alignItems: "center", gap: "10px",
                          transition: "background 0.1s ease",
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c ? `${c.color}0a` : "rgba(255,255,255,0.03)", border: `1px solid ${c ? c.color + "18" : "rgba(255,255,255,0.06)"}` }}>
                            <SeverityIcon severity={sv || "inactive"} size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                              {z.name}
                              {isFav && <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--caution)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "1px" }}>{z.area}</div>
                          </div>
                          {c && <span style={{ fontSize: "10px", color: c.color, fontWeight: 500 }}>{getSevLabel(sv, lang)}</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Click outside to close */}
              {mapSearchOpen && <div onClick={closeSearch} style={{ position: "fixed", inset: 0, zIndex: -1 }} />}
            </div>
          )}

          {/* Live feed — mobile only (desktop uses floating right panel) */}
          {!isDesktop && currentMainView === "live" && (
            <div key="live-view" onClick={(e) => { if (screen === "detail" && selectedZone && !e.target.closest("button, a, input")) { sheetCloseRef.current ? sheetCloseRef.current() : closeSheet(); } }} style={{ animation: "viewFadeIn 0.25s ease", height: "100%", overflow: "hidden" }}>
            <LiveFeed reports={reports} onZoneClick={(id) => handleZoneClick(id, "live")} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} onPhotoClick={setViewPhoto} onReport={() => setScreen("report")} />
            </div>
          )}
        </div>
        {isDesktop && (
          <div onTransitionEnd={() => { window.dispatchEvent(new Event("resize")); }} style={{ position: "absolute", top: 10, right: 10, bottom: 10, width: showPanel ? 370 : 0, flexShrink: 0, background: "rgba(12,18,32,0.65)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)", border: showPanel ? "1px solid rgba(255,255,255,0.1)" : "none", borderRadius: "32px", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease", boxShadow: showPanel ? "0 8px 40px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06)" : "none", zIndex: 10, opacity: showPanel ? 1 : 0 }}>
            <div style={{ width: 370, height: "100%", opacity: showPanel ? 1 : 0, transition: "opacity 0.2s ease", overflow: "hidden" }}>
              <LiveFeed reports={reports} onZoneClick={(id) => handleZoneClick(id, "live")} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} onPhotoClick={setViewPhoto} onReport={() => setScreen("report")} />
            </div>
          </div>
        )}
      </div>

      {/* HINT BUBBLE — portaled to body for working backdrop-filter */}
      {(isDesktop || currentMainView === "map") && !loading && !hintDismissed && !showMoreMenu && reports.filter(r => new Date(r.created_at).getTime() > Date.now() - 4 * 3600000).length === 0 && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", bottom: "calc(160px + env(safe-area-inset-bottom, 0px))", left: 16, right: 16, zIndex: 9999, display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease 1s both", pointerEvents: "none" }}>
          <div style={{ background: "rgba(10,15,26,0.2)", backdropFilter: "blur(16px) saturate(1.8)", WebkitBackdropFilter: "blur(16px) saturate(1.8)", borderRadius: "99px", padding: "10px 12px 10px 14px", border: "1px solid rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)", pointerEvents: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{es ? "Toca una zona o usa Reportar" : "Tap a zone or use Report"}</span>
            <button onClick={() => setHintDismissed(true)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 8 8" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/></svg>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* BOTTOM NAV — mobile only, fixed floating pill */}
      <RainRadarLegend enabled={radar.enabled} isDesktop={isDesktop} />
      {!isDesktop && <BottomNav activeTab={mobileView} onTab={handleMobileTab} onReport={() => setScreen("report")} liveCount={liveCount} dangerCount={dangerCount} lang={lang} />}
      {showMoreMenu && <MoreMenu lang={lang} onSelect={(key) => { if (key === "digest") setShowDigest(true); else setScreen(key); }} onClose={() => setShowMoreMenu(false)} />}

      {/* ZONE DETAIL — Bottom Sheet overlay (map stays visible behind) */}
      {screen === "detail" && selectedZone && (() => {
        const zone = ZONES.find((z) => z.id === selectedZone);
        return (
          <ZoneSheet
            zone={zone}
            severity={getZoneSeverity(selectedZone, reports)}
            reports={getZoneReports(selectedZone, reports)}
            onClose={closeSheet}
            onReport={() => setScreen("report")}
            onUpvote={upvoteReport}
            push={push}
            zoneWatchers={zoneWatchers}
            prediction={predictions[selectedZone]}
            watchZone={watchZone}
            unwatchZone={unwatchZone}
            onLogoClick={handleLogoClick}
            isDesktop={isDesktop}
            desktopView={desktopView}
            mapInstance={mapInstance}
            favs={favs}
            initialSnap={zoneClickSource === "map" ? "peek" : "half"}
            mapRestoreRef={mapRestoreRef}
            onPhotoClick={setViewPhoto}
            onDelete={deleteReport}
            userLocation={userLocation}
            closeRef={sheetCloseRef}
          />
        );
      })()}

      {/* Weekly Digest modal */}
      {(showDigest || closingDigest) && <WeeklyDigest onClose={() => { setClosingDigest(true); setTimeout(() => { setShowDigest(false); setClosingDigest(false); }, 250); }} onZoneClick={(id) => handleZoneClick(id, "list")} closing={closingDigest} />}

      {/* Desktop About modal — single container to prevent layer flicker */}
      {isDesktop && (screen === "about" || closingScreen === "about") && (
        <div onClick={closeScreenAnimated} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", animation: closingScreen === "about" ? "backdropOut 0.25s ease forwards" : "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, height: "85vh", background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", animation: closingScreen === "about" ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)", overflow: "hidden", position: "relative" }}>
            <AboutPage onBack={closeScreenAnimated} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} onShowOnboarding={() => { setClosingScreen("about"); setTimeout(() => { setScreen("main"); setClosingScreen(null); setShowOnboarding(true); }, 250); }} communityStats={{ reporters: communityStats?.reporters || 0, reports: communityStats?.totalReports || 0, zones: ZONES.length }} />
          </div>
        </div>
      )}

      {/* Desktop Profile modal — single container to prevent layer flicker */}
      {isDesktop && (screen === "profile" || closingScreen === "profile") && (
        <div onClick={closeScreenAnimated} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", animation: closingScreen === "profile" ? "backdropOut 0.25s ease forwards" : "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, height: "80vh", background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", animation: closingScreen === "profile" ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)", overflow: "hidden", position: "relative" }}>
            <ReporterProfile reports={reports} onBack={closeScreenAnimated} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} />
          </div>
        </div>
      )}

      {/* Desktop Heatmap modal */}
      {isDesktop && (screen === "heatmap" || closingScreen === "heatmap") && (
        <div onClick={closeScreenAnimated} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", animation: closingScreen === "heatmap" ? "backdropOut 0.25s ease forwards" : "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 800, height: "85vh", background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", animation: closingScreen === "heatmap" ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)", overflow: "hidden", position: "relative" }}>
            <HeatmapView onBack={closeScreenAnimated} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} />
          </div>
        </div>
      )}

      {/* Desktop Report modal */}
      {isDesktop && (screen === "report" || closingScreen === "report") && (
        <div onClick={closeScreenAnimated} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", animation: closingScreen === "report" ? "backdropOut 0.25s ease forwards" : "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "85vh", background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", animation: closingScreen === "report" ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)", overflow: "auto", position: "relative" }}>
            <ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} userLocation={userLocation} onSubmit={async (data) => {
              const prevCount = getReporterStats().reportCount;
              await handleReport(data);
              const newCount = getReporterStats().reportCount;
              const milestones = [1, 5, 20, 50];
              const crossedMilestone = milestones.find(m => prevCount < m && newCount >= m);
              if (crossedMilestone) {
                const ranks = { 1: es ? "Reportero" : "Reporter", 5: es ? "Vigía Verificado" : "Verified Watcher", 20: es ? "Protector" : "Protector", 50: es ? "Guardián" : "Guardian" };
                setRankUp(ranks[crossedMilestone]);
                setTimeout(() => setRankUp(null), 4500);
              }
              const zone = ZONES.find(z => z.id === data.zoneId);
              setLastReport({ zoneId: data.zoneId, zoneName: zone?.name, zoneArea: zone?.area, severity: data.severity, text: data.text });
              setScreen("main");
            }} onBack={closeScreenAnimated} onLogoClick={handleLogoClick} />
          </div>
        </div>
      )}

      {/* Post-report WhatsApp share prompt */}
      {(lastReport || closingWhatsApp) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: closingWhatsApp ? "backdropOut 0.25s ease forwards" : "fadeIn 0.2s ease" }}>
          <div style={{ width: "100%", maxWidth: 340, background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", padding: "32px 24px 24px", textAlign: "center", animation: closingWhatsApp ? "desktopModalOut 0.25s ease forwards" : "modalScaleIn 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "successPulse 0.5s ease" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.3px" }}>
              {es ? "¡Reporte enviado!" : "Report sent!"}
            </h3>
            {communityStats && communityStats.reporters > 1 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)", marginBottom: "12px", fontSize: "12px", fontWeight: 600, color: "var(--safe)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                {es ? `Alertando a ${communityStats.reporters} reporteros` : `Alerting ${communityStats.reporters} reporters`}
              </div>
            )}
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
              {es
                ? "Tu reporte protege a otros. Compártelo por WhatsApp para alertar a familiares y vecinos."
                : "Your report protects others. Share it via WhatsApp to alert family and neighbors."}
            </p>
            <button onClick={() => {
              const sevLabels = es
                ? { danger: "PELIGROSO", caution: "Precaución", safe: "Despejado" }
                : { danger: "DANGEROUS", caution: "Caution", safe: "Clear" };
              const text = es
                ? `⚠️ Arroyo ${sevLabels[lastReport.severity]} en ${lastReport.zoneName} (${lastReport.zoneArea})\n${lastReport.text ? lastReport.text + "\n" : ""}📍 AlertaArroyo — https://arroyo-alert.vercel.app?zone=${lastReport.zoneId}`
                : `⚠️ Arroyo ${sevLabels[lastReport.severity]} at ${lastReport.zoneName} (${lastReport.zoneArea})\n${lastReport.text ? lastReport.text + "\n" : ""}📍 AlertaArroyo — https://arroyo-alert.vercel.app?zone=${lastReport.zoneId}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              setClosingWhatsApp(true); setTimeout(() => { setLastReport(null); setClosingWhatsApp(false); }, 250);
            }} className="tap-target" style={{
              width: "100%", padding: "15px", borderRadius: "var(--radius-lg)",
              background: "#25D366", border: "none", color: "#fff",
              fontSize: "15px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: "0 8px 24px rgba(37,211,102,0.3)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              {es ? "Compartir por WhatsApp" : "Share via WhatsApp"}
            </button>
            <button onClick={() => { setClosingWhatsApp(true); setTimeout(() => { setLastReport(null); setClosingWhatsApp(false); }, 250); }} className="tap-target" style={{
              width: "100%", marginTop: "8px", padding: "13px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-lg)", color: "var(--text-dim)",
              fontSize: "14px", fontWeight: 500,
            }}>
              {es ? "Ahora no" : "Not now"}
            </button>
          </div>
        </div>
      )}

      {/* Rank-up celebration */}
      {rankUp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1950, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", animation: "fadeIn 0.2s ease", pointerEvents: "none" }}>
          <div style={{ textAlign: "center", animation: "modalScaleIn 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(245,208,51,0.1)", border: "2px solid rgba(245,208,51,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "successPulse 0.6s ease" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F5D033" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div style={{ fontSize: "12px", color: "var(--baq-yellow)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700, marginBottom: "8px" }}>{es ? "Nuevo rango" : "Rank up"}</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{rankUp}</div>
          </div>
        </div>
      )}

      {/* PWA install prompt */}
      {showInstallBanner && (
        <div onClick={() => setShowInstallBanner(false)} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", padding: "28px 24px 24px", animation: "slideUp 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <Logo size={44} />
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>{es ? "Instala AlertaArroyo" : "Install AlertaArroyo"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{es ? "Acceso rápido desde tu pantalla" : "Quick access from your home screen"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, text: es ? "Alertas instantáneas" : "Instant alerts" },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" strokeWidth="1.75" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: es ? "Funciona sin internet" : "Works offline" },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--baq-yellow)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, text: es ? "Abre al instante" : "Opens instantly" },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, padding: "10px 8px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px" }}>{item.icon}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: 500 }}>{item.text}</div>
                </div>
              ))}
            </div>
            <button onClick={async () => { if (installPrompt) { installPrompt.prompt(); try { await installPrompt.userChoice; } catch(e) {} setInstallPrompt(null); } setShowInstallBanner(false); }} className="tap-target" style={{
              width: "100%", padding: "15px", borderRadius: "var(--radius-lg)",
              background: "var(--accent)", border: "none", color: "#fff",
              fontSize: "15px", fontWeight: 700,
              boxShadow: "0 8px 24px rgba(91,156,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {es ? "Instalar app" : "Install app"}
            </button>
            <button onClick={() => setShowInstallBanner(false)} className="tap-target" style={{
              width: "100%", marginTop: "8px", padding: "13px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-lg)", color: "var(--text-dim)",
              fontSize: "14px", fontWeight: 500,
            }}>
              {es ? "Ahora no" : "Not now"}
            </button>
          </div>
        </div>
      )}

      {/* Notification permission prompt */}
      {showNotifPrompt && (
        <div onClick={() => setShowNotifPrompt(false)} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "rgba(12,18,32,0.92)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", padding: "32px 24px 24px", textAlign: "center", animation: "modalScaleIn 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(91,156,246,0.08)", border: "2px solid rgba(91,156,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.3px", color: "var(--text)" }}>
              {es ? "Activa las notificaciones" : "Enable notifications"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
              {es
                ? "Recibe alertas cuando se reporte un arroyo peligroso cerca de ti. Puede salvar tu vida."
                : "Get alerted when a dangerous arroyo is reported near you. It could save your life."}
            </p>
            <button onClick={async () => {
              try { await Notification.requestPermission(); } catch(e) {}
              setShowNotifPrompt(false);
            }} className="tap-target" style={{
              width: "100%", padding: "15px", borderRadius: "var(--radius-lg)",
              background: "var(--accent)", border: "none", color: "#fff",
              fontSize: "15px", fontWeight: 700,
              boxShadow: "0 8px 24px rgba(91,156,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              {es ? "Activar alertas" : "Enable alerts"}
            </button>
            <button onClick={() => setShowNotifPrompt(false)} className="tap-target" style={{
              width: "100%", marginTop: "8px", padding: "13px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-lg)", color: "var(--text-dim)",
              fontSize: "14px", fontWeight: 500,
            }}>
              {es ? "Ahora no" : "Not now"}
            </button>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", top: "max(16px, env(safe-area-inset-top, 16px))", left: "50%", transform: "translateX(-50%)", zIndex: 1900, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none", width: "90%", maxWidth: 360 }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: "rgba(12,18,32,0.88)", border: `1px solid ${t.color}30`,
              borderRadius: "24px", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "10px",
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
              animation: "slideDown 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)",
              pointerEvents: "auto", width: "100%",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0, animation: "blink 2s ease infinite" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", flex: 1 }}>{t.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen photo viewer */}
      {viewPhoto && (
        <div role="dialog" aria-label="Photo viewer" onClick={() => setViewPhoto(null)} style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", animation: "fadeIn 0.15s ease",
          cursor: "zoom-out",
        }}>
          <button onClick={() => setViewPhoto(null)} style={{
            position: "absolute", top: "max(16px, env(safe-area-inset-top, 16px))", right: 16, zIndex: 1,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
          </button>
          <img
            src={viewPhoto}
            alt="Report photo full view"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%", maxHeight: "85vh",
              borderRadius: "var(--radius-lg)",
              objectFit: "contain",
              animation: "modalScaleIn 0.25s cubic-bezier(0.34, 1.4, 0.64, 1)",
              cursor: "default",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Home() { return <LanguageProvider><AppContent /></LanguageProvider>; }
