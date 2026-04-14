"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { placeOrder, CheckoutState } from "@/app/actions/checkout";
import styles from "./checkout.module.css";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

type Props = {
  listing: {
    id: string;
    user_id: string;
    title: string;
    price: number;
    image_url: string | null;
    category: string;
    carbon_saved: string | null;
  };
  sellerName: string;
  sellerAvatar: string | null;
  buyerProfile: {
    full_name: string | null;
    phone: string | null;
    location: string | null;
    address: string | null;
  } | null;
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

export default function CheckoutForm({ listing, sellerName, sellerAvatar, buyerProfile }: Props) {
  const [state, formAction, isPending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    null
  );

  const [shippingName, setShippingName] = useState(buyerProfile?.full_name || "");
  const [shippingPhone, setShippingPhone] = useState(buyerProfile?.phone || "");
  const [shippingAddress, setShippingAddress] = useState(buyerProfile?.address || buyerProfile?.location || "");
  const [shippingNotes, setShippingNotes] = useState("");

  return (
    <>
      {/* Back button */}
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
        <input type="hidden" name="total_price" value={listing.price} />

        {/* Left: Shipping Form */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Informasi Pengiriman</h2>
              <p className={styles.cardSubtitle}>Pastikan data Anda benar agar barang sampai dengan aman.</p>
            </div>

            <div className={styles.formFields}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Nama Lengkap Penerima</span>
                <input
                  type="text"
                  name="shipping_name"
                  className={styles.input}
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>No. Telepon</span>
                <input
                  type="tel"
                  name="shipping_phone"
                  className={styles.input}
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Alamat Lengkap</span>
                <textarea
                  name="shipping_address"
                  className={styles.textarea}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Jl. ..., RT/RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos"
                  rows={3}
                  required
                />
              </label>

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
                    sizes="80px"
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
                <p className={styles.productMeta}>x1</p>
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

            {/* Impact */}
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
                <span className={styles.shippingFree}>Gratis</span>
              </div>
              <div className={styles.priceTotal}>
                <span>Total</span>
                <span>{formatRupiah(listing.price)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.payBtn}
              disabled={isPending}
            >
              {isPending ? "Memproses..." : `Bayar ${formatRupiah(listing.price)}`}
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
