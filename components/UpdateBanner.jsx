"use client";
import { useState, useEffect } from "react";
import { checkForUpdate, markVersionSeen, APP_VERSION, CHANGELOG } from "@/lib/version";
import { useLanguage } from "@/lib/LanguageContext";

export default function UpdateBanner() {
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showBugfixes, setShowBugfixes] = useState(false);

  useEffect(() => {
    const { isUpdate } = checkForUpdate();
    if (isUpdate) setShow(true);
  }, []);

  const handleDismiss = () => {
    markVersionSeen();
    setShow(false);
    setShowChangelog(false);
    setShowBugfixes(false);
  };

  if (!show) return null;

  const latest = CHANGELOG[0];
  const es = lang === "es";

  if (showChangelog && latest) {
    const bugfixes = latest.bugfixes?.[lang] || latest.bugfixes?.es;

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", animation: "fadeIn 0.2s ease",
      }}>
        <div style={{
          width: "100%", maxWidth: 360, maxHeight: "85vh", overflowY: "auto",
          background: "#0e1628",
          borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 24px", animation: "slideUp 0.3s ease",
        }}>
          <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>✨</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "4px", color: "var(--text)" }}>
            {latest.title[lang] || latest.title.es}
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "center", marginBottom: "20px" }}>
            v{latest.version}
          </div>

          {/* New features */}
          <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "10px" }}>
            {es ? "Novedades" : "What's new"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
            {(latest.items[lang] || latest.items.es).map((item, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "14px", color: "var(--text-secondary)",
                animation: `fadeIn 0.2s ease ${i * 0.04}s both`,
              }}>
                {item}
              </div>
            ))}
          </div>

          {/* Bug fixes — expandable */}
          {bugfixes && bugfixes.length > 0 && (
            <>
              <button onClick={() => setShowBugfixes(!showBugfixes)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 0", background: "none", border: "none",
                borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: showBugfixes ? "10px" : "20px",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: "12px" }}>🐛</span>
                <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: 600, flex: 1, textAlign: "left" }}>
                  {es ? `${bugfixes.length} correcciones` : `${bugfixes.length} bug fixes`}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-faint)", transform: showBugfixes ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>▾</span>
              </button>
              {showBugfixes && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px", animation: "fadeIn 0.2s ease" }}>
                  {bugfixes.map((fix, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", borderRadius: "var(--radius-sm)",
                      fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5,
                      display: "flex", gap: "8px", alignItems: "flex-start",
                    }}>
                      <span style={{ color: "var(--safe)", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                      {fix}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <button onClick={handleDismiss} style={{
            width: "100%", padding: "14px",
            background: "var(--accent)", border: "none",
            borderRadius: "var(--radius-md)", color: "#fff",
            fontSize: "15px", fontWeight: 700, cursor: "pointer",
          }}>
            {es ? "¡Entendido!" : "Got it!"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
      background: "rgba(96,165,250,0.08)", borderBottom: "1px solid rgba(96,165,250,0.15)",
      animation: "fadeIn 0.3s ease", flexShrink: 0,
    }}>
      <span style={{ fontSize: "14px" }}>✨</span>
      <span style={{ flex: 1, fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>
        {`AlertaArroyo v${APP_VERSION} — `}
        <button onClick={() => setShowChangelog(true)} style={{
          background: "none", border: "none", color: "var(--accent)",
          fontSize: "13px", fontWeight: 600, textDecoration: "underline",
          cursor: "pointer", padding: 0,
        }}>
          {es ? "¿Qué hay de nuevo?" : "What's new?"}
        </button>
      </span>
      <button onClick={handleDismiss} style={{
        background: "none", border: "none", cursor: "pointer", padding: "4px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><svg width="10" height="10" viewBox="0 0 10 10" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg></button>
    </div>
  );
}
