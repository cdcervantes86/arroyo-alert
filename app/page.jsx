"use client";
import { useState, useCallback, lazy, Suspense } from "react";
import { useReports } from "@/lib/useReports";
import { ZONES, SEVERITY, getZoneSeverity, getZoneReports, timeAgo } from "@/lib/zones";
import ReportFlow from "@/components/ReportFlow";
import ZoneDetail from "@/components/ZoneDetail";

// Lazy-load map (Leaflet needs browser APIs)
const MapView = lazy(() => import("@/components/MapView"));

export default function Home() {
  const { reports, loading, submitReport, upvoteReport } = useReports();
  const [screen, setScreen] = useState("main"); // main, detail, report
  const [selectedZone, setSelectedZone] = useState(null);
  const [view, setView] = useState("map"); // map or list

  const dangerCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "danger").length;
  const cautionCount = ZONES.filter((z) => getZoneSeverity(z.id, reports) === "caution").length;

  const handleZoneClick = useCallback((zoneId) => {
    setSelectedZone(zoneId);
    setScreen("detail");
  }, []);

  const handleReport = useCallback(async ({ zoneId, severity, text }) => {
    await submitReport({ zoneId, severity, text });
  }, [submitReport]);

  // ===== REPORT FLOW =====
  if (screen === "report") {
    return (
      <ReportFlow
        zones={ZONES}
        reports={reports}
        initialZoneId={selectedZone}
        onSubmit={async (data) => {
          await handleReport(data);
          setScreen("main");
        }}
        onBack={() => setScreen("main")}
      />
    );
  }

  // ===== ZONE DETAIL =====
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

  // ===== MAIN SCREEN =====
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(12,18,32,0.95)", borderBottom: "1px solid var(--border)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.5px", flex: 1 }}>
          🌊 Arroyo<span style={{ color: "var(--accent)" }}>Alert</span>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
          <button onClick={() => setView("map")} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: view === "map" ? "rgba(96,165,250,0.15)" : "transparent", color: view === "map" ? "var(--accent)" : "var(--text-dim)", borderRadius: "8px 0 0 8px" }}>🗺️</button>
          <button onClick={() => setView("list")} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: view === "list" ? "rgba(96,165,250,0.15)" : "transparent", color: view === "list" ? "var(--accent)" : "var(--text-dim)", borderRadius: "0 8px 8px 0" }}>📋</button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "8px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {dangerCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(220,38,38,0.1)", padding: "5px 10px", borderRadius: "16px", border: "1px solid rgba(220,38,38,0.15)" }}>
            <span style={{ width: 6, height: 6, background: "var(--danger)", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "11px", color: "#FCA5A5", fontWeight: 600 }}>{dangerCount} peligro</span>
          </div>
        )}
        {cautionCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(217,119,6,0.08)", padding: "5px 10px", borderRadius: "16px", border: "1px solid rgba(217,119,6,0.12)" }}>
            <span style={{ fontSize: "11px", color: "#FBBF24", fontWeight: 600 }}>{cautionCount} precaución</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: "10px", color: "var(--text-faint)", alignSelf: "center" }}>Expiran en 4h</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {view === "map" ? (
          <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: "14px" }}>Cargando mapa...</div>}>
            <MapView reports={reports} onZoneClick={handleZoneClick} />
          </Suspense>
        ) : (
          <div style={{ height: "100%", overflowY: "auto", padding: "12px 16px 100px" }}>
            {ZONES.map((z) => {
              const sv = getZoneSeverity(z.id, reports);
              const zr = getZoneReports(z.id, reports);
              const lt = zr[0];
              const c = sv ? SEVERITY[sv] : null;
              return (
                <button key={z.id} onClick={() => handleZoneClick(z.id)} style={{
                  width: "100%", background: c ? `linear-gradient(135deg,${c.bg},rgba(12,18,32,0.95))` : "var(--bg-card)",
                  border: c ? `1px solid ${c.color}20` : "1px solid var(--border)",
                  borderRadius: "12px", padding: "14px", cursor: "pointer", textAlign: "left",
                  display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px",
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0, background: c ? `${c.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${c ? c.color + "25" : "rgba(255,255,255,0.05)"}` }}>
                    {c ? c.emoji : "⚪"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                      {z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({z.area})</span>
                    </div>
                    {lt ? (
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lt.text} · {timeAgo(lt.created_at)}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: 2 }}>Sin reportes</div>
                    )}
                  </div>
                  {zr.length > 0 && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: "8px", flexShrink: 0 }}>{zr.length}</span>}
                  <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "16px", flexShrink: 0 }}>›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* FAB */}
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <button onClick={() => setScreen("report")} style={{
            padding: "14px 28px", background: "linear-gradient(135deg,#2563EB,#3B82F6)",
            color: "#fff", border: "none", borderRadius: "50px", fontSize: "14px", fontWeight: 700,
            cursor: "pointer", boxShadow: "0 6px 28px rgba(37,99,235,0.45)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            📡 Reportar Arroyo
          </button>
        </div>
      </div>
    </div>
  );
}
