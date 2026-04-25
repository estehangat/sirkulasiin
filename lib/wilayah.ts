// ─── Wilayah Indonesia API Wrapper (emsifa) ──────────────────────────────────
// Data kecamatan & kelurahan dari https://emsifa.github.io/api-wilayah-indonesia/

const EMSIFA_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmsifaProvince = { id: string; name: string };
export type EmsifaRegency = { id: string; province_id: string; name: string };
export type District = { id: string; regency_id: string; name: string };
export type Village = { id: string; district_id: string; name: string };

// ─── In-memory cache ─────────────────────────────────────────────────────────

let cachedEmsifaProvinces: EmsifaProvince[] | null = null;
const cachedRegencies: Record<string, EmsifaRegency[]> = {};
const cachedDistricts: Record<string, District[]> = {};
const cachedVillages: Record<string, Village[]> = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

async function fetchProvinces(): Promise<EmsifaProvince[]> {
  if (cachedEmsifaProvinces) return cachedEmsifaProvinces;
  const res = await fetch(`${EMSIFA_BASE}/provinces.json`);
  if (!res.ok) throw new Error(`Emsifa provinces error: ${res.status}`);
  cachedEmsifaProvinces = await res.json();
  return cachedEmsifaProvinces!;
}

async function fetchRegencies(provinceId: string): Promise<EmsifaRegency[]> {
  if (cachedRegencies[provinceId]) return cachedRegencies[provinceId];
  const res = await fetch(`${EMSIFA_BASE}/regencies/${provinceId}.json`);
  if (!res.ok) throw new Error(`Emsifa regencies error: ${res.status}`);
  cachedRegencies[provinceId] = await res.json();
  return cachedRegencies[provinceId];
}

// ─── Get Districts (kecamatan) ───────────────────────────────────────────────
// Match RajaOngkir province_name + city_name → emsifa regency → districts

export async function getDistricts(
  provinceName: string,
  cityName: string
): Promise<District[]> {
  const provinces = await fetchProvinces();
  const normProv = normalize(provinceName);
  const matchedProvince = provinces.find((p) => normalize(p.name) === normProv);
  if (!matchedProvince)
    throw new Error(`Provinsi "${provinceName}" tidak ditemukan di data wilayah.`);

  const regencies = await fetchRegencies(matchedProvince.id);
  const normCity = normalize(cityName);

  // Exact match first
  let matchedRegency = regencies.find((r) => normalize(r.name) === normCity);

  // Fallback: partial match (e.g. "Kabupaten Bogor" ↔ "KAB. BOGOR")
  if (!matchedRegency) {
    const stripped = normCity
      .replace(/^(kabupaten|kota)\s+/, "")
      .replace(/^(kab\.?|kota)\s+/, "");
    matchedRegency = regencies.find((r) => {
      const rStripped = normalize(r.name)
        .replace(/^(kabupaten|kota)\s+/, "")
        .replace(/^(kab\.?|kota)\s+/, "");
      return rStripped === stripped;
    });
  }

  // Fallback: includes
  if (!matchedRegency) {
    const stripped = normCity.replace(/^(kabupaten|kota|kab\.?)\s+/, "");
    matchedRegency = regencies.find((r) =>
      normalize(r.name).includes(stripped)
    );
  }

  if (!matchedRegency)
    throw new Error(`Kota "${cityName}" tidak ditemukan di data wilayah.`);

  const cacheKey = matchedRegency.id;
  if (cachedDistricts[cacheKey]) return cachedDistricts[cacheKey];

  const res = await fetch(`${EMSIFA_BASE}/districts/${matchedRegency.id}.json`);
  if (!res.ok) throw new Error(`Emsifa districts error: ${res.status}`);
  cachedDistricts[cacheKey] = await res.json();
  return cachedDistricts[cacheKey];
}

// ─── Get Villages (kelurahan/desa) ───────────────────────────────────────────

export async function getVillages(districtId: string): Promise<Village[]> {
  if (cachedVillages[districtId]) return cachedVillages[districtId];
  const res = await fetch(`${EMSIFA_BASE}/villages/${districtId}.json`);
  if (!res.ok) throw new Error(`Emsifa villages error: ${res.status}`);
  cachedVillages[districtId] = await res.json();
  return cachedVillages[districtId];
}
