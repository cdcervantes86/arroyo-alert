import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Subscribe to a zone
export async function POST(request) {
  try {
    const { zoneId, subscription } = await request.json();

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { zone_id: zoneId, subscription },
        { onConflict: "zone_id,(subscription->>endpoint)" }
      );

    if (error) {
      // If upsert fails due to constraint, try insert ignore
      await supabase
        .from("push_subscriptions")
        .insert({ zone_id: zoneId, subscription });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Unsubscribe from a zone
export async function DELETE(request) {
  try {
    const { zoneId, endpoint } = await request.json();

    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("zone_id", zoneId)
      .filter("subscription->>endpoint", "eq", endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
