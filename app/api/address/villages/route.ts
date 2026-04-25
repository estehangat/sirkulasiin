import { NextRequest, NextResponse } from "next/server";
import { getVillages } from "@/lib/wilayah";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("district_id");

  if (!districtId) {
    return NextResponse.json(
      { error: "district_id wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const villages = await getVillages(districtId);
    return NextResponse.json({ villages });
  } catch (err) {
    console.error("[/api/address/villages]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data kelurahan." },
      { status: 500 }
    );
  }
}
