"use client";
import { useState, useRef, useCallback } from "react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStart = useRef(null);
  const containerRef = useRef(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      touchStart.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStart.current === null || refreshing) return;
    const delta = e.touches[0].clientY - touchStart.current;
    if (delta > 0) {
      // Rubber-band effect: diminishing returns as you pull further
      const dampened = Math.min(delta * 0.45, 130);
      setPullY(dampened);
      if (dampened > 10) e.preventDefault();
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= threshold && !refreshing) {
      setRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(30);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    touchStart.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / threshold, 1);
  const pastThreshold = pullY >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative" }}
    >
      {/* Pull indicator */}
      <div style={{
        height: pullY > 5 || refreshing ? 60 : 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        transition: pullY > 0 ? "none" : "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        {refreshing ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="9" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 500 }}>Actualizando...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            {/* Water wave animation */}
            <svg width="40" height="20" viewBox="0 0 40 20" style={{
              opacity: progress,
              transform: `scale(${0.5 + progress * 0.5})`,
              transition: pullY > 0 ? "none" : "all 0.3s ease",
            }}>
              <path
                d={`M0 15 Q10 ${15 - progress * 10} 20 15 Q30 ${15 + progress * 10} 40 15`}
                fill="none" stroke={pastThreshold ? "var(--accent)" : "var(--text-faint)"}
                strokeWidth="2.5" strokeLinecap="round"
              />
              <path
                d={`M5 10 Q15 ${10 - progress * 8} 25 10 Q35 ${10 + progress * 8} 40 10`}
                fill="none" stroke={pastThreshold ? "var(--accent)" : "var(--text-faint)"}
                strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
              />
            </svg>
            <span style={{
              fontSize: "10px", fontWeight: 600,
              color: pastThreshold ? "var(--accent)" : "var(--text-faint)",
              transition: "color 0.15s ease",
            }}>
              {pastThreshold ? "Soltar para actualizar" : "Jalar para actualizar"}
            </span>
          </div>
        )}
      </div>

      {/* Content with pull transform */}
      <div style={{
        transform: pullY > 5 ? `translateY(${Math.max(0, pullY - 5) * 0.3}px)` : "none",
        transition: pullY > 0 ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        {children}
      </div>
    </div>
  );
}
