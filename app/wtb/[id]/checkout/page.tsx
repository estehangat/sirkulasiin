import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/app/components/navbar";
import WtbCheckoutForm from "./WtbCheckoutForm";
import styles from "@/app/marketplace/[id]/checkout/checkout.module.css";

export const metadata = {
  title: "Checkout Permintaan | SirkulasiIn",
};

export default async function WtbCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/wtb/${id}/checkout`);

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!wtb) notFound();
  if (wtb.user_id !== user.id) redirect(`/wtb/${id}`);
  if (wtb.status !== "in_checkout" || !wtb.accepted_offer_id) redirect(`/wtb/${id}`);

  const { data: offer } = await supabase
    .from("wtb_offers")
    .select("*")
    .eq("id", wtb.accepted_offer_id)
    .single();

  if (!offer || offer.status !== "accepted") redirect(`/wtb/${id}`);

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location, shipping_area_id, shipping_area_name, shipping_postal")
    .eq("id", offer.seller_id)
    .single();

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("full_name, phone, location, address, shipping_area_id, shipping_area_name, shipping_postal, full_address")
    .eq("id", user.id)
    .single();

  const sellerName = sellerProfile?.full_name || sellerProfile?.username || "Penjual";

  if (!sellerProfile?.shipping_area_id) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="marketplace" />
        <div className={styles.container}>
          <Link href={`/wtb/${id}`} className={styles.backLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Permintaan
          </Link>
          <div className={styles.sellerBlockedCard}>
            <div className={styles.sellerBlockedIcon}>🚚</div>
            <h1 className={styles.sellerBlockedTitle}>Checkout Tidak Tersedia</h1>
            <p className={styles.sellerBlockedDesc}>
              Penjual <strong>{sellerName}</strong> belum mengisi alamat pengiriman.
              Ongkos kirim tidak dapat dihitung.
            </p>
            <p className={styles.sellerBlockedHint}>
              Hubungi penjual melalui fitur chat untuk meminta mereka melengkapi alamat.
            </p>
            <Link href={`/wtb/${id}`} className={styles.backToListingBtn}>
              Kembali ke Permintaan
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
        <WtbCheckoutForm
          wtb={{ id: wtb.id, title: wtb.title }}
          offer={{
            id: offer.id,
            seller_id: offer.seller_id,
            item_name: offer.item_name,
            item_image_url: offer.item_image_url,
            price: offer.price,
            weight_grams: offer.weight_grams || 1000,
          }}
          sellerName={sellerName}
          sellerAvatar={sellerProfile?.avatar_url || null}
          sellerAreaId={sellerProfile.shipping_area_id}
          sellerPostal={sellerProfile.shipping_postal || ""}
          buyerProfile={buyerProfile}
        />
      </div>
    </main>
  );
}
