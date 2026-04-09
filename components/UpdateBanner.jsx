"use client";
import { useState, useEffect } from "react";
import { checkForUpdate, markVersionSeen, APP_VERSION, CHANGELOG } from "@/lib/version";
import { useLanguage } from "@/lib/LanguageContext";

export default function UpdateBanner() {
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    const { isUpdate } = checkForUpdate();
    if (isUpdate) setShow(true);
  }, []);

  const handleDismiss = () => {
    markVersionSeen();
    setShow(false);
    setShowChangelog(false);
  };

  const handleShowChangelog = () => {
    setShowChangelog(true);
  };

  if (!show) return null;

  const latest = CHANGELOG[0];
  const es = lang === "es";

  // Changelog modal
  if (showChangelog && latest) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", animation: "fadeIn 0.2s ease",
      }}>
        <div style={{
          width: "100%", maxWidth: 360, background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
          padding: "28px 24px", animation: "slideUp 0.3s ease",
        }}>
          <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>✨</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "4px", color: "var(--text)" }}>
            {latest.title[lang] || latest.title.es}
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "center", marginBottom: "20px" }}>
            v{latest.version}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {(latest.items[lang] || latest.items.es).map((item, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                fontSize: "14px", color: "var(--text-secondary)",
                animation: `fadeIn 0.2s ease ${i * 0.05}s both`,
              }}>
                {item}
              </div>
            ))}
          </div>

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

  // Update banner (small bar at top)
  return (
    <div style={{
      padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
      background: "rgba(96,165,250,0.08)", borderBottom: "1px solid rgba(96,165,250,0.15)",
      animation: "fadeIn 0.3s ease", flexShrink: 0,
    }}>
      <span style={{ fontSize: "14px" }}>✨</span>
      <span style={{ flex: 1, fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>
        {es ? `ArroyoAlerta v${APP_VERSION} — ` : `ArroyoAlerta v${APP_VERSION} — `}
        <button onClick={handleShowChangelog} style={{
          background: "none", border: "none", color: "var(--accent)",
          fontSize: "13px", fontWeight: 600, textDecoration: "underline",
          cursor: "pointer", padding: 0,
        }}>
          {es ? "¿Qué hay de nuevo?" : "What's new?"}
        </button>
      </span>
      <button onClick={handleDismiss} style={{
        background: "none", border: "none", color: "var(--text-dim)",
        fontSize: "16px", cursor: "pointer", padding: "0 4px",
      }}>✕</button>
    </div>
  );
}
