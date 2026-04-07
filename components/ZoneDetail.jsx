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
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>← Mapa</button>
      </div>
      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{severity ? SEVERITY[severity].emoji : "⚪"}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {zone.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({zone.area})</span>
            </h2>
            <p style={{ margin: "3px 0 0", color: "var(--text-dim)", fontSize: 12 }}>{zone.desc}</p>
          </div>
        </div>

        {severity && (
          <div style={{ display: "inline-block", padding: "5px 12px", borderRadius: 16, background: SEVERITY[severity].bg, color: SEVERITY[severity].color, fontSize: 12, fontWeight: 600, margin: "12px 0 20px" }}>
            Estado: {SEVERITY[severity].label}
          </div>
        )}

        <h3 style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
          Reportes ({reports.length})
        </h3>

        {!reports.length && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-faint)", fontSize: 13 }}>
            No hay reportes recientes para esta zona
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 80 }}>
          {reports.map((r) => {
            const isUpvoted = upvoted.has(r.id);
            return (
              <div key={r.id} style={{ background: "var(--bg-card)", border: `1px solid ${SEVERITY[r.severity].color}15`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{SEVERITY[r.severity].emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: SEVERITY[r.severity].color }}>{SEVERITY[r.severity].label}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{timeAgo(r.created_at)}</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.45, color: "rgba(255,255,255,0.7)" }}>{r.text}</p>
                <button onClick={() => handleUpvote(r)} style={{
                  background: isUpvoted ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isUpvoted ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
                  borderRadius: 8, padding: "5px 10px",
                  color: isUpvoted ? "var(--accent)" : "var(--text-dim)",
                  fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                }}>
                  👍 {isUpvoted ? "Confirmado" : "Confirmar"} · {r.upvotes + (isUpvoted ? 1 : 0)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "12px 20px", background: "rgba(12,18,32,0.95)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={onReport} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg,#2563EB,#3B82F6)",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>
          Reportar esta zona 📡
        </button>
      </div>
    </div>
  );
}
