import { NextRequest, NextResponse } from "next/server";
import { checkDealsForKeywords } from "@/lib/flipp-api";

export async function POST(request: NextRequest) {
  try {
    const { keywords, zip } = await request.json();

    if (!keywords?.length || !zip) {
      return NextResponse.json(
        { error: "keywords and zip are required" },
        { status: 400 }
      );
    }

    const matches = await checkDealsForKeywords(zip, keywords);
    const totalMatches = Object.values(matches).flat().length;

    return NextResponse.json({ matches, totalMatches });
  } catch (error) {
    console.error("Failed to check deals:", error);
    return NextResponse.json(
      { error: "Failed to check deals" },
      { status: 500 }
    );
  }
}
