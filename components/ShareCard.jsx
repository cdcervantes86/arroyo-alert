"use client";
import { useRef, useCallback, useState, useEffect } from "react";
import { SEVERITY } from "@/lib/zones";

export default function ShareCard({ zoneName, zoneArea, severity, reportText, photoUrl, zoneId, onClose, lang }) {
  const canvasRef = useRef(null);
  const [photoLoaded, setPhotoLoaded] = useState(null);
  const appUrl = "arroyo-alert.vercel.app";
  const es = lang !== "en";

  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setPhotoLoaded(img);
    img.onerror = () => setPhotoLoaded(null);
    img.src = photoUrl;
  }, [photoUrl]);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = 600;
    const hasText = reportText && reportText.trim();
    // Compact when no text, taller when there's text + photo corner
    const h = hasText ? (photoLoaded ? 480 : 340) : 260;
    canvas.width = w;
    canvas.height = h;

    const sevColors = { danger: "#DC2626", caution: "#D97706", safe: "#16A34A" };
    const sevLabels = es
      ? { danger: "\u26A0\uFE0F PELIGROSO", caution: "\u26A1 PRECAUCI\u00D3N", safe: "\u2705 DESPEJADO" }
      : { danger: "\u26A0\uFE0F DANGEROUS", caution: "\u26A1 CAUTION", safe: "\u2705 CLEAR" };
    const col = sevColors[severity];

    // === NO TEXT MODE: photo as subtle full background ===
    if (!hasText && photoLoaded) {
      // Draw photo covering entire canvas
      const imgR = photoLoaded.width / photoLoaded.height;
      const boxR = w / h;
      let sx = 0, sy = 0, sw = photoLoaded.width, sh = photoLoaded.height;
      if (imgR > boxR) { sw = photoLoaded.height * boxR; sx = (photoLoaded.width - sw) / 2; }
      else { sh = photoLoaded.width / boxR; sy = (photoLoaded.height - sh) / 2; }
      ctx.drawImage(photoLoaded, sx, sy, sw, sh, 0, 0, w, h);

      // Heavy dark gradient overlay — photo becomes atmosphere, not focal point
      const darkOverlay = ctx.createLinearGradient(0, 0, 0, h);
      darkOverlay.addColorStop(0, "rgba(8,13,24,0.75)");
      darkOverlay.addColorStop(0.4, "rgba(8,13,24,0.82)");
      darkOverlay.addColorStop(1, "rgba(8,13,24,0.92)");
      ctx.fillStyle = darkOverlay;
      ctx.fillRect(0, 0, w, h);

      // Extra darken from left for text readability
      const leftDark = ctx.createLinearGradient(0, 0, w * 0.6, 0);
      leftDark.addColorStop(0, "rgba(8,13,24,0.4)");
      leftDark.addColorStop(1, "rgba(8,13,24,0)");
      ctx.fillStyle = leftDark;
      ctx.fillRect(0, 0, w, h);
    } else if (!hasText) {
      // No text, no photo — plain background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0a1628");
      bg.addColorStop(1, "#080d18");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Has text — standard background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0a1628");
      bg.addColorStop(1, "#080d18");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Photo in corner when there's text
      if (photoLoaded) {
        ctx.save();
        const photoX = w - 240, photoY = 16, photoW = 224, photoH = 180, r = 16;
        ctx.beginPath();
        ctx.moveTo(photoX + r, photoY);
        ctx.lineTo(photoX + photoW - r, photoY);
        ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + r);
        ctx.lineTo(photoX + photoW, photoY + photoH - r);
        ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - r, photoY + photoH);
        ctx.lineTo(photoX + r, photoY + photoH);
        ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - r);
        ctx.lineTo(photoX, photoY + r);
        ctx.quadraticCurveTo(photoX, photoY, photoX + r, photoY);
        ctx.closePath();
        ctx.clip();

        const imgR = photoLoaded.width / photoLoaded.height;
        const boxR = photoW / photoH;
        let sx = 0, sy = 0, sw = photoLoaded.width, sh = photoLoaded.height;
        if (imgR > boxR) { sw = photoLoaded.height * boxR; sx = (photoLoaded.width - sw) / 2; }
        else { sh = photoLoaded.width / boxR; sy = (photoLoaded.height - sh) / 2; }
        ctx.drawImage(photoLoaded, sx, sy, sw, sh, photoX, photoY, photoW, photoH);

        const ov = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
        ov.addColorStop(0, "rgba(10,22,40,0)");
        ov.addColorStop(0.7, "rgba(10,22,40,0)");
        ov.addColorStop(1, "rgba(10,22,40,0.6)");
        ctx.fillStyle = ov;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        const lf = ctx.createLinearGradient(photoX, photoY, photoX + 60, photoY);
        lf.addColorStop(0, "rgba(10,22,40,0.7)");
        lf.addColorStop(1, "rgba(10,22,40,0)");
        ctx.fillStyle = lf;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Top accent bar
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, 4);

    // Severity
    ctx.font = "bold 24px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = col;
    ctx.fillText(sevLabels[severity], 32, 48);

    // Zone name
    ctx.font = "bold 36px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#f0f2f5";
    ctx.fillText(zoneName, 32, 100);

    // Area
    ctx.font = "400 20px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(zoneArea, 32, 133);

    // Report text (only when present)
    if (hasText) {
      ctx.font = "400 18px 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      const textMaxW = photoLoaded ? 310 : w - 64;
      const words = reportText.split(" ");
      let line = "";
      let y = photoLoaded ? 220 : 180;
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > textMaxW && line) {
          ctx.fillText(line.trim(), 32, y);
          line = word + " ";
          y += 26;
          if (y > (photoLoaded ? 290 : 230)) break;
        } else { line = testLine; }
      }
      if (line.trim()) ctx.fillText(line.trim(), 32, y);
    }

    // Bottom section
    const bottomY = h - 65;

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, bottomY);
    ctx.lineTo(w - 32, bottomY);
    ctx.stroke();

    // Barranquilla waves
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.3;
    const wY = bottomY + 18;
    ctx.strokeStyle = "#D42A2A";
    ctx.beginPath(); ctx.moveTo(32, wY); ctx.quadraticCurveTo(80, wY - 12, 130, wY); ctx.quadraticCurveTo(180, wY + 12, 220, wY); ctx.stroke();
    ctx.strokeStyle = "#F5D033";
    ctx.beginPath(); ctx.moveTo(32, wY + 10); ctx.quadraticCurveTo(80, wY - 2, 130, wY + 10); ctx.quadraticCurveTo(180, wY + 22, 220, wY + 10); ctx.stroke();
    ctx.strokeStyle = "#2d8a2d";
    ctx.beginPath(); ctx.moveTo(32, wY + 20); ctx.quadraticCurveTo(80, wY + 8, 130, wY + 20); ctx.quadraticCurveTo(180, wY + 32, 220, wY + 20); ctx.stroke();
    ctx.globalAlpha = 1;

    // App name
    ctx.font = "bold 16px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#f0f2f5";
    ctx.textAlign = "right";
    ctx.fillText("AlertaArroyo", w - 32, bottomY + 24);

    // URL
    ctx.font = "500 14px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "rgba(91,156,246,0.8)";
    ctx.fillText(appUrl, w - 32, bottomY + 46);

    ctx.textAlign = "left";
    return canvas;
  }, [zoneName, zoneArea, severity, reportText, photoLoaded]);

  useEffect(() => {
    if (canvasRef.current) setTimeout(generateImage, 50);
  }, [photoLoaded, generateImage]);

  const handleShare = async () => {
    const canvas = generateImage();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const sevLabels = es
        ? { danger: "PELIGROSO", caution: "Precauci\u00F3n", safe: "Despejado" }
        : { danger: "DANGEROUS", caution: "Caution", safe: "Clear" };
      const text = es
        ? `\u26A0\uFE0F Arroyo ${sevLabels[severity]} en ${zoneName} (${zoneArea})\n${reportText ? reportText + "\n" : ""}\uD83D\uDCCD AlertaArroyo \u2014 https://${appUrl}`
        : `\u26A0\uFE0F Arroyo ${sevLabels[severity]} at ${zoneName} (${zoneArea})\n${reportText ? reportText + "\n" : ""}\uD83D\uDCCD AlertaArroyo \u2014 https://${appUrl}`;
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "alerta-arroyo.png", { type: "image/png" });
        try { await navigator.share({ text, files: [file] }); onClose?.(); return; } catch (e) {}
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      onClose?.();
    }, "image/png");
  };

  const handleDownload = () => {
    const canvas = generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `alerta-${zoneName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const previewRef = useCallback((node) => {
    if (node) { canvasRef.current = node; setTimeout(generateImage, 50); }
  }, [generateImage]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
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

        {photoUrl && !photoLoaded && (
          <div style={{ textAlign: "center", padding: "8px", fontSize: "11px", color: "var(--text-faint)" }}>
            Cargando foto...
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button onClick={handleShare} style={{
            flex: 1, padding: "14px", borderRadius: "12px",
            background: "#25D366", border: "none", color: "#fff",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            {es ? "Compartir" : "Share"}
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
          {es ? "Cerrar" : "Close"}
        </button>
      </div>
    </div>
  );
}
