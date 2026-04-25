import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import CheckoutForm from "./CheckoutForm";
import styles from "./checkout.module.css";

export const metadata = {
  title: "Checkout | SirkulasiIn Marketplace",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/marketplace/${id}/checkout`);

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*, weight_grams")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!listing) notFound();

  if (listing.user_id === user.id) redirect(`/marketplace/${id}`);

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location, city_id, city_name, province_name")
    .eq("id", listing.user_id)
    .single();

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("full_name, phone, location, address, province_id, province_name, city_id, city_name, district_name, village_name, postal_code, full_address")
    .eq("id", user.id)
    .single();

  const sellerName =
    sellerProfile?.full_name || sellerProfile?.username || "Penjual";

  // Guard: seller belum mengisi alamat terstruktur → block checkout
  if (!sellerProfile?.city_id) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="marketplace" />
        <div className={styles.container}>
          <Link href={`/marketplace/${id}`} className={styles.backLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Detail Produk
          </Link>
          <div className={styles.sellerBlockedCard}>
            <div className={styles.sellerBlockedIcon}>🚚</div>
            <h1 className={styles.sellerBlockedTitle}>Checkout Tidak Tersedia</h1>
            <p className={styles.sellerBlockedDesc}>
              Penjual <strong>{sellerName}</strong> belum mengisi alamat pengiriman.
              Ongkos kirim tidak dapat dihitung.
            </p>
            <p className={styles.sellerBlockedHint}>
              Hubungi penjual melalui fitur chat untuk informasi pengiriman lebih lanjut.
            </p>
            <Link href={`/marketplace/${id}`} className={styles.backToListingBtn}>
              Kembali ke Listing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />
      <div className={styles.container}>
        <CheckoutForm
          listing={listing}
          sellerName={sellerName}
          sellerAvatar={sellerProfile?.avatar_url || null}
          sellerCityId={String(sellerProfile.city_id)}
          weightGrams={listing.weight_grams || 1000}
          buyerProfile={buyerProfile}
        />
      </div>
    </main>
  );
}
