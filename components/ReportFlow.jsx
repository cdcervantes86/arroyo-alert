"use client";
import { useState, useEffect, useRef } from "react";
import { SEVERITY, getZoneSeverity, getSevLabel } from "@/lib/zones";
import { useLanguage } from "@/lib/LanguageContext";
import { getReporterStats } from "@/lib/deviceId";
import { AlertTriangleIcon } from "@/components/Icons";
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
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #041210, #0a0f1a)", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}><SuccessRipple /></div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, animation: "fadeIn 0.4s ease 0.2s both", textAlign: "center" }}>{t.reportSent}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px", animation: "fadeIn 0.4s ease 0.4s both" }}>{t.thankYou}</p>
        {stats.verified && <div style={{ marginTop: "12px", animation: "fadeIn 0.4s ease 0.6s both" }}><span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>{lang === "en" ? "✓ Verified Reporter" : "✓ Reportero Verificado"}</span></div>}
        <div style={{ marginTop: "28px", width: "100px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.04)", overflow: "hidden", animation: "fadeIn 0.4s ease 0.6s both" }}>
          <div style={{ height: "100%", background: "var(--safe)", animation: "progressBar 2.5s linear forwards" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0f1a", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, background: "#0a0f1a", boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)" }}>
        <button onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 512 512" style={{ borderRadius: 5 }}><defs><linearGradient id="lBg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14261a" /><stop offset="100%" stopColor="#0a1210" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lBg2)" /><path d="M60 210 Q130 160 200 210 Q270 260 340 210 Q410 160 460 210" fill="none" stroke="#D42A2A" strokeWidth="28" strokeLinecap="round" opacity="0.9" /><path d="M60 290 Q130 240 200 290 Q270 340 340 290 Q410 240 460 290" fill="none" stroke="#F5D033" strokeWidth="28" strokeLinecap="round" opacity="0.85" /><path d="M60 370 Q130 320 200 370 Q270 420 340 370 Q410 320 460 370" fill="none" stroke="#2d8a2d" strokeWidth="28" strokeLinecap="round" opacity="0.75" /></svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Alerta<span style={{ color: "var(--baq-yellow)" }}>Arroyo</span></span>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 5px", borderRadius: "3px", border: "1px solid rgba(91,156,246,0.1)", marginLeft: "-2px", marginTop: "-8px" }}>Beta</span>
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.5px" }}>
          {t.step} {step + 1} / 3
        </span>
        <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>{t.back}</button>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.03)", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "var(--accent)", width: `${((step + 1) / 3) * 100}%`, transition: "width 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)", borderRadius: "0 3px 3px 0", boxShadow: "0 0 8px rgba(91,156,246,0.3)" }} />
      </div>

      <div style={{ padding: "24px 20px", flex: 1, overflowY: "auto", maxWidth: 520, margin: "0 auto", width: "100%" }}>
        {step === 0 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{t.whereIsArroyo}</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", margin: "0 0 20px" }}>{t.selectZone}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {zones.map((z, i) => {
                const sv = getZoneSeverity(z.id, reports);
                return (
                  <button key={z.id} onClick={() => { setZoneId(z.id); setStep(1); }} className="card-interactive" style={{
                    background: sv ? `${SEVERITY[sv].color}04` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${sv ? SEVERITY[sv].color + "15" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "var(--radius-lg)", padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: "14px", textAlign: "left",
                    animation: `fadeIn 0.2s ease ${i * 0.02}s both`, position: "relative", overflow: "hidden",
                  }}>
                    {sv && <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, borderRadius: "0 2px 2px 0", background: SEVERITY[sv].color }} />}
                    <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: sv ? `${SEVERITY[sv].color}0a` : "rgba(255,255,255,0.03)", border: `1px solid ${sv ? SEVERITY[sv].color + "18" : "rgba(255,255,255,0.06)"}` }}>
                      <SeverityIcon severity={sv} size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text)", fontSize: "15px", fontWeight: 700, letterSpacing: "-0.2px" }}>{z.name}</div>
                      <div style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: 2 }}>{z.area}</div>
                    </div>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, opacity: 0.15 }}><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                const isSelected = severity === opt.key;
                return (
                  <button key={opt.key} onClick={() => { setSeverity(opt.key); setStep(2); if (navigator.vibrate) navigator.vibrate(40); }} className="tap-target" style={{
                    background: `${cfg.color}06`, border: `1.5px solid ${cfg.color}20`,
                    borderRadius: "var(--radius-lg)", padding: "22px 20px",
                    display: "flex", alignItems: "center", gap: "18px", textAlign: "left",
                    animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                    transition: "all 0.2s ease", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: cfg.color, borderRadius: "0 2px 2px 0" }} />
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${cfg.color}0c`, border: `1px solid ${cfg.color}20` }}>
                      <SeverityIcon severity={opt.key} size={30} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: cfg.color, fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px" }}>{opt.label}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: 4, lineHeight: 1.4 }}>{opt.hint}</div>
                    </div>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ flexShrink: 0, opacity: 0.2 }}><path d="M1 1l6 6-6 6" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
              style={{ width: "100%", minHeight: 100, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-lg)", padding: "16px", color: "var(--text)", fontSize: "15px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5, transition: "border-color 0.2s ease" }} />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            <div style={{ marginTop: "14px" }}>
              {photoPreview ? (
                <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
                  <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="10" height="10" viewBox="0 0 10 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg></button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.12)", color: "var(--text-dim)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> {es ? "Agregar foto (opcional)" : "Add photo (optional)"}
                </button>
              )}
            </div>

            {/* Ruta alterna — only for danger/caution */}
            {(severity === "danger" || severity === "caution") && (
              <div style={{ marginTop: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--safe)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-8a3.5 3.5 0 010-7H12"/></svg> {es ? "Ruta alterna (opcional)" : "Alternate route (optional)"}
                </label>
                <textarea value={altRoute} onChange={(e) => setAltRoute(e.target.value)}
                  placeholder={es ? "Ej: Usa la Calle 30 como alternativa, o desvíate por la Cra 46..." : "E.g. Use Calle 30 as alternative, or detour via Cra 46..."}
                  style={{ width: "100%", minHeight: 70, background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "var(--radius-lg)", padding: "14px 16px", color: "var(--text)", fontSize: "14px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>{es ? "Ayuda a otros a evitar esta zona" : "Help others avoid this zone"}</p>
              </div>
            )}

            {/* Summary */}
            <div style={{ marginTop: 20, background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", padding: "18px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{t.reportSummary}</div>
              <div style={{ fontSize: "14px", marginBottom: 6, display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> {zones.find((z) => z.id === zoneId)?.name} ({zones.find((z) => z.id === zoneId)?.area})
              </div>
              <div style={{ fontSize: "14px", color: severity ? SEVERITY[severity].color : "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                {severity ? <SeverityIcon severity={severity} size={16} /> : ""} {severity ? getSevLabel(severity, lang) : ""}
              </div>
              {altRoute.trim() && <div style={{ fontSize: "12px", color: "var(--safe)", marginTop: 6, display: "flex", alignItems: "center", gap: "5px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-8a3.5 3.5 0 010-7H12"/></svg>{altRoute.trim()}</div>}
              {photo && <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: "middle", marginRight: 4 }}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>1 {es ? "foto adjunta" : "photo attached"}</div>}
            </div>

            <button onClick={handleSubmit} disabled={submitting} className="tap-target" style={{
              width: "100%", marginTop: 20, padding: "16px",
              background: submitting ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #D42A2A, #a11a1a)",
              color: "#fff", border: "none", borderRadius: "var(--radius-lg)",
              fontSize: "16px", fontWeight: 700,
              boxShadow: submitting ? "none" : "0 8px 24px rgba(212,42,42,0.3)",
              opacity: submitting ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "all 0.2s ease",
            }}>
              {!submitting && <AlertTriangleIcon size={16} color="#fff" />}
              {submitting ? (photo ? (es ? "Subiendo foto..." : "Uploading...") : t.sending) : t.submitReport}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
