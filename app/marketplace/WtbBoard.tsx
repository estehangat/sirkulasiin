import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import WtbFilters from "./WtbFilters";
import styles from "./marketplace.module.css";

const PER_PAGE = 20;

const CATEGORY_LABELS: Record<string, string> = {
  glass: "Kaca",
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  textile: "Tekstil",
  electronic: "Elektronik",
  other: "Lainnya",
};

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

function daysLeft(expiresAt: string) {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  return Math.max(0, days);
}

export default async function WtbBoard({
  sp,
}: {
  sp: Record<string, string | string[] | undefined>;
}) {
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const location = typeof sp.location === "string" ? sp.location : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "latest";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("wtb_requests")
    .select("*", { count: "exact" })
    .eq("status", "open")
    .gt("expires_at", nowIso);

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (category) query = query.eq("category", category);
  if (location) query = query.eq("city", location);

  if (sort === "budget_desc") {
    query = query.order("budget_max", { ascending: false });
  } else if (sort === "budget_asc") {
    query = query.order("budget_max", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * PER_PAGE;
  query = query.range(from, from + PER_PAGE - 1);

  const { data: requests, count } = await query;
  const items = requests ?? [];
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  // ─── Requester profiles ───
  const requesterIds = [...new Set(items.map((i) => i.user_id))];
  const { data: profiles } = requesterIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", requesterIds)
    : { data: [] };
  const requesterMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  // ─── Jumlah offer pending per WTB ───
  const wtbIds = items.map((i) => i.id);
  const { data: offerRows } = wtbIds.length
    ? await supabase
        .from("wtb_offers")
        .select("wtb_id")
        .in("wtb_id", wtbIds)
        .eq("status", "pending")
    : { data: [] };
  const offerCountMap = new Map<string, number>();
  for (const row of offerRows ?? []) {
    offerCountMap.set(row.wtb_id, (offerCountMap.get(row.wtb_id) ?? 0) + 1);
  }

  // ─── Kota untuk filter ───
  const { data: cityRows } = await supabase
    .from("wtb_requests")
    .select("city")
    .eq("status", "open")
    .gt("expires_at", nowIso)
    .not("city", "is", null)
    .not("city", "eq", "");
  const uniqueCities = [...new Set((cityRows ?? []).map((r) => r.city).filter(Boolean))].sort() as string[];

  const hasFilters = !!(q || category || location);
  const stringSp = Object.fromEntries(
    Object.entries(sp).filter(([, v]) => typeof v === "string")
  ) as Record<string, string>;

  return (
    <>
      <Suspense>
        <WtbFilters cities={uniqueCities} />
      </Suspense>

      <section className={styles.listingsSection}>
        <div className={styles.listingsHeader}>
          <h2 className={styles.sectionTitle}>
            {hasFilters ? "Hasil Pencarian" : "Sedang Dicari Warga"}
          </h2>
          {hasFilters && (
            <Link href="/marketplace?tab=dicari" className={styles.viewAllLink}>
              Reset Filter ×
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={`${styles.emptyMascotWrap} ${styles.emptyTone_search}`}>
              <span className={styles.emptyMascotGlow} aria-hidden />
              <span className={styles.emptyMascotRing} aria-hidden />
              <Image
                src="/siku-search.png"
                alt="Siku mencari permintaan"
                fill
                sizes="(max-width: 640px) 200px, 240px"
                className={styles.emptyMascotImg}
              />
            </div>
            <h3>{hasFilters ? "Hmm, nggak ketemu" : "Belum ada permintaan"}</h3>
            <p>
              {hasFilters
                ? "Siku sudah cari ke mana-mana, tapi belum ada permintaan yang cocok. Coba ubah filternya."
                : "Belum ada yang memposting barang yang dicari. Jadilah yang pertama!"}
            </p>
            {!hasFilters && (
              <Link href="/wtb/create" className={styles.listItemBtn}>
                Buat Permintaan
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.wtbGrid}>
              {items.map((item) => {
                const requester = requesterMap[item.user_id];
                const requesterName = requester?.full_name || requester?.username || "Warga";
                const offerCount = offerCountMap.get(item.id) ?? 0;
                const remainingDays = daysLeft(item.expires_at);
                return (
                  <Link key={item.id} href={`/wtb/${item.id}`} className={styles.wtbCardLink}>
                    <article className={styles.wtbCard}>
                      <span className={styles.wtbStamp}>Dicari</span>
                      <span className={styles.wtbCategory}>
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <h4 className={styles.wtbTitle}>{item.title}</h4>
                      {item.description && (
                        <p className={styles.wtbDesc}>{item.description}</p>
                      )}

                      <div className={styles.wtbRequester}>
                        {requester?.avatar_url ? (
                          <Image
                            src={requester.avatar_url}
                            alt={requesterName}
                            width={24}
                            height={24}
                            className={styles.sellerAvatar}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.sellerAvatarPlaceholder}>
                            {requesterName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={styles.wtbRequesterName}>{requesterName}</span>
                      </div>

                      <div className={styles.wtbMetaRow}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {item.city}
                        <span className={styles.dot}>•</span>
                        {timeAgo(item.created_at)}
                        <span className={styles.dot}>•</span>
                        sisa {remainingDays} hari
                      </div>

                      <div className={styles.wtbBudgetWrap}>
                        <div>
                          <span className={styles.wtbBudgetLabel}>Budget Maks</span>
                          <p className={styles.wtbBudget}>{formatRupiah(item.budget_max)}</p>
                        </div>
                        <span className={styles.wtbOffersCount}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10v12" />
                            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                          </svg>
                          {offerCount} tawaran
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationRow}>
                {page > 1 && (
                  <Link
                    href={`/marketplace?${new URLSearchParams({ ...stringSp, tab: "dicari", page: String(page - 1) }).toString()}`}
                    className={styles.paginationBtn}
                  >
                    ← Sebelumnya
                  </Link>
                )}
                <span className={styles.paginationInfo}>
                  Halaman {page} dari {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/marketplace?${new URLSearchParams({ ...stringSp, tab: "dicari", page: String(page + 1) }).toString()}`}
                    className={styles.paginationBtn}
                  >
                    Selanjutnya →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
