"use client";
import { useState, useEffect } from "react";
import { SEVERITY, getZoneSeverity, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";

export default function ReportFlow({ zones, reports, initialZoneId, onSubmit, onBack, onLogoClick }) {
  const { lang, t } = useLanguage();
  const [step, setStep] = useState(initialZoneId ? 1 : 0);
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [severity, setSeverity] = useState(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sevOptions = [
    { key: "danger", label: getSevLabel("danger", lang), hint: lang === "en" ? SEVERITY.danger.hintEn : SEVERITY.danger.hint },
    { key: "caution", label: getSevLabel("caution", lang), hint: lang === "en" ? SEVERITY.caution.hintEn : SEVERITY.caution.hint },
    { key: "safe", label: getSevLabel("safe", lang), hint: lang === "en" ? SEVERITY.safe.hintEn : SEVERITY.safe.hint },
  ];

  useEffect(() => { if (!done) return; const timer = setTimeout(() => onBack(), 2500); return () => clearTimeout(timer); }, [done, onBack]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const finalText = text.trim();
    await onSubmit({ zoneId, severity, text: finalText });
    if (navigator.vibrate) navigator.vibrate(100);
    setDone(true);
  };

  const goBack = () => { if (step > 0) setStep(step - 1); else onBack(); };

  if (done) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #052e16, #0a1628)" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px", animation: "successPulse 0.5s ease" }}>✅</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, animation: "fadeIn 0.4s ease 0.2s both" }}>{t.reportSent}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px", animation: "fadeIn 0.4s ease 0.4s both" }}>{t.thankYou}</p>
        <div style={{ marginTop: "24px", width: "120px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden", animation: "fadeIn 0.4s ease 0.6s both" }}>
          <div style={{ height: "100%", background: "var(--safe)", animation: "progressBar 2.5s linear forwards" }} />
        </div>
        <style>{`@keyframes progressBar { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "auto" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(8,13,24,0.92)", backdropFilter: "blur(16px)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={24} height={24} viewBox="0 0 512 512" style={{ borderRadius: 5, flexShrink: 0 }}>
            <defs><linearGradient id="lBg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs>
            <rect width="512" height="512" rx="112" fill="url(#lBg2)" />
            <path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
            <path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" />
            <path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Arroyo<span style={{ color: "var(--baq-yellow)" }}>Alerta</span></span>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(96,165,250,0.15)", marginLeft: "-4px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: "13px", color: "var(--text-dim)", fontWeight: 500 }}>{t.step} {step + 1} {t.of} 3</span>
        <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, padding: "4px 0" }}>{t.back}</button>
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
                  <button key={z.id} onClick={() => { setZoneId(z.id); setStep(1); }} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", textAlign: "left", animation: `fadeIn 0.25s ease ${i * 0.02}s both` }}>
                    <span style={{ fontSize: "16px" }}>{sv ? SEVERITY[sv].emoji : "⚪"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600 }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({z.area})</span></div>
                      <div style={{ color: "var(--text-dim)", fontSize: "11px", marginTop: 2 }}>{getZoneDesc(z, lang)}</div>
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
                  <button key={opt.key} onClick={() => { setSeverity(opt.key); setStep(2); }} style={{ background: cfg.bg, border: `2px solid ${cfg.color}30`, borderRadius: "var(--radius-lg)", padding: "22px 20px", display: "flex", alignItems: "center", gap: "18px", textAlign: "left", animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
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
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.textPlaceholder} style={{ width: "100%", minHeight: 110, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "16px", color: "var(--text)", fontSize: "15px", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }} />
            <div style={{ marginTop: 20, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.reportSummary}</div>
              <div style={{ fontSize: "14px", marginBottom: 6, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                {zones.find((z) => z.id === zoneId)?.name} ({zones.find((z) => z.id === zoneId)?.area})
              </div>
              <div style={{ fontSize: "14px", color: severity ? SEVERITY[severity].color : "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>{severity ? SEVERITY[severity].emoji : ""}</span>
                {severity ? getSevLabel(severity, lang) : ""}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting} style={{ width: "100%", marginTop: 20, padding: "16px", background: submitting ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #D42A2A, #c42222)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: 700, boxShadow: submitting ? "none" : "0 8px 24px rgba(212,42,42,0.3)", letterSpacing: "-0.2px" }}>
              {submitting ? t.sending : t.submitReport}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
