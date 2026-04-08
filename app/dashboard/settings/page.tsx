import type { Metadata } from "next";
import styles from "../section.module.css";

export const metadata: Metadata = {
  title: "Profil dan Settings — SirkulasiIn",
  description: "Atur profil dan preferensi akun Anda.",
};

export default function SettingsPage() {
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Profil dan Settings</h1>
      <p className={styles.subtitle}>
        Perbarui data profil, preferensi notifikasi, dan pengaturan keamanan
        akun Anda.
      </p>

      <div className={styles.list}>
        <article className={styles.listItem}>
          <h2 className={styles.listTitle}>Informasi Profil</h2>
          <p className={styles.listMeta}>Nama, avatar, bio, dan kontak.</p>
        </article>
        <article className={styles.listItem}>
          <h2 className={styles.listTitle}>Notifikasi</h2>
          <p className={styles.listMeta}>
            Atur notifikasi email untuk scan, transaksi, dan promo.
          </p>
        </article>
        <article className={styles.listItem}>
          <h2 className={styles.listTitle}>Keamanan Akun</h2>
          <p className={styles.listMeta}>
            Ubah password dan kelola sesi login.
          </p>
        </article>
      </div>
    </section>
  );
}
