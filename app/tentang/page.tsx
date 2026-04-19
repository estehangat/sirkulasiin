import type { Metadata } from "next";
import Navbar from "../components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./tentang.module.css";

export const metadata: Metadata = {
  title: "Tentang dan Cara Kerja — SirkulasiIn",
  description: "Pelajari misi dan cara kerja SirkulasiIn.",
};

const steps = [
  {
    title: "Temukan material",
    desc: "Mulai dari area publik: jelajahi marketplace, baca tutorial, lalu coba scan cepat.",
  },
  {
    title: "Analisis dan rekomendasi",
    desc: "AI mengidentifikasi material dan memberi rekomendasi aksi terbaik: jual, daur ulang, atau disposal khusus.",
  },
  {
    title: "Lacak dampak",
    desc: "Saat sudah login, pantau riwayat, rewards, transaksi, dan performa marketplace Anda dari area akun.",
  },
];

export default async function TentangPage() {
  const supabase = await createServerSupabaseClient();
  const { data: aboutData } = await supabase.from('site_content').select('content').eq('id', 'about_page').single();
  
  const missionTitle = aboutData?.content?.mission_title || "Platform untuk mengubah limbah jadi peluang";
  const missionText = aboutData?.content?.mission_text || "SirkulasiIn menghubungkan discovery publik dengan operasional akun, sehingga user bisa belajar, mencoba, lalu konsisten menjalankan aksi sirkular setiap hari.";

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="tentang" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Tentang SirkulasiIn</p>
        <h1 className={styles.title}>
          {missionTitle}
        </h1>
        <p className={styles.subtitle}>
          {missionText}
        </p>
      </section>

      <section className={styles.steps} aria-label="Cara kerja">
        {steps.map((step, idx) => (
          <article key={step.title} className={styles.stepCard}>
            <p className={styles.stepIndex}>0{idx + 1}</p>
            <h2 className={styles.stepTitle}>{step.title}</h2>
            <p className={styles.stepDesc}>{step.desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
