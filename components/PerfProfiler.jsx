"use client";
import { useEffect, useState } from "react";

// Temporary performance profiler. Only activates when ?profile=1 is in the URL.
// Shows a panel at the top of the screen with timing + device info so we can
// diagnose slowness on older/tablet devices without needing USB debugging.
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
          longTasks.push(Math.round(entry.duration));
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // longtask API not supported on some older browsers
    }

    let fpsFrames = 0;
    const fpsStart = performance.now();
    const fpsDurationMs = 3000;

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

      setResults({
        userAgent: navigator.userAgent,
        deviceMemoryGB: navigator.deviceMemory || "unknown",
        cpuCores: navigator.hardwareConcurrency || "unknown",
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : "unknown",
        loadEventMs: nav ? Math.round(nav.loadEventEnd) : "unknown",
        fps: Math.round(fpsFrames / (fpsDurationMs / 1000)),
        longTasksCount: longTasks.length,
        longTasksMaxMs: longTasks.length ? Math.max(...longTasks) : 0,
        longTasksSumMs: longTasks.reduce((a, b) => a + b, 0),
        backdropBlurElements: blurEls.length,
        totalDomNodes: document.querySelectorAll("*").length,
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
        background: "rgba(0,0,0,0.95)",
        color: "#0f0",
        padding: "12px 14px",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: "11px",
        lineHeight: 1.5,
        maxHeight: "60vh",
        overflowY: "auto",
        borderBottom: "2px solid #0f0",
      }}
    >
      <div style={{ color: "#ff0", fontWeight: "bold", marginBottom: 6 }}>
        PERF PROFILER — SCREENSHOT THIS
      </div>
      {!results && <div>Measuring... (3 seconds)</div>}
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
