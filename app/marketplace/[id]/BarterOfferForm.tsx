"use client";

import { useActionState, useState } from "react";
import { submitBarterOffer, BarterOfferState } from "@/app/actions/barter";
import styles from "./productDetail.module.css";

export default function BarterOfferForm({
  listingId,
  isLoggedIn,
  isOwnListing,
}: {
  listingId: string;
  isLoggedIn: boolean;
  isOwnListing: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<BarterOfferState, FormData>(
    submitBarterOffer,
    null
  );

  const [cashStr, setCashStr] = useState("");

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      setCashStr(new Intl.NumberFormat("id-ID").format(parseInt(val)));
    } else {
      setCashStr("");
    }
  };

  if (isOwnListing) return null;

  if (!isLoggedIn) {
    return (
      <p className={styles.barterLoginHint}>
        <a href="/login?next=/marketplace">Login</a> untuk mengajukan tawaran barter.
      </p>
    );
  }

  return (
    <div className={styles.barterFormWrap}>
      {!isOpen ? (
        <button
          type="button"
          className={styles.barterOfferBtn}
          onClick={() => setIsOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Ajukan Tawaran Barter
        </button>
      ) : (
        <form action={formAction} className={styles.barterForm}>
          <input type="hidden" name="listing_id" value={listingId} />

          {state?.error && (
            <div className={styles.barterAlert} style={{ color: "#dc2626", background: "#fef2f2" }}>
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className={styles.barterAlert} style={{ color: "#166534", background: "#dcfce7" }}>
              {state.success}
            </div>
          )}

          <div className={styles.barterFieldGroup}>
            <label className={styles.barterLabel}>Barang yang Anda tawarkan *</label>
            <input
              type="text"
              name="offered_item_name"
              className={styles.barterInput}
              placeholder="Contoh: Laptop ASUS VivoBook 2023"
              required
            />
          </div>

          <div className={styles.barterFieldGroup}>
            <label className={styles.barterLabel}>Deskripsi barang</label>
            <textarea
              name="offered_item_description"
              className={styles.barterTextarea}
              placeholder="Jelaskan kondisi, spesifikasi, dan kelengkapan barang Anda..."
              rows={3}
            />
          </div>

          <div className={styles.barterFieldGroup}>
            <label className={styles.barterLabel}>
              Tuker tambah (opsional)
              <span className={styles.barterLabelHint}>— tambahan uang jika nilai barang tidak setara</span>
            </label>
            <div className={styles.barterCashInput}>
              <span className={styles.barterCashPrefix}>Rp</span>
              <input
                type="text"
                name="cash_addition"
                className={styles.barterInput}
                value={cashStr}
                onChange={handleCashChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className={styles.barterFieldGroup}>
            <label className={styles.barterLabel}>Pesan untuk penjual</label>
            <textarea
              name="message"
              className={styles.barterTextarea}
              placeholder="Hai, saya tertarik untuk barter..."
              rows={2}
            />
          </div>

          <div className={styles.barterActions}>
            <button
              type="submit"
              className={styles.barterSubmitBtn}
              disabled={isPending}
            >
              {isPending ? "Mengirim..." : "Kirim Tawaran"}
            </button>
            <button
              type="button"
              className={styles.barterCancelBtn}
              onClick={() => setIsOpen(false)}
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
