import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/navbar";
import AnimatedCounter from "./components/AnimatedCounter";
import styles from "./page.module.css";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const CATEGORY_LABELS: Record<string, string> = {
  glass: "Kaca",
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  textile: "Tekstil",
  electronic: "Elektronik",
  other: "Lainnya",
};

function parseCarbonString(str: string | null): number {
  if (!str) return 0;
  let cleaned = str.replace(/CO2/gi, '');
  cleaned = cleaned.replace(',', '.');
  const match = cleaned.match(/[\d.]+/);
  if (!match) return 0;
  const value = parseFloat(match[0]);
  return isNaN(value) ? 0 : value;
}

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

const langkahSirkular = [
  {
    nomor: "01",
    judul: "Scan dengan AI",
    deskripsi:
      "Arahkan kamera ke barang atau sampahmu. AI SirkulasiIn langsung mengenali jenis material, kondisi, dan nilai sirkularnya hanya dalam hitungan detik.",
    mascot: "/siku-scan.png",
    alt: "Siku sedang memindai barang dengan smartphone",
    tone: "scan" as const,
  },
  {
    nomor: "02",
    judul: "Pilih Rekomendasi Terbaik",
    deskripsi:
      "Dapatkan tiga jalur cerdas dari AI: daur ulang jadi barang baru, jual di marketplace, atau buang aman bila tergolong limbah berbahaya — semua sesuai kondisi barangmu.",
    mascot: "/siku-pilih.png",
    alt: "Siku menampilkan tiga pilihan rekomendasi",
    tone: "pilih" as const,
  },
  {
    nomor: "03",
    judul: "Tuntaskan Aksi Sirkular",
    deskripsi:
      "Ikuti tutorial daur ulang, pasang listing di marketplace, atau temukan titik pembuangan B3 terdekat. Setiap aksimu menutup loop sampah dan menambah jejak hijau yang nyata.",
    mascot: "/siku-tuntas.png",
    alt: "Siku merayakan loop sirkular yang tertutup",
    tone: "tuntas" as const,
  },
];

const trustItems = [
  {
    title: "AI-Verified",
    text: "Setiap produk dianalisis dan diverifikasi oleh teknologi AI canggih untuk memastikan kualitas.",
    colorClass: "trustIconGreen",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Eco-Tracked",
    text: "Jejak karbon terukur di setiap transaksi. Pantau kontribusi hijau Anda secara real-time.",
    colorClass: "trustIconBlue",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M11.7 13.5c-.8-.4-1.5-1-2-1.8-.4-.7-.5-1.5-.3-2.2" />
      </svg>
    ),
  },
  {
    title: "Secure & Safe",
    text: "Transaksi aman, data terenkripsi, dan dukungan komunitas yang aktif melindungi setiap pengguna.",
    colorClass: "trustIconAmber",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    quote: "SirkulasiIn mengubah cara saya melihat sampah. Sekarang saya tahu persis mana yang bisa didaur ulang dan mana yang punya nilai jual.",
    name: "Rina Maharani",
    role: "Ibu Rumah Tangga, Jakarta",
    color: "#27ae60",
  },
  {
    quote: "Marketplace-nya luar biasa! Saya sudah menjual 15+ barang preloved dan mengumpulkan eco-points yang lumayan.",
    name: "Budi Santoso",
    role: "Mahasiswa, Bandung",
    color: "#3b82f6",
  },
  {
    quote: "Fitur AI scan-nya akurat banget. Dalam 2 bulan, sampah rumah kami berkurang 40%. Sangat recommended!",
    name: "Dewi Lestari",
    role: "Aktivis Lingkungan, Yogyakarta",
    color: "#d97706",
  },
  {
    quote: "Dulu bingung mau buang elektronik bekas kemana. Sekarang tinggal scan, langsung dapat rekomendasi drop point terdekat.",
    name: "Andi Prasetyo",
    role: "Karyawan Swasta, Surabaya",
    color: "#8b5cf6",
  },
  {
    quote: "Eco-points bisa ditukar jadi diskon belanja produk ramah lingkungan. Sistem reward-nya bikin semangat terus!",
    name: "Siti Nurhaliza",
    role: "Guru SD, Semarang",
    color: "#ec4899",
  },
  {
    quote: "Sebagai pengelola RT, SirkulasiIn bantu warga kami memilah sampah lebih baik. Data analitiknya sangat berguna.",
    name: "Hendra Wijaya",
    role: "Ketua RT, Depok",
    color: "#14b8a6",
  },
  {
    quote: "Anak-anak jadi antusias belajar daur ulang lewat fitur tutorial-nya. Edukatif dan menyenangkan!",
    name: "Putri Handayani",
    role: "Ibu & Content Creator, Malang",
    color: "#f59e0b",
  },
  {
    quote: "Platform terbaik untuk circular economy di Indonesia. Fitur barter-nya unik dan sangat membantu komunitas kami.",
    name: "Rizky Ramadhan",
    role: "Founder Komunitas Zero Waste, Medan",
    color: "#06b6d4",
  },
];

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Parallel data fetching
  const [
    homeContentRes,
    listingsRes,
    profileCountRes,
    allListingsCountRes,
    marketplaceCarbonRes,
    tutorialCarbonRes,
  ] = await Promise.all([
    supabase.from("site_content").select("content").eq("id", "home_page").single(),
    supabase
      .from("marketplace_listings")
      .select("id, title, image_url, price, carbon_saved, category")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    // Semua listing (termasuk draft/sold) — sama seperti profile
    supabase
      .from("marketplace_listings")
      .select("carbon_saved")
      .not("carbon_saved", "is", null),
    // Tutorial submissions → recycle_tutorials → scan_history carbon_saved
    supabase
      .from("tutorial_submissions")
      .select(`id, recycle_tutorials ( title, scan_history ( carbon_saved ) )`)
  ]);

  const heroTitle =
    homeContentRes.data?.content?.hero_title ||
    "Kelola sampah rumah jadi peluang, bukan beban.";
  const heroSubtitle =
    homeContentRes.data?.content?.hero_subtitle ||
    "SirkulasiIn membantu Anda memilah, memetakan, dan menyalurkan sampah ke ekosistem daur ulang sambil mengumpulkan insentif dan insight berbasis AI.";

  const latestListings = listingsRes.data ?? [];
  const totalUsers = profileCountRes.count ?? 0;
  const totalListings = allListingsCountRes.count ?? 0;

  // ═══ Kalkulasi CO₂ — sama persis dengan profile/page.tsx ═══
  // 1. Marketplace: parse string "0.05kg CO2" → number
  const marketplaceCo2 = (marketplaceCarbonRes.data ?? []).reduce(
    (sum: number, r: any) => sum + parseCarbonString(r.carbon_saved),
    0
  );
  // 2. Tutorial Submissions → recycle_tutorials → scan_history.carbon_saved
  const tutorialsCo2 = (tutorialCarbonRes.data ?? []).reduce((sum: number, sub: any) => {
    // ts-expect-error handling nested relation
    const carbonStr = sub.recycle_tutorials?.scan_history?.carbon_saved;
    return sum + parseCarbonString(carbonStr);
  }, 0);
  const totalCarbon = marketplaceCo2 + tutorialsCo2;

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="home" />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className={styles.hero} id="home">
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Platform AI Ekonomi Sirkular
          </span>

          <h1 className={styles.heroTitle}>
            Kelola sampah rumah jadi{" "}
            <span className={styles.heroTitleHighlight}>peluang</span>, bukan
            beban.
          </h1>

          <p className={styles.heroText}>{heroSubtitle}</p>

          <div className={styles.heroActions}>
            <Link href="/scan" className={styles.primaryAction}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Mulai Scan Sekarang
            </Link>
            <Link href="/marketplace" className={styles.secondaryAction}>
              Jelajahi Marketplace
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <AnimatedCounter value={totalUsers} suffix="+" className={styles.statValue} />
              <p className={styles.statLabel}>Green Guardian</p>
            </div>
            <div className={styles.statItem}>
              <AnimatedCounter value={totalListings} suffix="+" className={styles.statValue} />
              <p className={styles.statLabel}>Produk Terkurasi</p>
            </div>
            <div className={styles.statItem}>
              <AnimatedCounter value={totalCarbon} decimals={2} suffix=" kg" className={styles.statValue} />
              <p className={styles.statLabel}>CO₂ Dicegah</p>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.visualGlow} aria-hidden />
          <Image
            src="/heroSec.png"
            alt="Ilustrasi pertumbuhan hijau"
            fill
            className={styles.heroImage}
            priority
            sizes="(max-width: 900px) 100vw, 480px"
          />
          <div className={styles.chipGroup}>
            <div className={styles.sikuChip}>
              <div className={styles.sikuChipImg}>
                <Image src="/siku-chip.png" alt="" fill sizes="56px" />
              </div>
              <div>
                <p className={styles.chipTitle}>Halo, aku Siku!</p>
                <p className={styles.chipText}>Asisten AI sirkular kamu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STEPS ═══════════════ */}
      <section className={styles.stepsSection} id="scan">
        <div className={styles.stepsHeader}>
          <span className={styles.sectionLabel}>Cara Kerja SirkulasiIn</span>
          <h2 className={styles.sectionTitle}>
            Dari sampah jadi solusi, hanya dalam 3 langkah
          </h2>
        </div>

        <div className={styles.stepGrid}>
          {langkahSirkular.map((langkah) => (
            <article
              key={langkah.nomor}
              className={`${styles.stepCard} ${styles[`stepTone_${langkah.tone}`]}`}
            >
              <div className={styles.stepCardGlow} aria-hidden />
              <div className={styles.stepMascotWrap}>
                <span className={styles.stepMascotRing} aria-hidden />
                <span className={styles.stepMascotRingOuter} aria-hidden />
                <div className={styles.stepMascotImgWrap}>
                  <Image
                    src={langkah.mascot}
                    alt={langkah.alt}
                    fill
                    sizes="(max-width: 820px) 220px, 260px"
                    className={styles.stepMascotImg}
                  />
                </div>
              </div>
              <div className={styles.stepCardBody}>
                <span className={styles.stepNumber}>Langkah {langkah.nomor}</span>
                <h3 className={styles.stepTitle}>{langkah.judul}</h3>
                <p className={styles.stepText}>{langkah.deskripsi}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════════════ IMPACT ═══════════════ */}
      <section className={styles.impactSection} id="riwayat">
        <div className={styles.impactContent}>
          <span className={styles.sectionLabelLight}>Riwayat & Dampak</span>
          <h2 className={styles.impactTitle}>
            Setiap scan Anda membentuk jejak hijau yang terukur
          </h2>
          <p className={styles.impactText}>
            Pantau tren sampah rumah, kategori terbanyak, dan rekomendasi
            personal untuk mengurangi residu mingguan secara konsisten.
          </p>
          <div className={styles.impactStats}>
            <div className={styles.impactStatItem}>
              <p className={styles.impactValue}>84%</p>
              <p className={styles.impactLabel}>Sampah teralihkan dari TPA</p>
            </div>
            <div className={styles.impactStatItem}>
              <p className={styles.impactValue}>31 kg</p>
              <p className={styles.impactLabel}>Rata-rata pengurangan bulanan</p>
            </div>
            <div className={styles.impactStatItem}>
              <AnimatedCounter value={totalCarbon} decimals={2} suffix=" kg" className={styles.impactValue} />
              <p className={styles.impactLabel}>Total CO₂ dicegah komunitas</p>
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

      {/* ═══════════════ MARKETPLACE ═══════════════ */}
      <section className={styles.marketSection} id="marketplace">
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.sectionLabel}>Marketplace Sirkular</span>
            <h2 className={styles.sectionTitle}>
              Temukan produk terkurasi dari ekosistem daur ulang
            </h2>
          </div>
          <Link href="/marketplace" className={styles.marketLink}>
            Lihat Semua →
          </Link>
        </div>

        <div className={styles.marketGrid}>
          {latestListings.length > 0
            ? latestListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className={styles.productCardLink}
                >
                  <article className={styles.productCard}>
                    <div className={styles.productImageWrap}>
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.productImagePlaceholder}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                      {item.category && (
                        <span className={styles.productBadge}>
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      )}
                      {item.carbon_saved && (
                        <span className={styles.carbonTag}>
                          -{item.carbon_saved}
                        </span>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productName}>{item.title}</p>
                      <p className={styles.productMeta}>
                        {CATEGORY_LABELS[item.category] || item.category}
                      </p>
                      <p className={styles.productPrice}>
                        {formatRupiah(item.price)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <article key={i} className={styles.productCard}>
                  <div className={styles.productImageWrap}>
                    <div className={styles.productImagePlaceholder}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.productInfo}>
                    <p className={styles.productName}>Segera Hadir</p>
                    <p className={styles.productMeta}>Produk terkurasi</p>
                    <p className={styles.productPrice}>-</p>
                  </div>
                </article>
              ))}
        </div>
      </section>

      {/* ═══════════════ TRUST ═══════════════ */}
      <section className={styles.trustSection}>
        <div className={styles.trustHeader}>
          <span className={styles.sectionLabel}>Kenapa SirkulasiIn?</span>
          <h2 className={styles.sectionTitle}>
            Dipercaya oleh komunitas hijau Indonesia
          </h2>
        </div>

        <div className={styles.trustGrid}>
          {trustItems.map((item) => (
            <article key={item.title} className={styles.trustCard}>
              <div className={`${styles.trustIconWrap} ${styles[item.colorClass]}`}>
                {item.icon}
              </div>
              <h3 className={styles.trustTitle}>{item.title}</h3>
              <p className={styles.trustText}>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className={styles.testimonialSection}>
        <div className={styles.testimonialHeader}>
          <span className={styles.sectionLabel}>Suara Komunitas</span>
          <h2 className={styles.sectionTitle}>
            Apa kata mereka tentang SirkulasiIn
          </h2>
        </div>

        <div className={styles.testimonialCarousel}>
          <div className={styles.testimonialTrack}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <article key={`${t.name}-${i}`} className={styles.testimonialCard}>
                <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <div
                    className={styles.testimonialAvatar}
                    style={{ background: t.color }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className={styles.testimonialName}>{t.name}</p>
                    <p className={styles.testimonialRole}>{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow1} aria-hidden />
        <div className={styles.ctaGlow2} aria-hidden />
        <div className={styles.ctaDotGrid} aria-hidden />

        <div className={styles.ctaMascotWrap}>
          <span className={styles.ctaMascotGlow} aria-hidden />
          <span className={styles.ctaMascotRing} aria-hidden />
          <Image
            src="/siku-join.png"
            alt="Siku menyambut Green Guardian baru"
            fill
            sizes="(max-width: 820px) 240px, 360px"
            className={styles.ctaMascotImg}
          />

          <span className={`${styles.ctaSparkle} ${styles.ctaSparkleA}`} aria-hidden>✨</span>
          <span className={`${styles.ctaSparkle} ${styles.ctaSparkleB}`} aria-hidden>🌿</span>
          <span className={`${styles.ctaSparkle} ${styles.ctaSparkleC}`} aria-hidden>♻️</span>
        </div>

        <div className={styles.ctaContent}>
          <span className={styles.ctaEyebrow}>
            <span className={styles.ctaEyebrowDot} />
            Komunitas Green Guardian
          </span>

          <h2 className={styles.ctaTitle}>
            Yuk gabung bareng{" "}
            <span className={styles.ctaTitleAccent}>
              {totalUsers > 0 ? `${totalUsers.toLocaleString("id-ID")}+` : "ribuan"}
            </span>{" "}
            sahabat sirkular!
          </h2>
          <p className={styles.ctaText}>
            Daftar gratis untuk mulai tracking sampah rumah, dapatkan insight
            AI, dan buka peluang insentif dari setiap aksi kecil kamu — Siku siap nemenin.
          </p>

          <div className={styles.ctaActions}>
            <Link href="/signup" className={styles.ctaPrimary}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Buat Akun Gratis
            </Link>
            <Link href="/login" className={styles.ctaGhost}>
              Sudah punya akun? Login
            </Link>
          </div>
          <p className={styles.ctaTrust}>Gratis selamanya · Tanpa kartu kredit · Batal kapan saja</p>
        </div>
      </section>
    </main>
  );
}
