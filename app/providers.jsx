"use client";

import { useEffect } from "react";
import { startDeviceStruggleDetector } from "@/lib/deviceStruggleDetector";
import { AuthProvider } from "@/lib/useAuth";

export default function Providers({ children }) {
  useEffect(() => { startDeviceStruggleDetector(); }, []);
  return <AuthProvider>{children}</AuthProvider>;
}
