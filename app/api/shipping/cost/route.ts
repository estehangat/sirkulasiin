import { NextRequest, NextResponse } from "next/server";
import { getShippingCosts } from "@/lib/rajaongkir";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin_city_id, dest_city_id, weight_grams } = body as {
      origin_city_id: string;
      dest_city_id: string;
      weight_grams: number;
    };

    if (!origin_city_id || !dest_city_id || !weight_grams) {
      return NextResponse.json(
        { error: "origin_city_id, dest_city_id, dan weight_grams wajib diisi." },
        { status: 400 }
      );
    }

    const results = await getShippingCosts(
      String(origin_city_id),
      String(dest_city_id),
      Number(weight_grams)
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/shipping/cost]", err);
    return NextResponse.json(
      { error: "Gagal menghitung ongkir. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
