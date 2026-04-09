"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import { useLanguage } from "@/lib/LanguageContext";

function timeAgoShort(dateStr) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function CommentThread({ reportId, allDeviceCounts }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);

  // Fetch count on mount (lightweight)
  useEffect(() => {
    const fetchCount = async () => {
      const { count: c } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("report_id", reportId);
      setCount(c || 0);
    };
    fetchCount();
  }, [reportId]);

  // Fetch full comments when expanded
  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data);
      setCount(data.length);
    }
    setLoaded(true);
  }, [reportId]);

  useEffect(() => {
    if (!expanded) return;
    fetchComments();

    // Real-time subscription for this thread
    const channel = supabase
      .channel(`comments-${reportId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `report_id=eq.${reportId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new]);
          setCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [expanded, reportId, fetchComments]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const deviceId = getDeviceId();
    await supabase.from("comments").insert({
      report_id: reportId,
      device_id: deviceId,
      text: trimmed,
    });

    setText("");
    setSubmitting(false);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Toggle button */}
      <button onClick={handleToggle} style={{
        background: expanded ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)", padding: "5px 10px",
        color: expanded ? "var(--accent)" : "var(--text-dim)",
        fontSize: "11px", display: "flex", alignItems: "center", gap: "5px",
        fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease",
      }}>
        💬 {count > 0 ? count : ""} {count === 0 && !expanded ? (es ? "" : "") : ""}
      </button>

      {/* Expanded thread */}
      {expanded && (
        <div style={{
          marginTop: "10px", paddingTop: "10px",
          borderTop: "1px solid var(--border)",
          animation: "fadeIn 0.2s ease",
        }}>
          {/* Comments list */}
          {!loaded && (
            <div style={{ fontSize: "12px", color: "var(--text-faint)", padding: "8px 0" }}>
              {es ? "Cargando..." : "Loading..."}
            </div>
          )}

          {loaded && comments.length === 0 && (
            <div style={{ fontSize: "12px", color: "var(--text-faint)", padding: "8px 0", fontStyle: "italic" }}>
              {es ? "Sin comentarios aún — sé el primero" : "No comments yet — be the first"}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: comments.length > 0 ? "12px" : "0" }}>
            {comments.map((c, i) => {
              const isVerified = c.device_id && (allDeviceCounts?.[c.device_id] || 0) >= 5;
              const isOwn = c.device_id === getDeviceId();
              return (
                <div key={c.id} style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: isOwn ? "var(--accent-glow)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isOwn ? "rgba(96,165,250,0.2)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", color: isOwn ? "var(--accent)" : "var(--text-faint)",
                    fontWeight: 700,
                  }}>
                    {isVerified ? "✓" : "·"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      {isVerified && (
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 5px", borderRadius: "3px", border: "1px solid rgba(96,165,250,0.15)" }}>✓</span>
                      )}
                      {isOwn && (
                        <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-dim)" }}>{es ? "Tú" : "You"}</span>
                      )}
                      <span style={{ fontSize: "10px", color: "var(--text-faint)" }}>{timeAgoShort(c.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.45, color: "var(--text-secondary)", wordBreak: "break-word" }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div style={{
            display: "flex", gap: "8px", alignItems: "flex-end",
            marginTop: "8px",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={es ? "Escribe un comentario..." : "Write a comment..."}
              maxLength={280}
              style={{
                flex: 1, padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-light)",
                borderRadius: "20px", color: "var(--text)",
                fontSize: "13px", outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: text.trim() ? "var(--accent)" : "rgba(255,255,255,0.04)",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s ease",
                opacity: text.trim() ? 1 : 0.4,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
