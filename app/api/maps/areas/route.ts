import { NextRequest, NextResponse } from "next/server";
import { searchAreas } from "@/lib/biteship";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input || input.trim().length < 3) {
    return NextResponse.json({ areas: [] });
  }

  try {
    const areas = await searchAreas(input.trim());
    return NextResponse.json({ areas });
  } catch (err) {
    console.error("[/api/maps/areas]", err);
    return NextResponse.json(
      { error: "Gagal mencari area." },
      { status: 500 }
    );
  }
}
