"use client";
import { useState, useEffect, useRef } from "react";
import { SEVERITY, getZoneSeverity, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { getReporterStats } from "@/lib/deviceId";
import { SeverityIcon, SuccessRipple } from "@/components/SeverityIcon";

export default function ReportFlow({ zones, reports, initialZoneId, onSubmit, onBack, onLogoClick }) {
  const { lang, t } = useLanguage();
  const [step, setStep] = useState(initialZoneId ? 1 : 0);
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [severity, setSeverity] = useState(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [altRoute, setAltRoute] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef(null);
  const stats = typeof window !== "undefined" ? getReporterStats() : {};

  useEffect(() => { if (done) { const t = setTimeout(() => onBack(), 2500); return () => clearTimeout(t); } }, [done, onBack]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ zoneId, severity, text: text.trim(), photo, altRoute: altRoute.trim() });
    if (navigator.vibrate) navigator.vibrate(100);
    setDone(true);
  };

  const goBack = () => { if (step > 0) setStep(step - 1); else onBack(); };

  const es = lang === "es";

  if (done) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #041210, #070b14)", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}><SuccessRipple /></div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, animation: "fadeIn 0.4s ease 0.2s both", textAlign: "center" }}>{t.reportSent}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px", animation: "fadeIn 0.4s ease 0.4s both" }}>{t.thankYou}</p>
        {stats.verified && <div style={{ marginTop: "12px", animation: "fadeIn 0.4s ease 0.6s both" }}><span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>✓ Reportero Verificado</span></div>}
        <div style={{ marginTop: "28px", width: "100px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.04)", overflow: "hidden", animation: "fadeIn 0.4s ease 0.6s both" }}>
          <div style={{ height: "100%", background: "var(--safe)", animation: "progressBar 2.5s linear forwards" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(7,11,20,0.95)", backdropFilter: "blur(16px)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBg2)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.5px" }}>
          {t.step} {step + 1} / 3
        </span>
        <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600 }}>{t.back}</button>
      </div>

      {/* Progress */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
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
                  <button key={z.id} onClick={() => { setZoneId(z.id); setStep(1); }} className="card-interactive" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "13px 14px", display: "flex", alignItems: "center", gap: "12px", textAlign: "left", animation: `fadeIn 0.2s ease ${i * 0.02}s both` }}>
                    <SeverityIcon severity={sv} size={18} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600 }}>{z.name} <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>({z.area})</span></div>
                      <div style={{ color: "var(--text-faint)", fontSize: "11px", marginTop: 2 }}>{z.desc}</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "14px" }}>›</span>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { key: "danger", label: getSevLabel("danger", lang), hint: lang === "en" ? SEVERITY.danger.hintEn : SEVERITY.danger.hint },
                { key: "caution", label: getSevLabel("caution", lang), hint: lang === "en" ? SEVERITY.caution.hintEn : SEVERITY.caution.hint },
                { key: "safe", label: getSevLabel("safe", lang), hint: lang === "en" ? SEVERITY.safe.hintEn : SEVERITY.safe.hint },
              ].map((opt, i) => {
                const cfg = SEVERITY[opt.key];
                return (
                  <button key={opt.key} onClick={() => { setSeverity(opt.key); setStep(2); }} style={{
                    background: `${cfg.color}06`, border: `1px solid ${cfg.color}18`,
                    borderLeft: `4px solid ${cfg.color}`,
                    borderRadius: "var(--radius-md)", padding: "20px 18px",
                    display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
                    animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                  }}>
                    <SeverityIcon severity={opt.key} size={38} />
                    <div>
                      <div style={{ color: cfg.color, fontSize: "17px", fontWeight: 700 }}>{opt.label}</div>
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
              style={{ width: "100%", minHeight: 100, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "14px 16px", color: "var(--text)", fontSize: "15px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            <div style={{ marginTop: "14px" }}>
              {photoPreview ? (
                <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
                  <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.015)", border: "1px dashed var(--border-light)", color: "var(--text-dim)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                  📸 {es ? "Agregar foto (opcional)" : "Add photo (optional)"}
                </button>
              )}
            </div>

            {/* Ruta alterna — only for danger/caution */}
            {(severity === "danger" || severity === "caution") && (
              <div style={{ marginTop: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--safe)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  🛣️ {es ? "Ruta alterna (opcional)" : "Alternate route (optional)"}
                </label>
                <textarea value={altRoute} onChange={(e) => setAltRoute(e.target.value)}
                  placeholder={es ? "Ej: Usa la Calle 30 como alternativa, o desvíate por la Cra 46..." : "E.g. Use Calle 30 as alternative, or detour via Cra 46..."}
                  style={{ width: "100%", minHeight: 70, background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-md)", padding: "12px 14px", color: "var(--text)", fontSize: "14px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>{es ? "Ayuda a otros a evitar esta zona" : "Help others avoid this zone"}</p>
              </div>
            )}

            {/* Summary */}
            <div style={{ marginTop: 20, background: "rgba(255,255,255,0.015)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.reportSummary}</div>
              <div style={{ fontSize: "14px", marginBottom: 6, display: "flex", alignItems: "center", gap: "6px" }}>
                📍 {zones.find((z) => z.id === zoneId)?.name} ({zones.find((z) => z.id === zoneId)?.area})
              </div>
              <div style={{ fontSize: "14px", color: severity ? SEVERITY[severity].color : "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                {severity ? <SeverityIcon severity={severity} size={16} /> : ""} {severity ? getSevLabel(severity, lang) : ""}
              </div>
              {altRoute.trim() && <div style={{ fontSize: "12px", color: "var(--safe)", marginTop: 6, display: "flex", alignItems: "center", gap: "5px" }}>🛣️ {altRoute.trim()}</div>}
              {photo && <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 6 }}>📸 1 {es ? "foto adjunta" : "photo attached"}</div>}
            </div>

            <button onClick={handleSubmit} disabled={submitting} style={{
              width: "100%", marginTop: 20, padding: "16px",
              background: submitting ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #D42A2A, #b91c1c)",
              color: "#fff", border: "none", borderRadius: "var(--radius-md)",
              fontSize: "16px", fontWeight: 700,
              boxShadow: submitting ? "none" : "0 8px 24px rgba(212,42,42,0.25)",
              opacity: submitting ? 0.6 : 1,
            }}>
              {submitting ? (photo ? (es ? "Subiendo foto..." : "Uploading...") : t.sending) : t.submitReport}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
