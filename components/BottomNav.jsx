"use client";
import { MapIcon, LiveIcon, MoreIcon, AlertTriangleIcon } from "@/components/Icons";

export default function BottomNav({ activeTab, onTab, onReport, liveCount, dangerCount, lang, isLowEnd }) {
  const es = lang === "es";
  const tabs = [
    { key: "map", Icon: MapIcon, label: es ? "Mapa" : "Map", badge: dangerCount },
    { key: "live", Icon: LiveIcon, label: es ? "En vivo" : "Live", badge: liveCount },
    { key: "more", Icon: MoreIcon, label: es ? "Más" : "More" },
  ];

  const glassBg = isLowEnd ? "rgba(10,14,26,0.94)" : "rgba(10,14,26,0.72)";
  const glassBlur = isLowEnd ? "none" : "blur(24px) saturate(1.6)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* Primary action — wide Reportar button sits above the tab bar */}
      <div style={{ padding: "0 12px 10px", pointerEvents: "none" }}>
        <button
          onClick={onReport}
          className="tap-target"
          aria-label={es ? "Reportar arroyo" : "Report flood"}
          style={{
            width: "100%",
            maxWidth: 420,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "15px 16px",
            borderRadius: "16px",
            background: "#D42A2A",
            border: "0.5px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            boxShadow: "0 8px 24px rgba(212,42,42,0.22)",
            pointerEvents: "auto",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <AlertTriangleIcon size={20} color="#fff" />
          <span>{es ? "Reportar arroyo" : "Report flood"}</span>
        </button>
      </div>

      {/* Liquid-glass tab bar — 3 equal tabs, symmetric, no pill chrome */}
      <div
        className="bottom-nav"
        role="navigation"
        aria-label={es ? "Navegación principal" : "Main navigation"}
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
          background: glassBg,
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          borderTop: "0.5px solid rgba(255,255,255,0.08)",
          pointerEvents: "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const tint = isActive ? "#5B9CF6" : "rgba(255,255,255,0.5)";
          return (
            <button
              key={tab.key}
              onClick={() => onTab(tab.key)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                background: "none",
                border: "none",
                padding: "4px 16px",
                color: tint,
                cursor: "pointer",
                transition: "color 0.15s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <tab.Icon size={22} color={tint} active={isActive} />
                {tab.badge > 0 && !isActive && (tab.key === "map" ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -10,
                      minWidth: 16,
                      height: 16,
                      borderRadius: "8px",
                      background: "var(--danger)",
                      border: "1.5px solid rgba(10,15,26,0.9)",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      right: -2,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--danger)",
                      border: "1.5px solid rgba(10,15,26,0.9)",
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.1px",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
