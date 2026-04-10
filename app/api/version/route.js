import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic"; // Never cache this
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    }
  );
}
