"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { publishListing, saveDraft, ListingState } from "@/app/actions/listings";
import styles from "./createListing.module.css";

const CloudDoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17l5.09-5.09L16.5 10.5 10 17z" />
  </svg>
);

const AutoAwesomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5 .5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
  </svg>
);

const categories = [
  { id: "glass", label: "Kaca", icon: "liquor" },
  { id: "plastic", label: "Plastik", icon: "inventory_2" },
  { id: "paper", label: "Kertas", icon: "description" },
  { id: "metal", label: "Logam", icon: "hardware" },
  { id: "textile", label: "Tekstil", icon: "checkroom" },
  { id: "electronic", label: "Elektronik", icon: "devices" },
  { id: "other", label: "Lainnya", icon: "category" },
];

/** Parse "Rp 50.000 – Rp 100.000" → { min: 50000, max: 100000 } */
function parseEstimatedPrice(str: string | null | undefined): { min: number; max: number } | null {
  if (!str) return null;
  const nums = str.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map((n) => parseInt(n.replace(/\./g, ""), 10)).filter(Boolean);
  if (parsed.length === 0) return null;
  if (parsed.length === 1) return { min: parsed[0], max: parsed[0] };
  return { min: Math.min(...parsed), max: Math.max(...parsed) };
}

function formatRupiah(number: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

type ScanData = {
  id?: string | null;
  estimated_price?: string | null;
  ai_price_min?: number | null;
  ai_price_max?: number | null;
  category?: string | null;
  hero_description?: string | null;
  reason?: string | null;
  condition?: string | null;
  material?: string | null;
  image_url?: string | null;
  carbon_saved?: string | null;
  eco_points?: number | null;
  item_name?: string | null;
  weight?: string | number | null;
};

export default function CreateListingForm({ scanData }: { scanData: ScanData | null }) {
  const [publishState, publishAction, isPublishing] = useActionState<ListingState, FormData>(
    publishListing,
    null
  );
  
  const [draftState, draftAction, isSavingDraft] = useActionState<ListingState, FormData>(
    saveDraft,
    null
  );

  // Form states
  const parsedPrice = parseEstimatedPrice(scanData?.estimated_price);
  const aiPriceMin = parsedPrice?.min || scanData?.ai_price_min || 5000;
  const aiPriceMax = parsedPrice?.max || scanData?.ai_price_max || 15000;
  
  const [category, setCategory] = useState(scanData?.category || "glass");
  const [priceStr, setPriceStr] = useState(() => {
    const initial = aiPriceMin;
    return new Intl.NumberFormat("id-ID").format(initial);
  });
  const [weightGrams, setWeightGrams] = useState(() => {
    // Coba parse dari scan data (weight biasanya dalam format "500g" atau "1kg")
    if (scanData?.weight) {
      const parsed = parseInt(String(scanData.weight).replace(/[^0-9]/g, ""));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 500;
  });
  const [barterEnabled, setBarterEnabled] = useState(false);
  const [barterTags, setBarterTags] = useState<string[]>([]);
  const [barterTagInput, setBarterTagInput] = useState("");
  const [barterNotes, setBarterNotes] = useState("");
  const [description, setDescription] = useState(
    scanData?.hero_description ||
    scanData?.reason ||
    `Item preloved berkualitas, siap untuk digunakan kembali atau di-upcycle. Ditemukan dalam kondisi ${scanData?.condition || 'baik'}, material ${scanData?.material || 'campuran'}.`
  );

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and format with dots
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val));
      setPriceStr(formatted);
    } else {
      setPriceStr("");
    }
  };

  const isPending = isPublishing || isSavingDraft;
  const error = publishState?.error || draftState?.error;
  const success = draftState?.success;

  return (
    <>
      <div className={styles.leftColumn}>
        {/* Image Card */}
        <div className={styles.imageCard}>
          <div className={styles.imageRatio}>
            <Image
              src={scanData?.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuC9XDMEkjyn6FjzxU44nx3oCm0VttCZINCbtm1u9UawrS1PrNHpc6Y0oyzfje4SVqt3f1jAR1TOxvGJNe0Fznv3wNMdWZn1kCNxvkjY8SfSD6na36TJtpoO6w-AUjIEzjZ5se4vBHcm84LBUELc4gv0ZQz7tbiQnvet-8fQdbju5NPs7cW2gRfKzFke0Qg0-UgrW_VP-Z0huMRGRGfeqZnhgjJcosm3jSegI3OoRY-ENOTiGmDy2fogJNuFprv8QovPnq2EY9Jst8zZ"}
              alt="Scan"
              fill
              className={styles.scanImage}
              unoptimized
            />
            <div className={styles.imageOverlay} />
            <div className={styles.imageLabel}>
              <span className={styles.scannedBadge}>Scan Berhasil</span>
            </div>
          </div>
        </div>

        {/* Impact Card */}
        <div className={styles.impactCard}>
          <div className={styles.impactBgIcon}>
            <CloudDoneIcon />
          </div>
          <div className={styles.impactContent}>
            <div className={styles.impactIconWrap}>
              <CloudDoneIcon />
            </div>
            <div>
              <h4 className={styles.impactTitle}>Preview Dampak Lingkungan</h4>
              <p className={styles.impactDesc}>
                Menjual item ini mencegah <span className={styles.impactHighlight}>{scanData?.carbon_saved || "0.5kg CO2"}</span> memasuki atmosfer. Anda membuat perbedaan.
              </p>
            </div>
          </div>
          <div className={styles.impactFooter}>
            <span className={styles.impactFooterLabel}>Potensi Poin</span>
            <span className={styles.impactFooterValue}>+{scanData?.eco_points || 120} EP</span>
          </div>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Finalisasi Listing</h1>
          <p className={styles.pageDesc}>
            AI kami telah menganalisis item Anda dan menyiapkan draf konfigurasi terbaik untuk penjualan cepat.
          </p>
        </header>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.errorBanner} style={{backgroundColor: '#dcfce7', color: '#166534'}}>{success}</div>}

        <form className={styles.form}>
          {/* Hidden inputs for DB */}
          <input type="hidden" name="scan_id" value={scanData?.id || ""} />
          <input type="hidden" name="title" value={scanData?.item_name || "Preloved Item"} />
          <input type="hidden" name="image_url" value={scanData?.image_url || ""} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="ai_price_min" value={aiPriceMin} />
          <input type="hidden" name="ai_price_max" value={aiPriceMax} />
          <input type="hidden" name="carbon_saved" value={scanData?.carbon_saved || "0.5kg CO2"} />
          <input type="hidden" name="eco_points" value={scanData?.eco_points || 120} />
          <input type="hidden" name="barter_enabled" value={barterEnabled ? "on" : ""} />
          <input type="hidden" name="barter_with" value={barterTags.join(",")} />
          <input type="hidden" name="barter_notes" value={barterNotes} />
          <input type="hidden" name="weight_grams" value={weightGrams} />

          {/* Price Range */}
          <section>
            <label className={styles.sectionLabel}>
              Estimasi Harga AI <span className={styles.aiIcon}><AutoAwesomeIcon /></span>
            </label>
            <div className={styles.priceDisplayBox}>
              <div className={styles.priceRange}>
                {formatRupiah(aiPriceMin)} - {formatRupiah(aiPriceMax)}
              </div>
              <div className={styles.priceDesc}>Berdasarkan data penjualan terbaru di wilayah Anda</div>
            </div>

            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>HARGA ANDA</span>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input
                    type="text"
                    name="price"
                    className={styles.inputField}
                    value={priceStr}
                    onChange={handlePriceChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>MATA UANG</span>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={`${styles.inputField} ${styles.inputFieldReadOnly}`}
                    value="IDR"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Weight */}
          <section>
            <label className={styles.sectionLabel}>
              Berat Barang <span style={{ fontSize: "13px", fontWeight: 500, color: "#737369" }}>(gram)</span>
            </label>
            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>BERAT (GRAM)</span>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={weightGrams}
                    min={1}
                    max={30000}
                    step={1}
                    required
                    onChange={(e) => setWeightGrams(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>SETARA</span>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={`${styles.inputField} ${styles.inputFieldReadOnly}`}
                    value={weightGrams >= 1000 ? `${(weightGrams / 1000).toFixed(1)} kg` : `${weightGrams} g`}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "#737369", marginTop: "8px" }}>
              Digunakan untuk kalkulasi ongkos kirim. Contoh: 500 = setengah kilogram.
            </p>
          </section>

          {/* Category */}
          <section>
            <label className={styles.sectionLabel}>Pilih Kategori</label>
            <div className={styles.categoryGrid}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`${styles.categoryBtn} ${category === cat.id ? styles.categoryBtnActive : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Description */}
          <section>
            <div className={styles.descHeader}>
              <label className={styles.sectionLabel} style={{ marginBottom: 0 }}>
                Deskripsi Pintar
              </label>
              <button type="button" className={styles.regenBtn}>
                <AutoAwesomeIcon /> Regenerasi AI
              </button>
            </div>
            <textarea
              name="description"
              className={styles.textArea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </section>

          {/* Barter Option */}
          <section>
            <label className={styles.sectionLabel}>Opsi Barter</label>
            <div className={styles.barterToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${barterEnabled ? styles.toggleBtnActive : ""}`}
                onClick={() => setBarterEnabled(!barterEnabled)}
              >
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleThumb} />
                </span>
                Bersedia Barter / Tuker Tambah
              </button>
            </div>

            {barterEnabled && (
              <div className={styles.barterFields}>
                <div className={styles.barterTagSection}>
                  <span className={styles.inputLabel}>BARANG YANG DIINGINKAN</span>
                  <div className={styles.barterTagInputWrap}>
                    {barterTags.map((tag, i) => (
                      <span key={i} className={styles.barterTag}>
                        {tag}
                        <button
                          type="button"
                          className={styles.barterTagRemove}
                          onClick={() => setBarterTags(barterTags.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className={styles.barterTagInput}
                      placeholder="Ketik lalu Enter..."
                      value={barterTagInput}
                      onChange={(e) => setBarterTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && barterTagInput.trim()) {
                          e.preventDefault();
                          setBarterTags([...barterTags, barterTagInput.trim()]);
                          setBarterTagInput("");
                        }
                        if (e.key === "Backspace" && !barterTagInput && barterTags.length > 0) {
                          setBarterTags(barterTags.slice(0, -1));
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span className={styles.inputLabel}>CATATAN BARTER</span>
                  <textarea
                    className={styles.textArea}
                    value={barterNotes}
                    onChange={(e) => setBarterNotes(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Saya lebih berminat tukar dengan barang elektronik, kondisi minimal 80%..."
                  />
                </div>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className={styles.actionGroup}>
            <button
              formAction={publishAction}
              className={styles.publishBtn}
              disabled={isPending}
            >
              {isPublishing ? "Memproses..." : "Publikasi Listing"}
            </button>
            <button
              formAction={draftAction}
              className={styles.draftBtn}
              disabled={isPending}
            >
              {isSavingDraft ? "Menyimpan..." : "Simpan Draf"}
            </button>
          </div>
        </form>
      </div>

      <Link href="/scan" className={styles.discardBtn}>
        <div className={styles.discardIconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </div>
        <span className={styles.discardText}>Batal</span>
      </Link>
    </>
  );
}
