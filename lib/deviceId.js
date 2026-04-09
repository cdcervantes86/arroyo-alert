// Anonymous device ID for reputation tracking — no login needed
// Uses localStorage with a random UUID

export function getDeviceId() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem("arroyo-device-id");
    if (!id) {
      id = "dev_" + crypto.randomUUID();
      localStorage.setItem("arroyo-device-id", id);
    }
    return id;
  } catch (e) {
    return null;
  }
}

// Get reporter stats from localStorage cache
export function getReporterStats() {
  try {
    const raw = localStorage.getItem("arroyo-reporter-stats");
    return raw ? JSON.parse(raw) : { reportCount: 0, upvotesReceived: 0, verified: false };
  } catch (e) {
    return { reportCount: 0, upvotesReceived: 0, verified: false };
  }
}

// Update local stats after submitting a report
export function incrementReportCount() {
  try {
    const stats = getReporterStats();
    stats.reportCount += 1;
    // Verified after 5+ reports
    if (stats.reportCount >= 5) stats.verified = true;
    localStorage.setItem("arroyo-reporter-stats", JSON.stringify(stats));
    return stats;
  } catch (e) {
    return { reportCount: 1, upvotesReceived: 0, verified: false };
  }
}

// Track upvotes received on your reports
export function incrementUpvotesReceived() {
  try {
    const stats = getReporterStats();
    stats.upvotesReceived += 1;
    localStorage.setItem("arroyo-reporter-stats", JSON.stringify(stats));
    return stats;
  } catch (e) {
    return { reportCount: 0, upvotesReceived: 1, verified: false };
  }
}
