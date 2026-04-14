import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BarterDashboard from "./BarterDashboard";

export default async function BarterPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/barter");

  // Tawaran masuk (saya sebagai penjual)
  const { data: incoming } = await supabase
    .from("barter_offers")
    .select(`
      id, created_at, status, offered_item_name, offered_item_description,
      cash_addition, message, seller_response,
      listing_id,
      marketplace_listings!inner ( id, title, image_url, price ),
      profiles!barter_offers_offerer_id_fkey ( full_name, username, avatar_url )
    `)
    .in(
      "listing_id",
      (
        await supabase
          .from("marketplace_listings")
          .select("id")
          .eq("user_id", user.id)
      ).data?.map((l) => l.id) || []
    )
    .order("created_at", { ascending: false });

  // Tawaran keluar (saya sebagai pengaju)
  const { data: outgoing } = await supabase
    .from("barter_offers")
    .select(`
      id, created_at, status, offered_item_name, offered_item_description,
      cash_addition, message, seller_response,
      listing_id,
      marketplace_listings!inner ( id, title, image_url, price )
    `)
    .eq("offerer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <BarterDashboard
      incomingOffers={(incoming as any) || []}
      outgoingOffers={(outgoing as any) || []}
    />
  );
}
