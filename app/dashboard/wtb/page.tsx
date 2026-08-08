import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import WtbDashboard, { type MyRequest, type MyOffer } from "./WtbDashboard";

export const metadata: Metadata = {
  title: "Permintaan WTB — SirkulasiIn",
  description: "Kelola permintaan barang dan tawaran yang Anda kirim.",
};

export default async function WtbDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/wtb");

  // ─── Permintaan saya ───
  const { data: requests } = await supabase
    .from("wtb_requests")
    .select("id, title, category, budget_max, city, status, created_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const myRequests = requests ?? [];
  const requestIds = myRequests.map((r) => r.id);

  const { data: offerRows } = requestIds.length
    ? await supabase
        .from("wtb_offers")
        .select("wtb_id, status")
        .in("wtb_id", requestIds)
    : { data: [] };

  const offerStats = new Map<string, { total: number; pending: number }>();
  for (const row of offerRows ?? []) {
    const cur = offerStats.get(row.wtb_id) ?? { total: 0, pending: 0 };
    cur.total += 1;
    if (row.status === "pending") cur.pending += 1;
    offerStats.set(row.wtb_id, cur);
  }

  const normalizedRequests: MyRequest[] = myRequests.map((r) => ({
    ...r,
    offerCount: offerStats.get(r.id)?.total ?? 0,
    pendingOfferCount: offerStats.get(r.id)?.pending ?? 0,
  }));

  // ─── Tawaran yang saya kirim ───
  const { data: myOffers } = await supabase
    .from("wtb_offers")
    .select("id, wtb_id, item_name, price, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const offers = myOffers ?? [];
  const wtbIds = [...new Set(offers.map((o) => o.wtb_id))];
  const { data: wtbRows } = wtbIds.length
    ? await supabase.from("wtb_requests").select("id, title, status").in("id", wtbIds)
    : { data: [] };
  const wtbMap = new Map((wtbRows ?? []).map((w) => [w.id, w]));

  const normalizedOffers: MyOffer[] = offers.map((o) => ({
    ...o,
    wtb_title: wtbMap.get(o.wtb_id)?.title ?? "Permintaan dihapus",
    wtb_status: wtbMap.get(o.wtb_id)?.status ?? "closed",
  }));

  return <WtbDashboard requests={normalizedRequests} offers={normalizedOffers} />;
}
