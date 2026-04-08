"use client";
import { useState } from "react";
import { SEVERITY, timeAgo } from "@/lib/zones";

export default function ZoneDetail({ zone, severity, reports, onBack, onReport, onUpvote }) {
  const [upvoted, setUpvoted] = useState(new Set());

  const handleUpvote = (report) => {
    if (upvoted.has(report.id)) return;
    onUpvote(report.id, report.upvotes);
    setUpvoted((prev) => new Set([...prev, report.id]));
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px", display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
        background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "var(--accent)",
          fontSize: "14px", fontWeight: 600, padding: "4px 0",
        }}>
          ← Mapa
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px", flex: 1, overflowY: "auto" }}>
        {/* Zone header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "4px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", flexShrink: 0,
            background: severity ? `${SEVERITY[severity].color}10` : "rgba(255,255,255,0.03)",
            border: `1px solid ${severity ? SEVERITY[severity].color + "20" : "var(--border)"}`,
          }}>
            {severity ? SEVERITY[severity].emoji : "⚪"}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>
              {zone.name}
            </h2>
            <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>{zone.area}</p>
            <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "12px" }}>{zone.desc}</p>
          </div>
        </div>

        {severity && (
          <div style={{
            display: "inline-block", padding: "6px 14px", borderRadius: "20px",
            background: SEVERITY[severity].bg, color: SEVERITY[severity].color,
            fontSize: "12px", fontWeight: 600, margin: "16px 0 24px",
            border: `1px solid ${SEVERITY[severity].color}20`,
          }}>
            Estado actual: {SEVERITY[severity].label}
          </div>
        )}

        {/* Reports */}
        <div style={{
          fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase",
          letterSpacing: "1.5px", margin: "0 0 12px", fontWeight: 600,
        }}>
          Reportes recientes ({reports.length})
        </div>

        {!reports.length && (
          <div style={{
            textAlign: "center", padding: "48px 0",
            color: "var(--text-faint)", fontSize: "13px",
          }}>
            No hay reportes recientes para esta zona
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: 90 }}>
          {reports.map((r, i) => {
            const isUpvoted = upvoted.has(r.id);
            return (
              <div key={r.id} style={{
                background: "var(--bg-card)",
                border: `1px solid ${SEVERITY[r.severity].color}12`,
                borderRadius: "var(--radius-md)", padding: "14px 16px",
                animation: `fadeIn 0.25s ease ${i * 0.05}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 8 }}>
                  <span style={{ fontSize: "14px" }}>{SEVERITY[r.severity].emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: SEVERITY[r.severity].color }}>
                    {SEVERITY[r.severity].label}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>
                    {timeAgo(r.created_at)}
                  </span>
                </div>
                <p style={{
                  margin: "0 0 12px", fontSize: "14px", lineHeight: 1.55,
                  color: "var(--text-secondary)",
                }}>
                  {r.text}
                </p>
                <button onClick={() => handleUpvote(r)} style={{
                  background: isUpvoted ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)", padding: "6px 12px",
                  color: isUpvoted ? "var(--accent)" : "var(--text-dim)",
                  fontSize: "12px", display: "flex", alignItems: "center", gap: "6px",
                  fontWeight: 500,
                }}>
                  👍 {isUpvoted ? "Confirmado" : "Confirmar"} · {r.upvotes + (isUpvoted ? 1 : 0)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom action */}
      <div style={{
        padding: "14px 20px",
        background: "rgba(8,13,24,0.95)", backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)", flexShrink: 0,
      }}>
        <button onClick={onReport} style={{
          width: "100%", padding: "15px",
          background: "linear-gradient(135deg, #D42A2A, #c42222)",
          color: "#fff", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "15px", fontWeight: 700,
          boxShadow: "0 6px 20px rgba(212,42,42,0.25)",
          letterSpacing: "-0.2px",
        }}>
          Reportar esta zona
        </button>
      </div>
    </div>
  );
}
