import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
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

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/marketplace/${id}/checkout`);

  // Fetch listing
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!listing) notFound();

  // Tidak boleh beli listing sendiri
  if (listing.user_id === user.id) redirect(`/marketplace/${id}`);

  // Fetch seller profile
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, location")
    .eq("id", listing.user_id)
    .single();

  // Fetch buyer profile (untuk prefill form)
  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("full_name, phone, location, address")
    .eq("id", user.id)
    .single();

  const sellerName =
    sellerProfile?.full_name || sellerProfile?.username || "Penjual";

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />
      <div className={styles.container}>
        <CheckoutForm
          listing={listing}
          sellerName={sellerName}
          sellerAvatar={sellerProfile?.avatar_url || null}
          buyerProfile={buyerProfile}
        />
      </div>
    </main>
  );
}
