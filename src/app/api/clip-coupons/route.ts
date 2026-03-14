import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const clipperUrl = process.env.CLIPPER_URL;
    const clipperKey = process.env.CLIPPER_API_KEY;

    if (!clipperUrl || !clipperKey) {
      return NextResponse.json(
        { error: "Clipper service not configured" },
        { status: 503 }
      );
    }

    const clipperRes = await fetch(`${clipperUrl}/clip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": clipperKey,
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(115_000),
    });

    let data: Record<string, unknown>;
    try {
      data = await clipperRes.json();
    } catch {
      return NextResponse.json(
        { error: "Clipper service returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: clipperRes.status });
  } catch (error) {
    console.error("Clip coupons error:", error);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Clipper service timed out" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
