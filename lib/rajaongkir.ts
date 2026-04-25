// ─── Komerce RajaOngkir API Wrapper ──────────────────────────────────────────
// Endpoint baru setelah RajaOngkir Starter migrasi ke Komerce

const BASE_URL = "https://rajaongkir.komerce.id/api/v1";

function getHeaders(): HeadersInit {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) throw new Error("RAJAONGKIR_API_KEY is not set in environment variables.");
  return { key };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Province = {
  province_id: string;
  province: string;
};

export type City = {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
};

export type ShippingOption = {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Data provinsi & kota jarang berubah — cache untuk hemat API call

let cachedProvinces: Province[] | null = null;
const cachedCities: Record<string, City[]> = {};

// Helper untuk extract data (handle format asli RajaOngkir vs format Komerce)
function extractData<T>(json: any): T {
  if (json.rajaongkir && json.rajaongkir.results) {
    if (json.rajaongkir.status?.code !== 200) {
      throw new Error(json.rajaongkir.status.description || "API Error");
    }
    return json.rajaongkir.results;
  }
  if (json.data !== undefined) {
    if (json.meta && json.meta.code !== 200) {
      throw new Error(json.meta.message || "API Error");
    }
    return json.data;
  }
  throw new Error("Format response API tidak dikenali");
}

// ─── Get Provinces ────────────────────────────────────────────────────────────

export async function getProvinces(): Promise<Province[]> {
  if (cachedProvinces) return cachedProvinces;

  const res = await fetch(`${BASE_URL}/destination/province`, {
    headers: getHeaders(),
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  cachedProvinces = extractData<Province[]>(json);
  return cachedProvinces!;
}

// ─── Get Cities by Province ───────────────────────────────────────────────────

export async function getCities(provinceId: string): Promise<City[]> {
  if (cachedCities[provinceId]) return cachedCities[provinceId];

  // Komerce menggunakan path parameter untuk city
  const res = await fetch(`${BASE_URL}/destination/city/${provinceId}`, {
    headers: getHeaders(),
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  cachedCities[provinceId] = extractData<City[]>(json);
  return cachedCities[provinceId];
}

// ─── Get Shipping Costs (semua 3 kurir paralel) ───────────────────────────────

const COURIERS = ["jne", "tiki", "pos"] as const;
type Courier = (typeof COURIERS)[number];

async function getCostForCourier(
  originCityId: string,
  destinationCityId: string,
  weightGrams: number,
  courier: Courier
): Promise<ShippingOption[]> {
  try {
    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        origin: originCityId,
        destination: destinationCityId,
        weight: String(weightGrams),
        courier,
      }),
    });

    if (!res.ok) return [];

    const json = await res.json();
    const results = extractData<any[]>(json);

    if (!results?.length) return [];

    const courierResult = results[0];
    return courierResult.costs.map((c: any) => ({
      courier,
      service: c.service,
      description: c.description,
      cost: c.cost[0]?.value ?? 0,
      etd: c.cost[0]?.etd ?? "-",
    }));
  } catch (error) {
    console.error(`Gagal mengambil ongkir ${courier}:`, error);
    return [];
  }
}

export async function getShippingCosts(
  originCityId: string,
  destinationCityId: string,
  weightGrams: number
): Promise<ShippingOption[]> {
  const results = await Promise.allSettled(
    COURIERS.map((c) => getCostForCourier(originCityId, destinationCityId, weightGrams, c))
  );

  const options: ShippingOption[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") options.push(...r.value);
  }

  return options.sort((a, b) => a.cost - b.cost);
}

