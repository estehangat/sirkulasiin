import type { Metadata } from "next";
import styles from "../section.module.css";

export const metadata: Metadata = {
  title: "Riwayat Scan — SirkulasiIn",
  description: "Riwayat pemindaian material pengguna SirkulasiIn.",
};

const scanItems = [
  {
    title: "Botol PET 600ml",
    meta: "2 jam lalu · Dapat didaur ulang",
  },
  {
    title: "Kardus Belanja",
    meta: "Kemarin · Dapat dipakai ulang",
  },
  {
    title: "Baterai Bekas",
    meta: "3 hari lalu · Butuh penanganan khusus",
  },
];

export default function RiwayatScanPage() {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Riwayat Scan</h1>
      <p className={styles.subtitle}>
        Semua hasil scan tersimpan di sini untuk membantu Anda melacak dampak
        dan tindakan lanjutan.
      </p>

      <div className={styles.list}>
        {scanItems.map((item) => (
          <article key={item.title} className={styles.listItem}>
            <h2 className={styles.listTitle}>{item.title}</h2>
            <p className={styles.listMeta}>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
