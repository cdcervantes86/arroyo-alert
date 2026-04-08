"use client";
import { useState } from "react";
import { SEVERITY, getZoneSeverity } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

export default function ReportFlow({ zones, reports, initialZoneId, onSubmit, onBack }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(initialZoneId ? 1 : 0);
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [severity, setSeverity] = useState(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sevOptions = [
    { key: "danger", label: t.severityDanger, hint: t.hintDanger },
    { key: "caution", label: t.severityCaution, hint: t.hintCaution },
    { key: "safe", label: t.severitySafe, hint: t.hintSafe },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ zoneId, severity, text });
    setDone(true);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  if (done) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #052e16, #0a1628)",
      }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700 }}>{t.reportSent}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>{t.thankYou}</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "auto" }}>
      <div style={{
        padding: "14px 18px", display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
        background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)",
      }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, padding: "4px 0" }}>
          {t.back}
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: "13px", color: "var(--text-dim)", fontWeight: 500 }}>
          {t.step} {step + 1} {t.of} 3
        </span>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ height: 3, background: "rgba(255,255,255,0.03)", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "var(--accent)", width: `${((step + 1) / 3) * 100}%`, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)", borderRadius: "0 2px 2px 0" }} />
      </div>

      <div style={{ padding: "24px 20px", flex: 1, overflowY: "auto" }}>
        {step === 0 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{t.whereIsArroyo}</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", margin: "0 0 20px" }}>{t.selectZone}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {zones.map((z, i) => {
                const sv = getZoneSeverity(z.id, reports);
                return (
                  <button key={z.id} onClick={() => { setZoneId(z.id); setStep(1); }} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)", padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
                    animation: `fadeIn 0.25s ease ${i * 0.02}s both`,
                  }}>
                    <span style={{ fontSize: "16px" }}>{sv ? SEVERITY[sv].emoji : "⚪"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600 }}>
                        {z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({z.area})</span>
                      </div>
                      <div style={{ color: "var(--text-dim)", fontSize: "11px", marginTop: 2 }}>{z.desc}</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "16px" }}>›</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{t.howBad}</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", margin: "0 0 24px" }}>{t.selectRisk}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sevOptions.map((opt, i) => {
                const cfg = SEVERITY[opt.key];
                return (
                  <button key={opt.key} onClick={() => { setSeverity(opt.key); setStep(2); }} style={{
                    background: cfg.bg, border: `2px solid ${cfg.color}30`,
                    borderRadius: "var(--radius-lg)", padding: "22px 20px",
                    display: "flex", alignItems: "center", gap: "18px", textAlign: "left",
                    animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                  }}>
                    <span style={{ fontSize: "38px" }}>{cfg.emoji}</span>
                    <div>
                      <div style={{ color: cfg.color, fontSize: "18px", fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: 4 }}>{opt.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{t.anythingElse}</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", margin: "0 0 20px" }}>{t.optional}</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.textPlaceholder}
              style={{
                width: "100%", minHeight: 110, background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)",
                padding: "16px", color: "var(--text)", fontSize: "15px",
                resize: "vertical", outline: "none", fontFamily: "inherit",
                boxSizing: "border-box", lineHeight: 1.5,
              }} />
            <div style={{ marginTop: 20, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.reportSummary}</div>
              <div style={{ fontSize: "14px", marginBottom: 6, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                {zones.find((z) => z.id === zoneId)?.name} ({zones.find((z) => z.id === zoneId)?.area})
              </div>
              <div style={{ fontSize: "14px", color: severity ? SEVERITY[severity].color : "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>{severity ? SEVERITY[severity].emoji : ""}</span>
                {severity ? sevOptions.find(o => o.key === severity)?.label : ""}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{
              width: "100%", marginTop: 20, padding: "16px",
              background: submitting ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #D42A2A, #c42222)",
              color: "#fff", border: "none", borderRadius: "var(--radius-md)",
              fontSize: "16px", fontWeight: 700,
              boxShadow: submitting ? "none" : "0 8px 24px rgba(212,42,42,0.3)",
              letterSpacing: "-0.2px",
            }}>
              {submitting ? t.sending : t.submitReport}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
