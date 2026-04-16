import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import EditListingClient from "./edit-client";

export const metadata: Metadata = {
  title: "Edit Produk — SirkulasiIn",
  description: "Perbarui informasi produk listing Anda.",
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
        Silakan login terlebih dahulu.
      </div>
    );
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  // Pengamanan ekstra: Pastikan yang mau ngedit adalah pemilik sah
  if (data.user_id !== user.id) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
        Anda tidak memiliki akses untuk mengedit produk ini.
      </div>
    );
  }

  return <EditListingClient listing={data} />;
}
