import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./marketplace.module.css";

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

export default async function MarketplacePage() {
  const supabase = await createServerSupabaseClient();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  const items = listings ?? [];

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />

      {/* ── Hero & Filter Section ── */}
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
              <svg
                className={styles.listItemIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Mulai Scan Barangmu
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={styles.searchFilterGrid}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari berdasarkan barang, bahan, atau merek..."
              className={styles.searchInput}
            />
          </div>
          <select className={styles.filterSelect}>
            <option>Kategori</option>
            <option>Dekorasi Rumah</option>
            <option>Peralatan Dapur</option>
            <option>Elektronik</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Rentang Harga</option>
            <option>Rp0 - Rp500.000</option>
            <option>Rp500.000 - Rp2.000.000</option>
            <option>Rp2.000.000+</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Lokasi</option>
            <option>Terdekat</option>
            <option>Seluruh Indonesia</option>
          </select>
          <button className={styles.filterButton}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Featured Eco-Friendly Picks ── */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pilihan Ramah Lingkungan</h2>
          <a href="#" className={styles.viewAllLink}>
            Lihat koleksi →
          </a>
        </div>

        <div className={styles.featuredGrid}>
          {/* Large Featured Card */}
          <div className={styles.featuredLarge}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4RS3iOouHcCon7y4cx5M2n26HvDIpqtkxclYiTNGH3EuhDtJeSu_hm0jV_1XbYYG7kzX6Bh_mmcRSmFEp32EjheYriOiZPU2-mrdyB7WNqXkBHOywntfu31K8sg0xfZ5ESPZHz9BZPTK3B4hg_FUd7o11OONz5bS05cU5u8sYJFqUbYeRw66TrXhYdGCphmTm_FOqt4YWw_oD4-XPXlVRcDS62BWdyUSyuCAhnWQpqjxtNG2GVCVfrX546YKqE5aDr3xjDx1bXtrf"
              alt="minimalist wooden chair"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={styles.featuredImage}
            />
            <div className={styles.featuredOverlay} />
            <div className={styles.featuredContent}>
              <span className={styles.featuredBadge}>Koleksi Diperbarui</span>
              <h3 className={styles.featuredTitle}>Ruang Tamu Berkelanjutan</h3>
              <p className={styles.featuredText}>
                Furnitur pilihan yang direstorasi dengan bahan organik dan
                material non-toksik.
              </p>
              <button className={styles.exploreBtn}>Jelajahi Sekarang</button>
            </div>
          </div>

          {/* Side Grid */}
          <div className={styles.featuredSideGrid}>
            {/* Upcycled Tech Card */}
            <div className={styles.featuredCard}>
              <div className={styles.featuredCardContent}>
                <h3 className={styles.cardTitle}>Teknologi Daur Ulang</h3>
                <p className={styles.cardText}>
                  Bersertifikat bekas pakai dengan garansi 12 bulan.
                </p>
                <span className={styles.cardLink}>Telusuri Teknologi →</span>
              </div>
              <div className={styles.cardImageBox}>
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTAuWCvCpLlQG1o98FIP6snNfrz9X4DWiOwZq9DiTbieMHvSu6AtM_UrgrAu24aDAJ5DDvFsGCf1bbRlTXuhowZ9ha0vQIutVO0AHPDWlugD3dpmYxACUL4Ooz3SoqW6nlSUODodziDG-G5dbFEnizTuv5UUlVMWNZkAcdZFtkML_hvz6E3ETy5KRoxqY5q3_oWRC0JwfER39Wzha-FOIb1coM8M31DMHLh1f2bwSKMzqjMhy-zKjD6h2gzr5xc6lqgDq0UeC7XFTH"
                  alt="refurbished tablet"
                  fill
                  sizes="140px"
                  className={styles.cardImage}
                />
              </div>
            </div>

            {/* Impact Rewards Card */}
            <div className={styles.rewardCard}>
              <div className={styles.featuredCardContent}>
                <h3 className={styles.cardTitle}>Hadiah Dampak</h3>
                <p className={styles.cardText}>
                  Dapatkan Eco-Points ganda untuk barang kaca minggu ini.
                </p>
                <span className={styles.rewardBadge}>
                  Pelajari Lebih Lanjut
                </span>
              </div>
              <svg
                className={styles.ecoIcon}
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.66c.48-.17.98-.31 1.49-.44C9.15 17.76 10 16 10 14c0-1.88-.61-3.73-1.56-5.48l.86-1.51C13 8.44 15 10.99 15 14c0 1.94-.74 3.8-2.08 5.3l1.42 1.42C15.96 19.06 17 16.64 17 14c0-5.58-4.71-10.6-10.17-11.36L6 4.64c4.72.66 8 4.48 8 9.36 0 1.28-.3 2.5-.84 3.6l1.73 1C15.58 17.33 16 15.7 16 14c0-4.41-3.59-8-8-8H6.83z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Listings ── */}
      <section className={styles.listingsSection}>
        <div className={styles.listingsHeader}>
          <h2 className={styles.sectionTitle}>Listing Terbaru</h2>
          <div className={styles.tabGroup}>
            <button className={styles.tab}>Populer</button>
            <button className={`${styles.tab} ${styles.tabActive}`}>
              Terbaru
            </button>
            <button className={styles.tab}>Segera Berakhir</button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3>Belum ada listing</h3>
            <p>Jadilah yang pertama menjual barang preloved-mu!</p>
            <Link href="/scan" className={styles.listItemBtn}>
              Mulai Scan Barangmu
            </Link>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {items.map((item) => (
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
                    <div className={styles.verifiedBadge}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      TERVERIFIKASI AI
                    </div>
                    {item.barter_enabled && (
                      <div className={styles.barterBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        BARTER
                      </div>
                    )}
                    <button className={styles.favoriteBtn}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                      <h4 className={styles.productName}>{item.title}</h4>
                      <span className={styles.productPrice}>
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                    <div className={styles.productMeta}>
                      <span>{item.location || "Indonesia"}</span>
                      <span className={styles.dot}>•</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <span className={styles.footerBrand}>SirkulasiIn</span>
            <p className={styles.footerCopyright}>
              © 2024 SirkulasiIn. Menuai masa depan yang lebih hijau.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">Statistik Dampak</a>
            <a href="#">Privasi</a>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">Discord</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
