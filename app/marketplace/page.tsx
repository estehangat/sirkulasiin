import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import MarketplaceFilters from "./MarketplaceFilters";
import FavoriteButton from "./FavoriteButton";
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

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const priceRange = typeof sp.price === "string" ? sp.price : "";
  const location = typeof sp.location === "string" ? sp.location : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "latest";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createServerSupabaseClient();

  // ─── Check auth for favorites filter ───
  const { data: { user } } = await supabase.auth.getUser();
  const isFavoritesSort = sort === "favorites";

  // ─── Build query ───
  let query;
  if (isFavoritesSort && user) {
    // Join with user_favorites to show only favorited items
    query = supabase
      .from("marketplace_listings")
      .select("*, user_favorites!inner(*)", { count: "exact" })
      .eq("status", "published")
      .eq("user_favorites.user_id", user.id);
  } else {
    query = supabase
      .from("marketplace_listings")
      .select("*", { count: "exact" })
      .eq("status", "published");
  }

  // Search
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  // Category filter
  if (category) query = query.eq("category", category);

  // Price range filter
  if (priceRange) {
    const [minStr, maxStr] = priceRange.split("-");
    if (minStr) query = query.gte("price", Number(minStr));
    if (maxStr) query = query.lte("price", Number(maxStr));
  }

  // Location filter
  if (location) query = query.eq("location", location);

  // Sort + barter filter
  if (sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else if (sort === "barter") {
    query = query.eq("barter_enabled", true).order("created_at", { ascending: false });
  } else if (isFavoritesSort) {
    query = query.order("user_favorites.created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * PER_PAGE;
  query = query.range(from, from + PER_PAGE - 1);

  // Execute query (skip for favorites if not logged in)
  let items: any[] = [];
  let totalPages = 0;
  if (!(isFavoritesSort && !user)) {
    const { data: listings, count } = await query;
    items = listings ?? [];
    totalPages = Math.ceil((count ?? 0) / PER_PAGE);
  }

  // ─── Seller profiles ───
  const sellerIds = [...new Set(items.map((i) => i.user_id))];
  const { data: profiles } = sellerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", sellerIds)
    : { data: [] };
  const sellerMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  // ─── Distinct locations for filter ───
  const { data: locRows } = await supabase
    .from("marketplace_listings")
    .select("location")
    .eq("status", "published")
    .not("location", "is", null)
    .not("location", "eq", "");
  const uniqueLocations = [...new Set((locRows ?? []).map((r) => r.location).filter(Boolean))].sort() as string[];

  // ─── Featured: top 3 by view_count ───
  const { data: featuredRaw } = await supabase
    .from("marketplace_listings")
    .select("id, title, image_url, price, carbon_saved, category, view_count")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(3);
  const featured = featuredRaw ?? [];

  // Active filter indicator
  const hasFilters = !!(q || category || priceRange || location || sort === "favorites");

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />

      {/* ── Hero ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroTextContent}>
            <h1 className={styles.heroTitle}>
              Berikan barang{" "}
              <span className={styles.heroAccent}>kehidupan kedua.</span>
            </h1>
            <p className={styles.heroDescription}>
              Marketplace terkurasi untuk barang preloved berkualitas.
              Diverifikasi oleh AI, dikirim dengan cinta untuk bumi.
            </p>
          </div>
          <div>
            <Link href="/scan" className={styles.listItemBtn}>
              <svg className={styles.listItemIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Mulai Scan Barangmu
            </Link>
          </div>
        </div>

        {/* Filters (Client Component) */}
        <Suspense>
          <MarketplaceFilters locations={uniqueLocations} />
        </Suspense>
      </section>

      {/* ── Featured (dynamic) ── */}
      {featured.length >= 2 && !hasFilters && sort !== "favorites" && (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Paling Banyak Dilihat</h2>
            <Link href="/marketplace?sort=popular" className={styles.viewAllLink}>
              Lihat semua →
            </Link>
          </div>

          <div className={styles.featuredGrid}>
            {/* Large Featured Card */}
            <Link href={`/marketplace/${featured[0].id}`} className={styles.featuredLarge}>
              {featured[0].image_url ? (
                <Image
                  src={featured[0].image_url}
                  alt={featured[0].title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className={styles.featuredImage}
                />
              ) : (
                <div className={styles.productImagePlaceholder} style={{ position: "absolute", inset: 0 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
              <div className={styles.featuredOverlay} />
              <div className={styles.featuredContent}>
                <span className={styles.featuredBadge}>
                  {featured[0].view_count ?? 0} kali dilihat
                </span>
                <h3 className={styles.featuredTitle}>{featured[0].title}</h3>
                <p className={styles.featuredText}>
                  {CATEGORY_LABELS[featured[0].category] || featured[0].category} · {formatRupiah(featured[0].price)}
                </p>
              </div>
            </Link>

            {/* Side Grid */}
            <div className={styles.featuredSideGrid}>
              {featured.slice(1, 3).map((f) => (
                <Link key={f.id} href={`/marketplace/${f.id}`} className={styles.featuredCard}>
                  <div className={styles.featuredCardContent}>
                    <h3 className={styles.cardTitle}>{f.title}</h3>
                    <p className={styles.cardText}>
                      {CATEGORY_LABELS[f.category] || f.category} · {f.view_count ?? 0}x dilihat
                    </p>
                    <span className={styles.cardLink}>{formatRupiah(f.price)} →</span>
                  </div>
                  {f.image_url && (
                    <div className={styles.cardImageBox}>
                      <Image src={f.image_url} alt={f.title} fill sizes="140px" className={styles.cardImage} />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Listings ── */}
      <section className={styles.listingsSection}>
        <div className={styles.listingsHeader}>
          <h2 className={styles.sectionTitle}>
            {hasFilters
              ? "Hasil Pencarian"
              : sort === "popular"
                ? "Paling Populer"
                : sort === "barter"
                  ? "Bisa Barter"
                  : sort === "favorites"
                    ? "Favorit Saya"
                    : "Listing Terbaru"}
          </h2>
          {hasFilters && (
            <Link href="/marketplace" className={styles.viewAllLink}>
              Reset Filter ×
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3>
              {sort === "favorites"
                ? user
                  ? "Belum ada favorit"
                  : "Silakan login"
                : hasFilters
                  ? "Tidak ditemukan"
                  : "Belum ada listing"}
            </h3>
            <p>
              {sort === "favorites"
                ? user
                  ? "Jelajahi marketplace dan tambahkan barang ke favorit!"
                  : "Anda perlu login untuk melihat favorit."
                : hasFilters
                  ? "Coba ubah filter pencarian Anda."
                  : "Jadilah yang pertama menjual barang preloved-mu!"}
            </p>
            {sort === "favorites" && !user ? (
              <Link href="/login?next=/marketplace?sort=favorites" className={styles.listItemBtn}>
                Login
              </Link>
            ) : !hasFilters && sort !== "favorites" && (
              <Link href="/scan" className={styles.listItemBtn}>
                Mulai Scan Barangmu
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.productGrid}>
              {items.map((item) => {
                const seller = sellerMap[item.user_id];
                const sellerName = seller?.full_name || seller?.username || "Penjual";
                return (
                  <Link
                    key={item.id}
                    href={`/marketplace/${item.id}`}
                    className={styles.productCardLink}
                  >
                    <article className={styles.productCard}>
                      <div className={styles.productImageWrap}>
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className={styles.productImage}
                          />
                        ) : (
                          <div className={styles.productImagePlaceholder}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="m21 15-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                        {item.category && (
                          <span className={styles.categoryBadge}>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        )}
                        {item.barter_enabled && (
                          <span className={styles.barterBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            Barter
                          </span>
                        )}
                        <FavoriteButton listingId={item.id} />
                      </div>

                      <div className={styles.productInfo}>
                        <div className={styles.sellerRowCard}>
                          {seller?.avatar_url ? (
                            <Image src={seller.avatar_url} alt={sellerName} width={24} height={24} className={styles.sellerAvatar} unoptimized />
                          ) : (
                            <div className={styles.sellerAvatarPlaceholder}>{sellerName.charAt(0).toUpperCase()}</div>
                          )}
                          <span className={styles.sellerName}>{sellerName}</span>
                          {(item.view_count ?? 0) > 0 && (
                            <span className={styles.viewCount}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              {item.view_count}
                            </span>
                          )}
                        </div>

                        <h4 className={styles.productName}>{item.title}</h4>

                        <div className={styles.productFooter}>
                          <div>
                            <span className={styles.productPrice}>{formatRupiah(item.price)}</span>
                            {item.carbon_saved && (
                              <span className={styles.carbonBadge}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
                                </svg>
                                {item.carbon_saved}
                              </span>
                            )}
                          </div>
                          <div className={styles.productMeta}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {item.location || "Indonesia"}
                            <span className={styles.dot}>•</span>
                            {timeAgo(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.paginationRow}>
                {page > 1 && (
                  <Link
                    href={`/marketplace?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]), page: String(page - 1) }).toString()}`}
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
                    href={`/marketplace?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]), page: String(page + 1) }).toString()}`}
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

    </main>
  );
}
