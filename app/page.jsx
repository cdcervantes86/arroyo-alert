"use client";
import { useState, useCallback, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports, timeAgo } from "@/lib/zones";
import ReportFlow from "@/components/ReportFlow";
import ZoneDetail from "@/components/ZoneDetail";

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

export default function Home() {
  const { reports, loading, submitReport, upvoteReport } = useReports();
  const [screen, setScreen] = useState("main");
  const [selectedZone, setSelectedZone] = useState(null);
  const [view, setView] = useState("map");

  const dangerCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "danger").length;
  const cautionCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "caution").length;

  const handleZoneClick = useCallback((zoneId) => {
    setSelectedZone(zoneId);
    setScreen("detail");
  }, []);

  if (screen === "report") {
    return (
      <ReportFlow
        zones={ZONES}
        reports={reports}
        initialZoneId={selectedZone}
        onSubmit={async (data) => {
          await submitReport(data);
          setScreen("main");
        }}
        onBack={() => setScreen("main")}
      />
    );
  }

  if (screen === "detail" && selectedZone) {
    const zone = ZONES.find((z) => z.id === selectedZone);
    const zoneReports = getZoneReports(selectedZone, reports);
    const severity = getZoneSeverity(selectedZone, reports);
    return (
      <ZoneDetail
        zone={zone}
        severity={severity}
        reports={zoneReports}
        onBack={() => { setScreen("main"); setSelectedZone(null); }}
        onReport={() => setScreen("report")}
        onUpvote={upvoteReport}
      />
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* ===== HEADER ===== */}
      <div style={{
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 10, flexShrink: 0,
      }}>
        <Logo size={30} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>
            Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span>
          </span>
        </div>
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          borderRadius: "var(--radius-sm)", overflow: "hidden",
          border: "1px solid var(--border)",
        }}>
          {[
            { key: "map", icon: "🗺️" },
            { key: "list", icon: "📋" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setView(tab.key)} style={{
              padding: "7px 14px", fontSize: "13px", border: "none",
              background: view === tab.key ? "var(--accent-glow)" : "transparent",
              color: view === tab.key ? "var(--accent)" : "var(--text-dim)",
              fontWeight: view === tab.key ? 600 : 400,
            }}>
              {tab.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <div style={{
        padding: "10px 18px",
        display: "flex", gap: "8px", alignItems: "center",
        flexShrink: 0, borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        {dangerCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--danger-bg)", padding: "5px 12px",
            borderRadius: "20px", border: "1px solid var(--danger-border)",
          }}>
            <span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 600 }}>{dangerCount} peligro</span>
          </div>
        )}
        {cautionCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--caution-bg)", padding: "5px 12px",
            borderRadius: "20px", border: "1px solid var(--caution-border)",
          }}>
            <span style={{ fontSize: "12px", color: "#fcd34d", fontWeight: 600 }}>{cautionCount} precaución</span>
          </div>
        )}
        {dangerCount === 0 && cautionCount === 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--safe-bg)", padding: "5px 12px",
            borderRadius: "20px", border: "1px solid var(--safe-border)",
          }}>
            <span style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>Sin alertas activas</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>Expiran en 4h</span>
      </div>

      {/* ===== CONTENT ===== */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {view === "map" ? (
          <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>
              Cargando mapa...
            </div>
          }>
            <MapView reports={reports} onZoneClick={handleZoneClick} />
          </Suspense>
        ) : (
          <div style={{ height: "100%", overflowY: "auto", padding: "14px 18px 120px" }}>
            {ZONES.map((z, i) => {
              const sv = getZoneSeverity(z.id, reports);
              const zr = getZoneReports(z.id, reports);
              const lt = zr[0];
              const c = sv ? SEVERITY[sv] : null;
              return (
                <button key={z.id} onClick={() => handleZoneClick(z.id)} style={{
                  width: "100%",
                  background: c ? `linear-gradient(135deg, ${c.bg}, var(--bg))` : "var(--bg-card)",
                  border: c ? `1px solid ${c.color}18` : "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "16px", textAlign: "left",
                  display: "flex", gap: "14px", alignItems: "center", marginBottom: "8px",
                  animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", flexShrink: 0,
                    background: c ? `${c.color}10` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${c ? c.color + "20" : "var(--border)"}`,
                  }}>
                    {c ? c.emoji : "⚪"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                      {z.name}{" "}
                      <span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: "13px" }}>
                        {z.area}
                      </span>
                    </div>
                    {lt ? (
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lt.text} · {timeAgo(lt.created_at)}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 3 }}>Sin reportes recientes</div>
                    )}
                  </div>
                  {zr.length > 0 && (
                    <span style={{
                      fontSize: "11px", color: "var(--text-dim)",
                      background: "rgba(255,255,255,0.04)", padding: "3px 8px",
                      borderRadius: "var(--radius-sm)", flexShrink: 0, fontWeight: 600,
                    }}>
                      {zr.length}
                    </span>
                  )}
                  <span style={{ color: "var(--text-faint)", fontSize: "16px", flexShrink: 0 }}>›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ===== FAB ===== */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <button onClick={() => setScreen("report")} style={{
            padding: "15px 30px",
            background: "linear-gradient(135deg, #D42A2A, #c42222)",
            color: "#fff", border: "none", borderRadius: "50px",
            fontSize: "14px", fontWeight: 700,
            boxShadow: "0 8px 32px rgba(212,42,42,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: "8px",
            letterSpacing: "-0.2px",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v10M12 22c-4 0-8-2-8-6 0-3 2-5.5 5-7M12 22c4 0 8-2 8-6 0-3-2-5.5-5-7" />
            </svg>
            Reportar Arroyo
          </button>
        </div>
      </div>
    </div>
  );
}
