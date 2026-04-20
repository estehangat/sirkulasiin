import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import { ArrowLeft } from "lucide-react";
import GalleryGridClient from "./GalleryGridClient";

export default async function ProfileGalleryPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) return notFound();

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", id).single();
  if (!profile) return notFound();

  const { data: submissions } = await supabase
    .from("tutorial_submissions")
    .select("id, photo_url, tutorial_id, recycle_tutorials(title)")
    .eq("user_id", id)
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
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A1A" }}>Galeri Daur Ulang</h1>
              <p style={{ color: "#5a5c59", fontSize: "14px" }}>Semua hasil karya daur ulang oleh {profile.username}</p>
            </div>
          </div>
          
          <GalleryGridClient items={(submissions as any) || []} />
        </div>
      </div>
    </>
  );
}
