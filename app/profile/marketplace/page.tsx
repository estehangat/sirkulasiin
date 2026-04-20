import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import { ArrowLeft } from "lucide-react";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function ProfileMarketplacePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) return notFound();

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", id).single();
  if (!profile) return notFound();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, image_url, status, description")
    .eq("user_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: "#f7f7f3", minHeight: "100vh", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <Link href={`/profile?id=${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#fff", color: "#1A1A1A", border: "1px solid #EFEFEB", textDecoration: "none" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A1A" }}>Koleksi Marketplace</h1>
              <p style={{ color: "#5a5c59", fontSize: "14px" }}>Semua barang jualan publik oleh {profile.username}</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            {listings && listings.length > 0 ? listings.map((item) => (
              <Link href={`/marketplace/${item.id}`} key={item.id} style={{textDecoration: "none"}}>
                <div style={{
                  backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", 
                  border: "1px solid #EFEFEB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex", flexDirection: "column", transition: "transform 0.2s", height: "100%"
                }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ width: "100%", height: "200px", position: "relative", backgroundColor: "#f5f5f4" }}>
                     {item.image_url ? (
                       <img src={item.image_url} alt={item.title} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                     ) : <div style={{width: "100%", height: "100%", backgroundColor: "#e2e3de"}} />}
                  </div>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                     <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                       {item.title}
                     </h3>
                     <p style={{ color: "#006a35", fontWeight: 800, fontSize: "16px", marginTop: "12px" }}>
                       {formatRupiah(item.price)}
                     </p>
                  </div>
                </div>
              </Link>
            )) : (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#5a5c59" }}>
                Belum ada barang di marketplace.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
