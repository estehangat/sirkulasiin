import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BarterOfferForm from "./BarterOfferForm";
import ChatSellerButton from "./ChatSellerButton";
import FavoriteButton from "../FavoriteButton";
import ViewTracker from "./ViewTracker";
import styles from "./productDetail.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
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

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location")
    .eq("id", listing.user_id)
    .single();

  const sellerName = sellerProfile?.full_name || sellerProfile?.username || "Penjual";
  const sellerAvatar = sellerProfile?.avatar_url || null;
  const sellerLocation = sellerProfile?.location || listing.location || null;

  const { data: relatedListings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, image_url, carbon_saved")
    .eq("status", "published")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const related = relatedListings ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAvailable = listing.status === "published";
  const isOwnListing = user?.id === listing.user_id;

  return (
    <main className={styles.pageShell}>
      <ViewTracker listingId={listing.id} />
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
        {/* ── Gallery (sticky on desktop) ── */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {listing.image_url ? (
              <Image
                src={listing.image_url}
                alt={listing.title}
                fill
                priority
                unoptimized
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

            {/* Overlay badges & actions */}
            <div className={styles.imageBadges}>
              <div className={styles.verifiedBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                TERVERIFIKASI AI
              </div>
              <div className={styles.imageActions}>
                <FavoriteButton listingId={listing.id} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Info ── */}
        <div className={styles.productInfo}>
          {/* Badge Row */}
          <div className={styles.badgeRow}>
            <span className={styles.categoryBadge}>
              {categoryLabels[listing.category] || listing.category}
            </span>
            {listing.barter_enabled && (
              <span className={styles.barterBadgeInline}>Bisa Barter</span>
            )}
            {listing.carbon_saved && (
              <span className={styles.ecoBadge}>Eco-Friendly</span>
            )}
          </div>

          {/* Title */}
          <h1 className={styles.productTitle}>{listing.title}</h1>

          {/* Price */}
          <div className={styles.priceRow}>
            <span className={styles.productPrice}>{formatRupiah(listing.price)}</span>
          </div>

          {/* Meta: views, time, location */}
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {listing.view_count ?? 0} dilihat
            </span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {timeAgo(listing.created_at)}
            </span>
            {listing.location && (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {listing.location}
                </span>
              </>
            )}
          </div>

          <div className={styles.divider} />

          {/* Impact Card */}
          {listing.carbon_saved && (
            <div className={styles.impactCard}>
              <div className={styles.impactHeader}>
                <div className={styles.impactIconWrap}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 8C17 8 21 12.5 21 15C21 17.4853 18.9853 19.5 16.5 19.5C14.0147 19.5 12 17.4853 12 15C12 12.5 16 8 17 8Z" />
                    <path d="M7 3C7 3 3 7.5 3 10C3 12.4853 5.01472 14.5 7.5 14.5C9.98528 14.5 12 12.4853 12 10C12 7.5 8 3 7 3Z" />
                  </svg>
                </div>
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
          <Link href={`/profile?id=${listing.user_id}`} className={styles.sellerCard} style={{ textDecoration: "none", color: "inherit" }}>
            <div className={styles.sellerInfo}>
              {sellerAvatar ? (
                <div className={styles.sellerAvatar}>
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    fill
                    sizes="52px"
                    className={styles.sellerAvatarImg}
                    unoptimized
                  />
                </div>
              ) : (
                <div className={styles.sellerAvatarPlaceholder}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h4 className={styles.sellerName}>{sellerName}</h4>
                <div className={styles.sellerMeta}>
                  <span className={styles.sellerBadge}>Penjual</span>
                  {sellerLocation && (
                    <span className={styles.sellerRating}>
                      📍 {sellerLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className={styles.sellerArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </Link>

          <div className={styles.divider} />

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
          {listing.barter_enabled && isAvailable && (
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
              <BarterOfferForm
                listingId={listing.id}
                isLoggedIn={!!user}
                isOwnListing={isOwnListing}
              />
            </div>
          )}

          {/* Status Banner */}
          {!isAvailable && (
            <div className={`${styles.statusBanner} ${
              listing.status === "sold" ? styles.statusSold
                : listing.status === "reserved" ? styles.statusReserved
                  : styles.statusOther
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
              {listing.status === "sold"
                ? "Listing ini sudah terjual dan tidak tersedia lagi."
                : listing.status === "reserved"
                  ? "Listing ini sedang diproses oleh pembeli lain."
                  : "Listing ini sedang tidak tersedia."}
            </div>
          )}

          {/* CTAs (hidden on mobile, replaced by sticky bar) */}
          <div className={styles.ctaGroup}>
            {!isOwnListing && isAvailable ? (
              <Link href={`/marketplace/${listing.id}/checkout`} className={styles.buyBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Beli Sekarang
              </Link>
            ) : (
              <button className={styles.buyBtn} disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                {isOwnListing ? "Listing Anda Sendiri" : "Tidak Tersedia"}
              </button>
            )}
            {!isOwnListing && (
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

      {/* ── Mobile Sticky CTA ── */}
      {isAvailable && !isOwnListing && (
        <div className={styles.mobileCta}>
          <span className={styles.mobilePrice}>{formatRupiah(listing.price)}</span>
          <Link href={`/marketplace/${listing.id}/checkout`} className={styles.mobileBuyBtn}>
            Beli Sekarang
          </Link>
        </div>
      )}

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
                        sizes="(max-width: 768px) 50vw, 25vw"
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

    </main>
  );
}
