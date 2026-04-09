"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { playDangerAlert, playCautionAlert, isAudioEnabled } from "./audioAlerts";

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchReports = useCallback(async () => {
    const cutoff = new Date(Date.now() - 4 * 3600000).toISOString();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    }
    setLoading(false);
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((prev) => [payload.new, ...prev]);

            // Play audio alert for new reports (only after initial load)
            if (initialLoadDone.current && isAudioEnabled()) {
              const sev = payload.new.severity;
              if (sev === "danger") playDangerAlert();
              else if (sev === "caution") playCautionAlert();
            }
          } else if (payload.eventType === "UPDATE") {
            setReports((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
          } else if (payload.eventType === "DELETE") {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const submitReport = useCallback(async ({ zoneId, severity, text }) => {
    const { data, error } = await supabase.from("reports").insert({
      zone_id: zoneId,
      severity,
      text: text || "",
    }).select().single();

    if (error) {
      console.error("Error submitting report:", error);
      return null;
    }
    return data;
  }, []);

  const upvoteReport = useCallback(async (reportId, currentUpvotes) => {
    const { error } = await supabase
      .from("reports")
      .update({ upvotes: currentUpvotes + 1 })
      .eq("id", reportId);

    if (!error) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r
        )
      );
    }
  }, []);

  // Delete report (admin use)
  const deleteReport = useCallback(async (reportId) => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
    return !error;
  }, []);

  return { reports, loading, submitReport, upvoteReport, deleteReport, refetch: fetchReports };
}
