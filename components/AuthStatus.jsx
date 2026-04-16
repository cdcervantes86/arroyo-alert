"use client";

import { useAuth } from "@/lib/useAuth";
import { useState } from "react";

export default function AuthStatus() {
  const { user, isAnonymous, loading, linkAccount } = useAuth();
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLinking(true);
    setLinkError(null);

    const { error } = await linkAccount({ email, password });

    if (error) {
      setLinkError(error.message);
    } else {
      setShowLinkForm(false);
      setEmail("");
      setPassword("");
    }

    setLinking(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-dim)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: "12px" 
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
            {isAnonymous ? "Anonymous User" : "Account Linked"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
            {isAnonymous 
              ? "Link an email to save your data" 
              : "Your data is securely saved"}
          </div>
        </div>
        
        {isAnonymous && !showLinkForm && (
          <button
            onClick={() => setShowLinkForm(true)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Link Email
          </button>
        )}
      </div>

      {showLinkForm && (
        <form onSubmit={handleLinkAccount} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text)",
              fontSize: "13px",
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text)",
              fontSize: "13px",
            }}
            required
            minLength={6}
          />
          {linkError && (
            <div style={{ fontSize: "11px", color: "var(--danger)" }}>
              {linkError}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              disabled={linking}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                background: "var(--safe)",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: linking ? "not-allowed" : "pointer",
                opacity: linking ? 0.6 : 1,
              }}
            >
              {linking ? "Linking..." : "Link Account"}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-dim)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
