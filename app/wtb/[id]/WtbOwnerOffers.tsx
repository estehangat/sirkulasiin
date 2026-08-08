"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { respondWtbOffer } from "@/app/actions/wtb";
import styles from "../wtb.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

type Offer = {
  id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  price: number;
  message: string | null;
  status: string;
  created_at: string;
  seller?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Menunggu", bg: "#fef9c3", color: "#854d0e" },
  accepted: { label: "Diterima", bg: "#dcfce7", color: "#166534" },
  rejected: { label: "Ditolak", bg: "#fef2f2", color: "#991b1b" },
  cancelled: { label: "Dibatalkan", bg: "#f3f4f6", color: "#374151" },
};

export default function WtbOwnerOffers({
  offers,
  budgetMax,
  canRespond,
  acceptedOfferId,
}: {
  offers: Offer[];
  budgetMax: number;
  canRespond: boolean;
  acceptedOfferId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept] = useState<Offer | null>(null);
  const [error, setError] = useState("");

  const handleRespond = (offerId: string, action: "accepted" | "rejected") => {
    setError("");
    setProcessingId(offerId);
    startTransition(async () => {
      const result = await respondWtbOffer(offerId, action);
      // accepted → server redirect ke halaman checkout
      if (result?.error) {
        setError(result.error);
        setProcessingId(null);
        setConfirmAccept(null);
        return;
      }
      router.refresh();
      setProcessingId(null);
      setConfirmAccept(null);
    });
  };

  if (offers.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--color-gray-400)", lineHeight: 1.6 }}>
        Belum ada tawaran masuk. Bagikan permintaan ini ke komunitas Anda untuk mempercepat.
      </p>
    );
  }

  return (
    <>
      {error && <div className={styles.alertError}>{error}</div>}
      <div className={styles.offerList}>
        {offers.map((offer) => {
          const chip = STATUS_CHIP[offer.status] ?? STATUS_CHIP.pending;
          const sellerName =
            offer.seller?.full_name || offer.seller?.username || "Penawar";
          const isAccepted = offer.id === acceptedOfferId || offer.status === "accepted";
          const isMuted = offer.status === "rejected" || offer.status === "cancelled";
          const overBudget = offer.price > budgetMax;

          return (
            <div
              key={offer.id}
              className={
                isAccepted
                  ? styles.offerCardAccepted
                  : isMuted
                    ? styles.offerCardMuted
                    : styles.offerCard
              }
            >
              <div className={styles.offerHeader}>
                <div className={styles.offerThumb}>
                  {offer.item_image_url ? (
                    <Image
                      src={offer.item_image_url}
                      alt={offer.item_name}
                      fill
                      sizes="52px"
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className={styles.offerBody}>
                  <p className={styles.offerItemName}>{offer.item_name}</p>
                  <p className={styles.offerSeller}>dari {sellerName}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className={styles.offerPrice}>{formatRupiah(offer.price)}</p>
                  {overBudget && (
                    <p className={styles.offerOverBudget}>di atas budget</p>
                  )}
                </div>
              </div>

              {offer.item_description && (
                <p className={styles.offerDesc}>{offer.item_description}</p>
              )}
              {offer.message && (
                <p className={styles.offerMessage}>&ldquo;{offer.message}&rdquo;</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <span
                  className={styles.offerStatusChip}
                  style={{ background: chip.bg, color: chip.color }}
                >
                  {chip.label}
                </span>

                {canRespond && offer.status === "pending" && (
                  <div className={styles.offerActions}>
                    <button
                      type="button"
                      className={styles.smallBtnPrimary}
                      disabled={isPending}
                      onClick={() => setConfirmAccept(offer)}
                    >
                      Terima & Bayar
                    </button>
                    <button
                      type="button"
                      className={styles.smallBtnDanger}
                      disabled={isPending && processingId === offer.id}
                      onClick={() => handleRespond(offer.id, "rejected")}
                    >
                      {isPending && processingId === offer.id ? "Memproses..." : "Tolak"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal konfirmasi terima tawaran ── */}
      {confirmAccept && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setConfirmAccept(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 8 }}>
              Terima tawaran ini?
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-gray-600)", lineHeight: 1.6, marginBottom: 8 }}>
              <strong>{confirmAccept.item_name}</strong> — {formatRupiah(confirmAccept.price)}
            </p>
            <p style={{ fontSize: 13, color: "var(--color-gray-500)", lineHeight: 1.6, marginBottom: 22 }}>
              Permintaan Anda akan dikunci, tawaran lain dibatalkan, dan Anda akan
              diarahkan ke halaman pembayaran. Jika pembayaran batal atau kedaluwarsa,
              permintaan otomatis terbuka kembali.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className={styles.smallBtnGhost}
                style={{ flex: 1 }}
                onClick={() => setConfirmAccept(null)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.smallBtnPrimary}
                style={{ flex: 1 }}
                disabled={isPending}
                onClick={() => handleRespond(confirmAccept.id, "accepted")}
              >
                {isPending ? "Memproses..." : "Ya, Lanjut Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
