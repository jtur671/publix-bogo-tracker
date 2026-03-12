import { NextRequest, NextResponse } from "next/server";
import { searchPublixProducts } from "@/lib/flipp-api";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const zip = request.nextUrl.searchParams.get("zip") || "34695";

  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  try {
    const results = await searchPublixProducts(zip, q.trim());
    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
