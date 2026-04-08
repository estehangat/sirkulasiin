import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/navbar";
import styles from "./tutorial-list.module.css";

export const metadata: Metadata = {
  title: "Tutorial — SirkulasiIn",
  description: "Kumpulan tutorial daur ulang dan gaya hidup sirkular.",
};

const tutorials = [
  {
    title: "Planter Self-Watering dari Botol Kaca",
    desc: "Proyek ramah pemula untuk mengubah botol bekas menjadi planter cantik.",
    href: "/tutorial/botol-kaca-planter",
    level: "Pemula",
    duration: "5 menit",
  },
];

export default function TutorialListPage() {
  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="tutorial" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Edukasi Sirkular</p>
        <h1 className={styles.title}>Belajar dari aksi kecil yang berdampak</h1>
        <p className={styles.subtitle}>
          Mulai dari panduan paling sederhana untuk membiasakan reuse, recycle,
          dan upcycle dalam keseharian.
        </p>
      </section>

      <section className={styles.gridSection}>
        {tutorials.map((item) => (
          <article key={item.title} className={styles.card}>
            <div className={styles.badges}>
              <span className={styles.badge}>{item.level}</span>
              <span className={styles.badge}>{item.duration}</span>
            </div>
            <h2 className={styles.cardTitle}>{item.title}</h2>
            <p className={styles.cardDesc}>{item.desc}</p>
            <Link href={item.href} className={styles.cardLink}>
              Buka Tutorial
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
