import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BarterOfferForm from "./BarterOfferForm";
import ChatSellerButton from "./ChatSellerButton";
import styles from "./productDetail.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

const categoryLabels: Record<string, string> = {
  glass: "Kaca",
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  textile: "Tekstil",
  electronic: "Elektronik",
  other: "Lainnya",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch listing
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  // Fetch seller profile
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location")
    .eq("id", listing.user_id)
    .single();

  const sellerName = sellerProfile?.full_name || sellerProfile?.username || "Penjual";
  const sellerAvatar = sellerProfile?.avatar_url || null;
  const sellerLocation = sellerProfile?.location || listing.location || null;

  // Fetch related items (same category, exclude current)
  const { data: relatedListings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, image_url, carbon_saved")
    .eq("status", "published")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const related = relatedListings ?? [];

  // Cek apakah user sedang login (untuk form barter)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />

      {/* ── Breadcrumbs ── */}
      <nav className={styles.breadcrumbs}>
        <Link href="/marketplace">Marketplace</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span>{categoryLabels[listing.category] || listing.category}</span>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>{listing.title}</span>
      </nav>

      {/* ── Product Layout ── */}
      <div className={styles.productLayout}>
        {/* Gallery — single image */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {listing.image_url ? (
              <Image
                src={listing.image_url}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={styles.mainImageImg}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
            <div className={styles.verifiedBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
               TERVERIFIKASI AI
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <span className={styles.ecoBadge}>Pilihan Terkurasi Ramah Lingkungan</span>
          <h1 className={styles.productTitle}>{listing.title}</h1>
          <p className={styles.productPrice}>{formatRupiah(listing.price)}</p>

          {/* Impact Card */}
          {listing.carbon_saved && (
            <div className={styles.impactCard}>
              <div className={styles.impactHeader}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Laporan Dampak Buatan AI</span>
              </div>
              <p className={styles.impactText}>
                Dengan memilih item preloved ini, Anda mencegah{" "}
                <strong className={styles.impactHighlight}>{listing.carbon_saved}</strong> emisi
                dan menghemat sumber daya alam.
              </p>
            </div>
          )}

          {/* Seller Card */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerInfo}>
              {sellerAvatar ? (
                <div className={styles.sellerAvatar}>
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    fill
                    sizes="56px"
                    className={styles.sellerAvatarImg}
                    unoptimized
                  />
                </div>
              ) : (
                <div className={styles.sellerAvatarPlaceholder}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h4 className={styles.sellerName}>{sellerName}</h4>
                <div className={styles.sellerMeta}>
                  <span className={styles.sellerBadge}>Anggota</span>
                  {sellerLocation && (
                    <span className={styles.sellerRating}>
                      📍 {sellerLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className={styles.sellerArrow}>›</span>
          </div>

          {/* Description */}
          <div className={styles.description}>
            <h3 className={styles.descTitle}>Tentang barang ini</h3>
            <p className={styles.descText}>
              {listing.description || "Tidak ada deskripsi."}
            </p>
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Kategori</span>
                <span className={styles.specValue}>
                  {categoryLabels[listing.category] || listing.category}
                </span>
              </div>
              {listing.location && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Lokasi</span>
                  <span className={styles.specValue}>{listing.location}</span>
                </div>
              )}
              {listing.carbon_saved && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Karbon</span>
                  <span className={styles.specValue}>-{listing.carbon_saved}</span>
                </div>
              )}
            </div>
          </div>

          {/* Barter Section */}
          {listing.barter_enabled && (
            <div className={styles.barterSection}>
              <div className={styles.barterHeader}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <h3 className={styles.barterTitle}>Bersedia Barter</h3>
              </div>
              {listing.barter_with && listing.barter_with.length > 0 && (
                <div className={styles.barterWantSection}>
                  <p className={styles.barterWantLabel}>Ingin ditukar dengan:</p>
                  <div className={styles.barterTagList}>
                    {listing.barter_with.map((tag: string, i: number) => (
                      <span key={i} className={styles.barterTag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {listing.barter_notes && (
                <p className={styles.barterNotes}>{listing.barter_notes}</p>
              )}

              {/* Barter Offer Form */}
              <BarterOfferForm
                listingId={listing.id}
                isLoggedIn={!!user}
                isOwnListing={user?.id === listing.user_id}
              />
            </div>
          )}

          {/* CTAs */}
          <div className={styles.ctaGroup}>
            {user?.id !== listing.user_id ? (
              <Link href={`/marketplace/${listing.id}/checkout`} className={styles.buyBtn}>
                Beli Sekarang
              </Link>
            ) : (
              <button className={styles.buyBtn} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Listing Anda Sendiri
              </button>
            )}
            {user?.id !== listing.user_id && (
              <ChatSellerButton
                sellerId={listing.user_id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  image_url: listing.image_url ?? null,
                  carbon_saved: listing.carbon_saved ?? null,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Related Items ── */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <div>
              <span className={styles.relatedLabel}>Kurasi</span>
              <h2 className={styles.relatedTitle}>Mungkin Anda Juga Suka</h2>
            </div>
            <Link href="/marketplace" className={styles.relatedLink}>
              Jelajahi Marketplace →
            </Link>
          </div>

          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`} className={styles.relatedCardLink}>
                <article className={styles.relatedCard}>
                  <div className={styles.relatedImageWrap}>
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={styles.relatedImage}
                      />
                    ) : (
                      <div className={styles.relatedImagePlaceholder}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.relatedInfo}>
                    <h4 className={styles.relatedName}>{item.title}</h4>
                    <div className={styles.relatedBottom}>
                      <span className={styles.relatedPrice}>{formatRupiah(item.price)}</span>
                      {item.carbon_saved && (
                        <span className={styles.relatedCo2}>-{item.carbon_saved}</span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>SirkulasiIn</span>
          <div className={styles.footerLinks}>
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat Layanan</a>
            <a href="#">Metodologi Karbon</a>
            <a href="#">Pusat Bantuan</a>
          </div>
          <p className={styles.footerCopyright}>
            © 2024 SirkulasiIn. Menuai masa depan yang lebih hijau.
          </p>
        </div>
      </footer>
    </main>
  );
}
