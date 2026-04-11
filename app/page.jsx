"use client";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { usePushNotifications, notifyZone } from "@/lib/usePushNotifications";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports, getSevLabel } from "@/lib/zones";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import { checkEmergencyMode, getFloodPredictions } from "@/lib/predictions";
import { useLiveWatchers } from "@/lib/useLiveWatchers";
import ReportFlow from "@/components/ReportFlow";
import ZoneDetail from "@/components/ZoneDetail";
import LiveFeed from "@/components/LiveFeed";
import WeatherIndicator from "@/components/WeatherIndicator";
import Onboarding from "@/components/Onboarding";
import AboutPage from "@/components/AboutPage";
import HeatmapView from "@/components/HeatmapView";
import UpdateBanner from "@/components/UpdateBanner";
import { SeverityIcon } from "@/components/SeverityIcon";
import { MapIcon, ListIcon, LiveIcon, MoreIcon, ProfileIcon, ChartIcon, FlameIcon, InfoIcon, StarIcon, AlertTriangleIcon, BellIcon } from "@/components/Icons";
import { useRainRadar, RainRadarButton } from "@/components/RainRadar";
import PullToRefresh from "@/components/PullToRefresh";
import CommentThread from "@/components/CommentThread";
import ReporterProfile from "@/components/ReporterProfile";
import WeeklyDigest from "@/components/WeeklyDigest";
import { useFavorites } from "@/lib/useFavorites";
import { useUpdateChecker } from "@/lib/useUpdateChecker";

const MapView = lazy(() => import("@/components/MapView"));

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
  return <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px", marginBottom: "6px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}><div className="skeleton" style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="skeleton" style={{ width: "55%", height: 13, marginBottom: 8 }} /><div className="skeleton" style={{ width: "35%", height: 10 }} /></div></div>;
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

function BottomNav({ activeTab, onTab, onReport, liveCount, lang }) {
  const tabs = [
    { key: "map", Icon: MapIcon, label: lang === "es" ? "Mapa" : "Map" },
    { key: "list", Icon: ListIcon, label: lang === "es" ? "Zonas" : "Zones" },
    { key: "report", isReport: true, label: lang === "es" ? "Reportar" : "Report" },
    { key: "live", Icon: LiveIcon, label: lang === "es" ? "En vivo" : "Live", badge: liveCount },
    { key: "more", Icon: MoreIcon, label: lang === "es" ? "Más" : "More" },
  ];
  return (
    <div className="bottom-nav" style={{
      display: "flex", alignItems: "center", justifyContent: "space-around",
      background: "#0a0f1a", flexShrink: 0, height: 64,
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        if (tab.isReport) return (
          <button key={tab.key} onClick={onReport} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", background: "none", border: "none", padding: "0 16px", position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #D42A2A, #a11a1a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(212,42,42,0.4)", marginTop: "-18px", border: "2px solid rgba(255,255,255,0.1)" }}>
              <AlertTriangleIcon size={18} color="#fff" />
            </div>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.3px" }}>{tab.label}</span>
          </button>
        );
        return (
          <button key={tab.key} onClick={() => onTab(tab.key)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "3px", background: "none", border: "none", padding: "6px 18px", position: "relative",
            borderRadius: "14px", transition: "all 0.25s cubic-bezier(0.34, 1.4, 0.64, 1)",
          }}>
            {/* Active pill background */}
            {isActive && <div style={{
              position: "absolute", inset: "2px 6px", borderRadius: "12px",
              background: "rgba(91,156,246,0.08)", border: "1px solid rgba(91,156,246,0.1)",
              transition: "all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)",
            }} />}
            <div style={{ position: "relative", zIndex: 1 }}>
              <tab.Icon size={21} color={isActive ? "var(--accent)" : "rgba(255,255,255,0.3)"} active={isActive} />
              {tab.badge > 0 && !isActive && <span style={{ position: "absolute", top: -2, right: -4, width: 7, height: 7, borderRadius: "50%", background: "var(--danger)", border: "1.5px solid #0a0f1a", animation: "blink 1.5s ease-in-out infinite" }} />}
            </div>
            <span style={{ position: "relative", zIndex: 1, fontSize: "10px", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--accent)" : "rgba(255,255,255,0.3)", letterSpacing: isActive ? "0.2px" : "0", transition: "all 0.2s ease" }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MoreMenu({ onSelect, lang, onClose }) {
  const es = lang === "es";
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", animation: closing ? "menuBackdropOut 0.2s ease forwards" : "fadeIn 0.15s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 64, right: 12, left: 12, maxWidth: 300, marginLeft: "auto", background: "rgba(14,22,40,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-lg)", padding: "4px", animation: closing ? "menuSlideOut 0.2s ease forwards" : "slideUp 0.2s cubic-bezier(0.32, 0.72, 0, 1)", boxShadow: "0 -12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)", transformOrigin: "bottom right" }}>
        {[
          { key: "profile", Icon: ProfileIcon, label: es ? "Mi perfil" : "My profile", desc: es ? "Estadísticas y rango de reportero" : "Stats and reporter rank" },
          { key: "digest", Icon: ChartIcon, label: es ? "Resumen semanal" : "Weekly digest", desc: es ? "Actividad de los últimos 7 días" : "Last 7 days activity" },
          { key: "heatmap", Icon: FlameIcon, label: es ? "Historial" : "History", desc: es ? "Zonas más afectadas" : "Most affected zones" },
          { key: "about", Icon: InfoIcon, label: es ? "Info y seguridad" : "Info & safety", desc: es ? "Consejos, emergencias, ajustes" : "Tips, emergencies, settings" },
        ].map((item) => (
          <button key={item.key} onClick={() => { onSelect(item.key); handleClose(); }} className="more-menu-item" style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "13px 12px", background: "none", border: "none", textAlign: "left", borderRadius: "var(--radius-sm)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><item.Icon size={16} color="var(--text-secondary)" /></div>
            <div><div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{item.label}</div><div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 1 }}>{item.desc}</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====== MULTI-SNAP BOTTOM SHEET — peek / half / full ====== */
function ZoneSheet({ zone, severity, reports, onClose, onReport, onUpvote, push, zoneWatchers, prediction, watchZone, unwatchZone, onLogoClick, isDesktop, desktopView, mapInstance, favs }) {
  const { lang, t } = useLanguage();
  const es = lang === "es";
  const sevColor = severity ? SEVERITY[severity].color : "var(--border)";

  // Center map on zone when in desktop map view
  useEffect(() => {
    if (isDesktop && desktopView === "map" && mapInstance && zone) {
      mapInstance.flyTo({ center: [zone.lng, zone.lat], zoom: 14, duration: 800, offset: [-190, 0] });
    }
  }, [isDesktop, desktopView, mapInstance, zone]);

  // Mobile sheet state (must be declared before any conditional returns)
  const SNAPS = { peek: 19, half: 50, full: 88 };
  const [snap, setSnap] = useState("peek");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const touchRef = useRef({ startY: 0, startSnap: 0, lastY: 0, lastTime: 0, velocity: 0 });
  const contentRef = useRef(null);
  const sheetRef = useRef(null);

  const [upvoted, setUpvoted] = useState(new Set());
  const deviceCounts = {};
  reports.forEach((r) => { if (r.device_id) deviceCounts[r.device_id] = (deviceCounts[r.device_id] || 0) + 1; });
  const handleUpvote = (r) => { if (upvoted.has(r.id)) return; onUpvote(r.id, r.upvotes); setUpvoted(prev => new Set([...prev, r.id])); if (navigator.vibrate) navigator.vibrate(50); };

  useEffect(() => {
    if (!isDesktop) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }
  }, [isDesktop]);

  // === DESKTOP: Side panel (map view) or centered modal (list view) ===
  if (isDesktop) {
    const isSidePanel = desktopView === "map";
    const handleDesktopClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 280); };

    const subscribed = push.isSubscribed?.(zone.id);
    const watcherCount = zoneWatchers?.[zone.id] || 0;
    const altRoutes = reports.filter(r => r.alt_route && r.alt_route.trim() && (r.severity === "danger" || r.severity === "caution"));

    const panelContent = (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `2px solid ${sevColor}30`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: severity ? `${sevColor}10` : "rgba(255,255,255,0.03)", border: `1px solid ${severity ? sevColor + "20" : "var(--border)"}` }}>
              <SeverityIcon severity={severity} size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px" }}>{zone.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{zone.area}</span>
                {severity && <span style={{ fontSize: "11px", fontWeight: 600, color: sevColor, background: `${sevColor}0a`, padding: "2px 8px", borderRadius: "6px" }}>{getSevLabel(severity, lang)}</span>}
              </div>
            </div>
            <button onClick={handleDesktopClose} className="tap-target" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 24px 24px" }}>
          {zone.desc && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>{es ? zone.desc : (zone.descEn || zone.desc)}</p>}

          {/* Watchers + prediction */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            {watcherCount > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
                {watcherCount} {es ? "monitoreando" : "watching"}
              </div>
            )}
            {prediction && prediction.score >= 20 && !severity && (
              <div style={{ fontSize: "12px", fontWeight: 600, color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)" }}>
                {prediction.score}% {es ? "probabilidad" : "probability"}
              </div>
            )}
          </div>

          <button onClick={onReport} style={{ width: "100%", padding: "13px", marginBottom: "12px", background: "linear-gradient(135deg, #D42A2A, #b91c1c)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)" }}>{t.reportThisZone}</button>

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {push.supported && (
              <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); if (!subscribed) push.subscribeToZone?.(zone.id); else push.unsubscribeFromZone?.(zone.id); }} className="tap-target" style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", background: subscribed ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${subscribed ? "rgba(91,156,246,0.15)" : "var(--border)"}`, color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <BellIcon size={14} color={subscribed ? "var(--accent)" : "var(--text-dim)"} />
                {subscribed ? (es ? "Suscrito" : "Subscribed") : (es ? "Notificarme" : "Notify me")}
              </button>
            )}
          </div>

          {/* Alt routes */}
          {altRoutes.length > 0 && (
            <div style={{ marginBottom: "20px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "var(--safe)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>{es ? "Rutas alternas" : "Alternate routes"}</div>
              {altRoutes.slice(0, 3).map((r, i) => (
                <div key={r.id} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid rgba(34,197,94,0.08)" : "none", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--safe)", fontWeight: 700, marginRight: "6px" }}>↗</span>{r.alt_route}
                </div>
              ))}
            </div>
          )}

          {/* Reports */}
          <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</div>
          {!reports.length && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: 500 }}>{es ? "Todo tranquilo por aquí" : "All quiet here"}</p>
              <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "4px" }}>{es ? "No hay reportes en las últimas 4 horas" : "No reports in the last 4 hours"}</p>
            </div>
          )}
          {reports.map((r, i) => {
            const cfg = SEVERITY[r.severity];
            return (
              <div key={r.id} className={`card-interactive card-accent-${r.severity}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "8px", animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                  <SeverityIcon severity={r.severity} size={16} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: cfg.color }}>{getSevLabel(r.severity, lang)}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{timeAgoLocalized(r.created_at, lang)}</span>
                </div>
                {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                {r.photo_url && <div style={{ marginBottom: "10px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}><img src={r.photo_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} loading="lazy" /></div>}
                {!r.text && !r.photo_url && <div style={{ marginBottom: "8px" }} />}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => handleUpvote(r)} className="tap-target" style={{ background: upvoted.has(r.id) ? "var(--accent-glow)" : "rgba(255,255,255,0.02)", border: `1px solid ${upvoted.has(r.id) ? "rgba(91,156,246,0.15)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: upvoted.has(r.id) ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 500, flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={upvoted.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>{upvoted.has(r.id) ? (es ? "Confirmado" : "Confirmed") : (es ? "Confirmar" : "Confirm")} · {r.upvotes + (upvoted.has(r.id) ? 1 : 0)}</button>
                  <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    // SIDE PANEL — map view
    if (isSidePanel) {
      return (
        <>
          <div onClick={handleDesktopClose} style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "auto", background: closing ? "transparent" : "rgba(0,0,0,0.15)", transition: "background 0.25s ease" }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 400, zIndex: 1001,
            background: "rgba(14,22,40,0.98)", backdropFilter: "blur(24px) saturate(1.5)",
            borderLeft: "1px solid var(--border)",
            boxShadow: "-12px 0 48px rgba(0,0,0,0.4)",
            animation: closing ? "desktopPanelOut 0.25s ease forwards" : "desktopPanelIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            display: "flex", flexDirection: "column",
          }}>
            {panelContent}
          </div>
        </>
      );
    }

    // MODAL — list view
    return (
      <>
        <div onClick={handleDesktopClose} style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          animation: closing ? "menuBackdropOut 0.25s ease forwards" : "fadeIn 0.2s ease",
        }} />
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001,
          width: "100%", maxWidth: 480, maxHeight: "80vh",
          background: "rgba(14,22,40,0.98)", backdropFilter: "blur(24px) saturate(1.5)",
          borderRadius: "var(--radius-xl)", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: closing ? "desktopModalOut 0.25s ease forwards" : "desktopModalIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {panelContent}
        </div>
      </>
    );
  }

  // === MOBILE: Multi-snap bottom sheet ===

  const snapPx = (key) => (SNAPS[key] / 100) * (typeof window !== "undefined" ? window.innerHeight : 800);
  const targetHeight = entered ? (closing ? 0 : snapPx(snap) + dragOffset) : 0;
  const heightPx = Math.max(0, Math.min(snapPx("full") + 40, targetHeight));

  const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";
  const DURATION = "0.45s";

  const animateClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 380);
  }, [closing, onClose]);

  const handleTouchStart = (e) => {
    const scrollTop = contentRef.current?.scrollTop || 0;
    if (snap === "full" && scrollTop > 5) return;
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
  const backdropOpacity = closing ? 0 : Math.min(0.55, progress * 0.7);
  const backdropBlur = Math.min(8, progress * 12);
  const canScroll = snap === "full" && !isDragging;
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
      {/* Backdrop */}
      <div onClick={animateClose} style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: `rgba(0,0,0,${backdropOpacity})`,
        backdropFilter: `blur(${backdropBlur}px)`, WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        transition: isDragging ? "none" : `all ${DURATION} ${SPRING}`,
        pointerEvents: closing ? "none" : "auto",
      }} />

      {/* Sheet */}
      <div ref={sheetRef}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed", left: sheetMargin, right: sheetMargin, bottom: 0, zIndex: 1001,
          height: `${heightPx}px`,
          maxHeight: "92vh",
          background: "#0e1628",
          borderRadius: `${sheetRadius}px ${sheetRadius}px 0 0`,
          boxShadow: `0 -20px 80px rgba(0,0,0,0.7), 0 -4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
          display: "flex", flexDirection: "column",
          transition: isDragging ? "none" : `height ${DURATION} ${SPRING}, left ${DURATION} ${SPRING}, right ${DURATION} ${SPRING}, border-radius ${DURATION} ${SPRING}`,
          overflow: "hidden",
          willChange: "height",
        }}>

        {/* Handle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0 6px", flexShrink: 0, cursor: "grab" }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* PEEK CONTENT — always visible */}
        <div style={{ padding: "6px 20px 12px", flexShrink: 0, borderBottom: snap !== "peek" ? `1px solid ${sevColor}25` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: severity ? `${sevColor}12` : "rgba(255,255,255,0.04)", border: `1px solid ${severity ? sevColor + "25" : "var(--border)"}` }}>
              <SeverityIcon severity={severity} size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.4px" }}>{zone.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{zone.area}</span>
                {severity && <span style={{ fontSize: "11px", fontWeight: 600, color: sevColor, background: `${sevColor}0a`, padding: "2px 8px", borderRadius: "6px" }}>{getSevLabel(severity, lang)}</span>}
                {reports.length > 0 && <span style={{ fontSize: "11px", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{reports.length} {reports.length === 1 ? "report" : es ? "reportes" : "reports"}</span>}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); favs.toggle(zone.id); if (navigator.vibrate) navigator.vibrate(30); }} style={{ width: 32, height: 32, borderRadius: "50%", background: favs.isFavorite(zone.id) ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.06)", border: favs.isFavorite(zone.id) ? "1px solid rgba(250,204,21,0.2)" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s ease" }}>
              <StarIcon size={14} color={favs.isFavorite(zone.id) ? "#facc15" : "rgba(255,255,255,0.35)"} filled={favs.isFavorite(zone.id)} />
            </button>
            <button onClick={animateClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s ease" }}>
              <svg width="11" height="11" viewBox="0 0 10 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
            </button>
          </div>
          {/* Peek actions removed — button teasers below */}
        </div>

        {/* REPORT BUTTON — always visible, gets clipped at peek to tease swiping up */}
        <div style={{ padding: "12px 20px 14px", flexShrink: 0 }}>
          <button onClick={onReport} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #D42A2A, #b91c1c)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: 700, boxShadow: "0 6px 20px rgba(212,42,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <AlertTriangleIcon size={16} color="#fff" />
            {t.reportThisZone}
          </button>
        </div>

        {/* Bottom fade — visible at peek to hint "swipe up", fades away when expanded */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(to top, #0e1628 0%, rgba(14,22,40,0.9) 40%, transparent 100%)",
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
          flex: 1, overflowY: canScroll ? "auto" : "hidden",
          WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
          opacity: contentOpacity,
          transition: isDragging ? "none" : `opacity 0.3s ease`,
          pointerEvents: contentOpacity < 0.1 ? "none" : "auto",
        }}>
          <div style={{ padding: "14px 20px calc(20px + env(safe-area-inset-bottom, 20px))" }}>
            {/* Description */}
            {zone.desc && <p style={{ color: "var(--text-dim)", fontSize: "12px", marginBottom: "14px", lineHeight: 1.5 }}>{es ? zone.desc : (zone.descEn || zone.desc)}</p>}

            {/* Watchers + prediction */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              {watcherCount > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
                  {watcherCount} {es ? "monitoreando" : "watching"}
                </div>
              )}
              {prediction && prediction.score >= 20 && !severity && (
                <div style={{ fontSize: "12px", fontWeight: 600, color: prediction.score >= 70 ? "var(--danger)" : prediction.score >= 40 ? "var(--caution)" : "var(--accent)" }}>
                  {prediction.score}% {es ? "probabilidad" : "probability"}
                </div>
              )}
            </div>

            {/* Subscribe + actions */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {push.supported && (
                <button onClick={() => { const ns = !subscribed; if (navigator.vibrate) navigator.vibrate(50); if (ns) push.subscribeToZone?.(zone.id); else push.unsubscribeFromZone?.(zone.id); }} className="tap-target" style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", background: subscribed ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${subscribed ? "rgba(91,156,246,0.15)" : "var(--border)"}`, color: subscribed ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <BellIcon size={14} color={subscribed ? "var(--accent)" : "var(--text-dim)"} />
                  {subscribed ? (es ? "Suscrito" : "Subscribed") : (es ? "Notificarme" : "Notify me")}
                </button>
              )}
            </div>

            {/* Alt routes */}
            {altRoutes.length > 0 && (
              <div style={{ marginBottom: "20px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--safe)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>
                  {es ? "Rutas alternas" : "Alternate routes"}
                </div>
                {altRoutes.slice(0, 3).map((r, i) => (
                  <div key={r.id} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid rgba(34,197,94,0.08)" : "none", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--safe)", fontWeight: 700, marginRight: "6px" }}>↗</span>{r.alt_route}
                  </div>
                ))}
              </div>
            )}

            {/* Reports */}
            <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px", fontWeight: 600 }}>{t.recentReports} ({reports.length})</div>
            {!reports.length && (
              <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
                <p style={{ color: "var(--text-dim)", fontSize: "14px", fontWeight: 500 }}>{es ? "Todo tranquilo por aquí" : "All quiet here"}</p>
                <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "4px" }}>{es ? "No hay reportes en las últimas 4 horas" : "No reports in the last 4 hours"}</p>
              </div>
            )}
            {reports.map((r, i) => {
              const cfg = SEVERITY[r.severity];
              return (
                <div key={r.id} className={`card-interactive card-accent-${r.severity}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "8px", animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                    <SeverityIcon severity={r.severity} size={16} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: cfg.color }}>{getSevLabel(r.severity, lang)}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{timeAgoLocalized(r.created_at, lang)}</span>
                  </div>
                  {r.text && <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>}
                  {r.photo_url && <div style={{ marginBottom: "10px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}><img src={r.photo_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} loading="lazy" /></div>}
                  {!r.text && !r.photo_url && <div style={{ marginBottom: "8px" }} />}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => handleUpvote(r)} className="tap-target" style={{ background: upvoted.has(r.id) ? "var(--accent-glow)" : "rgba(255,255,255,0.02)", border: `1px solid ${upvoted.has(r.id) ? "rgba(91,156,246,0.15)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", color: upvoted.has(r.id) ? "var(--accent)" : "var(--text-dim)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 500, flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={upvoted.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>{upvoted.has(r.id) ? (es ? "Confirmado" : "Confirmed") : (es ? "Confirmar" : "Confirm")} · {r.upvotes + (upvoted.has(r.id) ? 1 : 0)}</button>
                    <CommentThread reportId={r.id} allDeviceCounts={deviceCounts} />
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
  const { reports, loading, submitReport, upvoteReport, refetch } = useReports();
  const push = usePushNotifications();
  const { totalWatchers, zoneWatchers, watchZone, unwatchZone } = useLiveWatchers();
  const [screen, setScreen] = useState("main");
  const [selectedZone, setSelectedZone] = useState(null);
  const [mobileView, setMobileView] = useState("map");
  const [desktopView, setDesktopView] = useState("map");
  const [showPanel, setShowPanel] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [upvotedSet, setUpvotedSet] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [weather, setWeather] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMarker, setLocationMarker] = useState(null);
  const [showDigest, setShowDigest] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const radar = useRainRadar(mapInstance);
  const favs = useFavorites();
  const pwaUpdate = useUpdateChecker();

  useEffect(() => { const c = () => setIsDesktop(window.innerWidth >= 900); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
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
          setTimeout(() => { setSelectedZone(id); setScreen("detail"); }, 500);
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
      const idx = new Date().getHours(); const probs = h.precipitation_probability.slice(idx, idx+3).filter(Boolean);
      setWeather({ isRaining: c.precipitation > 0, isStormy: c.weather_code >= 95, maxProb: Math.max(...probs, 0) });
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

  const handleZoneClick = useCallback((zoneId) => { setSelectedZone(zoneId); setScreen("detail"); }, []);
  const handleReport = useCallback(async ({ zoneId, severity, text, photo, altRoute }) => { await submitReport({ zoneId, severity, text, photo, altRoute }); const zone = ZONES.find((z) => z.id === zoneId); if (zone) notifyZone({ zoneId, zoneName: `${zone.name} (${zone.area})`, severity, text }); }, [submitReport]);
  const handleUpvoteLocal = useCallback((id) => { setUpvotedSet((prev) => new Set([...prev, id])); }, []);
  const handleLogoClick = () => { setScreen("main"); setSelectedZone(null); setActiveFilter(null); setShowMoreMenu(false); if (isDesktop) setDesktopView("map"); else setMobileView("map"); };
  const handleFilterClick = (filter) => { setActiveFilter((prev) => prev === filter ? null : filter); };
  const handleMobileTab = (key) => { if (key === "more") { setShowMoreMenu(true); return; } setMobileView(key); };
  const handleDesktopTab = (key) => { if (key === "live") setShowPanel((p) => !p); else setDesktopView(key); };
  const closeSheet = () => { setScreen("main"); setSelectedZone(null); };
  const handleMapReady = useCallback((map) => { setMapInstance(map); }, []);
  const handleLocate = useCallback(() => {
    if (!mapInstance) return;
    // Toggle off if already located
    if (userLocation) {
      if (locationMarker) locationMarker.remove();
      setLocationMarker(null);
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
      setUserLocation([latitude, longitude]);
      mapInstance.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 });
    }, null, { enableHighAccuracy: true });
  }, [mapInstance, locationMarker, userLocation]);

  const currentMainView = isDesktop ? desktopView : mobileView;
  const panelVisible = isDesktop && showPanel;
  const headerGlow = dangerCount > 0 ? "header-glow-danger" : cautionCount > 0 ? "header-glow-caution" : liveCount > 0 ? "header-glow-safe" : "header-glow-neutral";
  const isRaining = weather?.isRaining || false;

  if (showOnboarding) return <Onboarding lang={lang} onComplete={() => setShowOnboarding(false)} onToggleLang={toggleLang} />;
  if (screen === "about" && !isDesktop) return <div style={{ animation: "screenSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)" }}><AboutPage onBack={() => setScreen("main")} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} /></div>;
  if (screen === "heatmap") return <div style={{ animation: "screenSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)" }}><HeatmapView onBack={() => setScreen("main")} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} /></div>;
  if (screen === "profile" && !isDesktop) return <div style={{ animation: "screenSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)" }}><ReporterProfile reports={reports} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} /></div>;
  if (screen === "report") return <div style={{ animation: "screenSlideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)" }}><ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} onSubmit={async (data) => { await handleReport(data); const zone = ZONES.find(z => z.id === data.zoneId); setLastReport({ zoneId: data.zoneId, zoneName: zone?.name, zoneArea: zone?.area, severity: data.severity, text: data.text }); setScreen("main"); }} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} /></div>;

  const desktopTabs = [{ key: "map", Icon: MapIcon }, { key: "list", Icon: ListIcon }, { key: "live", Icon: LiveIcon }];

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)", flexShrink: 0, position: "relative", zIndex: 900 }}>
        <div className={headerGlow} style={{ position: "absolute", top: -30, left: "10%", right: "10%", height: 80, borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
        <button onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <Logo size={26} />
          <div style={{ display: "flex", alignItems: "baseline", gap: "0" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
            <span style={{ fontSize: "7px", fontWeight: 700, color: "var(--accent)", marginLeft: "4px", opacity: 0.6, letterSpacing: "0.5px" }}>BETA</span>
          </div>
        </button>
        <div style={{ flex: 1 }} />
        {totalWatchers > 1 && <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />{totalWatchers}</div>}
        <WeatherIndicator />
        {isDesktop && <>
          <button className="header-icon-btn" onClick={() => setScreen("profile")} style={{ width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ProfileIcon size={18} color="var(--text-dim)" /></button>
          <button className="header-icon-btn" onClick={() => setShowDigest(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChartIcon size={18} color="var(--text-dim)" /></button>
          <button className="header-icon-btn" onClick={() => setScreen("heatmap")} style={{ width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FlameIcon size={18} color="var(--text-dim)" /></button>
          <button className="header-icon-btn" onClick={() => setScreen("about")} style={{ width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><InfoIcon size={18} color="var(--text-dim)" /></button>
        </>}
        <button onClick={toggleLang} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.045)", border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>{lang === "es" ? "EN" : "ES"}</button>
        {isDesktop && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.045)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
            {desktopTabs.map((tab) => { const isActive = tab.key === "live" ? showPanel : desktopView === tab.key; return <button key={tab.key} onClick={() => handleDesktopTab(tab.key)} style={{ padding: "6px 10px", fontSize: "12px", border: "none", background: isActive ? "var(--accent-glow)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-faint)", fontWeight: isActive ? 600 : 400, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}><tab.Icon size={16} color={isActive ? "var(--accent)" : "var(--text-faint)"} active={isActive} />{tab.key === "live" && liveCount > 0 && !isActive && <span style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />}</button>; })}
          </div>
        )}
      </div>

      <EmergencyBanner emergency={emergency} lang={lang} />
      <OfflineBanner lang={lang} />
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

      {/* STATUS BAR */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        {dangerCount > 0 && <button onClick={() => handleFilterClick("danger")} className="tap-target" style={{ display: "flex", alignItems: "center", gap: "7px", background: activeFilter === "danger" ? "rgba(239,68,68,0.15)" : "var(--danger-bg)", padding: "6px 14px", borderRadius: "20px", border: activeFilter === "danger" ? "1.5px solid var(--danger)" : "1px solid var(--danger-border)", cursor: "pointer", transition: "all 0.2s ease" }}><span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite", flexShrink: 0 }} /><span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{dangerCount} {t.danger}</span></button>}
        {cautionCount > 0 && <button onClick={() => handleFilterClick("caution")} className="tap-target" style={{ display: "flex", alignItems: "center", gap: "7px", background: activeFilter === "caution" ? "rgba(234,179,8,0.15)" : "var(--caution-bg)", padding: "6px 14px", borderRadius: "20px", border: activeFilter === "caution" ? "1.5px solid var(--caution)" : "1px solid var(--caution-border)", cursor: "pointer", transition: "all 0.2s ease" }}><span style={{ width: 6, height: 6, background: "var(--caution)", borderRadius: "50%", flexShrink: 0 }} /><span style={{ fontSize: "12px", color: "#fde047", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{cautionCount} {t.caution}</span></button>}
        {dangerCount === 0 && cautionCount === 0 && <div style={{ display: "flex", alignItems: "center", gap: "7px", background: "var(--safe-bg)", padding: "6px 14px", borderRadius: "20px", border: "1px solid var(--safe-border)" }}><span style={{ width: 6, height: 6, background: "var(--safe)", borderRadius: "50%", flexShrink: 0 }} /><span style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>{t.noActiveAlerts}</span></div>}
        {activeFilter && <button onClick={() => setActiveFilter(null)} className="tap-target" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(255,255,255,0.045)", borderRadius: "50%", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s ease" }}><svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg></button>}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {currentMainView === "map" ? (
            <>
            <MapErrorBoundary>
            <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>{t.loadingMap}</div>}>
              <MapView reports={reports} onZoneClick={handleZoneClick} panelOpen={panelVisible} activeFilter={activeFilter} predictions={predictions} onMapReady={handleMapReady} />
            </Suspense>
            </MapErrorBoundary>
            {isRaining && <div className="rain-overlay" />}
            {/* First-time hint — shows when no reports are active */}
            {!loading && !hintDismissed && reports.filter(r => new Date(r.created_at).getTime() > Date.now() - 4 * 3600000).length === 0 && (
              <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 6, animation: "fadeIn 0.5s ease 1s both" }}>
                <div style={{ background: "rgba(10,15,26,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "20px", padding: "10px 14px 10px 16px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{es ? "Toca una zona o usa Reportar" : "Tap a zone or use Report"}</span>
                  <button onClick={() => setHintDismissed(true)} style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: "2px" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/></svg>
                  </button>
                </div>
              </div>
            )}
            {/* Floating map controls */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 800, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <RainRadarButton enabled={radar.enabled} onToggle={radar.toggle} />
              <button onClick={handleLocate} style={{
                width: 40, height: 40, borderRadius: "50%",
                background: userLocation ? "rgba(66,133,244,0.15)" : "rgba(10,15,26,0.9)",
                border: `1px solid ${userLocation ? "rgba(66,133,244,0.25)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={userLocation ? "#4285F4" : "rgba(255,255,255,0.5)"} strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </button>
            </div>
            </>
          ) : currentMainView === "list" ? (
            <div key="list-view" style={{ animation: "viewFadeIn 0.25s ease", height: "100%", overflow: "hidden" }}>
            <PullToRefresh onRefresh={refetch}>
            <div style={{ padding: "12px 16px 20px" }}>
              {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} i={i} />) : (
                <>
                  {favs.sortZones(ZONES.filter((z) => !activeFilter || getZoneSeverity(z.id, reports) === activeFilter)).map((z, i, arr) => {
                    const sv = getZoneSeverity(z.id, reports); const zr = getZoneReports(z.id, reports); const lt = zr[0]; const c = sv ? SEVERITY[sv] : null;
                    const isSubbed = push.isSubscribed(z.id); const pred = predictions[z.id];
                    const isFav = favs.isFavorite(z.id);
                    const showDivider = favs.count > 0 && i > 0 && isFav === false && favs.isFavorite(arr[i - 1]?.id);
                    const hasActivity = sv || (pred && pred.score >= 40);
                    return (
                      <div key={z.id}>
                        {showDivider && <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />}
                        <button onClick={() => handleZoneClick(z.id)} className="card-interactive" style={{
                          width: "100%", textAlign: "left", display: "flex", gap: "14px", alignItems: "center",
                          padding: "14px 16px", marginBottom: "6px", borderRadius: "var(--radius-lg)",
                          background: hasActivity ? `${c ? c.color : "var(--accent)"}04` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${c ? c.color + "18" : "var(--border)"}`,
                          animation: `fadeIn 0.25s ease ${i * 0.03}s both`,
                          position: "relative", overflow: "hidden",
                        }}>
                          {/* Severity accent bar */}
                          {sv && <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, borderRadius: "0 2px 2px 0", background: c.color }} />}

                          {/* Icon */}
                          <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c ? `${c.color}0a` : "rgba(255,255,255,0.03)", border: `1px solid ${c ? c.color + "18" : "rgba(255,255,255,0.06)"}` }}>
                            <SeverityIcon severity={sv} size={22} />
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{z.name}</span>
                              <span onClick={(e) => { e.stopPropagation(); favs.toggle(z.id); }} style={{ cursor: "pointer", display: "inline-flex", opacity: isFav ? 1 : 0, transition: "opacity 0.2s" }}>
                                <StarIcon size={12} color="#facc15" filled />
                              </span>
                              {isSubbed && <BellIcon size={11} color="var(--accent)" />}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 2 }}>{z.area}</div>
                            {lt ? <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lt.text ? `${lt.text} · ` : ""}{timeAgoLocalized(lt.created_at, lang)}</div>
                              : pred && pred.score >= 30 ? <div style={{ fontSize: "12px", color: pred.score >= 70 ? "var(--danger)" : pred.score >= 40 ? "var(--caution)" : "var(--text-dim)", marginTop: 4, fontWeight: 500 }}>{pred.score}% {es ? "probabilidad" : "probability"}</div>
                              : <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 4 }}>{es ? z.desc : (z.descEn || z.desc)}</div>}
                          </div>

                          {/* Right side */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            {zr.length > 0 && <span style={{ fontSize: "12px", color: c ? c.color : "var(--text-dim)", background: c ? `${c.color}0c` : "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "center" }}>{zr.length}</span>}
                            {lt?.photo_url && <img src={lt.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} loading="lazy" />}
                            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, opacity: 0.15 }}><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{es ? "Hecho para Barranquilla" : "Made for Barranquilla"} <svg width="20" height="14" viewBox="0 0 30 20" style={{ borderRadius: "2px", verticalAlign: "middle", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}><rect width="30" height="20" fill="#D42A2A"/><rect x="3" y="3" width="24" height="14" fill="#F5D033"/><rect x="6" y="6" width="18" height="8" fill="#2D8A2D"/><polygon points="15,7.5 15.9,9.3 17.8,9.6 16.4,11 16.7,12.9 15,12 13.3,12.9 13.6,11 12.2,9.6 14.1,9.3" fill="rgba(255,255,255,0.9)"/></svg></div>
                </>
              )}
            </div>
            </PullToRefresh>
            </div>
          ) : (
            <div key="live-view" style={{ animation: "viewFadeIn 0.25s ease", height: "100%", overflow: "hidden" }}>
            <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
            </div>
          )}
        </div>
        {isDesktop && (
          <div onTransitionEnd={() => { window.dispatchEvent(new Event("resize")); }} style={{ width: showPanel ? 380 : 0, minWidth: 0, flexShrink: 0, borderLeft: showPanel ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <div style={{ width: 380, height: "100%", opacity: showPanel ? 1 : 0, transition: "opacity 0.2s ease", overflow: "hidden" }}>
              <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV — mobile only */}
      {!isDesktop && <BottomNav activeTab={mobileView} onTab={handleMobileTab} onReport={() => setScreen("report")} liveCount={liveCount} lang={lang} />}
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
          />
        );
      })()}

      {/* Weekly Digest modal */}
      {showDigest && <WeeklyDigest onClose={() => setShowDigest(false)} onZoneClick={handleZoneClick} />}

      {/* Desktop About modal — overlays on top of main UI */}
      {isDesktop && screen === "about" && (
        <>
          <div onClick={() => setScreen("main")} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", animation: "fadeIn 0.2s ease" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1201, width: "100%", maxWidth: 560, height: "85vh", background: "var(--bg-elevated)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", animation: "desktopModalIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", overflow: "hidden", willChange: "transform, opacity" }}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <AboutPage onBack={() => setScreen("main")} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} />
            </div>
          </div>
        </>
      )}

      {/* Desktop Profile modal — overlays on top of main UI */}
      {isDesktop && screen === "profile" && (
        <>
          <div onClick={() => setScreen("main")} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", animation: "fadeIn 0.2s ease" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1201, width: "100%", maxWidth: 480, height: "80vh", background: "var(--bg-elevated)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", animation: "desktopModalIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)", overflow: "hidden", willChange: "transform, opacity" }}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <ReporterProfile reports={reports} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} onToggleLang={toggleLang} lang={lang} />
            </div>
          </div>
        </>
      )}

      {/* Post-report WhatsApp share prompt */}
      {lastReport && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
          <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", animation: "successPulse 0.5s ease" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.3px" }}>
              {es ? "¡Reporte enviado!" : "Report sent!"}
            </h3>
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
              setLastReport(null);
            }} style={{
              width: "100%", padding: "16px", borderRadius: "var(--radius-md)",
              background: "#25D366", border: "none", color: "#fff",
              fontSize: "16px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: "0 8px 24px rgba(37,211,102,0.25)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              {es ? "Compartir por WhatsApp" : "Share via WhatsApp"}
            </button>
            <button onClick={() => setLastReport(null)} style={{
              width: "100%", marginTop: "10px", padding: "14px",
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-md)", color: "var(--text-dim)",
              fontSize: "14px", fontWeight: 500, cursor: "pointer",
            }}>
              {es ? "Ahora no" : "Not now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() { return <LanguageProvider><AppContent /></LanguageProvider>; }
