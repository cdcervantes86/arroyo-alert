"use client";
import { useState, useEffect, useRef } from "react";
import { getZoneImage, hasZoneImages } from "@/lib/zoneImages";

/**
 * ZoneHero — contextual hero image for zone detail sheet
 * 
 * Displays a time-of-day + severity-aware background image
 * with gradient overlay. Transitions smoothly between states.
 * 
 * Usage in zone detail:
 *   <ZoneHero zoneName={zone.name} severity={currentSeverity} />
 */
export default function ZoneHero({ zoneName, severity, height = 180 }) {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!hasZoneImages(zoneName)) {
      setCurrentSrc(null);
      return;
    }

    const newSrc = getZoneImage(zoneName, severity);
    if (newSrc === currentSrc) return;

    // Keep previous image visible during crossfade
    if (currentSrc && loaded) {
      setPrevSrc(currentSrc);
    }

    setLoaded(false);
    setCurrentSrc(newSrc);

    // Preload the image
    const img = new Image();
    img.onload = () => {
      setLoaded(true);
      // Clear previous image after transition
      setTimeout(() => setPrevSrc(null), 600);
    };
    img.src = newSrc;
  }, [zoneName, severity]);

  if (!currentSrc && !hasZoneImages(zoneName)) return null;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: `${height}px`,
      overflow: "hidden",
      borderRadius: "0 0 16px 16px",
      marginBottom: "12px",
      flexShrink: 0,
    }}>
      {/* Previous image (for crossfade) */}
      {prevSrc && (
        <img
          src={prevSrc}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
        />
      )}

      {/* Current image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={`${zoneName} — vista actual`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
      )}

      {/* Gradient overlay — bottom fade for text readability */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(7,11,20,0) 30%, rgba(7,11,20,0.4) 65%, rgba(7,11,20,0.85) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top edge fade into sheet background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "20px",
        background: "linear-gradient(to bottom, var(--bg-elevated, #0d1321) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Loading shimmer */}
      {!loaded && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(110deg, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 60%)",
          backgroundSize: "200% 100%",
          animation: "heroShimmer 1.5s ease infinite",
        }} />
      )}

      <style>{`
        @keyframes heroShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
