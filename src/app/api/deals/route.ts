import { NextRequest, NextResponse } from "next/server";
import { fetchPublixDeals } from "@/lib/flipp-api";

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip") || "34695";

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: "Invalid zip code" },
      { status: 400 }
    );
  }

  try {
    const deals = await fetchPublixDeals(zip);
    return NextResponse.json({ deals, count: deals.length, zip });
  } catch (error) {
    console.error("Failed to fetch deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
