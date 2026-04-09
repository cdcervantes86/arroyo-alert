"use client";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { usePushNotifications, notifyZone } from "@/lib/usePushNotifications";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports, getZoneDesc, getSevLabel, translateReportText } from "@/lib/zones";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { timeAgoLocalized } from "@/lib/translations";
import ReportFlow from "@/components/ReportFlow";
import ZoneDetail from "@/components/ZoneDetail";
import LiveFeed from "@/components/LiveFeed";

const MapView = lazy(() => import("@/components/MapView"));

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14261a" />
          <stop offset="100%" stopColor="#0a1210" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#logoBg)" />
      <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
      <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
      <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
      <circle cx="400" cy="115" r="40" fill="#fff" />
      <text x="400" y="133" textAnchor="middle" fill="#D42A2A" fontSize="52" fontWeight="900" fontFamily="sans-serif">!</text>
    </svg>
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
  const panelRef = useRef(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const dangerCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "danger").length;
  const cautionCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "caution").length;
  const cutoff = Date.now() - 4 * 3600000;
  const liveCount = reports.filter((r) => new Date(r.created_at).getTime() > cutoff).length;
  const hasAnyReports = liveCount > 0;

  const handleZoneClick = useCallback((zoneId) => { setSelectedZone(zoneId); setScreen("detail"); }, []);
  const handleReport = useCallback(async ({ zoneId, severity, text }) => {
    await submitReport({ zoneId, severity, text });
    const zone = ZONES.find((z) => z.id === zoneId);
    if (zone) notifyZone({ zoneId, zoneName: `${zone.name} (${zone.area})`, severity, text });
  }, [submitReport]);
  const handleUpvoteLocal = useCallback((id) => { setUpvotedSet((prev) => new Set([...prev, id])); }, []);
  const handleLogoClick = () => { setScreen("main"); setSelectedZone(null); setActiveFilter(null); if (isDesktop) setDesktopView("map"); else setMobileView("map"); };
  const handleTabClick = (key) => { if (isDesktop) { if (key === "live") setShowPanel((p) => !p); else setDesktopView(key); } else { setMobileView(key); } };
  const handleFilterClick = (filter) => { setActiveFilter((prev) => prev === filter ? null : filter); };
  const isTabActive = (key) => { if (isDesktop) { if (key === "live") return showPanel; return desktopView === key; } return mobileView === key; };

  const currentMainView = isDesktop ? desktopView : mobileView;
  const panelVisible = isDesktop && showPanel;

  if (screen === "report") {
    return <ReportFlow zones={ZONES} reports={reports} initialZoneId={selectedZone} onSubmit={async (data) => { await handleReport(data); setScreen("main"); }} onBack={() => setScreen("main")} onLogoClick={handleLogoClick} />;
  }
  if (screen === "detail" && selectedZone) {
    const zone = ZONES.find((z) => z.id === selectedZone);
    return <ZoneDetail zone={zone} severity={getZoneSeverity(selectedZone, reports)} reports={getZoneReports(selectedZone, reports)} onBack={() => { setScreen("main"); setSelectedZone(null); }} onReport={() => setScreen("report")} onUpvote={upvoteReport} pushSupported={push.supported} isSubscribed={push.isSubscribed} onSubscribe={push.subscribeToZone} onUnsubscribe={push.unsubscribeFromZone} onLogoClick={handleLogoClick} />;
  }

  const tabs = [{ key: "map", icon: "🗺️" }, { key: "list", icon: "📋" }, { key: "live", icon: "🔴" }];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <button onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Logo size={30} />
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>
            Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span>
          </span>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(96,165,250,0.15)", marginLeft: "-4px", marginTop: "-8px" }}>Beta</span>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={toggleLang} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {lang === "es" ? "EN" : "ES"}
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => handleTabClick(tab.key)} style={{ padding: "7px 12px", fontSize: "12px", border: "none", background: isTabActive(tab.key) ? "var(--accent-glow)" : "transparent", color: isTabActive(tab.key) ? "var(--accent)" : "var(--text-dim)", fontWeight: isTabActive(tab.key) ? 600 : 400, display: "flex", alignItems: "center", gap: "4px", position: "relative" }}>
              {tab.icon}
              {tab.key === "live" && liveCount > 0 && !isTabActive("live") && (
                <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", animation: "blink 1.5s ease-in-out infinite" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ padding: "10px 18px", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        {dangerCount > 0 && (
          <button onClick={() => handleFilterClick("danger")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "danger" ? "rgba(239,68,68,0.2)" : "var(--danger-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "danger" ? "2px solid var(--danger)" : "1px solid var(--danger-border)", cursor: "pointer", transition: "all 0.15s ease" }}>
            <span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{dangerCount} {t.danger}</span>
          </button>
        )}
        {cautionCount > 0 && (
          <button onClick={() => handleFilterClick("caution")} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeFilter === "caution" ? "rgba(245,158,11,0.2)" : "var(--caution-bg)", padding: "5px 12px", borderRadius: "20px", border: activeFilter === "caution" ? "2px solid var(--caution)" : "1px solid var(--caution-border)", cursor: "pointer", transition: "all 0.15s ease" }}>
            <span style={{ fontSize: "12px", color: "#fcd34d", fontWeight: 600 }}>{cautionCount} {t.caution}</span>
          </button>
        )}
        {dangerCount === 0 && cautionCount === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--safe-bg)", padding: "5px 12px", borderRadius: "20px", border: "1px solid var(--safe-border)" }}>
            <span style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>{t.noActiveAlerts}</span>
          </div>
        )}
        {activeFilter && (
          <button onClick={() => setActiveFilter(null)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "5px 10px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer", fontSize: "11px", color: "var(--text-dim)", fontWeight: 500 }}>
            ✕ {lang === "es" ? "Limpiar" : "Clear"}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>{t.expiresIn}</span>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {currentMainView === "map" ? (
            <>
              <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>{t.loadingMap}</div>}>
                <MapView reports={reports} onZoneClick={handleZoneClick} panelOpen={panelVisible} activeFilter={activeFilter} lang={lang} />
              </Suspense>
              {!hasAnyReports && (
                <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(8,13,24,0.85)", backdropFilter: "blur(8px)", padding: "10px 20px", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-dim)", fontWeight: 500, pointerEvents: "none", zIndex: 5, animation: "fadeIn 0.5s ease 1s both", whiteSpace: "nowrap" }}>
                  {lang === "es" ? "Toca un punto para ver detalles" : "Tap a dot to see details"}
                </div>
              )}
            </>
          ) : currentMainView === "list" ? (
            <div style={{ height: "100%", overflowY: "auto", padding: "14px 18px 120px" }}>
              {ZONES.filter((z) => !activeFilter || getZoneSeverity(z.id, reports) === activeFilter).map((z, i) => {
                const sv = getZoneSeverity(z.id, reports);
                const zr = getZoneReports(z.id, reports);
                const lt = zr[0];
                const c = sv ? SEVERITY[sv] : null;
                const isSubbed = push.isSubscribed(z.id);
                return (
                  <button key={z.id} onClick={() => handleZoneClick(z.id)} style={{ width: "100%", background: c ? `linear-gradient(135deg, ${c.bg}, var(--bg))` : "var(--bg-card)", border: c ? `1px solid ${c.color}18` : "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", textAlign: "left", display: "flex", gap: "14px", alignItems: "center", marginBottom: "8px", animation: `fadeIn 0.3s ease ${i * 0.03}s both` }}>
                    <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0, background: c ? `${c.color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${c ? c.color + "20" : "var(--border)"}` }}>
                      {c ? c.emoji : "⚪"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                        {z.name}
                        <span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: "13px" }}>{z.area}</span>
                        {isSubbed && <span style={{ fontSize: "12px" }}>🔔</span>}
                      </div>
                      {lt ? (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {translateReportText(lt.text, lang)} · {timeAgoLocalized(lt.created_at, lang)}
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 3 }}>{t.noRecentReports}</div>
                      )}
                    </div>
                    {zr.length > 0 && <span style={{ fontSize: "11px", color: "var(--text-dim)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: "var(--radius-sm)", flexShrink: 0, fontWeight: 600 }}>{zr.length}</span>}
                    <span style={{ color: "var(--text-faint)", fontSize: "16px", flexShrink: 0 }}>›</span>
                  </button>
                );
              })}
              <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: "12px", color: "var(--text-faint)", letterSpacing: "0.3px" }}>
                {lang === "es" ? "Hecho para Barranquilla 🇨🇴" : "Made for Barranquilla 🇨🇴"}
              </div>
            </div>
          ) : (
            <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
          )}

          {/* FAB — alert triangle icon */}
          <div className="fab-container" style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
            <button onClick={() => setScreen("report")} style={{ padding: "15px 30px", background: "linear-gradient(135deg, #D42A2A, #c42222)", color: "#fff", border: "none", borderRadius: "50px", fontSize: "14px", fontWeight: 700, boxShadow: "0 8px 32px rgba(212,42,42,0.35), 0 0 0 1px rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "-0.2px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {t.reportArroyo}
            </button>
          </div>
        </div>

        {/* DESKTOP SIDE PANEL */}
        {isDesktop && (
          <div ref={panelRef} onTransitionEnd={() => { window.dispatchEvent(new Event("resize")); }} style={{ width: showPanel ? 380 : 0, minWidth: 0, flexShrink: 0, borderLeft: showPanel ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <div style={{ width: 380, height: "100%", opacity: showPanel ? 1 : 0, transition: "opacity 0.2s ease", overflow: "hidden" }}>
              <LiveFeed reports={reports} onZoneClick={handleZoneClick} onUpvote={upvoteReport} upvotedSet={upvotedSet} onUpvoteLocal={handleUpvoteLocal} activeFilter={activeFilter} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
