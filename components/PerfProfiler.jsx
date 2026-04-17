"use client";
import { useEffect, useState } from "react";

// Upgraded performance profiler — shows:
// - Device info
// - Overall timings (DOM ready, load event)
// - performance.mark() waypoints with durations between them
// - Long tasks with timestamps so we can see WHEN they fire
// - FPS during first 5 seconds
// Activates only when ?profile=1 is in the URL.

export default function PerfProfiler() {
  const [enabled, setEnabled] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("profile") === "1") setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const longTasks = [];
    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push({
            startMs: Math.round(entry.startTime),
            durMs: Math.round(entry.duration),
          });
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // not supported
    }

    let fpsFrames = 0;
    const fpsStart = performance.now();
    const fpsDurationMs = 20000;

    function countFrame() {
      fpsFrames++;
      if (performance.now() - fpsStart < fpsDurationMs) {
        requestAnimationFrame(countFrame);
      } else {
        finish();
      }
    }

    function finish() {
      const nav = performance.getEntriesByType("navigation")[0];
      const blurEls = Array.from(document.querySelectorAll("*")).filter((el) => {
        const s = getComputedStyle(el);
        return s.backdropFilter && s.backdropFilter !== "none";
      });

      // Read all performance marks and sort by time
      const marks = performance.getEntriesByType("mark").map((m) => ({
        name: m.name,
        atMs: Math.round(m.startTime),
      })).sort((a, b) => a.atMs - b.atMs);

      // Compute gap durations between consecutive marks
      const gaps = [];
      for (let i = 1; i < marks.length; i++) {
        gaps.push({
          from: marks[i - 1].name,
          to: marks[i].name,
          gapMs: marks[i].atMs - marks[i - 1].atMs,
        });
      }

      setResults({
        device: {
          userAgent: navigator.userAgent,
          deviceMemoryGB: navigator.deviceMemory || "unknown",
          cpuCores: navigator.hardwareConcurrency || "unknown",
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          devicePixelRatio: window.devicePixelRatio,
        },
        load: {
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : "unknown",
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : "unknown",
        },
        longTasks: {
          count: longTasks.length,
          items: longTasks,
          totalBlockedMs: longTasks.reduce((a, b) => a + b.durMs, 0),
        },
        marks,
        gaps,
        render: {
          fps: Math.round(fpsFrames / (fpsDurationMs / 1000)),
          backdropBlurElements: blurEls.length,
          totalDomNodes: document.querySelectorAll("*").length,
        },
      });

      if (observer) {
        try { observer.disconnect(); } catch (e) {}
      }
    }

    requestAnimationFrame(countFrame);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.96)",
        color: "#0f0",
        padding: "12px 14px",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: "11px",
        lineHeight: 1.5,
        maxHeight: "75vh",
        overflowY: "auto",
        borderBottom: "2px solid #0f0",
      }}
    >
      <div style={{ color: "#ff0", fontWeight: "bold", marginBottom: 6 }}>
        PERF PROFILER v2 — measuring for 5 seconds
      </div>
      {!results && <div>Measuring...</div>}
      {results && (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
{JSON.stringify(results, null, 2)}
        </pre>
      )}
      <div style={{ color: "#888", marginTop: 8, fontSize: "10px" }}>
        Remove ?profile=1 from URL to hide this panel.
      </div>
    </div>
  );
}
