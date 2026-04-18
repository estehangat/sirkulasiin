"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { respondBarterOffer } from "@/app/actions/barter";
import styles from "./barter.module.css";

type Listing = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
};

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type IncomingOffer = {
  id: string;
  created_at: string;
  status: string;
  offered_item_name: string;
  offered_item_description: string | null;
  cash_addition: number;
  message: string | null;
  seller_response: string | null;
  listing_id: string;
  marketplace_listings: Listing;
  profiles: Profile | null;
};

export type OutgoingOffer = {
  id: string;
  created_at: string;
  status: string;
  offered_item_name: string;
  offered_item_description: string | null;
  cash_addition: number;
  message: string | null;
  seller_response: string | null;
  listing_id: string;
  marketplace_listings: Listing;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(s: string) {
  switch (s) {
    case "pending":
      return { label: "Menunggu", cls: styles.badgePending };
    case "accepted":
      return { label: "Diterima", cls: styles.badgeAccepted };
    case "rejected":
      return { label: "Ditolak", cls: styles.badgeRejected };
    case "cancelled":
      return { label: "Dibatalkan", cls: styles.badgeCancelled };
    default:
      return { label: s, cls: styles.badgePending };
  }
}

/* ── Icons ── */
const SwapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const InboxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export default function BarterDashboard({
  incomingOffers,
  outgoingOffers,
}: {
  incomingOffers: IncomingOffer[];
  outgoingOffers: OutgoingOffer[];
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const pendingIncoming = incomingOffers.filter((o) => o.status === "pending").length;

  const handleRespond = (offerId: string, status: "accepted" | "rejected") => {
    setFeedback(null);
    startTransition(async () => {
      const result = await respondBarterOffer(offerId, status, responseText || undefined);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: result?.success || "Berhasil!" });
        setRespondingId(null);
        setResponseText("");
        // Refresh page to get updated data
        window.location.reload();
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === "success" ? styles.alertSuccess : styles.alertError}>
          {feedback.text}
          <button className={styles.alertClose} onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "incoming" ? styles.tabActive : ""}`}
          onClick={() => setTab("incoming")}
        >
          <InboxIcon />
          Tawaran Masuk
          {pendingIncoming > 0 && (
            <span className={styles.tabBadge}>{pendingIncoming}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${tab === "outgoing" ? styles.tabActive : ""}`}
          onClick={() => setTab("outgoing")}
        >
          <SendIcon />
          Tawaran Saya
        </button>
      </div>

      {/* ═══ INCOMING TAB ═══ */}
      {tab === "incoming" && (
        <div className={styles.offerList}>
          {incomingOffers.length === 0 ? (
            <div className={styles.emptyState}>
              <SwapIcon />
              <p className={styles.emptyTitle}>Belum ada tawaran masuk</p>
              <p className={styles.emptyDesc}>
                Aktifkan opsi barter saat membuat listing agar orang lain bisa mengajukan tawaran.
              </p>
            </div>
          ) : (
            incomingOffers.map((offer) => {
              const badge = statusBadge(offer.status);
              const offerer = offer.profiles;
              const offererName = offerer?.full_name || offerer?.username || "Pengguna";

              return (
                <div key={offer.id} className={styles.offerCard}>
                  {/* Header */}
                  <div className={styles.offerHeader}>
                    <div className={styles.offerHeaderLeft}>
                      {offerer?.avatar_url ? (
                        <Image
                          src={offerer.avatar_url}
                          alt={offererName}
                          width={36}
                          height={36}
                          className={styles.offerAvatar}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.offerAvatarPlaceholder}>
                          {offererName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className={styles.offerFrom}>{offererName}</p>
                        <p className={styles.offerDate}>{formatDate(offer.created_at)}</p>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                  </div>

                  {/* Content */}
                  <div className={styles.offerBody}>
                    {/* Target listing */}
                    <div className={styles.offerTarget}>
                      <span className={styles.offerLabel}>Listing Anda</span>
                      <Link href={`/marketplace/${offer.marketplace_listings.id}`} className={styles.offerListingLink}>
                        {offer.marketplace_listings.image_url && (
                          <Image
                            src={offer.marketplace_listings.image_url}
                            alt={offer.marketplace_listings.title}
                            width={40}
                            height={40}
                            className={styles.offerListingImg}
                            unoptimized
                          />
                        )}
                        <span>{offer.marketplace_listings.title}</span>
                      </Link>
                    </div>

                    {/* Arrow */}
                    <div className={styles.swapArrow}>
                      <SwapIcon />
                    </div>

                    {/* Offered item */}
                    <div className={styles.offerTarget}>
                      <span className={styles.offerLabel}>Barang Ditawarkan</span>
                      <p className={styles.offerItemName}>{offer.offered_item_name}</p>
                      {offer.offered_item_description && (
                        <p className={styles.offerItemDesc}>{offer.offered_item_description}</p>
                      )}
                    </div>
                  </div>

                  {/* Cash addition */}
                  {offer.cash_addition > 0 && (
                    <div className={styles.cashBadge}>
                      + {formatRupiah(offer.cash_addition)} tuker tambah
                    </div>
                  )}

                  {/* Message */}
                  {offer.message && (
                    <div className={styles.offerMessage}>
                      <span className={styles.offerLabel}>Pesan</span>
                      <p>{offer.message}</p>
                    </div>
                  )}

                  {/* Seller response (if already responded) */}
                  {offer.seller_response && (
                    <div className={styles.offerResponse}>
                      <span className={styles.offerLabel}>Respons Anda</span>
                      <p>{offer.seller_response}</p>
                    </div>
                  )}

                  {/* Actions (only for pending) */}
                  {offer.status === "pending" && (
                    <div className={styles.offerActions}>
                      {respondingId === offer.id ? (
                        <div className={styles.responseForm}>
                          <textarea
                            className={styles.responseTextarea}
                            placeholder="Pesan untuk pengaju (opsional)..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={2}
                          />
                          <div className={styles.responseButtons}>
                            <button
                              className={styles.acceptBtn}
                              onClick={() => handleRespond(offer.id, "accepted")}
                              disabled={isPending}
                            >
                              {isPending ? "..." : "✓ Terima"}
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => handleRespond(offer.id, "rejected")}
                              disabled={isPending}
                            >
                              {isPending ? "..." : "✕ Tolak"}
                            </button>
                            <button
                              className={styles.cancelResBtn}
                              onClick={() => { setRespondingId(null); setResponseText(""); }}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className={styles.respondBtn}
                          onClick={() => setRespondingId(offer.id)}
                        >
                          Respons Tawaran
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ OUTGOING TAB ═══ */}
      {tab === "outgoing" && (
        <div className={styles.offerList}>
          {outgoingOffers.length === 0 ? (
            <div className={styles.emptyState}>
              <SendIcon />
              <p className={styles.emptyTitle}>Belum ada tawaran terkirim</p>
              <p className={styles.emptyDesc}>
                Cari listing yang menerima barter di marketplace dan mulai menawarkan barang Anda.
              </p>
              <Link href="/marketplace" className={styles.emptyBtn}>
                Jelajahi Marketplace
              </Link>
            </div>
          ) : (
            outgoingOffers.map((offer) => {
              const badge = statusBadge(offer.status);

              return (
                <div key={offer.id} className={styles.offerCard}>
                  {/* Header */}
                  <div className={styles.offerHeader}>
                    <div className={styles.offerHeaderLeft}>
                      <div>
                        <p className={styles.offerFrom}>Tawaran Anda</p>
                        <p className={styles.offerDate}>{formatDate(offer.created_at)}</p>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                  </div>

                  {/* Content */}
                  <div className={styles.offerBody}>
                    <div className={styles.offerTarget}>
                      <span className={styles.offerLabel}>Listing Target</span>
                      <Link href={`/marketplace/${offer.marketplace_listings.id}`} className={styles.offerListingLink}>
                        {offer.marketplace_listings.image_url && (
                          <Image
                            src={offer.marketplace_listings.image_url}
                            alt={offer.marketplace_listings.title}
                            width={40}
                            height={40}
                            className={styles.offerListingImg}
                            unoptimized
                          />
                        )}
                        <span>{offer.marketplace_listings.title}</span>
                        <span className={styles.offerListingPrice}>
                          {formatRupiah(offer.marketplace_listings.price)}
                        </span>
                      </Link>
                    </div>

                    <div className={styles.swapArrow}>
                      <SwapIcon />
                    </div>

                    <div className={styles.offerTarget}>
                      <span className={styles.offerLabel}>Barang Anda</span>
                      <p className={styles.offerItemName}>{offer.offered_item_name}</p>
                      {offer.offered_item_description && (
                        <p className={styles.offerItemDesc}>{offer.offered_item_description}</p>
                      )}
                    </div>
                  </div>

                  {offer.cash_addition > 0 && (
                    <div className={styles.cashBadge}>
                      + {formatRupiah(offer.cash_addition)} tuker tambah
                    </div>
                  )}

                  {offer.message && (
                    <div className={styles.offerMessage}>
                      <span className={styles.offerLabel}>Pesan Anda</span>
                      <p>{offer.message}</p>
                    </div>
                  )}

                  {/* Seller response */}
                  {offer.seller_response && (
                    <div className={styles.offerResponse}>
                      <span className={styles.offerLabel}>Respons Penjual</span>
                      <p>{offer.seller_response}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
