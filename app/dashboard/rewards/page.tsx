import type { Metadata } from "next";
import styles from "../section.module.css";

export const metadata: Metadata = {
  title: "Rewards — SirkulasiIn",
  description: "Lihat dan tukarkan rewards dari aktivitas sirkular Anda.",
};

export default function RewardsPage() {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Rewards</h1>
      <p className={styles.subtitle}>
        Poin yang Anda kumpulkan dari scan dan transaksi bisa ditukar menjadi
        voucher, cashback, atau keuntungan komunitas lainnya.
      </p>

      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Total Eco Points</p>
          <p className={styles.cardValue}>1.280</p>
        </article>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Voucher Tersedia</p>
          <p className={styles.cardValue}>4</p>
        </article>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Masa Berlaku Terdekat</p>
          <p className={styles.cardValue}>12 Hari</p>
        </article>
      </div>
    </section>
  );
}
