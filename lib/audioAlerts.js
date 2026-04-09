// Audio alert system using Web Audio API — no external files needed

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== "undefined") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Play a two-tone alert sound (urgent but not annoying)
export function playDangerAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone — high
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone — higher (after brief pause)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1100;
    gain2.gain.setValueAtTime(0.3, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 0.65);

    // Third tone — highest (urgency)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = 1320;
    gain3.gain.setValueAtTime(0.25, now + 0.7);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.7);
    osc3.stop(now + 1.2);
  } catch (e) {
    // Audio not available — fail silently
  }
}

// Softer sound for caution alerts
export function playCautionAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {}
}

// Check if audio alerts are enabled (stored in localStorage)
export function isAudioEnabled() {
  try {
    return localStorage.getItem("arroyo-audio-alerts") !== "off";
  } catch (e) {
    return true;
  }
}

export function setAudioEnabled(enabled) {
  try {
    localStorage.setItem("arroyo-audio-alerts", enabled ? "on" : "off");
  } catch (e) {}
}
