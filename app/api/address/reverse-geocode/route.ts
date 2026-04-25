import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat dan lon wajib diisi." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=id`,
      {
        headers: {
          "User-Agent": "SirkulasiIn/1.0 (contact@sirkulasiin.id)",
          "Accept-Language": "id",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Nominatim error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/address/reverse-geocode]", err);
    return NextResponse.json(
      { error: "Gagal menghubungi layanan geocoding." },
      { status: 500 }
    );
  }
}
