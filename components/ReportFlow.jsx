"use client";
import { useState } from "react";
import { SEVERITY, getZoneSeverity } from "@/lib/zones";

export default function ReportFlow({ zones, reports, initialZoneId, onSubmit, onBack }) {
  const [step, setStep] = useState(initialZoneId ? 1 : 0);
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [severity, setSeverity] = useState(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ zoneId, severity, text });
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "15px", cursor: "pointer", fontWeight: 600 }}>← Atrás</button>
        <span style={{ flex: 1, textAlign: "center", fontSize: "13px", color: "var(--text-dim)" }}>Paso {step + 1} de 3</span>
        <div style={{ width: 50 }} />
      </div>
      {/* Progress */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "var(--accent)", width: `${((step + 1) / 3) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        {/* Step 0: Zone */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 2px" }}>¿Dónde está el arroyo?</h2>
            <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 16px" }}>Selecciona la zona</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {zones.map((z) => {
                const sv = getZoneSeverity(z.id, reports);
                return (
                  <button key={z.id} onClick={() => { setZoneId(z.id); setStep(1); }} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                    padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  }}>
                    <span style={{ fontSize: 16 }}>{sv ? SEVERITY[sv].emoji : "⚪"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({z.area})</span></div>
                      <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 1 }}>{z.desc}</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: 16 }}>›</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 1: Severity */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 2px" }}>¿Qué tan grave está?</h2>
            <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>Nivel de riesgo</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(SEVERITY).map(([key, cfg]) => (
                <button key={key} onClick={() => { setSeverity(key); setStep(2); }} style={{
                  background: cfg.bg, border: `2px solid ${cfg.color}40`, borderRadius: 14,
                  padding: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left",
                }}>
                  <span style={{ fontSize: 36 }}>{cfg.emoji}</span>
                  <div>
                    <div style={{ color: cfg.color, fontSize: 18, fontWeight: 700 }}>{cfg.label}</div>
                    <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 4 }}>{cfg.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Text + submit */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 2px" }}>¿Algo más?</h2>
            <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 16px" }}>Opcional</p>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Ej: El agua está subiendo rápido..."
              style={{
                width: "100%", minHeight: 100, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14,
                color: "#fff", fontSize: 15, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            {/* Summary */}
            <div style={{ marginTop: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 14, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Resumen</div>
              <div style={{ fontSize: 14, marginBottom: 4 }}>📍 {zones.find((z) => z.id === zoneId)?.name} ({zones.find((z) => z.id === zoneId)?.area})</div>
              <div style={{ fontSize: 14, color: severity ? SEVERITY[severity].color : "#fff" }}>
                {severity ? `${SEVERITY[severity].emoji} ${SEVERITY[severity].label}` : ""}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{
              width: "100%", marginTop: 16, padding: 16,
              background: submitting ? "#555" : "linear-gradient(135deg,#2563EB,#3B82F6)",
              color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: submitting ? "default" : "pointer", boxShadow: "0 6px 24px rgba(37,99,235,0.35)",
            }}>
              {submitting ? "Enviando..." : "Enviar Reporte 📡"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
