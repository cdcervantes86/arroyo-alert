import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  "mailto:arroyoalerta@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const { zoneId, zoneName, severity, text } = await request.json();

    // Get all subscriptions for this zone
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("zone_id", zoneId);

    if (error || !subscriptions?.length) {
      return NextResponse.json({ sent: 0 });
    }

    const severityLabels = {
      danger: "🔴 PELIGROSO",
      caution: "🟡 Precaución",
      safe: "🟢 Despejado",
    };

    const payload = JSON.stringify({
      title: `${severityLabels[severity]} — ${zoneName}`,
      body: text || "Nuevo reporte de arroyo en tu zona",
      zoneId,
    });

    // Send to all subscribers
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub.subscription, payload).catch(async (err) => {
          // Remove invalid subscriptions (expired, unsubscribed)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("zone_id", zoneId)
              .eq("subscription->>endpoint", sub.subscription.endpoint);
          }
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent });
  } catch (err) {
    console.error("Push notification error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
