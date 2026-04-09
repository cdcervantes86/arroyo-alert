"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { playDangerAlert, playCautionAlert, isAudioEnabled } from "./audioAlerts";
import { getDeviceId, incrementReportCount } from "./deviceId";

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

    if (!error && data) setReports(data);
    setLoading(false);
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel("reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setReports((prev) => [payload.new, ...prev]);
          if (initialLoadDone.current && isAudioEnabled()) {
            if (payload.new.severity === "danger") playDangerAlert();
            else if (payload.new.severity === "caution") playCautionAlert();
          }
        } else if (payload.eventType === "UPDATE") {
          setReports((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
        } else if (payload.eventType === "DELETE") {
          setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  // Upload photo to Supabase Storage
  const uploadPhoto = useCallback(async (file) => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("report-photos")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Photo upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  }, []);

  const submitReport = useCallback(async ({ zoneId, severity, text, photo }) => {
    let photoUrl = null;
    if (photo) {
      photoUrl = await uploadPhoto(photo);
    }

    const deviceId = getDeviceId();

    const { data, error } = await supabase.from("reports").insert({
      zone_id: zoneId,
      severity,
      text: text || "",
      photo_url: photoUrl,
      device_id: deviceId,
    }).select().single();

    if (error) {
      console.error("Error submitting report:", error);
      return null;
    }

    incrementReportCount();
    return data;
  }, [uploadPhoto]);

  const upvoteReport = useCallback(async (reportId, currentUpvotes) => {
    const { error } = await supabase
      .from("reports")
      .update({ upvotes: currentUpvotes + 1 })
      .eq("id", reportId);

    if (!error) {
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r));
    }
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    const { error } = await supabase.from("reports").delete().eq("id", reportId);
    if (!error) setReports((prev) => prev.filter((r) => r.id !== reportId));
    return !error;
  }, []);

  return { reports, loading, submitReport, upvoteReport, deleteReport, refetch: fetchReports };
}
