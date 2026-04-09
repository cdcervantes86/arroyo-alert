"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ZONES, SEVERITY } from "@/lib/zones";

const ADMIN_PASSWORD = "arroyoalerta2025";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    // All reports (not just 4h)
    const { data: allReports } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (allReports) {
      setReports(allReports);

      const today = new Date().toISOString().split("T")[0];
      const todayReports = allReports.filter((r) => r.created_at.startsWith(today));
      const last24h = allReports.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86400000);

      // Zone activity
      const zoneCounts = {};
      allReports.forEach((r) => {
        zoneCounts[r.zone_id] = (zoneCounts[r.zone_id] || 0) + 1;
      });
      const topZones = Object.entries(zoneCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const zone = ZONES.find((z) => z.id === parseInt(id));
          return { name: zone?.name || `Zone ${id}`, area: zone?.area || "", count };
        });

      // Severity breakdown
      const sevCounts = { danger: 0, caution: 0, safe: 0 };
      last24h.forEach((r) => { sevCounts[r.severity] = (sevCounts[r.severity] || 0) + 1; });

      // Subscribers count
      const { count: subCount } = await supabase.from("push_subscriptions").select("*", { count: "exact", head: true });

      setStats({
        totalAllTime: allReports.length,
        today: todayReports.length,
        last24h: last24h.length,
        topZones,
        sevCounts,
        subscribers: subCount || 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed, fetchAll]);

  const handleDelete = async (id) => {
    setDeleting((prev) => new Set([...prev, id]));
    await supabase.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    setDeleting((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#080d18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#f0f2f5" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔐</div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Admin Dashboard</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password === ADMIN_PASSWORD && setAuthed(true)}
            placeholder="Contraseña"
            style={{
              width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
              color: "#fff", fontSize: "15px", outline: "none", textAlign: "center",
              fontFamily: "inherit", marginBottom: "12px",
            }}
          />
          <button
            onClick={() => password === ADMIN_PASSWORD && setAuthed(true)}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #D42A2A, #c42222)",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const timeAgo = (dateStr) => {
    const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}d`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080d18", fontFamily: "'DM Sans', sans-serif", color: "#f0f2f5", padding: "20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, flex: 1 }}>
            🛡️ ArroyoAlerta <span style={{ color: "rgba(255,255,255,0.3)" }}>Admin</span>
          </h1>
          <button onClick={fetchAll} style={{
            padding: "8px 16px", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
            color: "#60a5fa", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            ↻ Refrescar
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>Cargando datos...</div>
        ) : stats && (
          <>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>
              {[
                { label: "Total reportes", value: stats.totalAllTime, color: "#60a5fa" },
                { label: "Hoy", value: stats.today, color: "#22c55e" },
                { label: "Últimas 24h", value: stats.last24h, color: "#f59e0b" },
                { label: "Suscriptores", value: stats.subscribers, color: "#a78bfa" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px", padding: "20px",
                }}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: s.color, marginBottom: "4px" }}>{s.value}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Severity breakdown */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
              {Object.entries(stats.sevCounts).map(([key, count]) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 16px", borderRadius: "20px",
                  background: SEVERITY[key].bg, border: `1px solid ${SEVERITY[key].color}20`,
                }}>
                  <span>{SEVERITY[key].emoji}</span>
                  <span style={{ fontSize: "13px", color: SEVERITY[key].color, fontWeight: 600 }}>{count} {SEVERITY[key].label}</span>
                </div>
              ))}
            </div>

            {/* Top zones */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px", fontWeight: 600 }}>
                Zonas más activas
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {stats.topZones.map((z, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px", background: "rgba(255,255,255,0.025)",
                    borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.2)", width: 24 }}>#{i + 1}</span>
                    <span style={{ fontSize: "14px", fontWeight: 600, flex: 1 }}>{z.name} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>{z.area}</span></span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#60a5fa" }}>{z.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reports with delete */}
            <div>
              <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px", fontWeight: 600 }}>
                Reportes recientes ({reports.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {reports.slice(0, 50).map((r) => {
                  const zone = ZONES.find((z) => z.id === r.zone_id);
                  const sev = SEVERITY[r.severity];
                  const isDeleting = deleting.has(r.id);
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                      borderRadius: "10px", border: `1px solid ${sev.color}15`,
                      opacity: isDeleting ? 0.3 : 1, transition: "opacity 0.2s",
                    }}>
                      <span style={{ fontSize: "14px" }}>{sev.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                          {zone?.name || `Zone ${r.zone_id}`}{" "}
                          <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>{zone?.area}</span>
                        </div>
                        {r.text && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.text}</div>}
                      </div>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{timeAgo(r.created_at)}</span>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>👍 {r.upvotes}</span>
                      <button onClick={() => handleDelete(r.id)} disabled={isDeleting} style={{
                        padding: "4px 10px", background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px",
                        color: "#ef4444", fontSize: "11px", fontWeight: 600,
                        cursor: "pointer", flexShrink: 0,
                      }}>
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
