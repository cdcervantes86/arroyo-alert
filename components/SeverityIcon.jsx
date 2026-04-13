"use client";

// Danger: water drop with exclamation
export function DangerIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5C12 2.5 5 11 5 15.5C5 19.37 8.13 22.5 12 22.5C15.87 22.5 19 19.37 19 15.5C19 11 12 2.5 12 2.5Z" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="12" x2="12" y2="16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="18.5" r="1" fill="#ef4444" />
    </svg>
  );
}

// Caution: water drop (rising water, not yet dangerous)
export function CautionIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5C12 2.5 5 11 5 15.5C5 19.37 8.13 22.5 12 22.5C15.87 22.5 19 19.37 19 15.5C19 11 12 2.5 12 2.5Z" fill="#eab30815" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 16.5C9.5 14.5 11 13.5 12 13.5" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Safe: checkmark in calm water
export function SafeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#22c55e10" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
      <path d="M8 12.5L11 15.5L16.5 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Inactive: empty circle
export function InactiveIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M8 14C9.5 11.5 14.5 11.5 16 14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SeverityIcon({ severity, size = 20 }) {
  switch (severity) {
    case "danger": return <DangerIcon size={size} />;
    case "caution": return <CautionIcon size={size} />;
    case "safe": return <SafeIcon size={size} />;
    default: return <InactiveIcon size={size} />;
  }
}

// Empty state illustration for zones with no reports
export function EmptyStateIllustration() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0 24px" }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        {/* Calm water */}
        <path d="M10 50 Q20 44 30 50 Q40 56 50 50 Q60 44 70 50" stroke="rgba(34,197,94,0.3)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M15 58 Q25 53 35 58 Q45 63 55 58 Q65 53 70 58" stroke="rgba(34,197,94,0.15)" strokeWidth="2" strokeLinecap="round" />
        {/* Sun */}
        <circle cx="40" cy="25" r="10" fill="rgba(245,208,51,0.08)" stroke="rgba(245,208,51,0.25)" strokeWidth="1.5" />
        <circle cx="40" cy="25" r="5" fill="rgba(245,208,51,0.15)" />
        {/* Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 40 + Math.cos(rad) * 14;
          const y1 = 25 + Math.sin(rad) * 14;
          const x2 = 40 + Math.cos(rad) * 18;
          const y2 = 25 + Math.sin(rad) * 18;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(245,208,51,0.15)" strokeWidth="1.5" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
}

// Success ripple for report submission
export function SuccessRipple() {
  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", top: 0, left: 0 }}>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="60" cy="60" r="20" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1.5"
            style={{ animation: `rippleExpand 2s ease-out ${i * 0.4}s infinite` }} />
        ))}
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
        animation: "successPulse 0.5s ease",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

// Animated counter that rolls numbers
export function AnimatedCount({ value, color = "inherit" }) {
  return (
    <span style={{
      display: "inline-block",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      color,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {value}
    </span>
  );
}
