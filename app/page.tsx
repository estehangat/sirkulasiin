import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/navbar";
import styles from "./page.module.css";

const langkahSirkular = [
  {
    nomor: "01",
    judul: "Scan Sampah",
    deskripsi:
      "Arahkan kamera ke material sampah, lalu AI akan mengenali jenis, tingkat kebersihan, dan nilai daurnya dalam hitungan detik.",
  },
  {
    nomor: "02",
    judul: "Dapatkan Insight",
    deskripsi:
      "Lihat rekomendasi aksi paling efektif, estimasi dampak lingkungan, dan potensi insentif dari setiap item yang Anda kelola.",
  },
  {
    nomor: "03",
    judul: "Terhubung Ekosistem",
    deskripsi:
      "Hubungkan hasil scan ke mitra drop point, pengepul lokal, atau marketplace sirkular untuk menuntaskan alur sampah rumah.",
  },
];

const produkUnggulan = [
  {
    nama: "Rak Modular Daur Ulang",
    kategori: "Produk Rumah",
    harga: "Rp 350.000",
    label: "Laku Cepat",
  },
  {
    nama: "Tas Belanja Serat Alam",
    kategori: "Gaya Hidup",
    harga: "Rp 145.000",
    label: "Pilihan Komunitas",
  },
  {
    nama: "Kompos Aktif Organik",
    kategori: "Kebun Rumah",
    harga: "Rp 89.000",
    label: "Baru",
  },
  {
    nama: "Lampu Meja Upcycle",
    kategori: "Dekorasi",
    harga: "Rp 220.000",
    label: "Terbatas",
  },
];

export default function HomePage() {
  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="home" />

      <section className={styles.hero} id="home">
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Platform AI Ekonomi Sirkular</span>
          <h1 className={styles.heroTitle}>
            Kelola sampah rumah jadi peluang,
            <br />
            bukan beban.
          </h1>
          <p className={styles.heroText}>
            SirkulasiIn membantu Anda memilah, memetakan, dan menyalurkan sampah
            ke ekosistem daur ulang sambil mengumpulkan insentif dan insight
            berbasis AI.
          </p>

          <div className={styles.heroActions}>
            <a href="#scan" className={styles.primaryAction}>
              Mulai Scan Sekarang
            </a>
            <a href="#marketplace" className={styles.secondaryAction}>
              Jelajahi Marketplace
            </a>
          </div>

          <div className={styles.heroStats}>
            <div>
              <p className={styles.statValue}>2,4 Juta+</p>
              <p className={styles.statLabel}>Item terpetakan oleh AI</p>
            </div>
            <div>
              <p className={styles.statValue}>16.200</p>
              <p className={styles.statLabel}>Mitra daur ulang aktif</p>
            </div>
            <div>
              <p className={styles.statValue}>Rp 9,8 M</p>
              <p className={styles.statLabel}>Insentif dibagikan</p>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.visualGlow} aria-hidden />
          <Image
            src="/signup-hero.png"
            alt="Ilustrasi pertumbuhan hijau"
            fill
            className={styles.heroImage}
            priority
            sizes="(max-width: 900px) 100vw, 480px"
          />
          <div className={styles.scanChip}>
            <span className={styles.scanChipBadge}>AI</span>
            <div>
              <p className={styles.scanChipTitle}>Scan terbaru: Botol PET</p>
              <p className={styles.scanChipText}>
                Tingkat daur ulang 98% - nilai insentif Rp 1.200
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stepsSection} id="scan">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Alur SirkulasiIn</p>
          <h2 className={styles.sectionTitle}>
            Circular lifecycle dalam 3 langkah sederhana
          </h2>
        </div>

        <div className={styles.stepGrid}>
          {langkahSirkular.map((langkah) => (
            <article key={langkah.nomor} className={styles.stepCard}>
              <span className={styles.stepNumber}>{langkah.nomor}</span>
              <h3 className={styles.stepTitle}>{langkah.judul}</h3>
              <p className={styles.stepText}>{langkah.deskripsi}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.impactSection} id="riwayat">
        <div className={styles.impactContent}>
          <p className={styles.sectionLabelLight}>Riwayat dan Dampak</p>
          <h2 className={styles.impactTitle}>
            Setiap scan Anda membentuk jejak hijau yang terukur
          </h2>
          <p className={styles.impactText}>
            Pantau tren sampah rumah, kategori terbanyak, dan rekomendasi
            personal untuk mengurangi residu mingguan secara konsisten.
          </p>
          <div className={styles.impactStats}>
            <div>
              <p className={styles.impactValue}>84%</p>
              <p className={styles.impactLabel}>Sampah teralihkan dari TPA</p>
            </div>
            <div>
              <p className={styles.impactValue}>31 kg</p>
              <p className={styles.impactLabel}>
                Rata-rata pengurangan bulanan
              </p>
            </div>
          </div>
        </div>

        <div className={styles.impactVisual}>
          <Image
            src="/login-hero.png"
            alt="Tangan memegang tanaman"
            fill
            className={styles.impactImage}
            sizes="(max-width: 900px) 100vw, 420px"
          />
        </div>
      </section>

      <section className={styles.marketSection} id="marketplace">
        <div className={styles.sectionHeaderRow}>
          <div>
            <p className={styles.sectionLabel}>Marketplace Sirkular</p>
            <h2 className={styles.sectionTitle}>
              Temukan produk terkurasi dari ekosistem daur ulang
            </h2>
          </div>
          <a href="#" className={styles.marketLink}>
            Lihat Semua
          </a>
        </div>

        <div className={styles.marketGrid}>
          {produkUnggulan.map((produk) => (
            <article className={styles.productCard} key={produk.nama}>
              <div className={styles.productVisual} aria-hidden>
                <span className={styles.productTag}>{produk.label}</span>
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productName}>{produk.nama}</p>
                <p className={styles.productCategory}>{produk.kategori}</p>
                <p className={styles.productPrice}>{produk.harga}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>
          Gabung 50.000+ Green Guardian bersama SirkulasiIn
        </h2>
        <p className={styles.ctaText}>
          Daftar sekarang untuk mulai tracking sampah rumah, dapatkan insight
          AI, dan buka peluang insentif dari setiap aksi kecil Anda.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/signup" className={styles.primaryAction}>
            Buat Akun Gratis
          </Link>
          <Link href="/login" className={styles.ghostAction}>
            Sudah punya akun? Login
          </Link>
        </div>
      </section>
    </main>
  );
}
