import { createServerSupabaseClient } from "@/lib/supabase-server";
import ScanClient from "./ScanClient";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Baru saja";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} hari lalu`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bulan lalu`;
  return `${Math.floor(diffInMonths / 12)} tahun lalu`;
}

function getBadge(recommendation: string) {
  if (recommendation === "recycle") return { badge: "Dapat Didaur Ulang", style: "badgeRecyclable" as const };
  if (recommendation === "sell") return { badge: "Bisa Dijual", style: "badgeCompostable" as const };
  return { badge: "Buang Bertanggung Jawab", style: "badgeHazardous" as const };
}

export default async function ScanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let riwayatScan: Array<{ id: string; nama: string; badge: string; badgeStyle: string; waktu: string; image_url: string | null }> = [];
  if (user) {
    const { data } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      riwayatScan = data.map(item => {
        const bdg = getBadge(item.recommendation);
        return {
          id: item.id,
          nama: item.item_name || "Item Tidak Dikenal",
          badge: bdg.badge,
          badgeStyle: bdg.style,
          waktu: timeAgo(item.created_at),
          image_url: item.image_url || null,
        };
      });
    }
  }

  return <ScanClient riwayatScan={riwayatScan} />;
}
