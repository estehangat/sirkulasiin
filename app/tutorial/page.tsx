"use client";

import { useEffect, useState, useMemo } from "react";
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
  materials: string[] | null;
};

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ Constants ═══════════════ */
const DIFFICULTIES = ["Pemula", "Menengah", "Mahir"] as const;
const PAGE_SIZE = 6;

/* ─── Material normalisation ─── */
const MATERIAL_MAP: Record<string, string> = {
  besi: "Besi", baja: "Baja", kayu: "Kayu", bambu: "Bambu",
  plastik: "Plastik", kain: "Kain", kertas: "Kertas", kardus: "Kardus",
  kaca: "Kaca", karet: "Karet", tali: "Tali", benang: "Benang",
  botol: "Botol", kaleng: "Kaleng", cd: "CD", dvd: "DVD",
  pipa: "Pipa", lem: "Lem", cat: "Cat", mur: "Baut", baut: "Baut",
  kabel: "Kabel", aluminum: "Aluminium", aluminium: "Aluminium",
  alumunium: "Aluminium", tembaga: "Tembaga", triplek: "Triplek",
  keramik: "Keramik", seng: "Seng", galon: "Galon", ban: "Ban",
};

function normaliseMaterial(raw: string): string {
  const first = raw.trim().split(/\s+/)[0].toLowerCase();
  return MATERIAL_MAP[first] ?? raw.trim().split(/\s+/).slice(0, 2).join(" ");
}

function extractMaterials(tutorials: Tutorial[]): string[] {
  const set = new Set<string>();
  tutorials.forEach((t) => {
    if (t.materials?.length) set.add(normaliseMaterial(t.materials[0]));
  });
  return Array.from(set).sort();
}

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
const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ═══════════════ Helpers ═══════════════ */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Pemula: "#22c55e",
  Menengah: "#f59e0b",
  Mahir: "#ef4444",
};

/* ═══════════════ Component ═══════════════ */
export default function TutorialListPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    supabase
      .from("recycle_tutorials")
      .select("id, title, description, difficulty, duration, eco_points, final_image_url, created_at, materials")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setTutorials(data as Tutorial[]);
        setLoading(false);
      });
  }, []);

  const allMaterials = useMemo(() => extractMaterials(tutorials), [tutorials]);

  // Featured is ALWAYS the latest tutorial — never affected by filters
  const featured = tutorials[0] ?? null;

  // Grid = everything except featured, then filtered
  const gridItems = useMemo(() => {
    return tutorials.slice(1).filter((t) => {
      if (activeDifficulty && t.difficulty !== activeDifficulty) return false;
      if (activeMaterial) {
        const label = t.materials?.length ? normaliseMaterial(t.materials[0]) : null;
        if (label !== activeMaterial) return false;
      }
      return true;
    });
  }, [tutorials, activeDifficulty, activeMaterial]);

  const totalPages = Math.ceil(gridItems.length / PAGE_SIZE);
  const paginated = gridItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilter = !!(activeDifficulty || activeMaterial);
  const totalPoints = tutorials.reduce((s, t) => s + t.eco_points, 0);

  function bump() { setAnimKey((k) => k + 1); }

  function clearFilters() {
    setActiveDifficulty(null); setActiveMaterial(null); setPage(1); bump();
  }
  function handleDifficulty(d: string) {
    setActiveDifficulty((p) => (p === d ? null : d)); setPage(1); bump();
  }
  function handleMaterial(m: string) {
    setActiveMaterial((p) => (p === m ? null : m)); setPage(1); bump();
  }
  function handlePageChange(p: number) {
    setPage(p); bump();
    document.getElementById("tutorial-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
            {/* ── Featured: ALWAYS latest, never changes with filter ── */}
            {featured && (
              <section className={styles.featuredSection}>
                <Link href={`/tutorial/recycle?id=${featured.id}`} className={styles.featuredCard}>
                  <div className={styles.featuredImageWrap}>
                    {featured.final_image_url && (
                      <Image src={featured.final_image_url} alt={featured.title} fill className={styles.featuredImage} sizes="(max-width:1100px) 100vw, 590px" unoptimized />
                    )}
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
                      <span className={styles.featuredMetaChip}><UserGroupIcon className={styles.chipIcon} />{featured.difficulty}</span>
                      <span className={styles.featuredMetaChip}><ClockIcon className={styles.chipIcon} />{featured.duration}</span>
                      <span className={styles.featuredMetaChip}><StarIcon className={`${styles.chipIcon} ${styles.chipIconStar}`} />+{featured.eco_points} Poin</span>
                      {featured.materials?.[0] && (
                        <span className={styles.featuredMetaChip}>🧱 {normaliseMaterial(featured.materials[0])}</span>
                      )}
                    </div>
                    <span className={styles.featuredCta}>
                      Mulai Tutorial <ArrowRightIcon className={styles.ctaIcon} />
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* ── Grid Section ── */}
            <section id="tutorial-grid" style={{ scrollMarginTop: "100px" }}>
              {/* Section Header with embedded filter toggle */}
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon}>
                    <GridIcon className={styles.sectionIconInner} />
                  </div>
                  <h2 className={styles.sectionTitle}>Semua Tutorial</h2>
                </div>
                <div className={styles.sectionHeaderRight}>
                  {hasActiveFilter && (
                    <div className={styles.activePills}>
                      {activeDifficulty && (
                        <span className={styles.activePill}>
                          {activeDifficulty}
                          <button onClick={() => { setActiveDifficulty(null); setPage(1); bump(); }} aria-label="Hapus filter">
                            <XIcon className={styles.pillX} />
                          </button>
                        </span>
                      )}
                      {activeMaterial && (
                        <span className={styles.activePill}>
                          {activeMaterial}
                          <button onClick={() => { setActiveMaterial(null); setPage(1); bump(); }} aria-label="Hapus filter">
                            <XIcon className={styles.pillX} />
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                  <span className={styles.sectionCount}>{gridItems.length} tutorial</span>
                  <button
                    className={`${styles.filterToggleBtn} ${filterOpen ? styles.filterToggleBtnActive : ""} ${hasActiveFilter ? styles.filterToggleBtnHasFilter : ""}`}
                    onClick={() => setFilterOpen((v) => !v)}
                    aria-expanded={filterOpen}
                  >
                    <FilterIcon className={styles.filterToggleIcon} />
                    Filter
                    {hasActiveFilter && <span className={styles.filterDot} />}
                  </button>
                </div>
              </div>

              {/* ── Collapsible Filter Panel ── */}
              <div className={`${styles.filterPanel} ${filterOpen ? styles.filterPanelOpen : ""}`}>
                <div className={styles.filterPanelInnerWrapper}>
                  <div className={styles.filterPanelInner}>
                    <div className={styles.filterGroup}>
                      <span className={styles.filterLabel}>
                        <FilterIcon className={styles.filterLabelIcon} />
                        Tingkat
                      </span>
                      <div className={styles.filterChips}>
                        {DIFFICULTIES.map((d) => (
                          <button
                            key={d}
                            className={`${styles.chip} ${activeDifficulty === d ? styles.chipActive : ""}`}
                            onClick={() => handleDifficulty(d)}
                            style={activeDifficulty === d ? { "--chip-color": DIFFICULTY_COLOR[d] } as React.CSSProperties : undefined}
                          >
                            <span className={styles.chipDot} style={{ background: DIFFICULTY_COLOR[d] }} />
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {allMaterials.length > 0 && (
                      <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>
                          <svg className={styles.filterLabelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                          </svg>
                          Material
                        </span>
                        <div className={styles.filterChips}>
                          {allMaterials.map((m) => (
                            <button
                              key={m}
                              className={`${styles.chip} ${activeMaterial === m ? styles.chipActiveMaterial : ""}`}
                              onClick={() => handleMaterial(m)}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasActiveFilter && (
                      <button className={styles.clearFilter} onClick={clearFilters}>
                        <XIcon className={styles.clearFilterIcon} />
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Grid with stagger animation ── */}
              <div className={styles.grid} key={animKey}>
                {gridItems.length === 0 && (
                  <div className={styles.emptyState}>
                    <ImagePlaceholderIcon className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>
                      {hasActiveFilter ? "Tidak ada tutorial yang cocok" : "Belum ada tutorial"}
                    </h3>
                    <p className={styles.emptyDesc}>
                      {hasActiveFilter
                        ? "Coba ubah filter untuk melihat lebih banyak tutorial."
                        : "Scan item Anda untuk mendapatkan tutorial daur ulang yang di-generate oleh AI secara otomatis."}
                    </p>
                    {hasActiveFilter ? (
                      <button className={styles.emptyCta} onClick={clearFilters}>Reset Filter</button>
                    ) : (
                      <Link href="/scan" className={styles.emptyCta}>
                        <ScanIcon className={styles.ctaIcon} />
                        Mulai Scan
                      </Link>
                    )}
                  </div>
                )}

                {paginated.map((tut, idx) => (
                  <Link
                    key={tut.id}
                    href={`/tutorial/recycle?id=${tut.id}`}
                    className={styles.card}
                    style={{ "--stagger-i": idx } as React.CSSProperties}
                  >
                    <div className={styles.cardImageWrap}>
                      {tut.final_image_url ? (
                        <>
                          <Image src={tut.final_image_url} alt={tut.title} fill className={styles.cardImage} sizes="(max-width:680px) 100vw, (max-width:1100px) 50vw, 380px" unoptimized />
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
                        <span className={styles.cardBadge} style={{ background: `${DIFFICULTY_COLOR[tut.difficulty]}22`, color: DIFFICULTY_COLOR[tut.difficulty] }}>
                          {tut.difficulty}
                        </span>
                        <span className={`${styles.cardBadge} ${styles.cardBadgeTime}`}>{tut.duration}</span>
                        {tut.materials?.[0] && (
                          <span className={`${styles.cardBadge} ${styles.cardBadgeMaterial}`}>
                            {normaliseMaterial(tut.materials[0])}
                          </span>
                        )}
                      </div>
                      <h3 className={styles.cardTitle}>{tut.title}</h3>
                      <p className={styles.cardDesc}>{tut.description || "Tutorial daur ulang yang di-generate oleh AI."}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardCta}>
                          Buka Tutorial <ArrowRightIcon className={styles.cardCtaIcon} />
                        </span>
                        <span className={styles.cardDate}>{formatDate(tut.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Sebelumnya">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="m15 18-6-6 6-6" /></svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const hidden = totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages;
                    const ellipsis = totalPages > 7 && ((p === 2 && page > 4) || (p === totalPages - 1 && page < totalPages - 3));
                    if (hidden && !ellipsis) return null;
                    if (hidden && ellipsis) return <span key={p} className={styles.pageEllipsis}>…</span>;
                    return (
                      <button key={p} className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`} onClick={() => handlePageChange(p)}>
                        {p}
                      </button>
                    );
                  })}

                  <button className={styles.pageBtn} onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Berikutnya">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </main>
  );
}
