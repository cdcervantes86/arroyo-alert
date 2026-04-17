"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/deviceId";
import { useLanguage } from "@/lib/LanguageContext";

function timeAgoShort(dateStr) {
  const m = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
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
  const threadRef = useRef(null);

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

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (data) { setComments(data); setCount(data.length); }
    setLoaded(true);
  }, [reportId]);

  useEffect(() => {
    if (!expanded) return;
    fetchComments();
    setTimeout(() => { threadRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 100);
    const channel = supabase
      .channel(`comments-${reportId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `report_id=eq.${reportId}` },
        (payload) => { setComments((prev) => [...prev, payload.new]); setCount((c) => c + 1); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [expanded, reportId, fetchComments]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    // Get the authenticated user (anonymous, from AuthProvider)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user — cannot submit comment");
      setSubmitting(false);
      return;
    }

    await supabase.from("comments").insert({
      report_id: reportId,
      device_id: getDeviceId(),
      text: trimmed,
      user_id: user.id,
    });
    setText(""); setSubmitting(false);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleToggle = (e) => { e.stopPropagation(); setExpanded((prev) => !prev); };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  const handleInputFocus = () => { setTimeout(() => { inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 350); };

  return (
    <div onClick={(e) => e.stopPropagation()} ref={threadRef}>
      {/* Toggle — pill button with count */}
      <button onClick={handleToggle} className="tap-target" style={{
        background: expanded ? "rgba(91,156,246,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "99px", padding: "7px 14px",
        color: expanded ? "var(--accent)" : "var(--text-dim)",
        fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px",
        fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease",
        boxShadow: expanded ? "inset 0 1px 0 rgba(91,156,246,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill={expanded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {count > 0
          ? `${count} ${count === 1 ? (es ? "comentario" : "comment") : (es ? "comentarios" : "comments")}`
          : (es ? "Comentar" : "Comment")
        }
      </button>

      {/* Thread */}
      {expanded && (
        <div style={{
          marginTop: "12px", background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px",
          padding: "14px", animation: "fadeIn 0.2s ease",
        }}>
          {!loaded && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
              <div className="skeleton" style={{ width: 26, height: 26, borderRadius: "50%" }} />
              <div className="skeleton" style={{ width: "55%", height: 11, borderRadius: 6 }} />
            </div>
          )}

          {loaded && comments.length === 0 && (
            <div style={{ padding: "4px 0 8px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--text-faint)", margin: 0, opacity: 0.6 }}>
                {es ? "Sé el primero en comentar" : "Be the first to comment"}
              </p>
            </div>
          )}

          {comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {comments.map((c, i) => {
                const isVerified = c.device_id && (allDeviceCounts?.[c.device_id] || 0) >= 5;
                const isOwn = c.device_id === getDeviceId();
                return (
                  <div key={c.id} style={{
                    display: "flex", gap: "8px", alignItems: "flex-start",
                    flexDirection: isOwn ? "row-reverse" : "row",
                    animation: `fadeIn 0.15s ease ${i * 0.03}s both`,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: isOwn ? "rgba(91,156,246,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isOwn ? "rgba(91,156,246,0.2)" : "rgba(255,255,255,0.06)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isVerified
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isOwn ? "var(--accent)" : "var(--text-faint)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 00-16 0"/></svg>
                      }
                    </div>
                    <div style={{ maxWidth: "80%", minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: "13px", lineHeight: 1.45, color: isOwn ? "#e8f0fe" : "var(--text-secondary)",
                        wordBreak: "break-word",
                        background: isOwn ? "rgba(91,156,246,0.12)" : "rgba(255,255,255,0.04)",
                        padding: "8px 12px",
                        borderRadius: isOwn ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                        border: `1px solid ${isOwn ? "rgba(91,156,246,0.15)" : "rgba(255,255,255,0.06)"}`,
                      }}>{c.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px", justifyContent: isOwn ? "flex-end" : "flex-start", padding: "0 4px" }}>
                        {isOwn && <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 500 }}>{es ? "Tú" : "You"}</span>}
                        {isVerified && !isOwn && <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--accent)", background: "rgba(91,156,246,0.08)", padding: "1px 5px", borderRadius: "99px", border: "1px solid rgba(91,156,246,0.12)" }}>{es ? "Verificado" : "Verified"}</span>}
                        <span style={{ fontSize: "10px", color: "var(--text-faint)", opacity: 0.6 }}>{timeAgoShort(c.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleInputFocus}
              placeholder={es ? "Escribe un comentario..." : "Write a comment..."} maxLength={280}
              style={{
                flex: 1, padding: "9px 14px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "99px",
                color: "var(--text)", fontSize: "13px", outline: "none", fontFamily: "inherit",
                transition: "border-color 0.2s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}
              onFocusCapture={(e) => { e.target.style.borderColor = "rgba(91,156,246,0.3)"; }}
              onBlurCapture={(e) => { e.target.style.borderColor = ""; }}
            />
            <button onClick={handleSubmit} disabled={!text.trim() || submitting} className="tap-target" style={{
              width: 34, height: 34, borderRadius: "50%",
              background: text.trim() ? "var(--accent)" : "rgba(255,255,255,0.04)",
              border: text.trim() ? "none" : "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s ease",
              opacity: text.trim() ? 1 : 0.3,
              boxShadow: text.trim() ? "0 2px 8px rgba(91,156,246,0.3)" : "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          {text.length > 200 && (
            <div style={{ textAlign: "right", fontSize: "10px", color: text.length > 260 ? "var(--danger)" : "var(--text-faint)", marginTop: "4px", fontVariantNumeric: "tabular-nums", paddingRight: "48px" }}>
              {text.length}/280
            </div>
          )}
        </div>
      )}
    </div>
  );
}
