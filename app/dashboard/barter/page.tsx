import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BarterDashboard, {
  type IncomingOffer,
  type OutgoingOffer,
} from "./BarterDashboard";

type RawListing = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
};

type RawProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type RawIncomingOffer = Omit<IncomingOffer, "marketplace_listings" | "profiles"> & {
  marketplace_listings: RawListing[] | RawListing;
  profiles: RawProfile[] | RawProfile | null;
};

type RawOutgoingOffer = Omit<OutgoingOffer, "marketplace_listings"> & {
  marketplace_listings: RawListing[] | RawListing;
};

function firstRelation<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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
      profiles!barter_offers_offerer_id_fkey ( id, full_name, username, avatar_url )
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

  const normalizedIncoming: IncomingOffer[] = ((incoming as RawIncomingOffer[] | null) || [])
    .map((offer) => {
      const listing = firstRelation(offer.marketplace_listings);
      if (!listing) return null;

      return {
        ...offer,
        marketplace_listings: listing,
        profiles: firstRelation(offer.profiles),
      };
    })
    .filter((offer): offer is IncomingOffer => offer !== null);

  const normalizedOutgoing: OutgoingOffer[] = ((outgoing as RawOutgoingOffer[] | null) || [])
    .map((offer) => {
      const listing = firstRelation(offer.marketplace_listings);
      if (!listing) return null;

      return {
        ...offer,
        marketplace_listings: listing,
      };
    })
    .filter((offer): offer is OutgoingOffer => offer !== null);

  return (
    <BarterDashboard
      incomingOffers={normalizedIncoming}
      outgoingOffers={normalizedOutgoing}
    />
  );
}
