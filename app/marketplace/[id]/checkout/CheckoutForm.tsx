"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { placeOrder, CheckoutState } from "@/app/actions/checkout";
import type { ShippingOption } from "@/lib/rajaongkir";
import styles from "./checkout.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

type BuyerProfile = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  address: string | null;
  province_id: string | null;
  province_name: string | null;
  city_id: string | null;
  city_name: string | null;
  district_name: string | null;
  village_name: string | null;
  postal_code: string | null;
  full_address: string | null;
} | null;

type Props = {
  listing: {
    id: string;
    user_id: string;
    title: string;
    price: number;
    image_url: string | null;
    category: string;
    carbon_saved: string | null;
    weight_grams: number;
  };
  sellerName: string;
  sellerAvatar: string | null;
  sellerCityId: string;
  weightGrams: number;
  buyerProfile: BuyerProfile;
};

/* ── Icons ── */
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LeafIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
    <rect width="9" height="11" x="11" y="6" rx="2" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const COURIER_LABELS: Record<string, string> = {
  jne: "JNE",
  tiki: "TIKI",
  pos: "POS Indonesia",
};

export default function CheckoutForm({
  listing,
  sellerName,
  sellerAvatar,
  sellerCityId,
  weightGrams,
  buyerProfile,
}: Props) {
  const [state, formAction, isPending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    null
  );

  const shippingName = buyerProfile?.full_name || "";
  const shippingPhone = buyerProfile?.phone || "";
  const selectedCityId = buyerProfile?.city_id || "";

  // Compose display address from all address fields
  const addressLines = [
    buyerProfile?.full_address,
    [buyerProfile?.village_name, buyerProfile?.district_name ? `Kec. ${buyerProfile.district_name}` : null]
      .filter(Boolean).join(", "),
    [buyerProfile?.city_name, buyerProfile?.province_name, buyerProfile?.postal_code]
      .filter(Boolean).join(", "),
  ].filter(Boolean);
  const shippingAddress = addressLines.join("\n");
  const hasAddress = !!(buyerProfile?.city_id && buyerProfile?.full_address);

  const [shippingNotes, setShippingNotes] = useState("");

  // ── Shipping ──────────────────────────────────────────────
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");

  // Auto-fetch ongkir saat mount (city sudah dari profile)
  useEffect(() => {
    if (!selectedCityId || !sellerCityId) return;
    setLoadingShipping(true);
    setShippingError("");
    setSelectedShipping(null);
    setShippingOptions([]);
    fetch("/api/shipping/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin_city_id: sellerCityId,
        dest_city_id: selectedCityId,
        weight_grams: weightGrams,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.results) setShippingOptions(d.results as ShippingOption[]);
        else setShippingError("Gagal memuat pilihan ongkir.");
      })
      .catch(() => setShippingError("Gagal memuat ongkir. Coba lagi."))
      .finally(() => setLoadingShipping(false));
  }, [selectedCityId, sellerCityId, weightGrams]);

  const shippingCost = selectedShipping?.cost ?? 0;
  const totalPrice = listing.price + shippingCost;
  const canSubmit = !!selectedShipping && !isPending && hasAddress;

  return (
    <>
      <Link href={`/marketplace/${listing.id}`} className={styles.backLink}>
        <ChevronLeft />
        Kembali ke Detail Produk
      </Link>

      <h1 className={styles.pageTitle}>Checkout</h1>
      <p className={styles.pageSubtitle}>Konfirmasi pesanan dan isi detail pengiriman Anda.</p>

      {state?.error && (
        <div className={styles.errorBanner}>{state.error}</div>
      )}

      <form action={formAction} className={styles.checkoutGrid}>
        {/* Hidden fields */}
        <input type="hidden" name="listing_id" value={listing.id} />
        <input type="hidden" name="seller_id" value={listing.user_id} />
        <input type="hidden" name="total_price" value={totalPrice} />
        <input type="hidden" name="shipping_cost" value={shippingCost} />
        <input type="hidden" name="shipping_courier" value={selectedShipping?.courier ?? ""} />
        <input type="hidden" name="shipping_service" value={selectedShipping?.service ?? ""} />
        <input type="hidden" name="shipping_etd" value={selectedShipping?.etd ?? ""} />
        <input type="hidden" name="destination_city_id" value={selectedCityId} />
        <input type="hidden" name="shipping_name" value={shippingName} />
        <input type="hidden" name="shipping_phone" value={shippingPhone} />
        <input type="hidden" name="shipping_address" value={shippingAddress} />

        {/* Left: Shipping Form */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 className={styles.cardTitle}>Informasi Pengiriman</h2>
                <p className={styles.cardSubtitle}>Data diambil dari profil Anda.</p>
              </div>
              <Link
                href="/dashboard/settings"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1E8449",
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid rgba(39,174,96,0.35)",
                  borderRadius: "10px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                ✏️ Ubah Data
              </Link>
            </div>

            {!hasAddress && (
              <div style={{
                margin: "12px 0",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#fef9c3",
                border: "1px solid #fde047",
                fontSize: "13px",
                color: "#854d0e",
              }}>
                ⚠️ Alamat pengiriman belum lengkap.{" "}
                <Link href="/dashboard/settings" style={{ color: "#854d0e", fontWeight: 700 }}>
                  Lengkapi sekarang →
                </Link>
              </div>
            )}

            <div className={styles.formFields}>
              {/* Read-only profile data */}
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Nama Lengkap Penerima</span>
                <div className={styles.input} style={{ background: "#f7f7f5", color: shippingName ? "#1a1a18" : "#A3A39B", cursor: "default" }}>
                  {shippingName || <em style={{ fontStyle: "normal", color: "#A3A39B" }}>Belum diisi — ubah di profil</em>}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>No. Telepon</span>
                <div className={styles.input} style={{ background: "#f7f7f5", color: shippingPhone ? "#1a1a18" : "#A3A39B", cursor: "default" }}>
                  {shippingPhone || <em style={{ fontStyle: "normal", color: "#A3A39B" }}>Belum diisi — ubah di profil</em>}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Alamat Pengiriman</span>
                <div
                  className={styles.textarea}
                  style={{ background: "#f7f7f5", cursor: "default", whiteSpace: "pre-line", minHeight: "72px", color: addressLines.length ? "#1a1a18" : "#A3A39B" }}
                >
                  {addressLines.length
                    ? addressLines.map((line, i) => <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>)
                    : <em style={{ fontStyle: "normal" }}>Belum diisi — ubah di profil</em>
                  }
                </div>
              </div>

              {/* Shipping Options */}
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#27AE60" }}><TruckIcon /></span>
                  Pilih Layanan Pengiriman
                </span>
                <div className={styles.shippingSection}>
                  {!selectedCityId ? (
                    <p className={styles.shippingPendingText}>Pilih kota tujuan untuk melihat opsi pengiriman.</p>
                  ) : loadingShipping ? (
                    <p className={styles.shippingLoadingText}>⏳ Menghitung ongkir...</p>
                  ) : shippingError ? (
                    <p className={styles.shippingErrorText}>{shippingError}</p>
                  ) : shippingOptions.length === 0 ? (
                    <p className={styles.shippingEmptyText}>Tidak ada layanan tersedia untuk rute ini.</p>
                  ) : (
                    shippingOptions.map((opt, i) => {
                      const key = `${opt.courier}-${opt.service}-${i}`;
                      const isSelected =
                        selectedShipping?.courier === opt.courier &&
                        selectedShipping?.service === opt.service;
                      return (
                        <div
                          key={key}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          className={`${styles.shippingOption} ${isSelected ? styles.shippingOptionSelected : ""}`}
                          onClick={() => setSelectedShipping(opt)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedShipping(opt); }}}
                        >
                          <div className={isSelected ? styles.shippingCheckOn : styles.shippingCheckOff}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                          <div className={styles.shippingOptionInfo}>
                            <p className={styles.shippingOptionLabel}>
                              {COURIER_LABELS[opt.courier] ?? opt.courier.toUpperCase()} {opt.service}
                            </p>
                            <p className={styles.shippingOptionEtd}>{opt.description} · Estimasi {opt.etd} hari</p>
                          </div>
                          <span className={styles.shippingOptionCost}>{formatRupiah(opt.cost)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  Catatan untuk Penjual <span className={styles.optionalLabel}>(Opsional)</span>
                </span>
                <textarea
                  name="shipping_notes"
                  className={styles.textarea}
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  placeholder="Misalnya: Tolong packing rapat agar tidak pecah"
                  rows={2}
                />
              </label>
            </div>
          </div>

          {/* Trust Badges */}
          <div className={styles.trustRow}>
            <div className={styles.trustItem}>
              <ShieldIcon />
              <span>Transaksi Dilindungi</span>
            </div>
            <div className={styles.trustItem}>
              <LeafIcon />
              <span>Perdagangan Hijau</span>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Ringkasan Pesanan</h2>

            {/* Product */}
            <div className={styles.productRow}>
              <div className={styles.productImageWrap}>
                {listing.image_url ? (
                  <Image
                    src={listing.image_url}
                    alt={listing.title}
                    fill
                    sizes="72px"
                    className={styles.productImage}
                    unoptimized
                  />
                ) : (
                  <div className={styles.productImagePlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productName}>{listing.title}</p>
                <p className={styles.productMeta}>x1 · {weightGrams}g</p>
              </div>
              <p className={styles.productPrice}>{formatRupiah(listing.price)}</p>
            </div>

            {/* Seller */}
            <div className={styles.sellerRow}>
              <div className={styles.sellerMini}>
                {sellerAvatar ? (
                  <Image
                    src={sellerAvatar}
                    alt={sellerName}
                    width={28}
                    height={28}
                    className={styles.sellerMiniAvatar}
                    unoptimized
                  />
                ) : (
                  <div className={styles.sellerMiniPlaceholder}>
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.sellerMiniName}>Penjual: {sellerName}</span>
              </div>
            </div>

            {listing.carbon_saved && (
              <div className={styles.impactBanner}>
                <LeafIcon />
                <span>Anda menyelamatkan <strong>{listing.carbon_saved}</strong> emisi karbon</span>
              </div>
            )}

            {/* Pricing */}
            <div className={styles.pricingSection}>
              <div className={styles.priceLine}>
                <span>Subtotal</span>
                <span>{formatRupiah(listing.price)}</span>
              </div>
              <div className={styles.priceLine}>
                <span>Ongkos Kirim</span>
                <span>
                  {loadingShipping
                    ? "Menghitung..."
                    : selectedShipping
                      ? formatRupiah(shippingCost)
                      : <em style={{ color: "#A3A39B", fontStyle: "normal" }}>Pilih kurir</em>
                  }
                </span>
              </div>
              <div className={styles.priceTotal}>
                <span>Total</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
            </div>

            <button
              type="submit"
              className={styles.payBtn}
              disabled={!canSubmit}
            >
              {isPending ? "Memproses..." : canSubmit ? `Bayar ${formatRupiah(totalPrice)}` : "Pilih kurir dulu"}
            </button>

            <p className={styles.disclaimer}>
              Dengan menekan tombol di atas, Anda menyetujui <a href="#">Syarat & Ketentuan</a> SirkulasiIn.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
