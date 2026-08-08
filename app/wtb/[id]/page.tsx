import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import WtbOfferForm from "./WtbOfferForm";
import WtbOwnerOffers from "./WtbOwnerOffers";
import WtbEditForm from "./WtbEditForm";
import WtbCloseButton from "./WtbCloseButton";
import styles from "../wtb.module.css";

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
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export default async function WtbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!wtb) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location")
    .eq("id", wtb.user_id)
    .single();

  const requesterName = requesterProfile?.full_name || requesterProfile?.username || "Warga";
  const isOwner = user?.id === wtb.user_id;
  const isOpen = wtb.status === "open" && daysLeft(wtb.expires_at) > 0;
  const remainingDays = daysLeft(wtb.expires_at);

  // Penawar wajib punya alamat asal (dipakai untuk ongkir saat checkout).
  // Cek lebih awal supaya form tidak ditampilkan sebelum alamat diisi.
  let viewerHasAddress = false;
  if (user && !isOwner) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("shipping_area_id")
      .eq("id", user.id)
      .single();
    viewerHasAddress = !!viewerProfile?.shipping_area_id;
  }

  // ─── Offers ───
  type SellerLite = {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  type OfferRow = {
    id: string;
    wtb_id: string;
    seller_id: string;
    item_name: string;
    item_description: string | null;
    item_image_url: string | null;
    price: number;
    weight_grams: number;
    message: string | null;
    status: string;
    created_at: string;
    seller?: SellerLite | null;
  };

  let offers: OfferRow[] = [];
  let myOffer: OfferRow | null = null;

  if (isOwner) {
    const { data } = await supabase
      .from("wtb_offers")
      .select("*")
      .eq("wtb_id", wtb.id)
      .order("created_at", { ascending: false });
    offers = data ?? [];

    const sellerIds = [...new Set(offers.map((o) => o.seller_id))];
    const { data: sellerProfiles } = sellerIds.length
      ? await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", sellerIds)
      : { data: [] };
    const sellerMap = Object.fromEntries((sellerProfiles ?? []).map((p) => [p.id, p]));
    offers = offers.map((o) => ({ ...o, seller: sellerMap[o.seller_id] ?? null }));
  } else if (user) {
    const { data } = await supabase
      .from("wtb_offers")
      .select("*")
      .eq("wtb_id", wtb.id)
      .eq("seller_id", user.id)
      .maybeSingle();
    myOffer = data ?? null;
  }

  const pendingCount = offers.filter((o) => o.status === "pending").length;

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />

      <div className={styles.container}>
        <nav className={styles.breadcrumbs}>
          <Link href="/marketplace">Marketplace</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link href="/marketplace?tab=dicari">Sedang Dicari</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{wtb.title}</span>
        </nav>

        <div className={styles.detailLayout}>
          {/* ── Kiri: kartu permintaan ── */}
          <div className={styles.requestCard}>
            <span className={styles.stampBig}>Dicari</span>
            <h1 className={styles.requestTitle}>{wtb.title}</h1>

            <div className={styles.chipRow}>
              <span className={styles.chipGreen}>
                {CATEGORY_LABELS[wtb.category] || wtb.category}
              </span>
              <span className={styles.chip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {wtb.city}
              </span>
              <span className={styles.chip}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {timeAgo(wtb.created_at)}
              </span>
              {wtb.status === "open" && (
                <span className={styles.chip}>
                  Berakhir dalam {remainingDays} hari
                </span>
              )}
            </div>

            <div className={styles.budgetHero}>
              <div>
                <span className={styles.budgetHeroLabel}>Budget Maksimal</span>
                <p className={styles.budgetHeroValue}>{formatRupiah(wtb.budget_max)}</p>
              </div>
              <span className={styles.budgetHeroNote}>
                Penjual boleh menawar di atas budget — keputusan akhir di tangan pembuat permintaan.
              </span>
            </div>

            {wtb.description && (
              <div className={styles.descSection}>
                <h3 className={styles.descTitle}>Detail yang dicari</h3>
                <p className={styles.descText}>{wtb.description}</p>
              </div>
            )}

            <Link href={`/profile?id=${wtb.user_id}`} className={styles.requesterCard}>
              {requesterProfile?.avatar_url ? (
                <div className={styles.requesterAvatar}>
                  <Image
                    src={requesterProfile.avatar_url}
                    alt={requesterName}
                    fill
                    sizes="44px"
                    className={styles.requesterAvatarImg}
                    unoptimized
                  />
                </div>
              ) : (
                <div className={styles.requesterAvatarPlaceholder}>
                  {requesterName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className={styles.requesterName}>{requesterName}</p>
                <p className={styles.requesterMeta}>
                  Pembuat permintaan{requesterProfile?.location ? ` · ${requesterProfile.location}` : ""}
                </p>
              </div>
            </Link>

            {isOwner && wtb.status === "open" && (
              <>
                <div className={styles.divider} />
                <WtbEditForm wtb={wtb} />
                <div style={{ marginTop: 14 }}>
                  <WtbCloseButton wtbId={wtb.id} />
                </div>
              </>
            )}
          </div>

          {/* ── Kanan: area tawaran ── */}
          <div className={styles.sectionGap}>
            {wtb.status === "in_checkout" && (
              <div className={styles.statusLocked}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {isOwner
                  ? "Anda sudah menerima satu tawaran. Selesaikan pembayaran sebelum sesi berakhir."
                  : "Permintaan ini sedang dalam proses pembayaran oleh pembuatnya."}
              </div>
            )}

            {wtb.status === "fulfilled" && (
              <div className={styles.statusDone}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                Permintaan ini sudah terpenuhi. Terima kasih sudah mengedarkan barang!
              </div>
            )}

            {(wtb.status === "closed" || wtb.status === "expired" || (wtb.status === "open" && remainingDays <= 0)) && (
              <div className={styles.statusDone}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                Permintaan ini sudah tidak aktif.
              </div>
            )}

            {isOwner && wtb.status === "in_checkout" && (
              <Link href={`/wtb/${wtb.id}/checkout`} className={styles.primaryBtn}>
                Lanjut ke Pembayaran →
              </Link>
            )}

            {/* ── Pemilik: kelola tawaran ── */}
            {isOwner && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  Tawaran Masuk {offers.length > 0 && `(${pendingCount} baru)`}
                </h2>
                <p className={styles.cardSubtitle}>
                  Terima satu tawaran untuk mengunci permintaan ini dan lanjut ke pembayaran.
                </p>
                <WtbOwnerOffers
                  offers={offers}
                  budgetMax={wtb.budget_max}
                  canRespond={wtb.status === "open"}
                  acceptedOfferId={wtb.accepted_offer_id}
                />
              </div>
            )}

            {/* ── Bukan pemilik: kirim tawaran ── */}
            {!isOwner && isOpen && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Punya barangnya?</h2>
                <p className={styles.cardSubtitle}>
                  Tawarkan barangmu langsung ke pembuat permintaan.
                </p>
                {user && !viewerHasAddress ? (
                  <div className={styles.alertWarn} style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                        <rect width="9" height="11" x="11" y="6" rx="2" />
                        <circle cx="7.5" cy="17.5" r="2.5" />
                        <circle cx="17.5" cy="17.5" r="2.5" />
                      </svg>
                      <div>
                        <p style={{ fontWeight: 800, marginBottom: 4 }}>
                          Isi alamat pengiriman dulu
                        </p>
                        <p style={{ fontWeight: 500, lineHeight: 1.6, marginBottom: 12 }}>
                          Alamat Anda dipakai sebagai alamat asal untuk menghitung ongkir
                          saat pembuat permintaan menerima tawaran Anda.
                        </p>
                        <Link
                          href="/dashboard/settings?alert=address_required"
                          className={styles.smallBtnPrimary}
                        >
                          Isi Alamat Sekarang →
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <WtbOfferForm
                    wtbId={wtb.id}
                    budgetMax={wtb.budget_max}
                    isLoggedIn={!!user}
                    myOffer={myOffer}
                  />
                )}
              </div>
            )}

            {!isOwner && !isOpen && myOffer && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Tawaran Anda</h2>
                <p className={styles.cardSubtitle}>
                  {myOffer.status === "accepted"
                    ? "Tawaran Anda diterima untuk permintaan ini."
                    : myOffer.status === "pending"
                      ? "Tawaran Anda masih menunggu respon."
                      : `Status tawaran Anda: ${myOffer.status}.`}
                </p>
                <WtbOwnerOffers
                  offers={[myOffer]}
                  budgetMax={wtb.budget_max}
                  canRespond={false}
                  acceptedOfferId={wtb.accepted_offer_id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
