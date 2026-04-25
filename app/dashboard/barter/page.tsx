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
  offerer_id: string;
};

type RawOutgoingOffer = Omit<OutgoingOffer, "marketplace_listings"> & {
  listing_id: string;
};

export default async function BarterPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/barter");

  const { data: myListings } = await supabase
    .from("marketplace_listings")
    .select("id")
    .eq("user_id", user.id);

  const myListingIds = (myListings || []).map((l) => l.id);

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    myListingIds.length
      ? supabase
          .from("barter_offers")
          .select(
            "id, created_at, status, offered_item_name, offered_item_description, cash_addition, message, seller_response, listing_id, offerer_id, accepted_at, owner_shipped_at, offerer_shipped_at, owner_completed_at, offerer_completed_at"
          )
          .in("listing_id", myListingIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("barter_offers")
      .select(
        "id, created_at, status, offered_item_name, offered_item_description, cash_addition, message, seller_response, listing_id, accepted_at, owner_shipped_at, offerer_shipped_at, owner_completed_at, offerer_completed_at"
      )
      .eq("offerer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const allListingIds = [...new Set([...(incoming || []).map((o) => o.listing_id), ...(outgoing || []).map((o) => o.listing_id)])];
  const offererIds = [...new Set((incoming || []).map((o) => o.offerer_id).filter(Boolean))];

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    allListingIds.length
      ? supabase.from("marketplace_listings").select("id, title, image_url, price").in("id", allListingIds)
      : Promise.resolve({ data: [] }),
    offererIds.length
      ? supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", offererIds)
      : Promise.resolve({ data: [] }),
  ]);

  const listingMap = new Map((listings || []).map((listing) => [listing.id, listing]));
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

  const normalizedIncoming = ((incoming as RawIncomingOffer[] | null) || [])
    .flatMap((offer): IncomingOffer[] => {
      const listing = listingMap.get(offer.listing_id);
      if (!listing) return [];

      return [{
        id: offer.id,
        created_at: offer.created_at,
        status: offer.status,
        offered_item_name: offer.offered_item_name,
        offered_item_description: offer.offered_item_description,
        cash_addition: offer.cash_addition,
        message: offer.message,
        seller_response: offer.seller_response,
        listing_id: offer.listing_id,
        accepted_at: offer.accepted_at,
        owner_shipped_at: offer.owner_shipped_at,
        offerer_shipped_at: offer.offerer_shipped_at,
        owner_completed_at: offer.owner_completed_at,
        offerer_completed_at: offer.offerer_completed_at,
        marketplace_listings: listing,
        profiles: profileMap.get(offer.offerer_id) || null,
      }];
    });

  const normalizedOutgoing = ((outgoing as RawOutgoingOffer[] | null) || [])
    .flatMap((offer): OutgoingOffer[] => {
      const listing = listingMap.get(offer.listing_id);
      if (!listing) return [];

      return [{
        ...offer,
        marketplace_listings: listing,
      }];
    });

  return (
    <BarterDashboard
      incomingOffers={normalizedIncoming}
      outgoingOffers={normalizedOutgoing}
    />
  );
}
