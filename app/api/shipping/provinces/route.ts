import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/rajaongkir";

export async function GET() {
  try {
    const provinces = await getProvinces();
    return NextResponse.json({ provinces });
  } catch (err) {
    console.error("[/api/shipping/provinces]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data provinsi." },
      { status: 500 }
    );
  }
}
