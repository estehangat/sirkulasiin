"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/app/components/navbar";
import styles from "./tutorial-list.module.css";

/* ═══════════════ Types ═══════════════ */
type Tutorial = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration: string;
  eco_points: number;
  final_image_url: string | null;
  created_at: string;
};

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ SVG Icons ═══════════════ */
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const ImagePlaceholderIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className={styles.loadingSpinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const ScanIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </svg>
);

/* ═══════════════ Helpers ═══════════════ */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ═══════════════ Component ═══════════════ */
export default function TutorialListPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTutorials() {
      const { data } = await supabase
        .from("recycle_tutorials")
        .select("id, title, description, difficulty, duration, eco_points, final_image_url, created_at")
        .order("created_at", { ascending: false });

      if (data) setTutorials(data as Tutorial[]);
      setLoading(false);
    }
    fetchTutorials();
  }, []);

  const totalPoints = tutorials.reduce((sum, t) => sum + t.eco_points, 0);
  const featured = tutorials[0];
  const rest = tutorials.slice(1);

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="tutorial" />

      <div className={styles.container}>
        {/* ═══ HERO ═══ */}
        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            <LeafIcon className={styles.eyebrowIcon} />
            Edukasi Sirkular
          </span>
          <h1 className={styles.title}>
            Belajar dari aksi kecil{" "}
            <span className={styles.titleAccent}>yang berdampak</span>
          </h1>
          <p className={styles.subtitle}>
            Panduan langkah-demi-langkah yang di-generate oleh AI untuk mengubah
            limbah menjadi karya berharga. Mulai perjalanan sirkular Anda hari ini.
          </p>

          {!loading && tutorials.length > 0 && (
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{tutorials.length}</span>
                <span className={styles.statLabel}>Tutorial</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{totalPoints}</span>
                <span className={styles.statLabel}>Total Poin</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>AI</span>
                <span className={styles.statLabel}>Generated</span>
              </div>
            </div>
          )}
        </section>

        {/* ═══ LOADING ═══ */}
        {loading && (
          <div className={styles.loadingWrap}>
            <SpinnerIcon />
            <p className={styles.loadingText}>Memuat tutorial...</p>
          </div>
        )}

        {/* ═══ CONTENT ═══ */}
        {!loading && (
          <>
            {/* Featured Card */}
            {featured && (
              <section className={styles.featuredSection}>
                <Link
                  href={`/tutorial/recycle?id=${featured.id}`}
                  className={styles.featuredCard}
                >
                  <div className={styles.featuredImageWrap}>
                    {featured.final_image_url ? (
                      <Image
                        src={featured.final_image_url}
                        alt={featured.title}
                        fill
                        className={styles.featuredImage}
                        sizes="(max-width: 1100px) 100vw, 590px"
                        unoptimized
                      />
                    ) : null}
                    <span className={styles.featuredLabel}>
                      <StarIcon className={styles.chipIcon} />
                      Terbaru
                    </span>
                  </div>
                  <div className={styles.featuredContent}>
                    <span className={styles.featuredBadge}>
                      <LeafIcon className={styles.chipIcon} />
                      Tutorial Daur Ulang
                    </span>
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <p className={styles.featuredDesc}>
                      {featured.description || "Pelajari cara mengubah limbah menjadi karya berharga dengan panduan langkah demi langkah."}
                    </p>
                    <div className={styles.featuredMeta}>
                      <span className={styles.featuredMetaChip}>
                        <UserGroupIcon className={styles.chipIcon} />
                        {featured.difficulty}
                      </span>
                      <span className={styles.featuredMetaChip}>
                        <ClockIcon className={styles.chipIcon} />
                        {featured.duration}
                      </span>
                      <span className={styles.featuredMetaChip}>
                        <StarIcon className={`${styles.chipIcon} ${styles.chipIconStar}`} />
                        +{featured.eco_points} Poin
                      </span>
                    </div>
                    <span className={styles.featuredCta}>
                      Mulai Tutorial
                      <ArrowRightIcon className={styles.ctaIcon} />
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* Grid Section */}
            <section>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon}>
                    <GridIcon className={styles.sectionIconInner} />
                  </div>
                  <h2 className={styles.sectionTitle}>Semua Tutorial</h2>
                </div>
                <span className={styles.sectionCount}>
                  {tutorials.length} tutorial
                </span>
              </div>

              <div className={styles.grid}>
                {tutorials.length === 0 && (
                  <div className={styles.emptyState}>
                    <ImagePlaceholderIcon className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Belum ada tutorial</h3>
                    <p className={styles.emptyDesc}>
                      Scan item Anda untuk mendapatkan tutorial daur ulang yang
                      di-generate oleh AI secara otomatis.
                    </p>
                    <Link href="/scan" className={styles.emptyCta}>
                      <ScanIcon className={styles.ctaIcon} />
                      Mulai Scan
                    </Link>
                  </div>
                )}

                {(rest.length > 0 ? rest : tutorials.length === 1 ? [] : tutorials).map((tut) => (
                  <Link
                    key={tut.id}
                    href={`/tutorial/recycle?id=${tut.id}`}
                    className={styles.card}
                  >
                    <div className={styles.cardImageWrap}>
                      {tut.final_image_url ? (
                        <>
                          <Image
                            src={tut.final_image_url}
                            alt={tut.title}
                            fill
                            className={styles.cardImage}
                            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 380px"
                            unoptimized
                          />
                          <div className={styles.cardImageOverlay} />
                        </>
                      ) : (
                        <div className={styles.cardImagePlaceholder}>
                          <ImagePlaceholderIcon className={styles.placeholderIcon} />
                        </div>
                      )}
                      <span className={styles.cardPoints}>
                        <StarIcon className={styles.pointsIcon} />
                        +{tut.eco_points}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardBadge}>{tut.difficulty}</span>
                        <span className={`${styles.cardBadge} ${styles.cardBadgeTime}`}>
                          {tut.duration}
                        </span>
                      </div>
                      <h3 className={styles.cardTitle}>{tut.title}</h3>
                      <p className={styles.cardDesc}>
                        {tut.description || "Tutorial daur ulang yang di-generate oleh AI."}
                      </p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardCta}>
                          Buka Tutorial
                          <ArrowRightIcon className={styles.cardCtaIcon} />
                        </span>
                        <span className={styles.cardDate}>
                          {formatDate(tut.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className={styles.footer}>
          <p className={styles.footerLeft}>
            © 2026 SirkulasiIn. Memupuk planet yang lebih bersih.
          </p>
          <nav className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Kebijakan Privasi</a>
            <a href="#" className={styles.footerLink}>Laporan Keberlanjutan</a>
            <a href="#" className={styles.footerLink}>Bantuan</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
