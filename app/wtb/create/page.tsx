import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/app/components/navbar";
import CreateWtbForm from "./CreateWtbForm";
import styles from "../wtb.module.css";

export const metadata = {
  title: "Buat Permintaan | SirkulasiIn",
};

export default async function CreateWtbPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/wtb/create");

  const { data: profile } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", user.id)
    .single();

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />
      <div className={styles.containerNarrow}>
        <div className={styles.createHeader}>
          <span className={styles.createEyebrow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Want To Buy
          </span>
          <h1 className={styles.createTitle}>Barang apa yang kamu cari?</h1>
          <p className={styles.createSubtitle}>
            Tulis permintaanmu, tentukan budget, dan biarkan penjual menawarkan
            barangnya kepadamu. Permintaan aktif selama 30 hari.
          </p>
        </div>

        <div className={styles.card}>
          <CreateWtbForm defaultCity={profile?.location || ""} />
        </div>
      </div>
    </main>
  );
}
