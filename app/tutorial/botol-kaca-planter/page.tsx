import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import styles from "./tutorial.module.css";

export const metadata: Metadata = {
  title:
    "Tutorial: Planter Self-Watering dari Botol Kaca — SirkulasiIn",
  description:
    "Pelajari cara mengubah botol kaca bekas menjadi planter self-watering yang cantik. Tutorial ramah pemula dengan panduan langkah demi langkah.",
};

/* ═══════════════ SVG Inline Icons ═══════════════ */
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ToolIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const BoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

const ScissorsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
  </svg>
);

const DropletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </svg>
);

const SandpaperIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" />
  </svg>
);

const SproutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const AwardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

/* ═══════════════ Data ═══════════════ */
const tools = [
  { icon: ScissorsIcon, label: "Alat Potong Kaca" },
  { icon: SandpaperIcon, label: "Amplas Halus #400" },
  { icon: DropletIcon, label: "Sabun & Sikat Botol" },
  { icon: ToolIcon, label: "Pembersih Lem" },
];

const materials = [
  { icon: BoxIcon, label: "Botol Kaca Bekas" },
  { icon: DropletIcon, label: "Sumbu Katun Organik" },
  { icon: SproutIcon, label: "Tanah Pot" },
  { icon: LeafIcon, label: "Tanaman Herba" },
];

/* ═══════════════ Page Component ═══════════════ */
export default function TutorialPage() {
  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="home" />

      <div className={styles.container}>
        {/* ── Breadcrumb ── */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/">Tutorial</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>
            Planter Self-Watering Botol Kaca
          </span>
        </nav>

        {/* ═══════════════ Hero Section ═══════════════ */}
        <section className={styles.hero} id="tutorial-hero">
          <div className={styles.heroContent}>
            <span className={styles.categoryBadge}>
              <LeafIcon className={styles.categoryIcon} />
              Proyek Ramah Lingkungan
            </span>

            <h1 className={styles.heroTitle}>
              Planter Botol Kaca{" "}
              <span className={styles.heroTitleAccent}>
                Self-Watering
              </span>
            </h1>

            <p className={styles.heroDesc}>
              Ubah botol kaca bekas menjadi planter self-watering yang cantik
              dan fungsional untuk tanaman herba indoor Anda. Proyek ramah
              pemula yang sempurna untuk memulai gaya hidup sirkular.
            </p>

            <div className={styles.heroMeta}>
              <span className={styles.metaChip}>
                <UserGroupIcon className={styles.metaChipIcon} />
                Pemula
              </span>
              <span className={styles.metaChip}>
                <ClockIcon className={styles.metaChipIcon} />
                5 Menit
              </span>
              <span className={styles.metaChip}>
                <StarIcon
                  className={`${styles.metaChipIcon} ${styles.metaChipStar}`}
                />
                4.9/5 EcoPoin
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <Image
              src="/tutorial/hero.png"
              alt="Planter self-watering dari botol kaca"
              fill
              className={styles.heroImage}
              priority
              sizes="(max-width: 1100px) 100vw, 500px"
            />
            <div className={styles.heroVisualOverlay}>
              <p className={styles.heroOverlayText}>
                Selesaikan proyek ini & raih{" "}
                <span className={styles.heroOverlayHighlight}>
                  +150 SirkuPoin
                </span>{" "}
                yang bisa ditukar di marketplace!
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════ Info Cards: Tools & Materials ═══════════════ */}
        <section className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardIcon}>
                <ToolIcon className={styles.categoryIcon} />
              </div>
              <div>
                <h2 className={styles.infoCardTitle}>Alat yang Diperlukan</h2>
                <p className={styles.infoCardSubtitle}>
                  Peralatan dasar
                </p>
              </div>
            </div>
            <div className={styles.infoChipGrid}>
              {tools.map((t) => (
                <span key={t.label} className={styles.infoChip}>
                  <t.icon className={styles.infoChipIcon} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardIcon}>
                <BoxIcon className={styles.categoryIcon} />
              </div>
              <div>
                <h2 className={styles.infoCardTitle}>Material Inti</h2>
                <p className={styles.infoCardSubtitle}>
                  Bahan utama proyek
                </p>
              </div>
            </div>
            <div className={styles.infoChipGrid}>
              {materials.map((m) => (
                <span key={m.label} className={styles.infoChip}>
                  <m.icon className={styles.infoChipIcon} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ Assembly Process ═══════════════ */}
        <section className={styles.assemblySection} id="assembly">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <BookIcon className={styles.categoryIcon} />
            </div>
            <h2 className={styles.sectionTitle}>Proses Perakitan</h2>
          </div>

          <div className={styles.stepList}>
            {/* ── Step 1: Purify ── */}
            <div className={styles.stepItem}>
              <div className={styles.stepTimeline}>
                <span className={styles.stepNumber}>1</span>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepWithSidebar}>
                  <div className={styles.stepContentCard}>
                    <div className={styles.stepTextContent}>
                      <span className={styles.stepLabel}>Langkah 1</span>
                      <h3 className={styles.stepStepTitle}>
                        Bersihkan Botol Anda
                      </h3>
                      <p className={styles.stepDesc}>
                        Rendam botol kaca bekas selama 10-15 menit dalam air
                        hangat bersabun. Gunakan sikat khusus untuk membersihkan
                        sisa-sisa lem label. Pastikan botol benar-benar bersih
                        dan kering sebelum melanjutkan ke langkah berikutnya.
                      </p>
                    </div>
                    <div className={styles.stepImageWrapper}>
                      <Image
                        src="/tutorial/step-purify.png"
                        alt="Proses membersihkan botol kaca"
                        fill
                        className={styles.stepImage}
                        sizes="(max-width: 1100px) 100vw, 400px"
                      />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className={styles.stepSidebar}>
                    <div className={styles.sidebarCard}>
                      <p className={styles.sidebarCardTitle}>Catatan Penting</p>
                      <p className={styles.sidebarCardBody}>
                        Gunakan botol dengan ketebalan{" "}
                        <span className={styles.sidebarHighlight}>≥3mm</span>.
                        Botol yang lebih tebal lebih aman untuk dipotong dan
                        menghasilkan potongan yang lebih rapi.
                      </p>
                    </div>

                    <div className={styles.sidebarCard}>
                      <p className={styles.sidebarCardTitle}>Teknik Alternatif</p>
                      <div className={styles.altMethods}>
                        <span className={styles.altMethod}>Minyak Kayu Putih</span>
                        <span className={styles.altMethod}>Aseton</span>
                        <span className={styles.altMethod}>Baking Soda</span>
                        <span className={styles.altMethod}>Cuka</span>
                      </div>
                    </div>

                    {/* Community Hub */}
                    <div className={styles.communityCard}>
                      <div className={styles.communityHeader}>
                        <p className={styles.communityTitle}>Komunitas</p>
                        <a href="#" className={styles.communityLink}>
                          Lihat Semua →
                        </a>
                      </div>
                      <div className={styles.communityAvatars}>
                        <span className={styles.communityUser}>
                          <span className={styles.communityAvatar}>RA</span>
                          @RinaAstuti
                        </span>
                        <span className={styles.communityUser}>
                          <span className={styles.communityAvatar}>BP</span>
                          @BudiPratama
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 2: Scoring ── */}
            <div className={styles.stepItem}>
              <div className={styles.stepTimeline}>
                <span className={styles.stepNumber}>2</span>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepContentCard}>
                  <div className={styles.stepTextContent}>
                    <span className={styles.stepLabel}>Langkah 2</span>
                    <h3 className={styles.stepStepTitle}>
                      Garis Potong Presisi
                    </h3>
                    <p className={styles.stepDesc}>
                      Buat garis skor di sekeliling botol kira-kira di ⅓ bagian
                      atas. Gunakan alat potong kaca dan putar botol dengan
                      tekanan yang konsisten. Metode thermal shock dapat digunakan
                      untuk mendapatkan potongan yang lebih bersih dan presisi.
                    </p>
                  </div>
                  <div className={styles.stepImageWrapper}>
                    <Image
                      src="/tutorial/step-scoring.png"
                      alt="Proses scoring garis potong pada botol kaca"
                      fill
                      className={styles.stepImage}
                      sizes="(max-width: 1100px) 100vw, 400px"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 3: Refining ── */}
            <div className={styles.stepItem}>
              <div className={styles.stepTimeline}>
                <span className={styles.stepNumber}>3</span>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepBody}>
                <div
                  className={`${styles.stepContentCard} ${styles.stepContentCardReverse}`}
                >
                  <div className={styles.stepImageWrapper}>
                    <Image
                      src="/tutorial/step-refining.png"
                      alt="Proses menghaluskan tepi botol kaca"
                      fill
                      className={styles.stepImage}
                      sizes="(max-width: 1100px) 100vw, 400px"
                    />
                  </div>
                  <div className={styles.stepTextContent}>
                    <span className={styles.stepLabel}>Langkah 3</span>
                    <h3 className={styles.stepStepTitle}>
                      Haluskan Tepi Kaca
                    </h3>
                    <p className={styles.stepDesc}>
                      Ini sangat penting untuk keselamatan! Gunakan amplas #400
                      basah dan haluskan tepi potongan dengan gerakan melingkar.
                      Lakukan secara progresif — dari kasar ke halus — hingga
                      tepinya mulus dan aman disentuh.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 4: Hydro-Link ── */}
            <div className={styles.stepItem}>
              <div className={styles.stepTimeline}>
                <span className={styles.stepNumber}>4</span>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepContentCard}>
                  <div className={styles.stepTextContent}>
                    <span className={styles.stepLabel}>Langkah 4</span>
                    <h3 className={styles.stepStepTitle}>
                      Pasang Hydro-Link
                    </h3>
                    <p className={styles.stepDesc}>
                      Selipkan sumbu katun organik melalui leher botol. Sumbu ini
                      akan menyerap air dari reservoir dan menyalurkan kelembaban
                      secara konsisten ke akar tanaman, memastikan tanaman Anda
                      tetap terhidrasi tanpa perawatan berlebih.
                    </p>
                  </div>
                  <div className={styles.stepImageWrapper}>
                    <Image
                      src="/tutorial/step-hydrolink.png"
                      alt="Proses memasang sumbu katun hydro-link"
                      fill
                      className={styles.stepImage}
                      sizes="(max-width: 1100px) 100vw, 400px"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 5: Final ── */}
            <div className={styles.stepItem}>
              <div className={styles.stepTimeline}>
                <span className={styles.stepNumber}>5</span>
                <div className={styles.stepLine} />
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepSimple}>
                  <span className={styles.stepLabel}>Langkah 5</span>
                  <h3 className={styles.stepStepTitle}>Instalasi Akhir</h3>
                  <p className={styles.stepDesc}>
                    Masukkan sumbu ke bagian dasar botol. Tambahkan lapisan
                    kerikil kecil, lalu tanah pot, dan tanam tanaman herba
                    pilihan Anda. Isi reservoir air, dan saksikan ekosistem
                    mini self-watering Anda hidup! Pastikan ujung sumbu
                    terendam di air untuk menjaga kelembaban optimal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ Completion CTA ═══════════════ */}
        <section className={styles.ctaSection}>
          <p className={styles.ctaLabel}>Proyek Selesai?</p>
          <h2 className={styles.ctaTitle}>
            Verifikasi hasil proyek Anda dan dapatkan SirkuPoin!
          </h2>
          <p className={styles.ctaDesc}>
            Upload foto hasil planter Anda, AI kami akan memverifikasi kualitas
            dan memberikan feedback untuk perbaikan.
          </p>
          <button className={styles.ctaButton} type="button">
            Klaim +150 SirkuPoin
            <ArrowRightIcon className={styles.ctaButtonIcon} />
          </button>
          <div className={styles.ctaSublinks}>
            <a href="#" className={styles.ctaSublink}>
              <DownloadIcon className={styles.ctaSublinkIcon} />
              Unduh PDF
            </a>
            <a href="#" className={styles.ctaSublink}>
              <ShareIcon className={styles.ctaSublinkIcon} />
              Bagikan Tutorial
            </a>
          </div>
        </section>

        {/* ═══════════════ Footer ═══════════════ */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoMark}>
                  <LeafIcon className={styles.categoryIcon} />
                </div>
                <span className={styles.footerLogoText}>SirkulasiIn</span>
              </div>
              <p className={styles.footerBrandDesc}>
                Platform AI companion untuk gaya hidup sirkular. Mengubah
                limbah menjadi kebijaksanaan.
              </p>
              <div className={styles.footerSocials}>
                <button className={styles.footerSocialBtn} type="button" aria-label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </button>
                <button className={styles.footerSocialBtn} type="button" aria-label="Twitter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </button>
                <button className={styles.footerSocialBtn} type="button" aria-label="YouTube">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Platform</p>
              <ul className={styles.footerLinks}>
                <li><Link href="/scan" className={styles.footerLink}>AI Scanner</Link></li>
                <li><Link href="/marketplace" className={styles.footerLink}>Marketplace</Link></li>
                <li><a href="#" className={styles.footerLink}>Tutorial</a></li>
                <li><a href="#" className={styles.footerLink}>Leaderboard</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Sumber Daya</p>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Blog</a></li>
                <li><a href="#" className={styles.footerLink}>Panduan Daur Ulang</a></li>
                <li><a href="#" className={styles.footerLink}>FAQ</a></li>
                <li><a href="#" className={styles.footerLink}>Dokumentasi API</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Dukungan</p>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Bantuan</a></li>
                <li><a href="#" className={styles.footerLink}>Kontak Kami</a></li>
                <li><a href="#" className={styles.footerLink}>Kebijakan Privasi</a></li>
                <li><a href="#" className={styles.footerLink}>Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            © 2026 SirkulasiIn. Seluruh hak dilindungi.
          </div>
        </footer>
      </div>
    </main>
  );
}
