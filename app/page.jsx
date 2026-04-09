"use client";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { usePushNotifications, notifyZone } from "@/lib/usePushNotifications";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports } from "@/lib/zones";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ReportFlow from "@/components/ReportFlow";
import ZoneDetail from "@/components/ZoneDetail";
import LiveFeed from "@/components/LiveFeed";
import WeatherIndicator from "@/components/WeatherIndicator";
import Onboarding from "@/components/Onboarding";
import AboutPage from "@/components/AboutPage";
import HeatmapView from "@/components/HeatmapView";
import RouteChecker from "@/components/RouteChecker";

const MapView = lazy(() => import("@/components/MapView"));

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
      <defs><linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
      <rect width="512" height="512" rx="112" fill="url(#logoBg)" />
      <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
      <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
      <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
      <circle cx="400" cy="115" r="40" fill="#fff" />
      <text x="400" y="133" textAnchor="middle" fill="#D42A2A" fontSize="52" fontWeight="900" fontFamily="sans-serif">!</text>
    </svg>
  );
}

function SkeletonCard({ i }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "16px", marginBottom: "8px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}><div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }} /><div className="skeleton" style={{ width: "40%", height: 10 }} /></div>
    </div>
  );
}

function OfflineBanner({ lang }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const off = () => setOffline(true); const on = () => setOffline(false);
    window.addEventListener("offline", off); window.addEventListener("online", on);
    setOffline(!navigator.onLine);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, []);
  if (!offline) return null;
  return <div style={{ padding: "8px 16px", background: "rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: "8px", animation: "offlinePulse 2s ease infinite", flexShrink: 0 }}><span style={{ fontSize: "12px" }}>📡</span><span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{lang === "es" ? "Sin conexión" : "Offline"}</span></div>;
}

function BottomNav({ activeTab, onTab, onReport, liveCount, lang }) {
  const tabs = [
    { key: "map", icon: "🗺️", label: lang === "es" ? "Mapa" : "Map" },
    { key: "list", icon: "📋", label: lang === "es" ? "Zonas" : "Zones" },
    { key: "report", icon: "⚠️", label: lang === "es" ? "Reportar" : "Report", isReport: true },
    { key: "live", icon: "🔴", label: lang === "es" ? "En vivo" : "Live", badge: liveCount },
    { key: "more", icon: "•••", label: lang === "es" ? "Más" : "More" },
  ];

  return (
    <div className="bottom-nav" style={{
      display: "flex", alignItems: "stretch",
      background: "rgba(8,13,24,0.96)", backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border)", flexShrink: 0,
      paddingTop: "6px", paddingBottom: "6px",
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        if (tab.isReport) {
          return (
            <button key={tab.key} onClick={onReport} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "2px", background: "none", border: "none", padding: "4px 0",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #D42A2A, #c42222)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", boxShadow: "0 4px 16px rgba(212,42,42,0.35)",
                marginTop: "-12px",
              }}>⚠️</div>
              <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--baq-red)", marginTop: "1px" }}>{tab.label}</span>
            </button>
          );
        }
        return (
          <button key={tab.key} onClick={() => onTab(tab.key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "3px", background: "none", border: "none", padding: "6px 0", position: "relative",
          }}>
            <span style={{ fontSize: "18px", opacity: isActive ? 1 : 0.5, transition: "opacity 0.15s" }}>{tab.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--accent)" : "var(--text-dim)", transition: "color 0.15s" }}>{tab.label}</span>
            {tab.badge > 0 && !isActive && (
              <span style={{ position: "absolute", top: 4, right: "calc(50% - 16px)", width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function MoreMenu({ onSelect, lang, onClose }) {
  const es = lang === "es";
  const items = [
    { key: "route", icon: "🛣️", label: es ? "Ruta segura" : "Safe route", desc: es ? "Verifica arroyos en tu camino" : "Check arroyos on your path" },
    { key: "heatmap", icon: "🔥", label: es ? "Historial" : "History", desc: es ? "Zonas más afectadas" : "Most affected zones" },
    { key: "about", icon: "ⓘ", label: es ? "Información" : "Information", desc: es ? "Seguridad y emergencias" : "Safety & emergencies" },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.15s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", bottom: 72, right: 12, left: 12, maxWidth: 320, marginLeft: "auto",
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "8px", overflow: "hidden",
        animation: "slideUp 0.2s ease", boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
      }}>
        {items.map((item, i) => (
          <button key={item.key} onClick={() => { onSelect(item.key); onClose(); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "14px",
            padding: "14px 12px", background: "none", border: "none", textAlign: "left",
            borderRadius: "var(--radius-md)",
          }}>
            <span style={{ fontSize: "22px", width: 32, textAlign: "center" }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { lang, toggleLang, t } = useLanguage();
  const { reports, loading, submitReport, upvoteReport } = useReports();
  const push = usePushNotifications();
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

  useEffect(() => { const c = () => setIsDesktop(window.innerWidth >= 900); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  useEffect(() => { try { if (!localStorage.getItem("arroyo-onboarded")) setShowOnboarding(true); } catch(e) {} }, []);

  const dangerCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "danger").length;
  const cautionCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "caution").length;
  const cutoff = Date.now() - 4 * 3600000;
  const liveCount = reports.filter((r) => new Date(r.created_at).getTime() > cutoff).length;
  const hasAnyReports = liveCount > 0;

  const handleZoneClick = useCallback((zoneId) => { setSelectedZone(zoneId); setScreen("detail"); }, []);
  const handleReport = useCallback(async ({ zoneId, severity, text, photo }) => {
    await submitReport({ zoneId, severity, text, photo });
    const zone = ZONES.find((z) => z.id === zoneId);
    if (zone) notifyZone({ zoneId, zoneName: `${zone.name} (${zone.area})`, severity, text });
  }, [submitReport]);
  const handleUpvoteLocal = useCallback((id) => { setUpvotedSet((prev) => new Set([...prev, id])); }, []);
  const handleLogoClick = () => { setScreen("main"); setSelectedZone(null); setActiveFilter(null); setShowMoreMenu(false); if (isDesktop) setDesktopView("map"); else setMobileView("map"); };
  const handleFilterClick = (filter) => { setActiveFilter((prev) => prev === filter ? null : filter); };

  const handleMobileTab = (key) => {
    if (key === "more") { setShowMoreMenu(true); return; }
    setMobileView(key);
  };
  const handleDesktopTab = (key) => {
    if (key === "live") setShowPanel((p) => !p);
    else setDesktopView(key);
  };

  const currentMainView = isDesktop ? desktopView : mobileView;
  const panelVisible = isDesktop && showPanel;

  if (showOnboarding) return <Onboarding lang={lang} onComplete={() => setShowOnboarding(false)} />;
  if (screen === "about") return <AboutPage onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "heatmap") return <HeatmapView onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "route") return <RouteChecker reports={reports} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "report") return <ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} onSubmit={async (data) => { await handleReport(data); setScreen("main"); }} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  if (screen === "detail" && selectedZone) {
    const zone = ZONES.find((z) => z.id === selectedZone);
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <ZoneDetail zone={zone} severity={getZoneSeverity(selectedZone, reports)} reports={getZoneReports(selectedZone, reports)} onBack={() => { setScreen("main"); setSelectedZone(null); }} onReport={() => setScreen("report")} onUpvote={upvoteReport} pushSupported={push.supported} isSubscribed={push.isSubscribed} onSubscribe={push.subscribeToZone} onUnsubscribe={push.unsubscribeFromZone} onLogoClick={handleLogoClick} />
        </div>
        {!isDesktop && <BottomNav activeTab="" onTab={(key) => { if (key === "more") { setShowMoreMenu(true); return; } setScreen("main"); setSelectedZone(null); setMobileView(key); }} onReport={() => setScreen("report")} liveCount={liveCount} lang={lang} />}
        {showMoreMenu && <MoreMenu lang={lang} onSelect={(key) => { setSelectedZone(null); setScreen(key); }} onClose={() => setShowMoreMenu(false)} />}
      </div>
    );
  }

  const desktopTabs = [{ key: "map", icon: "🗺️" }, { key: "list", icon: "📋" }, { key: "live", icon: "🔴" }];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* HEADER — clean and compact */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <Logo size={26} />
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>
            Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span>
          </span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(96,165,250,0.15)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <div style={{ flex: 1 }} />
        <WeatherIndicator />
        {/* Desktop-only buttons */}
        {isDesktop && (
          <>
            <button onClick={() => setScreen("route")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", flexShrink: 0 }}>🛣️</button>
            <button onClick={() => setScreen("heatmap")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", flexShrink: 0 }}>🔥</button>
            <button onClick={() => setScreen("about")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>ⓘ</button>
          </>
        )}
        <button onClick={toggleLang} style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>
          {lang === "es" ? "EN" : "ES"}
        </button>
        {/* Desktop tabs */}
        {isDesktop && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {desktopTabs.map((tab) => {
              const isActive = tab.key === "live" ? showPanel : desktopView === tab.key;
              return (
                <button key={tab.key} onClick={() => handleDesktopTab(tab.key)} style={{ padding: "7px 12px", fontSize: "12px", border: "none", background: isActive ? "var(--accent-glow)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-dim)", fontWeight: isActive ? 600 : 400, display: "flex", alignItems: "center", gap: "4px", position: "relative" }}>
                  {tab.icon}
                  {tab.key === "live" && liveCount > 0 && !isActive && <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <OfflineBanner lang={lang} />

      {/* STATUS BAR */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        {dangerCount > 0 && (
          <button onClick={() => handleFilterClick("danger")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "danger" ? "rgba(239,68,68,0.2)" : "var(--danger-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "danger" ? "2px solid var(--danger)" : "1px solid var(--danger-border)", cursor: "pointer" }}>
            <span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{dangerCount} {t.danger}</span>
          </button>
        )}
        {cautionCount > 0 && (
          <button onClick={() => handleFilterClick("caution")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "caution" ? "rgba(245,158,11,0.2)" : "var(--caution-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "caution" ? "2px solid var(--caution)" : "1px solid var(--caution-border)", cursor: "pointer" }}>
            <span style={{ fontSize: "12px", color: "#fcd34d", fontWeight: 600 }}>{cautionCount} {t.caution}</span>
          </button>
        )}
        {dangerCount === 0 && cautionCount === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--safe-bg)", padding: "5px 12px", borderRadius: "20px", border: "1px solid var(--safe-border)" }}>
            <span style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>{t.noActiveAlerts}</span>
          </div>
        )}
        {activeFilter && (
          <button onClick={() => setActiveFilter(null)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "5px 10px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer", fontSize: "11px", color: "var(--text-dim)", fontWeight: 500 }}>✕</button>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {currentMainView === "map" ? (
            <>
              <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>{t.loadingMap}</div>}>
                <MapView reports={reports} onZoneClick={handleZoneClick} panelOpen={panelVisible} activeFilter={activeFilter} />
              </Suspense>
              {!hasAnyReports && (
                <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(8,13,24,0.85)", backdropFilter: "blur(8px)", padding: "10px 20px", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-dim)", fontWeight: 500, pointerEvents: "none", zIndex: 5, animation: "fadeIn 0.5s ease 1s both", whiteSpace: "nowrap" }}>
                  {lang === "es" ? "Toca un punto para ver detalles" : "Tap a dot to see details"}
                </div>
              )}
              {/* Desktop FAB only */}
              {isDesktop && (
                <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
                  <button onClick={() => setScreen("report")} style={{ padding: "15px 30px", background: "linear-gradient(135deg, #D42A2A, #c42222)", color: "#fff", border: "none", borderRadius: "50px", fontSize: "14px", fontWeight: 700, boxShadow: "0 8px 32px rgba(212,42,42,0.35), 0 0 0 1px rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {t.reportArroyo}
                  </button>
                </div>
              )}
            </>
          ) : currentMainView === "list" ? (
            <div style={{ height: "100%", overflowY: "auto", padding: "14px 16px 80px" }}>
              {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} i={i} />) : (
                <>
                  {ZONES.filter((z) => !activeFilter || getZoneSeverity(z.id, reports) === activeFilter).map((z, i) => {
                    const sv = getZoneSeverity(z.id, reports);
                    const zr = getZoneReports(z.id, reports);
                    const lt = zr[0]; const c = sv ? SEVERITY[sv] : null;
                    const isSubbed = push.isSubscribed(z.id);
                    return (
                      <button key={z.id} onClick={() => handleZoneClick(z.id)} className="card-interactive" style={{ width: "100%", background: c ? `linear-gradient(135deg, ${c.bg}, var(--bg))` : "var(--bg-card)", border: c ? `1px solid ${c.color}18` : "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px", textAlign: "left", display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px", animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, background: c ? `${c.color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${c ? c.color + "20" : "var(--border)"}` }}>{c ? c.emoji : "⚪"}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                            {z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: "13px" }}>{z.area}</span>
                            {isSubbed && <span style={{ fontSize: "12px" }}>🔔</span>}
                          </div>
                          {lt ? <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lt.text ? `${lt.text} · ` : ""}{timeAgoLocalized(lt.created_at, lang)}</div>
                            : <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 3 }}>{t.noRecentReports}</div>}
                        </div>
                        {zr.length > 0 && <span style={{ fontSize: "11px", color: "var(--text-dim)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: "var(--radius-sm)", flexShrink: 0, fontWeight: 600 }}>{zr.length}</span>}
                        <span style={{ color: "var(--text-faint)", fontSize: "16px", flexShrink: 0 }}>›</span>
                      </button>
                    );
                  })}
                  <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: "12px", color: "var(--text-faint)" }}>{lang === "es" ? "Hecho para Barranquilla 🇨🇴" : "Made for Barranquilla 🇨🇴"}</div>
                </>
              )}
            </div>
          ) : (
            <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
          )}
        </div>

        {/* Desktop side panel */}
        {isDesktop && (
          <div onTransitionEnd={() => { window.dispatchEvent(new Event("resize")); }} style={{ width: showPanel ? 380 : 0, minWidth: 0, flexShrink: 0, borderLeft: showPanel ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <div style={{ width: 380, height: "100%", opacity: showPanel ? 1 : 0, transition: "opacity 0.2s ease", overflow: "hidden" }}>
              <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
            </div>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      {!isDesktop && (
        <BottomNav activeTab={mobileView} onTab={handleMobileTab} onReport={() => setScreen("report")} liveCount={liveCount} lang={lang} />
      )}

      {/* More menu overlay */}
      {showMoreMenu && <MoreMenu lang={lang} onSelect={(key) => setScreen(key)} onClose={() => setShowMoreMenu(false)} />}
    </div>
  );
}

export default function Home() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
