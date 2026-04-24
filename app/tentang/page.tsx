import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/navbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./tentang.module.css";

export const metadata: Metadata = {
  title: "Tentang dan Cara Kerja — SirkulasiIn",
  description:
    "Pelajari bagaimana SirkulasiIn menggunakan AI untuk mengubah limbah menjadi peluang. Scan, analisis, dan lacak dampak lingkungan Anda.",
};

/* ===== SVG ICON COMPONENTS ===== */
const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
  </svg>
);

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconFlash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconFlag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const IconBot = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const IconSchool = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
  </svg>
);

const IconStore = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconLeaf = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10Z" />
    <path d="M2 21c0-3 1.9-5.5 4.5-6.5" />
  </svg>
);

const IconRecycle = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
    <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 12.006 3a1.784 1.784 0 0 1 1.578.887l4.052 7.034" />
    <path d="m14.5 9.5 2.19-1.289L17.98 10.4" />
  </svg>
);

const IconStorefront = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7h20l-1.5 8.5a2 2 0 0 1-2 1.5H5.5a2 2 0 0 1-2-1.5L2 7Z" />
    <path d="M2 7 4 3h16l2 4" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
  </svg>
);

const IconTrash = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconSeedling = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22a1 1 0 0 1-1-1v-5.2A7.5 7.5 0 0 1 4 8.5V8a1 1 0 0 1 1-1h3.5A7.5 7.5 0 0 1 15 10.67 7.5 7.5 0 0 1 18.5 3H20a1 1 0 0 1 1 1v1.5A7.5 7.5 0 0 1 13 13v8a1 1 0 0 1-1 1Z" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ===== DATA ===== */
const missions = [
  {
    icon: <IconBot />,
    title: "Integrasi AI",
    desc: "Mengintegrasikan kecerdasan buatan untuk mengenali dan mengklasifikasi material secara instan.",
    colorClass: "missionIconGreen" as const,
  },
  {
    icon: <IconSchool />,
    title: "Edukasi Masyarakat",
    desc: "Mengedukasi masyarakat melalui tutorial daur ulang yang praktis dan mudah diikuti.",
    colorClass: "missionIconTaupe" as const,
  },
  {
    icon: <IconStore />,
    title: "Pemberdayaan Ekonomi",
    desc: "Memberdayakan ekonomi lokal melalui marketplace barang pre-loved dan hasil daur ulang.",
    colorClass: "missionIconSage" as const,
  },
  {
    icon: <IconLeaf />,
    title: "Dampak Terukur",
    desc: "Memberikan dampak lingkungan nyata yang dapat diukur melalui setiap aksi pengguna.",
    colorClass: "missionIconNeutral" as const,
  },
];

const impactCards = [
  {
    title: "Mendaur Ulang 1 Kg Kaca",
    badge: "Botol Kaca",
    badgeClass: "badgeGreen" as const,
    value: "1.2",
    unit: "kg CO₂ dihemat",
    valueClass: "impactValueGreen" as const,
    note: "Setara dengan mengemudi mobil sejauh 5 km.",
    image: "/tentang-impact-glass.png",
    imageAlt: "Botol kaca yang siap didaur ulang",
  },
  {
    title: "Menjual 1 Kaos Katun",
    badge: "Pakaian Bekas",
    badgeClass: "badgeTaupe" as const,
    value: "2.1",
    unit: "kg CO₂ dihemat",
    valueClass: "impactValueTaupe" as const,
    note: "Menghindari produksi baru menghemat ribuan liter air.",
    image: "/tentang-impact-clothing.png",
    imageAlt: "Tumpukan pakaian bekas yang masih layak pakai",
  },
  {
    title: "Buang Terpilah 1 Laptop",
    badge: "Elektronik",
    badgeClass: "badgeSage" as const,
    value: "14.5",
    unit: "kg CO₂ dicegah",
    valueClass: "impactValueSage" as const,
    note: "Mencegah pelepasan bahan kimia beracun ke tanah.",
    image: "/tentang-impact-electronics.png",
    imageAlt: "Komponen elektronik yang dipilah untuk daur ulang",
  },
];

export default async function TentangPage() {
  const supabase = await createServerSupabaseClient();
  const { data: aboutData } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", "about_page")
    .single();

  const visionText =
    aboutData?.content?.vision_text ||
    "Membangun ekosistem sirkular yang cerdas untuk masa depan Indonesia yang lebih bersih dan berkelanjutan.";
  const missionText =
    aboutData?.content?.mission_text ||
    "SirkulasiIn menghubungkan discovery publik dengan operasional akun, sehingga user bisa belajar, mencoba, lalu konsisten menjalankan aksi sirkular setiap hari.";

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="tentang" />

      {/* ───────── HERO ───────── */}
      <section className={styles.hero} id="tentang-hero">
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>
            <IconSparkle />
            AI-Powered Recognition
          </div>

          <h1 className={styles.heroTitle}>
            Scan Barang,
            <br />
            <span className={styles.heroTitleGradient}>
              Biarkan AI Bekerja.
            </span>
          </h1>

          <p className={styles.heroDesc}>{missionText}</p>

          <Link href="/scan" className={styles.heroCta}>
            <IconCamera />
            Mulai Scan Sekarang
          </Link>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroBlob1} aria-hidden />
          <div className={styles.heroBlob2} aria-hidden />

          {/* Glassmorphism Phone Mockup */}
          <div className={styles.phoneMockup}>
            <div className={styles.phoneMockupInner}>
              <Image
                src="/tentang-scan-pet.png"
                alt="Botol plastik PET yang sedang discan"
                fill
                className={styles.phoneBgImage}
                sizes="300px"
              />
              <div className={styles.phoneScanUI}>
                <div className={styles.phoneTopBar}>
                  <div className={styles.phoneIcon}><IconClose /></div>
                  <div className={styles.phoneIcon}><IconFlash /></div>
                </div>

                <div className={styles.phoneScanBox}>
                  <div className={styles.phoneScanLine} />
                </div>

                <div className={styles.phoneResult}>
                  <p className={styles.phoneResultLabel}>Mendeteksi...</p>
                  <p className={styles.phoneResultValue}>Botol Plastik PET</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── VISI & MISI ───────── */}
      <section className={styles.visionMission} aria-label="Visi dan Misi">
        <div className={styles.visionCard}>
          <div className={`${styles.sectionBadge} ${styles.badgeVision}`}>
            <IconEye />
            Visi Kami
          </div>
          <h2 className={styles.visionTitle}>{visionText}</h2>
        </div>

        <div className={styles.missionCard}>
          <div className={`${styles.sectionBadge} ${styles.badgeMission}`}>
            <IconFlag />
            Misi Kami
          </div>

          <div className={styles.missionList}>
            {missions.map((m) => (
              <div key={m.title} className={styles.missionItem}>
                <div
                  className={`${styles.missionIcon} ${styles[m.colorClass]}`}
                >
                  {m.icon}
                </div>
                <div>
                  <p className={styles.missionItemTitle}>{m.title}</p>
                  <p className={styles.missionItemDesc}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── REKOMENDASI AI — BENTO GRID ───────── */}
      <section className={styles.bentoSection} aria-label="Rekomendasi AI">
        <div className={styles.bentoHeader}>
          <h2 className={styles.bentoTitle}>Rekomendasi AI Cerdas</h2>
          <p className={styles.bentoSubtitle}>
            Setelah mendeteksi barang, SirkulasiIn menganalisis kondisi pasar,
            ketersediaan fasilitas daur ulang lokal, dan nilai material untuk
            menentukan jalur paling optimal.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Recycle */}
          <article className={`${styles.bentoCard} ${styles.bentoRecycle}`}>
            <div className={styles.bentoDecoBlob} aria-hidden />
            <div>
              <div className={styles.bentoIconWrap}><IconRecycle /></div>
              <h3 className={styles.bentoCardTitle}>Daur Ulang (Recycle)</h3>
              <p className={styles.bentoCardDesc}>
                Kirimkan barang yang sudah tidak layak pakai ke fasilitas daur
                ulang terdekat. Ubah limbah menjadi bahan baku baru.
              </p>
            </div>
            <div className={styles.bentoFooter}>
              <div className={styles.bentoFooterLabel}>
                <IconSeedling />
                Dapatkan Poin Eco
              </div>
              <IconArrowRight />
            </div>
          </article>

          {/* Sell */}
          <article className={`${styles.bentoCard} ${styles.bentoSell}`}>
            <div className={styles.bentoDecoBlob} aria-hidden />
            <div>
              <div className={styles.bentoIconWrap}><IconStorefront /></div>
              <h3 className={styles.bentoCardTitle}>Jual (Sell)</h3>
              <p className={styles.bentoCardDesc}>
                Barang masih layak pakai? Jual langsung di marketplace
                SirkulasiIn kepada yang membutuhkan.
              </p>
            </div>
            <div className={styles.bentoSellImage}>
              <Image
                src="/tentang-marketplace.png"
                alt="Produk preloved di marketplace SirkulasiIn"
                fill
                className={styles.bentoSellImg}
                sizes="(max-width: 780px) 100vw, 360px"
              />
            </div>
          </article>

          {/* Discard */}
          <article className={`${styles.bentoCard} ${styles.bentoDiscard}`}>
            <div>
              <div className={styles.bentoIconWrap}><IconTrash /></div>
              <h3 className={styles.bentoCardTitle}>
                Buang Terpilah (Discard)
              </h3>
              <p className={styles.bentoCardDesc}>
                Jika barang tidak dapat didaur ulang atau dijual, kami pandu cara
                membuangnya dengan benar sesuai kategori limbah lokal.
              </p>
            </div>

            <div className={styles.discardInfo}>
              <div className={styles.discardInfoHeader}>
                <div className={styles.discardWarning}><IconWarning /></div>
                <div>
                  <p className={styles.discardInfoTitle}>Limbah B3</p>
                  <p className={styles.discardInfoSub}>Baterai Bekas</p>
                </div>
              </div>
              <p className={styles.discardLocLabel}>
                Lokasi Drop-off Terdekat:
              </p>
              <div className={styles.discardLocRow}>
                <span className={styles.discardLocName}>
                  Pusat Elektronik Kota
                </span>
                <span className={styles.discardLocDist}>2.5 km</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ───────── DAMPAK LINGKUNGAN ───────── */}
      <section className={styles.impactSection} aria-label="Dampak Lingkungan">
        <div className={styles.impactHeader}>
          <h2 className={styles.impactTitle}>Dampak Lingkungan Nyata</h2>
          <p className={styles.impactSubtitle}>
            Setiap tindakan kecil memiliki jejak. Lihat berapa banyak karbon
            yang dapat Anda hemat melalui keputusan berkelanjutan.
          </p>
        </div>

        <div className={styles.impactGrid}>
          {impactCards.map((card) => (
            <article key={card.title} className={styles.impactCard}>
              <div className={styles.impactCardImage}>
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className={styles.impactCardImageBg}
                  sizes="(max-width: 780px) 100vw, (max-width: 1100px) 50vw, 360px"
                />
                <div className={styles.impactCardOverlay} />
                <span
                  className={`${styles.impactCardBadge} ${styles[card.badgeClass]}`}
                >
                  {card.badge}
                </span>
              </div>
              <h4 className={styles.impactCardTitle}>{card.title}</h4>
              <div className={styles.impactStatRow}>
                <span
                  className={`${styles.impactStatValue} ${styles[card.valueClass]}`}
                >
                  {card.value}
                </span>
                <span className={styles.impactStatUnit}>{card.unit}</span>
              </div>
              <p className={styles.impactStatNote}>{card.note}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} aria-hidden />
        <div className={styles.ctaGlow2} aria-hidden />

        <h2 className={styles.ctaTitle}>
          Gabung 50.000+ Green Guardian bersama SirkulasiIn
        </h2>
        <p className={styles.ctaDesc}>
          Daftar sekarang untuk mulai tracking sampah rumah, dapatkan insight AI,
          dan buka peluang insentif dari setiap aksi kecil Anda.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/auth/signup" className={styles.ctaPrimary}>
            Buat Akun Gratis
          </Link>
          <Link href="/auth/login" className={styles.ctaGhost}>
            Sudah punya akun? Login
          </Link>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className={styles.footer}>
        <p className={styles.footerBrand}>SirkulasiIn</p>
        <nav className={styles.footerNav}>
          <Link href="/tentang" className={styles.footerLink}>Tentang</Link>
          <Link href="/scan" className={styles.footerLink}>AI Scan</Link>
          <Link href="/tutorial" className={styles.footerLink}>Tutorial</Link>
          <Link href="/marketplace" className={styles.footerLink}>Marketplace</Link>
        </nav>
        <p className={styles.footerCopy}>
          © 2025 SirkulasiIn. Setiap scan berarti untuk bumi yang lebih bersih.
        </p>
      </footer>
    </main>
  );
}
