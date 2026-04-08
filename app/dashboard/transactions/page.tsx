import type { Metadata } from "next";
import styles from "../section.module.css";

export const metadata: Metadata = {
  title: "Transaksi — SirkulasiIn",
  description: "Riwayat transaksi marketplace dan rewards Anda.",
};

const transactionItems = [
  {
    title: "Penjualan Tas Kain Upcycle",
    meta: "Rp 145.000 · Selesai · 07 Apr 2026",
  },
  {
    title: "Penukaran Voucher Ongkir",
    meta: "200 points · Berhasil · 04 Apr 2026",
  },
  {
    title: "Pembelian Kompos Organik",
    meta: "Rp 89.000 · Diproses · 01 Apr 2026",
  },
];

export default function TransactionsPage() {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Transaksi</h1>
      <p className={styles.subtitle}>
        Pantau seluruh aktivitas transaksi Anda, baik pembelian, penjualan,
        maupun penukaran rewards.
      </p>

      <div className={styles.list}>
        {transactionItems.map((item) => (
          <article key={item.title} className={styles.listItem}>
            <h2 className={styles.listTitle}>{item.title}</h2>
            <p className={styles.listMeta}>{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
