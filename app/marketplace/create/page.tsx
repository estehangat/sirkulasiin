import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/app/components/navbar";
import CreateListingForm from "./CreateListingForm";
import styles from "./createListing.module.css";

export const metadata = {
  title: "Buat Listing | SirkulasiIn Marketplace",
};

export default async function CreateListingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; from?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Memastikan user sudah login
  if (!user) {
    redirect("/login?next=/marketplace/create");
  }

  let scanData = null;
  const params = await searchParams;

  // Mengambil data scan jika user datang dari hasil scan
  if (params.id) {
    const { data } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {
      scanData = data;
    }
  }

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />
      <div className={styles.mainContent}>
        <CreateListingForm scanData={scanData} />
      </div>
    </main>
  );
}
