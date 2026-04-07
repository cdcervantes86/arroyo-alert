"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent reports (last 4 hours)
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
  }, []);

  // Subscribe to real-time changes
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  // Submit a new report
  const submitReport = useCallback(async ({ zoneId, severity, text }) => {
    const { data, error } = await supabase.from("reports").insert({
      zone_id: zoneId,
      severity,
      text: text || "Sin comentario",
    }).select().single();

    if (error) {
      console.error("Error submitting report:", error);
      return null;
    }
    return data;
  }, []);

  // Upvote a report
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

  return { reports, loading, submitReport, upvoteReport, refetch: fetchReports };
}
