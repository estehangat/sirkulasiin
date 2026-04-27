import { NextRequest, NextResponse } from "next/server";
import { getRates } from "@/lib/biteship";

// Couriers yang ditawarkan ke buyer (sesuaikan dengan kebutuhan).
// TIKI di-skip karena belum tersedia di Biteship sandbox.
const ENABLED_COURIERS = "jne,jnt,sicepat,anteraja,pos,ninja";

// Mock rates by weight (gram) — fallback ketika Biteship tidak bisa dipanggil
// (saldo habis, network error, dll). Estimasi kasar untuk dev/demo.
type MockResult = {
  courier: string;
  service: string;
  service_name: string;
  description: string;
  cost: number;
  etd: string;
};

function buildMockRates(weightGrams: number): MockResult[] {
  // Round up ke kelipatan 1000g
  const billableKg = Math.max(1, Math.ceil(weightGrams / 1000));
  return [
    { courier: "jne", service: "reg", service_name: "Reguler", description: "Layanan Reguler 2-3 hari", cost: 12000 * billableKg, etd: "2-3 hari" },
    { courier: "jne", service: "yes", service_name: "YES", description: "Yakin Esok Sampai 1 hari", cost: 22000 * billableKg, etd: "1 hari" },
    { courier: "jnt", service: "ez", service_name: "EZ", description: "J&T Express Reguler 2-3 hari", cost: 11000 * billableKg, etd: "2-3 hari" },
    { courier: "sicepat", service: "reg", service_name: "REG", description: "SiCepat Reguler 2-3 hari", cost: 10500 * billableKg, etd: "2-3 hari" },
    { courier: "anteraja", service: "reg", service_name: "Regular", description: "AnterAja Reguler 2-3 hari", cost: 10000 * billableKg, etd: "2-3 hari" },
    { courier: "pos", service: "reg", service_name: "Reguler", description: "POS Indonesia Reguler 3-5 hari", cost: 9500 * billableKg, etd: "3-5 hari" },
  ];
}

function isInsufficientBalance(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return msg.includes("balance") || msg.includes("top up") || msg.includes("insufficient");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin_area_id, destination_area_id, weight_grams, item_value } = body as {
      origin_area_id: string;
      destination_area_id: string;
      weight_grams: number;
      item_value?: number;
    };

    if (!origin_area_id || !destination_area_id || !weight_grams) {
      return NextResponse.json(
        { error: "origin_area_id, destination_area_id, dan weight_grams wajib diisi." },
        { status: 400 }
      );
    }

    try {
      const rates = await getRates({
        originAreaId: origin_area_id,
        destinationAreaId: destination_area_id,
        couriers: ENABLED_COURIERS,
        items: [
          {
            name: "Item",
            value: Number(item_value) || 100000,
            weight: Number(weight_grams),
            quantity: 1,
          },
        ],
      });

      const results = rates.map((r) => ({
        courier: r.courier_code,
        service: r.courier_service_code,
        service_name: r.courier_service_name,
        description: r.description || r.courier_name,
        cost: r.price,
        etd: r.duration,
      }));

      return NextResponse.json({ results });
    } catch (err) {
      // Fallback: kalau saldo Biteship habis / API down, kasih mock rates.
      // CheckoutForm tetap bisa lanjut → buyer bisa tes flow checkout.
      if (isInsufficientBalance(err) || process.env.SHIPPING_USE_MOCK === "1") {
        console.warn("[/api/shipping/cost] Biteship unavailable, returning MOCK rates:", err instanceof Error ? err.message : err);
        return NextResponse.json({
          results: buildMockRates(Number(weight_grams)),
          mock: true,
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("[/api/shipping/cost]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghitung ongkir." },
      { status: 500 }
    );
  }
}
