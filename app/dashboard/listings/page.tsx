import type { Metadata } from "next";
import styles from "../section.module.css";

export const metadata: Metadata = {
  title: "Marketplace Saya — SirkulasiIn",
  description: "Kelola listing marketplace pribadi Anda.",
};

const listingItems = [
  {
    title: "Tas Kain Upcycle",
    meta: "Aktif · 14 pengunjung",
  },
  {
    title: "Rak Kayu Rekondisi",
    meta: "Aktif · 8 pengunjung",
  },
  {
    title: "Lampu Meja Reuse",
    meta: "Draft · Belum dipublikasikan",
  },
];

export default function ListingsPage() {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Marketplace Saya</h1>
      <p className={styles.subtitle}>
        Kelola produk jualan Anda, pantau performa listing, dan siapkan produk
        baru untuk dipublikasikan.
      </p>

      <div className={styles.list}>
        {listingItems.map((item) => (
          <article key={item.title} className={styles.listItem}>
            <h2 className={styles.listTitle}>{item.title}</h2>
            <p className={styles.listMeta}>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
