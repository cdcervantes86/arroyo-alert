"use client";

import { useState, useEffect, useMemo } from "react";

// Detect if device is low-end
function detectPerformanceLevel() {
  // Check for low memory (RAM)
  const memory = navigator.deviceMemory;
  if (memory && memory < 4) return "low";
  
  // Check for low CPU cores
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) return "low";
  
  // Check if mobile/tablet
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for older iOS
  const iOSMatch = navigator.userAgent.match(/OS (\d+)_/);
  if (iOSMatch && parseInt(iOSMatch[1]) < 15) return "low";
  
  // Check for older Android
  const androidMatch = navigator.userAgent.match(/Android (\d+)/);
  if (androidMatch && parseInt(androidMatch[1]) < 10) return "low";
  
  // Check for iPad (often lower performance than phones)
  const isiPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isiPad && memory && memory < 6) return "medium";
  
  // Default to high for modern devices
  return "high";
}

// Check if WebGL is supported (for Mapbox)
function isWebGLSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export function usePerformanceMode() {
  const [performanceLevel, setPerformanceLevel] = useState("high");
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Detect on mount
    const level = detectPerformanceLevel();
    const webgl = isWebGLSupported();
    
    setPerformanceLevel(level);
    setWebGLSupported(webgl);
    setIsReady(true);
    
    // Log for debugging
    console.log(`[Performance] Level: ${level}, WebGL: ${webgl}`);
  }, []);
  
  const isLowEnd = performanceLevel === "low";
  const isMedium = performanceLevel === "medium";
  const isHigh = performanceLevel === "high";
  
  // Memoized style presets
  const styles = useMemo(() => ({
    // Glass panel styles
    glass: {
      background: isLowEnd ? "rgba(14,20,36,0.95)" : isMedium ? "rgba(12,18,32,0.75)" : "rgba(12,18,32,0.65)",
      backdropFilter: isLowEnd ? "none" : isMedium ? "blur(12px) saturate(1.3)" : "blur(24px) saturate(1.6)",
      WebkitBackdropFilter: isLowEnd ? "none" : isMedium ? "blur(12px) saturate(1.3)" : "blur(24px) saturate(1.6)",
      border: isLowEnd ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.1)",
      boxShadow: isLowEnd ? "0 2px 12px rgba(0,0,0,0.3)" : isMedium ? "0 4px 24px rgba(0,0,0,0.35)" : "0 8px 40px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06)",
    },
    
    // Nav pill styles
    nav: {
      background: isLowEnd ? "rgba(14,20,36,0.95)" : "linear-gradient(180deg, rgba(14,18,30,0.18) 0%, rgba(8,12,22,0.22) 100%)",
      backdropFilter: isLowEnd ? "none" : "blur(16px) saturate(1.8)",
      WebkitBackdropFilter: isLowEnd ? "none" : "blur(16px) saturate(1.8)",
    },
    
    // Animation preferences
    animations: {
      enabled: !isLowEnd,
      duration: isLowEnd ? "0.1s" : isMedium ? "0.2s" : "0.3s",
    },
    
    // Map preferences
    map: {
      useWebGL: webGLSupported && !isLowEnd,
      simplifyMarkers: isLowEnd,
      reduceUpdates: isLowEnd,
    },
    
    // Real-time updates
    realtime: {
      throttleMs: isLowEnd ? 5000 : isMedium ? 2000 : 1000,
    },
  }), [isLowEnd, isMedium, webGLSupported]);
  
  return {
    performanceLevel,
    isLowEnd,
    isMedium,
    isHigh,
    webGLSupported,
    isReady,
    styles,
  };
}

export default usePerformanceMode;
