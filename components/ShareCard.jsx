"use client";
import { useRef, useCallback } from "react";
import { SEVERITY } from "@/lib/zones";

export default function ShareCard({ zoneName, zoneArea, severity, reportText, onClose }) {
  const canvasRef = useRef(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = 600, h = 340;
    canvas.width = w;
    canvas.height = h;

    const sev = SEVERITY[severity];
    const sevColors = { danger: "#DC2626", caution: "#D97706", safe: "#16A34A" };
    const sevLabels = { danger: "⚠️ PELIGROSO", caution: "⚡ PRECAUCIÓN", safe: "✅ DESPEJADO" };
    const col = sevColors[severity];

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#0a1628");
    bg.addColorStop(1, "#080d18");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Top color accent bar
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, 4);

    // Severity label
    ctx.font = "bold 28px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = col;
    ctx.fillText(sevLabels[severity], 32, 52);

    // Zone name
    ctx.font = "bold 36px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#f0f2f5";
    ctx.fillText(zoneName, 32, 105);

    // Zone area
    ctx.font = "400 20px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(zoneArea, 32, 138);

    // Report text (if any)
    if (reportText) {
      ctx.font = "400 18px 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      // Wrap text
      const maxWidth = w - 64;
      const words = reportText.split(" ");
      let line = "";
      let y = 180;
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line.trim(), 32, y);
          line = word + " ";
          y += 26;
          if (y > 230) break;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), 32, y);
    }

    // Divider line
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 265);
    ctx.lineTo(w - 32, 265);
    ctx.stroke();

    // Barranquilla wave decoration
    ctx.strokeStyle = "#D42A2A";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(32, 290);
    ctx.quadraticCurveTo(80, 275, 130, 290);
    ctx.quadraticCurveTo(180, 305, 230, 290);
    ctx.stroke();
    ctx.strokeStyle = "#F5D033";
    ctx.beginPath();
    ctx.moveTo(32, 302);
    ctx.quadraticCurveTo(80, 287, 130, 302);
    ctx.quadraticCurveTo(180, 317, 230, 302);
    ctx.stroke();
    ctx.strokeStyle = "#2d8a2d";
    ctx.beginPath();
    ctx.moveTo(32, 314);
    ctx.quadraticCurveTo(80, 299, 130, 314);
    ctx.quadraticCurveTo(180, 329, 230, 314);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // App name + URL
    ctx.font = "bold 16px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#f0f2f5";
    ctx.textAlign = "right";
    ctx.fillText("AlertaArroyo", w - 32, 295);
    ctx.font = "400 13px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("arroyo-alert.vercel.app", w - 32, 318);
    ctx.textAlign = "left";

    return canvas;
  }, [zoneName, zoneArea, severity, reportText]);

  const handleShare = async () => {
    const canvas = generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const sevLabels = { danger: "PELIGROSO", caution: "Precaución", safe: "Despejado" };
      const text = `⚠️ Arroyo ${sevLabels[severity]} en ${zoneName} (${zoneArea})\n${reportText ? reportText + "\n" : ""}📍 AlertaArroyo — arroyo-alert.vercel.app`;

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "arroyo-alerta.png", { type: "image/png" });
        try {
          await navigator.share({ text, files: [file] });
          onClose?.();
          return;
        } catch (e) {
          // User cancelled or share failed — fall through to WhatsApp
        }
      }

      // Fallback: WhatsApp text share
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      onClose?.();
    }, "image/png");
  };

  const handleDownload = () => {
    const canvas = generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `arroyo-${zoneName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Generate preview on mount
  const previewRef = useCallback((node) => {
    if (node) {
      canvasRef.current = node;
      setTimeout(generateImage, 50);
    }
  }, [generateImage]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <canvas ref={previewRef} style={{
          width: "100%", height: "auto", borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }} />

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button onClick={handleShare} style={{
            flex: 1, padding: "14px", borderRadius: "12px",
            background: "#25D366", border: "none", color: "#fff",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            Compartir
          </button>
          <button onClick={handleDownload} style={{
            padding: "14px 20px", borderRadius: "12px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            💾
          </button>
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: "10px", padding: "12px",
          background: "none", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", color: "var(--text-dim)",
          fontSize: "13px", cursor: "pointer",
        }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
