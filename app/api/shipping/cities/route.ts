import { NextRequest, NextResponse } from "next/server";
import { getCities } from "@/lib/rajaongkir";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get("province_id");

  if (!provinceId) {
    return NextResponse.json(
      { error: "province_id wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const cities = await getCities(provinceId);
    return NextResponse.json({ cities });
  } catch (err) {
    console.error("[/api/shipping/cities]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data kota." },
      { status: 500 }
    );
  }
}
