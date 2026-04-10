"use client";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { usePushNotifications, notifyZone } from "@/lib/usePushNotifications";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
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
import { useRainRadar, RainRadarButton } from "@/components/RainRadar";
import PullToRefresh from "@/components/PullToRefresh";
import ReporterProfile from "@/components/ReporterProfile";
import WeeklyDigest from "@/components/WeeklyDigest";
import { useFavorites } from "@/lib/useFavorites";

const MapView = lazy(() => import("@/components/MapView"));

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
  return <div style={{ padding: "8px 16px", background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.1)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}><span style={{ fontSize: "12px" }}>📡</span><span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{lang === "es" ? "Sin conexión" : "Offline"}</span></div>;
}

function EmergencyBanner({ emergency, lang }) {
  if (!emergency.active) return null;
  const es = lang === "es";
  return (
    <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.12)", borderBottom: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, animation: "fadeIn 0.3s ease" }}>
      <span style={{ fontSize: "20px", animation: "blink 1s ease infinite" }}>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fca5a5" }}>{es ? "ALERTA MÁXIMA" : "MAXIMUM ALERT"}</div>
        <div style={{ fontSize: "12px", color: "rgba(252,165,165,0.7)", marginTop: 1 }}>{es ? `${emergency.dangerCount} reportes de peligro en los últimos 30 min` : `${emergency.dangerCount} danger reports in the last 30 min`}</div>
      </div>
    </div>
  );
}

function BottomNav({ activeTab, onTab, onReport, liveCount, lang }) {
  const tabs = [
    { key: "map", icon: "🗺️", label: lang === "es" ? "Mapa" : "Map" },
    { key: "list", icon: "📋", label: lang === "es" ? "Zonas" : "Zones" },
    { key: "report", isReport: true, label: lang === "es" ? "Reportar" : "Report" },
    { key: "live", icon: "🔴", label: lang === "es" ? "En vivo" : "Live", badge: liveCount },
    { key: "more", icon: "•••", label: lang === "es" ? "Más" : "More" },
  ];
  return (
    <div className="bottom-nav" style={{
      display: "flex", alignItems: "stretch",
      background: "rgba(7,11,20,0.97)", backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border)", flexShrink: 0, height: 56,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        if (tab.isReport) return (
          <button key={tab.key} onClick={onReport} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", background: "none", border: "none", padding: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #D42A2A, #b91c1c)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(212,42,42,0.3)", marginTop: "-10px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--baq-red)" }}>{tab.label}</span>
          </button>
        );
        return (
          <button key={tab.key} onClick={() => onTab(tab.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", background: "none", border: "none", padding: "4px 0", position: "relative" }}>
            {isActive && <div style={{ position: "absolute", top: 0, left: "30%", right: "30%", height: 2, borderRadius: "0 0 2px 2px", background: "var(--accent)" }} />}
            <span style={{ fontSize: "16px", opacity: isActive ? 1 : 0.4 }}>{tab.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--accent)" : "var(--text-faint)" }}>{tab.label}</span>
            {tab.badge > 0 && !isActive && <span style={{ position: "absolute", top: 4, right: "calc(50% - 14px)", width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />}
          </button>
        );
      })}
    </div>
  );
}

function MoreMenu({ onSelect, lang, onClose }) {
  const es = lang === "es";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.15s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 64, right: 12, left: 12, maxWidth: 300, marginLeft: "auto", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "6px", animation: "slideUp 0.2s ease", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
        {[
          { key: "profile", icon: "👤", label: es ? "Mi perfil" : "My profile", desc: es ? "Estadísticas y rango de reportero" : "Stats and reporter rank" },
          { key: "digest", icon: "📊", label: es ? "Resumen semanal" : "Weekly digest", desc: es ? "Actividad de los últimos 7 días" : "Last 7 days activity" },
          { key: "heatmap", icon: "🔥", label: es ? "Historial" : "History", desc: es ? "Zonas más afectadas" : "Most affected zones" },
          { key: "about", icon: "ⓘ", label: es ? "Info y seguridad" : "Info & safety", desc: es ? "Consejos, emergencias, ajustes" : "Tips, emergencies, settings" },
        ].map((item) => (
          <button key={item.key} onClick={() => { onSelect(item.key); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "13px 12px", background: "none", border: "none", textAlign: "left", borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: "20px", width: 28, textAlign: "center" }}>{item.icon}</span>
            <div><div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{item.label}</div><div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 1 }}>{item.desc}</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====== BOTTOM SHEET for Zone Detail — swipe to dismiss ====== */
function ZoneSheet({ zone, severity, reports, onClose, onReport, onUpvote, push, zoneWatchers, prediction, watchZone, unwatchZone, onLogoClick }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const touchStart = useRef(null);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  const handleTouchStart = (e) => {
    // Only allow drag from the handle area or when scrolled to top
    const scrollTop = contentRef.current?.scrollTop || 0;
    const touch = e.touches[0];
    if (scrollTop <= 0) {
      touchStart.current = touch.clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || touchStart.current === null) return;
    const delta = e.touches[0].clientY - touchStart.current;
    if (delta > 0) {
      setDragY(delta);
      e.preventDefault();
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 120) {
      setClosing(true);
      setTimeout(onClose, 250);
    } else {
      setDragY(0);
    }
    setIsDragging(false);
    touchStart.current = null;
  };

  const opacity = closing ? 0 : Math.max(0, 1 - dragY / 400);
  const translate = closing ? "translateY(100%)" : `translateY(${dragY}px)`;

  return (
    <>
      <div className="sheet-backdrop" onClick={() => { setClosing(true); setTimeout(onClose, 250); }}
        style={{ opacity, transition: closing ? "opacity 0.25s ease" : (isDragging ? "none" : "opacity 0.3s ease") }} />
      <div ref={sheetRef} className="sheet-container"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          transform: translate,
          transition: closing ? "transform 0.25s ease" : (isDragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"),
        }}>
        <div className="sheet-handle-area">
          <div className="sheet-handle" />
        </div>
        <div className="sheet-content" ref={contentRef}>
          <ZoneDetail
            zone={zone} severity={severity} reports={reports}
            onBack={onClose} onReport={onReport} onUpvote={onUpvote}
            pushSupported={push.supported} isSubscribed={push.isSubscribed}
            onSubscribe={push.subscribeToZone} onUnsubscribe={push.unsubscribeFromZone}
            onLogoClick={onLogoClick} zoneWatchers={zoneWatchers}
            prediction={prediction} onWatchZone={watchZone} onUnwatchZone={unwatchZone}
            isSheet={true}
          />
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
  const radar = useRainRadar(mapInstance);
  const favs = useFavorites();

  useEffect(() => { const c = () => setIsDesktop(window.innerWidth >= 900); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  useEffect(() => { try { if (!localStorage.getItem("arroyo-onboarded")) setShowOnboarding(true); } catch(e) {} }, []);

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
    if (!mapInstance || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const mapboxgl = require("mapbox-gl");
      // Remove old marker
      if (locationMarker) locationMarker.remove();
      // Create location dot
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
  }, [mapInstance, locationMarker]);

  const currentMainView = isDesktop ? desktopView : mobileView;
  const panelVisible = isDesktop && showPanel;
  const headerGlow = dangerCount > 0 ? "header-glow-danger" : cautionCount > 0 ? "header-glow-caution" : liveCount > 0 ? "header-glow-safe" : "header-glow-neutral";
  const isRaining = weather?.isRaining || false;
  const totalReportsEver = reports.length;
  const protectedCount = Math.max(totalReportsEver * 23, 0); // estimated people warned

  if (showOnboarding) return <Onboarding lang={lang} onComplete={() => setShowOnboarding(false)} onToggleLang={toggleLang} />;
  if (screen === "about") return <AboutPage onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "heatmap") return <HeatmapView onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "profile") return <ReporterProfile reports={reports} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "report") return <ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} onSubmit={async (data) => { await handleReport(data); setScreen("main"); }} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;

  const desktopTabs = [{ key: "map", icon: "🗺️" }, { key: "list", icon: "📋" }, { key: "live", icon: "🔴" }];

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", background: emergency.active ? "rgba(30,5,5,0.95)" : "rgba(7,11,20,0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${emergency.active ? "rgba(239,68,68,0.2)" : "var(--border)"}`, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <div className={headerGlow} style={{ position: "absolute", top: -30, left: "10%", right: "10%", height: 80, borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
        <button onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <Logo size={24} />
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <div style={{ flex: 1 }} />
        {totalWatchers > 1 && <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />{totalWatchers} {es ? "en línea" : "online"}</div>}
        <WeatherIndicator />
        {isDesktop && <>
          <button onClick={() => setScreen("profile")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", flexShrink: 0 }}>👤</button>
          <button onClick={() => setShowDigest(true)} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", flexShrink: 0 }}>📊</button>
          <button onClick={() => setScreen("heatmap")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", flexShrink: 0 }}>🔥</button>
          <button onClick={() => setScreen("about")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>ⓘ</button>
        </>}
        <button onClick={toggleLang} style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>{lang === "es" ? "EN" : "ES"}</button>
        {isDesktop && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
            {desktopTabs.map((tab) => { const isActive = tab.key === "live" ? showPanel : desktopView === tab.key; return <button key={tab.key} onClick={() => handleDesktopTab(tab.key)} style={{ padding: "6px 12px", fontSize: "12px", border: "none", background: isActive ? "var(--accent-glow)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-faint)", fontWeight: isActive ? 600 : 400, position: "relative" }}>{tab.icon}{tab.key === "live" && liveCount > 0 && !isActive && <span style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />}</button>; })}
          </div>
        )}
      </div>

      <EmergencyBanner emergency={emergency} lang={lang} />
      <OfflineBanner lang={lang} />
      <UpdateBanner />

      {/* STATUS BAR */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        {dangerCount > 0 && <button onClick={() => handleFilterClick("danger")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "danger" ? "rgba(239,68,68,0.12)" : "var(--danger-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "danger" ? "2px solid var(--danger)" : "1px solid var(--danger-border)", cursor: "pointer" }}><span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite" }} /><span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{dangerCount} {t.danger}</span></button>}
        {cautionCount > 0 && <button onClick={() => handleFilterClick("caution")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "caution" ? "rgba(234,179,8,0.12)" : "var(--caution-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "caution" ? "2px solid var(--caution)" : "1px solid var(--caution-border)", cursor: "pointer" }}><span style={{ fontSize: "12px", color: "#fde047", fontWeight: 600 }}>{cautionCount} {t.caution}</span></button>}
        {dangerCount === 0 && cautionCount === 0 && <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--safe-bg)", padding: "5px 12px", borderRadius: "20px", border: "1px solid var(--safe-border)" }}><span style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>{t.noActiveAlerts}</span></div>}
        {activeFilter && <button onClick={() => setActiveFilter(null)} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "5px 10px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer", fontSize: "11px", color: "var(--text-dim)" }}>✕</button>}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {currentMainView === "map" ? (
            <>
            <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>{t.loadingMap}</div>}>
              <MapView reports={reports} onZoneClick={handleZoneClick} panelOpen={panelVisible} activeFilter={activeFilter} predictions={predictions} onMapReady={handleMapReady} />
            </Suspense>
            {isRaining && <div className="rain-overlay" />}
            {/* Floating map controls */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 800, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <RainRadarButton enabled={radar.enabled} onToggle={radar.toggle} />
              <button onClick={handleLocate} style={{
                width: 40, height: 40, borderRadius: "50%",
                background: userLocation ? "rgba(66,133,244,0.15)" : "rgba(8,13,24,0.9)",
                border: `1px solid ${userLocation ? "rgba(66,133,244,0.25)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={userLocation ? "#4285F4" : "rgba(255,255,255,0.5)"} strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </button>
            </div>
            {protectedCount > 0 && (
              <div className="social-proof">
                <div style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "6px 14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--safe)", animation: "blink 2s ease infinite" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {protectedCount.toLocaleString()} {es ? "personas protegidas" : "people protected"}
                  </span>
                </div>
              </div>
            )}
            </>
          ) : currentMainView === "list" ? (
            <PullToRefresh onRefresh={refetch}>
            <div style={{ padding: "14px 14px 20px" }}>
              {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} i={i} />) : (
                <>
                  {favs.sortZones(ZONES.filter((z) => !activeFilter || getZoneSeverity(z.id, reports) === activeFilter)).map((z, i, arr) => {
                    const sv = getZoneSeverity(z.id, reports); const zr = getZoneReports(z.id, reports); const lt = zr[0]; const c = sv ? SEVERITY[sv] : null;
                    const isSubbed = push.isSubscribed(z.id); const pred = predictions[z.id];
                    const isFav = favs.isFavorite(z.id);
                    const accentStyle = sv ? { borderLeft: `3px solid ${c.color}` } : pred && pred.score >= 40 ? { borderLeft: `3px dashed ${pred.score >= 70 ? "var(--danger)" : "var(--caution)"}` } : {};
                    // Show divider between favorites and rest
                    const showDivider = favs.count > 0 && i > 0 && isFav === false && favs.isFavorite(arr[i - 1]?.id);
                    return (
                      <div key={z.id}>
                        {showDivider && <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />}
                        <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "6px", animation: `fadeIn 0.25s ease ${i * 0.03}s both` }}>
                          <button onClick={(e) => { e.stopPropagation(); favs.toggle(z.id); }} style={{
                            width: 32, height: 32, borderRadius: "50%", background: "none", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            fontSize: "14px", opacity: isFav ? 1 : 0.25, transition: "opacity 0.2s, transform 0.2s",
                            transform: isFav ? "scale(1.1)" : "scale(1)",
                          }}>
                            {isFav ? "⭐" : "☆"}
                          </button>
                          <button onClick={() => handleZoneClick(z.id)} className="card-interactive" style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", ...accentStyle, borderRadius: "var(--radius-md)", padding: "13px 14px", textAlign: "left", display: "flex", gap: "12px", alignItems: "center" }}>
                            <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c ? `${c.color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${c ? c.color + "15" : "var(--border)"}` }}><SeverityIcon severity={sv} size={22} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: "13px" }}>{z.area}</span>
                                {isSubbed && <span style={{ fontSize: "11px" }}>🔔</span>}
                              </div>
                              {lt ? <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lt.text ? `${lt.text} · ` : ""}{timeAgoLocalized(lt.created_at, lang)}</div>
                                : pred && pred.score >= 30 ? <div style={{ fontSize: "12px", color: pred.score >= 70 ? "var(--danger)" : pred.score >= 40 ? "var(--caution)" : "var(--text-dim)", marginTop: 3 }}>🧠 {pred.score}% {es ? "probabilidad" : "probability"}</div>
                                : <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 3 }}>{t.noRecentReports}</div>}
                            </div>
                            {zr.length > 0 && <span style={{ fontSize: "11px", color: c ? c.color : "var(--text-dim)", background: c ? `${c.color}0a` : "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: "6px", flexShrink: 0, fontWeight: 700 }}>{zr.length}</span>}
                            <span style={{ color: "var(--text-faint)", fontSize: "14px", flexShrink: 0 }}>›</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ textAlign: "center", padding: "36px 0 16px", fontSize: "12px", color: "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{es ? "Hecho para Barranquilla" : "Made for Barranquilla"} <svg width="18" height="13" viewBox="0 0 18 13" style={{ borderRadius: "2px", verticalAlign: "middle", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.1)" }}><rect width="18" height="6.5" fill="#D42A2A"/><rect y="6.5" width="18" height="6.5" fill="#F5D033"/></svg></div>
                </>
              )}
            </div>
            </PullToRefresh>
          ) : (
            <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
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
          />
        );
      })()}

      {/* Weekly Digest modal */}
      {showDigest && <WeeklyDigest onClose={() => setShowDigest(false)} onZoneClick={handleZoneClick} />}
    </div>
  );
}

export default function Home() { return <LanguageProvider><AppContent /></LanguageProvider>; }
