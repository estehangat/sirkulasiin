"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../../components/navbar";
import styles from "./hasil.module.css";

/* ═══════════════ Types ═══════════════ */
type ScanData = {
  id: string;
  created_at: string;
  image_url: string | null;
  description: string | null;
  item_name: string;
  material: string | null;
  grade: string | null;
  weight: string | null;
  condition: string | null;
  recommendation: string;
  reason: string | null;
  market_sentiment: string | null;
  material_purity: string | null;
  circular_potential: number;
  carbon_offset: number;
  carbon_saved: string | null;
  potential_reward: string | null;
  estimated_price: string | null;
  recycle_options: string[] | null;
  upcycle_idea: string | null;
  upcycle_description: string | null;
  upcycle_image_url: string | null;
  hero_headline: string | null;
  hero_description: string | null;
};

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ SVG Icons ═══════════════ */
const CheckShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4" />
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);
const TargetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const SparklesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);
const LeafIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
const GiftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);
const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const RecycleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" /><path d="M8.293 13.596 4.875 5.5l7.418-.476" />
    <path d="m9.5 5.5 4-7" /><path d="m14.5 13.5 4 7" />
  </svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const SpinnerIcon = () => (
  <svg style={{ animation: "spin 0.8s linear infinite" }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/* ═══════════════ Helpers ═══════════════ */
function conditionLabel(c: string | null) {
  switch (c) {
    case "good": return "Sangat Baik";
    case "fair": return "Cukup Baik";
    case "poor": return "Kurang Baik";
    default: return c || "-";
  }
}

function recoEmoji(r: string) {
  switch (r) {
    case "sell": return "🏷";
    case "recycle": return "♻️";
    case "dispose": return "🗑";
    default: return "📦";
  }
}

function upcycleEmoji(idea: string | null) {
  if (!idea) return "🌿";
  const lower = idea.toLowerCase();
  if (lower.includes("vas") || lower.includes("pot")) return "🌺";
  if (lower.includes("terrarium")) return "🏺";
  if (lower.includes("lampu") || lower.includes("lamp")) return "💡";
  if (lower.includes("rak") || lower.includes("shelf")) return "🪵";
  if (lower.includes("tas") || lower.includes("bag")) return "👜";
  if (lower.includes("dompet")) return "👛";
  if (lower.includes("hiasan") || lower.includes("dekorasi")) return "🎨";
  if (lower.includes("mainan") || lower.includes("toy")) return "🧸";
  return "🌿";
}

/* ═══════════════ COMPONENT ═══════════════ */
/* ═══════════════ Loading Messages ═══════════════ */
const GEN_MESSAGES = [
  "Menganalisis item untuk daur ulang...",
  "AI sedang membuat langkah-langkah tutorial...",
  "Membuat gambar hasil akhir dengan AI...",
  "Menyimpan tutorial ke database...",
  "Hampir selesai, mohon tunggu...",
];

function HasilScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Tutorial generation state ── */
  const [tutorialId, setTutorialId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(GEN_MESSAGES[0]);

  useEffect(() => {
    async function fetchData() {
      const id = searchParams.get("id");
      const isFallback = searchParams.get("fallback") === "true";

      if (isFallback) {
        try {
          const stored = localStorage.getItem("scanResult");
          const storedImage = localStorage.getItem("scanImage");
          if (stored) {
            const r = JSON.parse(stored);
            setScanData({
              id: "local",
              created_at: new Date().toISOString(),
              image_url: storedImage || null,
              description: null,
              item_name: r.itemName || "Item",
              material: r.material || null,
              grade: r.grade || null,
              weight: r.weight || null,
              condition: r.condition || null,
              recommendation: r.recommendation || "dispose",
              reason: r.reason || null,
              market_sentiment: r.marketSentiment || null,
              material_purity: r.materialPurity || null,
              circular_potential: r.circularPotential || 0,
              carbon_offset: r.carbonOffset || 0,
              carbon_saved: r.carbonSaved || null,
              potential_reward: r.potentialReward || null,
              estimated_price: r.estimatedPrice || null,
              recycle_options: r.recycleOptions || null,
              upcycle_idea: r.upcycleIdea || null,
              upcycle_description: r.upcycleDescription || null,
              upcycle_image_url: null,
              hero_headline: r.heroHeadline || null,
              hero_description: r.heroDescription || null,
            });
          } else {
            setError("Data hasil scan tidak ditemukan.");
          }
        } catch {
          setError("Gagal memuat data hasil scan.");
        }
        setLoading(false);
        return;
      }

      if (!id) {
        setError("ID scan tidak ditemukan di URL.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbErr } = await supabase
          .from("scan_history")
          .select("*")
          .eq("id", id)
          .single();

        if (dbErr || !data) {
          setError("Hasil scan tidak ditemukan.");
        } else {
          setScanData(data as ScanData);

          // Auto-generate tutorial & image if missing
          if (data.recommendation === "recycle") {
            fetch("/api/scan/generate-tutorial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scanId: id }),
            }).then(res => res.json()).then(resData => {
              if (resData.tutorialId) setTutorialId(resData.tutorialId);
              // Trigger refresh data scan untuk mendapatkan upcycle_image_url terbaru
              supabase.from("scan_history").select("upcycle_image_url").eq("id", id).single().then(({data: updated}) => {
                if (updated?.upcycle_image_url) {
                  setScanData(prev => prev ? { ...prev, upcycle_image_url: updated.upcycle_image_url } : null);
                }
              });
            }).catch(console.error);
          }

          // Auto-fetch tutorial ID for recycle recommendations
          if (data.recommendation === "recycle") {
            const { data: tut } = await supabase
              .from("recycle_tutorials")
              .select("id")
              .eq("scan_id", id)
              .single();
            if (tut) setTutorialId(tut.id);
          }
        }
      } catch {
        setError("Gagal memuat data dari database.");
      }
      setLoading(false);
    }
    fetchData();
  }, [searchParams]);

  /* ── Cycle generating messages ── */
  useEffect(() => {
    if (!isGenerating) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % GEN_MESSAGES.length;
      setGenMessage(GEN_MESSAGES[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  /* ── On-demand tutorial generation ── */
  const handleGenerateTutorial = useCallback(async () => {
    if (!scanData || scanData.id === "local" || isGenerating) return;
    setIsGenerating(true);
    setGenMessage(GEN_MESSAGES[0]);
    try {
      const res = await fetch("/api/scan/generate-tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scanData.id }),
      });
      const data = await res.json();
      if (data.tutorialId) {
        setTutorialId(data.tutorialId);
        router.push(`/tutorial/recycle?id=${data.tutorialId}`);
      }
    } catch (err) {
      console.error("Generate tutorial error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [scanData, isGenerating, router]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="scan" />
        <div className={styles.loadingWrap}>
          <SpinnerIcon />
          <p className={styles.loadingText}>Memuat hasil analisis...</p>
        </div>
      </main>
    );
  }

  /* ── Error State ── */
  if (error || !scanData) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="scan" />
        <div className={styles.loadingWrap}>
          <p className={styles.errorText}>⚠ {error || "Data tidak ditemukan."}</p>
          <Link href="/scan" className={styles.backToScanBtn}>
            ← Kembali ke Scan
          </Link>
        </div>
      </main>
    );
  }

  /* ── Shorthand ── */
  const d = scanData;
  const reco = d.recommendation;
  const isRecycle = reco === "recycle";
  const isSell = reco === "sell";
  const isDispose = reco === "dispose";

  /* ── Default headlines ── */
  const headline = d.hero_headline || (
    isSell ? "Berikan item ini kehidupan kedua." :
    isRecycle ? "Item ini bisa didaur ulang!" :
    "Buang dengan bertanggung jawab."
  );

  const heroDesc = d.hero_description || d.reason || "AI kami telah menganalisis item ini dan memberikan rekomendasi terbaik.";

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="scan" />

      {/* ═══ GENERATING OVERLAY ═══ */}
      {isGenerating && (
        <div className={styles.genOverlay}>
          <div className={styles.genCard}>
            <div className={styles.genIconWrap}>
              <div className={styles.genRing} />
              <div className={styles.genInner}>
                <RecycleIcon />
              </div>
            </div>
            <h2 className={styles.genTitle}>Membuat Tutorial</h2>
            <p className={styles.genSubtitle}>{genMessage}</p>
            <div className={styles.genDots}>
              <span className={styles.genDot} />
              <span className={styles.genDot} />
              <span className={styles.genDot} />
            </div>
          </div>
        </div>
      )}

      {/* ═══ HERO SECTION ═══ */}
      <section className={styles.heroSection}>
        {/* Image Card */}
        <div className={styles.imageCard}>
          {d.image_url && (
            <Image
              src={d.image_url}
              alt={d.item_name}
              fill
              className={styles.imageCardImg}
              sizes="(max-width: 1100px) 100vw, 480px"
              priority
              unoptimized
            />
          )}
          <span className={styles.verifiedBadge}>
            <CheckShieldIcon />
            Scan Terverifikasi
          </span>
          <h1 className={styles.imageCardTitle}>{d.item_name}</h1>
        </div>

        {/* Right Content */}
        <div className={styles.heroRight}>
          <span className={styles.eyebrow}>Jalur Keberlanjutan</span>
          <h2 className={styles.heroHeadline}>{headline}</h2>
          <p className={styles.heroDesc}>{heroDesc}</p>

          {/* Analysis Cards */}
          <div className={styles.analysisCards}>
            <div className={styles.analysisCard}>
              <div className={styles.analysisCardHeader}>
                <span className={`${styles.analysisCardIcon} ${styles.iconGreen}`}>
                  <TargetIcon />
                </span>
                <span className={styles.analysisCardTitle}>Analisis Strategis</span>
              </div>
              <p className={styles.analysisFieldLabel}>Sentimen Pasar</p>
              <p className={styles.analysisFieldValue}>
                {d.market_sentiment || "Data tidak tersedia."}
              </p>
              <p className={styles.analysisFieldLabel}>Kemurnian Material</p>
              <p className={styles.analysisFieldValue}>
                {d.material_purity || "Data tidak tersedia."}
              </p>
            </div>

            <div className={styles.analysisCard}>
              <div className={styles.analysisCardHeader}>
                <span className={`${styles.analysisCardIcon} ${styles.iconPurple}`}>
                  <SparklesIcon />
                </span>
                <span className={styles.analysisCardTitle}>Dampak Keberlanjutan</span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Potensi Sirkular</span>
                <span className={styles.progressValue}>{d.circular_potential}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${d.circular_potential}%` }} />
              </div>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Nilai Offset Karbon</span>
                <span className={styles.progressValue}>{d.carbon_offset}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${d.carbon_offset}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MIDDLE SECTION ═══ */}
      <section className={styles.middleSection}>
        {/* Left Column */}
        <div className={styles.middleLeft}>
          {/* Technical Breakdown */}
          <div className={styles.techCard}>
            <div className={styles.techHeader}>
              <span className={styles.techIcon}><ClipboardIcon /></span>
              <span className={styles.techTitle}>Rincian Teknis</span>
            </div>
            <table className={styles.techTable}>
              <thead><tr><th>Atribut</th><th>Data</th></tr></thead>
              <tbody>
                <tr><td>Material</td><td>{d.material || "-"}</td></tr>
                <tr><td>Grade</td><td>{d.grade || "-"}</td></tr>
                <tr><td>Berat</td><td>{d.weight || "-"}</td></tr>
                <tr>
                  <td>Kondisi</td>
                  <td className={styles.valueGreen}>{conditionLabel(d.condition)}</td>
                </tr>
                <tr>
                  <td>Rekomendasi</td>
                  <td>{recoEmoji(reco)} {reco === "sell" ? "Jual" : reco === "recycle" ? "Daur Ulang" : "Buang"}</td>
                </tr>
                {d.estimated_price && (
                  <tr><td>Estimasi Harga</td><td>{d.estimated_price}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stat Cards */}
          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <div className={styles.statCardIcon}><LeafIcon /></div>
              <p className={styles.statCardLabel}>Karbon Disimpan</p>
              <p className={styles.statCardValue}>{d.carbon_saved || "0kg CO2"}</p>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statCardIcon} ${styles.statCardIconBlue}`}>
                <GiftIcon />
              </div>
              <p className={styles.statCardLabel}>Potensi Reward</p>
              <p className={styles.statCardValue}>{d.potential_reward || "0 Poin"}</p>
            </div>
          </div>

          {/* Recycle Options */}
          {isRecycle && d.recycle_options && d.recycle_options.length > 0 && (
            <div className={styles.techCard}>
              <div className={styles.techHeader}>
                <span className={styles.techIcon}><RecycleIcon /></span>
                <span className={styles.techTitle}>Opsi Daur Ulang</span>
              </div>
              <div className={styles.recycleChips}>
                {d.recycle_options.map((opt) => (
                  <span key={opt} className={styles.recycleChip}>{opt}</span>
                ))}
              </div>
            </div>
          )}

          {/* Community Row */}
          <div className={styles.communityRow}>
            <div className={styles.avatarStack}>
              <div className={styles.avatarDot} style={{ background: "#27AE60" }}>S</div>
              <div className={styles.avatarDot} style={{ background: "#3498db" }}>A</div>
              <div className={styles.avatarDot} style={{ background: "#829E60" }}>R</div>
              <div className={styles.avatarDot} style={{ background: "#A89F8D" }}>+12k</div>
            </div>
            <p className={styles.communityText}>
              <span className={styles.communityTextBold}>12.000 orang lain</span>{" "}
              mendaur ulang item ini bulan ini.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.middleRight}>
          {/* ── Featured Card: depends on recommendation ── */}
          {isSell && (
            <Link href={`/marketplace/create?from=scan&id=${d.id}`} className={styles.featuredCard} style={{ textDecoration: "none", color: "inherit" }}>
              <div className={styles.featuredThumbnail}>🏷</div>
              <div className={styles.featuredContent}>
                <p className={styles.featuredTitle}>Buat Listing di Marketplace</p>
                <p className={styles.featuredDesc}>
                  Jual item ini kepada pembeli yang membutuhkan. {d.estimated_price ? `Estimasi nilai: ${d.estimated_price}` : ""}
                </p>
                <div className={styles.featuredTags}>
                  <span className={`${styles.featuredTag} ${styles.featuredTagGreen}`}>+50 Bonus Poin</span>
                  <span className={styles.featuredTag}>Langsung Jual</span>
                </div>
              </div>
              <span className={styles.featuredBtn}>Buat<br />Listing</span>
            </Link>
          )}

          {isRecycle && (
            <div className={styles.featuredCard}>
              <div className={d.upcycle_image_url ? styles.featuredThumbnailImg : styles.featuredThumbnail}>
                {d.upcycle_image_url ? (
                  <Image
                    src={d.upcycle_image_url}
                    alt={d.upcycle_idea || "Upcycle idea"}
                    width={90}
                    height={90}
                    className={styles.featuredThumbnailImage}
                    unoptimized
                  />
                ) : (
                  upcycleEmoji(d.upcycle_idea)
                )}
              </div>
              <div className={styles.featuredContent}>
                <p className={styles.featuredTitle}>
                  {d.upcycle_idea ? `Ubah Menjadi ${d.upcycle_idea}` : "Tutorial Upcycling"}
                </p>
                <p className={styles.featuredDesc}>
                  {d.upcycle_description || "Pelajari cara mengubah item ini menjadi sesuatu yang baru dan berguna."}
                </p>
                <div className={styles.featuredTags}>
                  <span className={`${styles.featuredTag} ${styles.featuredTagGreen}`}>+50 Bonus Poin</span>
                  <span className={styles.featuredTag}>AI Generated</span>
                </div>
              </div>
              {tutorialId ? (
                <Link href={`/tutorial/recycle?id=${tutorialId}`} className={styles.featuredBtn}>
                  Mulai<br />Perjalanan
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.featuredBtn}
                  onClick={handleGenerateTutorial}
                  disabled={isGenerating}
                >
                  Mulai<br />Perjalanan
                </button>
              )}
            </div>
          )}

          {isDispose && (
            <div className={styles.featuredCard} style={{ borderColor: "#e74c3c" }}>
              <div className={styles.featuredThumbnail} style={{ background: "rgba(231,76,60,0.1)" }}>
                <TrashIcon />
              </div>
              <div className={styles.featuredContent}>
                <p className={styles.featuredTitle}>Panduan Pembuangan Aman</p>
                <p className={styles.featuredDesc}>
                  {d.reason || "Pastikan item ini dibuang dengan cara yang aman dan bertanggung jawab untuk melindungi lingkungan."}
                </p>
                <div className={styles.featuredTags}>
                  <span className={styles.featuredTag}>Panduan Lengkap</span>
                </div>
              </div>
              <Link href={`/scan/hasil/pembuangan-aman?id=${d.id}`} className={styles.featuredBtn} style={{ background: "#e74c3c" }}>
                Lihat<br />Panduan
              </Link>
            </div>
          )}

          {/* Action Rows — contextual */}
          {!isSell && (
            <Link href={`/marketplace/create?from=scan&id=${d.id}`} className={styles.actionRow}>
              <div className={`${styles.actionRowIcon} ${styles.actionRowIconGreen}`}>
                <StoreIcon />
              </div>
              <div className={styles.actionRowContent}>
                <p className={styles.actionRowTitle}>Jual di Marketplace</p>
                <p className={styles.actionRowDesc}>
                  {d.estimated_price
                    ? `Estimasi nilai: ${d.estimated_price}`
                    : "Tawarkan ke pembeli potensial."
                  }
                </p>
              </div>
              <span className={styles.actionRowArrow}><ChevronRightIcon /></span>
            </Link>
          )}

          {!isRecycle && (
            <button
              type="button"
              className={styles.actionRow}
              onClick={handleGenerateTutorial}
              disabled={isGenerating}
              style={{ width: "100%", textAlign: "left", cursor: isGenerating ? "wait" : "pointer" }}
            >
              <div className={`${styles.actionRowIcon} ${styles.actionRowIconGreen}`}>
                <RecycleIcon />
              </div>
              <div className={styles.actionRowContent}>
                <p className={styles.actionRowTitle}>Opsi Daur Ulang</p>
                <p className={styles.actionRowDesc}>
                  {d.upcycle_idea
                    ? `Ide: ${d.upcycle_idea}`
                    : "Generate tutorial daur ulang dengan AI."
                  }
                </p>
              </div>
              <span className={styles.actionRowArrow}><ChevronRightIcon /></span>
            </button>
          )}

          <Link href="#" className={styles.actionRow}>
            <div className={`${styles.actionRowIcon} ${styles.actionRowIconBlue}`}>
              <MapPinIcon />
            </div>
            <div className={styles.actionRowContent}>
              <p className={styles.actionRowTitle}>Eco-Drop Point</p>
              <p className={styles.actionRowDesc}>
                Serahkan di pusat hijau terdekat dari lokasi Anda.
              </p>
            </div>
            <span className={styles.actionRowArrow}><ChevronRightIcon /></span>
          </Link>

          {/* Journey Stepper */}
          <div className={styles.journeyCard}>
            <div className={styles.journeyHeader}>
              <span className={styles.journeyLine} />
              <span className={styles.journeyTitle}>Perjalanan Hijau Sejauh Ini</span>
              <span className={styles.journeyLine} />
            </div>
            <div className={styles.stepper}>
              <div className={styles.stepperProgress} style={{ width: "62%" }} />
              {[
                { num: 1, label: "Scan Item", active: true },
                { num: 2, label: "Analisis", active: true },
                { num: 3, label: "Rencana Aksi", active: true },
                { num: 4, label: "Dampak Eco", active: false },
              ].map((s) => (
                <div className={styles.step} key={s.num}>
                  <div className={`${styles.stepDot} ${s.active ? styles.stepDotActive : styles.stepDotInactive}`}>
                    {s.num}
                  </div>
                  <span className={`${styles.stepLabel} ${s.active ? styles.stepLabelActive : ""}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default function HasilScanPage() {
  return (
    <Suspense>
      <HasilScanPageContent />
    </Suspense>
  );
}
