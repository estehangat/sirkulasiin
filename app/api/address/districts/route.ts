import { NextRequest, NextResponse } from "next/server";
import { getDistricts } from "@/lib/wilayah";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceName = searchParams.get("province_name");
  const cityName = searchParams.get("city_name");

  if (!provinceName || !cityName) {
    return NextResponse.json(
      { error: "province_name dan city_name wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const districts = await getDistricts(provinceName, cityName);
    return NextResponse.json({ districts });
  } catch (err) {
    console.error("[/api/address/districts]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data kecamatan." },
      { status: 500 }
    );
  }
}
