"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitWtbOffer, cancelWtbOffer, WtbState } from "@/app/actions/wtb";
import { createClient } from "@/lib/supabase";
import styles from "../wtb.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

type MyOffer = {
  id: string;
  item_name: string;
  price: number;
  status: string;
} | null;

export default function WtbOfferForm({
  wtbId,
  budgetMax,
  isLoggedIn,
  myOffer,
}: {
  wtbId: string;
  budgetMax: number;
  isLoggedIn: boolean;
  myOffer: MyOffer;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<WtbState, FormData>(
    async (prev, formData) => {
      const result = await submitWtbOffer(prev, formData);
      if (result?.room_id) {
        router.push(`/messages?room=${result.room_id}`);
      }
      return result;
    },
    null
  );

  const [priceStr, setPriceStr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const priceNum = parseInt(priceStr.replace(/\./g, "") || "0");
  const overBudget = priceNum > budgetMax;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPriceStr(val ? new Intl.NumberFormat("id-ID").format(parseInt(val)) : "");
  };

  const handleUpload = async (file: File) => {
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran maksimal 2MB.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `wtb-offers/${wtbId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("scan-images").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      setUploadError("Gagal mengunggah gambar.");
      return;
    }
    const { data } = supabase.storage.from("scan-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const handleCancel = async () => {
    if (!myOffer) return;
    setCancelling(true);
    const result = await cancelWtbOffer(myOffer.id);
    setCancelling(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  if (!isLoggedIn) {
    return (
      <p style={{ fontSize: 14, color: "var(--color-gray-500)" }}>
        <Link href={`/login?next=/wtb/${wtbId}`} style={{ color: "var(--color-primary-dark)", fontWeight: 700 }}>
          Login
        </Link>{" "}
        untuk menawarkan barang Anda.
      </p>
    );
  }

  // Sudah pernah menawar → tampilkan status + opsi batal
  if (myOffer && myOffer.status === "pending") {
    return (
      <div>
        <div className={styles.alertSuccess}>
          Tawaran Anda <strong>{myOffer.item_name}</strong> ({formatRupiah(myOffer.price)}) sudah terkirim dan menunggu respon.
        </div>
        <button
          type="button"
          className={styles.smallBtnDanger}
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? "Membatalkan..." : "Batalkan Tawaran"}
        </button>
      </div>
    );
  }

  if (myOffer && myOffer.status !== "pending") {
    return (
      <div className={styles.alert}>
        Tawaran Anda <strong>{myOffer.item_name}</strong> berstatus <strong>{myOffer.status}</strong> untuk permintaan ini.
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="wtb_id" value={wtbId} />
      <input type="hidden" name="item_image_url" value={imageUrl} />

      {state?.error && <div className={styles.alertError}>{state.error}</div>}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="offer-name">
          Nama barang Anda *
        </label>
        <input
          id="offer-name"
          type="text"
          name="item_name"
          className={styles.input}
          placeholder="Contoh: 10 botol kaca selai 500ml"
          required
          maxLength={120}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="offer-desc">
          Kondisi & kelengkapan
        </label>
        <textarea
          id="offer-desc"
          name="item_description"
          className={styles.textarea}
          placeholder="Jelaskan kondisi barang, riwayat pemakaian, kelengkapan..."
          rows={3}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>
          Foto barang <span className={styles.fieldHint}>(opsional, maks 2MB)</span>
        </span>
        <div className={styles.uploadRow}>
          <div className={styles.uploadPreview}>
            {imageUrl ? (
              <Image src={imageUrl} alt="Foto barang" fill sizes="72px" style={{ objectFit: "cover" }} unoptimized />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            )}
          </div>
          <div>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Mengunggah..." : imageUrl ? "Ganti Foto" : "Unggah Foto"}
            </button>
            {uploadError && (
              <p style={{ fontSize: 12, color: "#991b1b", marginTop: 6 }}>{uploadError}</p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="offer-price">
            Harga penawaran *
          </label>
          <div className={styles.currencyInput}>
            <span className={styles.currencyPrefix}>Rp</span>
            <input
              id="offer-price"
              type="text"
              name="price"
              inputMode="numeric"
              value={priceStr}
              onChange={handlePriceChange}
              placeholder="0"
              required
            />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="offer-weight">
            Perkiraan berat (gram)
          </label>
          <input
            id="offer-weight"
            type="number"
            name="weight_grams"
            className={styles.input}
            placeholder="1000"
            min={1}
            defaultValue={1000}
          />
        </div>
      </div>

      {overBudget && (
        <div className={styles.alertWarn}>
          Harga Anda di atas budget pembuat permintaan ({formatRupiah(budgetMax)}).
          Tawaran tetap dikirim — keputusan ada di tangan mereka.
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="offer-message">
          Pesan <span className={styles.fieldHint}>(opsional)</span>
        </label>
        <textarea
          id="offer-message"
          name="message"
          className={styles.textarea}
          placeholder="Hai, barangnya masih bagus dan siap kirim..."
          rows={2}
        />
      </div>

      <button type="submit" className={styles.amberBtn} disabled={isPending || uploading}>
        {isPending ? "Mengirim..." : "Kirim Tawaran"}
      </button>
    </form>
  );
}
