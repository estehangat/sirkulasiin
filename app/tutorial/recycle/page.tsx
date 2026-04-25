"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import * as LucideIcons from "lucide-react";
import {
  X, Camera, Upload, Image as ImageIcon, Trophy, Sparkles, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import styles from "./recycle-tutorial.module.css";

/* ═══════════════ Dynamic Lucide Icon ═══════════════ */
const lucideMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

function StepIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && lucideMap[name]) || lucideMap["Recycle"];
  return <Icon className={className} />;
}

/* ═══════════════ Types ═══════════════ */
type TutorialStep = {
  stepNumber: number;
  title: string;
  label?: string;
  description?: string;
  mainDesc?: string;
  detailDesc?: string;
  dos?: string[];
  donts?: string[];
  expertInsight?: string | null;
  techniqueRef?: string | null;
  iconName?: string;
};

type TutorialData = {
  id: string;
  scan_id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration: string;
  eco_points: number;
  tools: string[];
  materials: string[];
  steps: TutorialStep[];
  final_image_url: string | null;
  created_at: string;
};

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ SVG Icons ═══════════════ */
const RecycleSpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" /><path d="M8.293 13.596 4.875 5.5l7.418-.476" />
    <path d="m9.5 5.5 4-7" /><path d="m14.5 13.5 4 7" />
  </svg>
);

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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const ImagePlaceholderIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const PlayCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);

/* ═══════════════ Loading Messages ═══════════════ */
const LOADING_MESSAGES = [
  "Memuat tutorial dari database...",
  "Menyiapkan langkah-langkah...",
  "Hampir selesai...",
];

/* ═══════════════ Component ═══════════════ */
function RecycleTutorialPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tutorial, setTutorial] = useState<TutorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  /* ── Submit Modal State ── */
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitImage, setSubmitImage] = useState<string | null>(null);
  const [submitPreview, setSubmitPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ ecoPoints: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const submitFileRef = useRef<HTMLInputElement>(null);

  /* ── Share State ── */
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tutorial) return;
    
    // Safely get base URL
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Mari mendaur ulang bersama! 🌱\n\nSaya baru saja membaca tutorial "${tutorial.title}" di SirkulasiIn.\nYuk, ikuti langkah-langkahnya untuk mengubah barang bekas menjadi kreasi bermanfaat dan kumpulkan poinnya!\n\nBaca selengkapnya di sini: ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Tutorial Daur Ulang: ${tutorial.title}`,
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error("Gagal membagikan tutorial:", err);
    }
  };

  useEffect(() => {
    // Cycle loading messages
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchTutorial() {
      const id = searchParams.get("id");
      if (!id) {
        setError("ID tutorial tidak ditemukan.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbErr } = await supabase
          .from("recycle_tutorials")
          .select("*")
          .eq("id", id)
          .single();

        if (dbErr || !data) {
          setError("Tutorial tidak ditemukan.");
        } else {
          const tutorialData = data as TutorialData;
          setTutorial(tutorialData);

          // Auto-generate final image if missing
          if (!tutorialData.final_image_url && tutorialData.scan_id) {
            fetch("/api/scan/generate-tutorial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scanId: tutorialData.scan_id }),
            })
              .then((r) => r.json())
              .then((res) => {
                if (res.tutorialId) {
                  // Re-fetch tutorial data to get the newly generated image
                  supabase.from("recycle_tutorials").select("final_image_url").eq("id", res.tutorialId).single().then(({data}) => {
                    if (data?.final_image_url) {
                      setTutorial((prev) => prev ? { ...prev, final_image_url: data.final_image_url } : prev);
                    }
                  });
                }
              })
              .catch(() => {});
          }

          // Auto-enrich steps with Lucide icon names if missing
          const steps = Array.isArray(tutorialData.steps) ? tutorialData.steps : [];
          const needsIcons = steps.some((s: TutorialStep) => !s.iconName);
          if (needsIcons && tutorialData.id) {
            fetch("/api/tutorial/generate-icons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tutorialId: tutorialData.id }),
            })
              .then((r) => r.json())
              .then((res) => {
                if (res.steps) {
                  setTutorial((prev) => prev ? { ...prev, steps: res.steps } : prev);
                }
              })
              .catch(() => {}); // Fail silently — icons are non-critical
          }
        }
      } catch {
        setError("Gagal memuat tutorial.");
      }
      setLoading(false);
    }

    fetchTutorial();
  }, [searchParams]);

  /* ── File reader with resize ── */
  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error("Ukuran file melebihi 10MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = () => reject(new Error("Gagal membaca gambar."));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });

  const handleSubmitFile = useCallback(async (file: File) => {
    setSubmitError(null);
    try {
      const base64 = await readFileAsBase64(file);
      setSubmitImage(base64);
      setSubmitPreview(base64);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Gagal memproses file.");
    }
  }, []);

  const onSubmitDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleSubmitFile(file);
    else setSubmitError("Harap unggah file gambar (JPEG, PNG).");
  }, [handleSubmitFile]);

  /* ── Submit to API ── */
  const handleSubmitCompletion = async () => {
    if (!submitImage || !tutorial) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/tutorial/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorialId: tutorial.id,
          imageBase64: submitImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim.");

      setSubmitSuccess({ ecoPoints: data.ecoPoints });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSubmitModal(false);
    setSubmitImage(null);
    setSubmitPreview(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="tutorial" />
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingIconWrap}>
              <div className={styles.loadingIconRing} />
              <div className={styles.loadingIconInner}>
                <RecycleSpinnerIcon className={styles.loadingIconSvg} />
              </div>
            </div>
            <h2 className={styles.loadingTitle}>Memuat Tutorial</h2>
            <p className={styles.loadingSubtitle}>{loadingMsg}</p>
            <div className={styles.loadingDots}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Error State ── */
  if (error || !tutorial) {
    return (
      <main className={styles.pageShell}>
        <Navbar activeNav="tutorial" />
        <div className={styles.errorWrap}>
          <div className={styles.errorIcon}>
            <AlertIcon className={styles.iconSm} />
          </div>
          <p className={styles.errorText}>{error || "Data tidak ditemukan."}</p>
          <Link href="/scan" className={styles.backBtn}>
            ← Kembali ke Scan
          </Link>
        </div>
      </main>
    );
  }

  const t = tutorial;
  const steps = (Array.isArray(t.steps) ? t.steps : []) as TutorialStep[];
  const tools = (Array.isArray(t.tools) ? t.tools : []) as string[];
  const materials = (Array.isArray(t.materials) ? t.materials : []) as string[];

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="tutorial" />

      <div className={styles.container}>

        {/* ═══ HERO ═══ */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.categoryBadge}>
              <LeafIcon className={styles.iconSm} />
              Tutorial Daur Ulang
            </span>

            <h1 className={styles.heroTitle}>
              {t.title.split(" ").slice(0, -2).join(" ")}{" "}
              <span className={styles.heroTitleAccent}>
                {t.title.split(" ").slice(-2).join(" ")}
              </span>
            </h1>

            {t.description && (
              <p className={styles.heroDesc}>{t.description}</p>
            )}

            <div className={styles.heroMeta}>
              <span className={styles.metaChip}>
                <UserGroupIcon className={styles.metaChipIcon} />
                {t.difficulty}
              </span>
              <span className={styles.metaChip}>
                <ClockIcon className={styles.metaChipIcon} />
                {t.duration}
              </span>
              <span className={`${styles.metaChip} ${styles.metaChipPrimary}`}>
                <StarIcon className={`${styles.metaChipIcon} ${styles.metaChipStar}`} />
                +{t.eco_points} SirkuPoin
              </span>
            </div>

            <Link href={`/tutorial/recycle/steps?id=${t.id}`} className={styles.heroActionBtn}>
              Mulai Daur Ulang
              <PlayCircleIcon className={styles.heroActionBtnIcon} />
            </Link>
          </div>

          <div className={styles.heroVisual}>
            {t.final_image_url ? (
              <Image
                src={t.final_image_url}
                alt={t.title}
                fill
                className={styles.heroImage}
                priority
                sizes="(max-width: 1100px) 100vw, 500px"
                unoptimized
              />
            ) : (
              <div className={styles.heroVisualPlaceholder}>
                <ImagePlaceholderIcon className={styles.placeholderIcon} />
                <span className={styles.placeholderText}>Gambar AI sedang diproses</span>
              </div>
            )}
            <div className={styles.impactCard}>
              <div className={styles.impactCardHeader}>
                <div className={styles.impactIconWrapper}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M8 17V12" /><path d="M12 17V8" /><path d="M16 17V14" />
                  </svg>
                </div>
                <span className={styles.impactTitle}>ECO IMPACT</span>
              </div>
              <p className={styles.impactDesc}>
                Selesaikan tutorial ini dan raih +{t.eco_points} SirkuPoin.
                Setiap langkah kecil membawa dampak besar bagi lingkungan!
              </p>
            </div>
          </div>
        </section>

        {/* ═══ INFO CARDS ═══ */}
        {(tools.length > 0 || materials.length > 0) && (
          <section className={styles.infoCards}>
            {tools.length > 0 && (
              <div className={`${styles.infoCard} ${styles.infoCardGreen}`}>
                <div className={styles.infoCardHeader}>
                  <div className={`${styles.infoCardIcon} ${styles.infoCardIconGreen}`}>
                    <ToolIcon className={styles.iconSm} />
                  </div>
                  <div>
                    <h2 className={styles.infoCardTitle}>Alat yang Diperlukan</h2>
                    <p className={styles.infoCardSubtitle}>Peralatan dasar</p>
                  </div>
                </div>
                <div className={styles.chipGrid}>
                  {tools.map((tool) => (
                    <span key={tool} className={styles.chip}>{tool}</span>
                  ))}
                </div>
              </div>
            )}

            {materials.length > 0 && (
              <div className={`${styles.infoCard} ${styles.infoCardBrown}`}>
                <div className={styles.infoCardHeader}>
                  <div className={`${styles.infoCardIcon} ${styles.infoCardIconBrown}`}>
                    <BoxIcon className={styles.iconSm} />
                  </div>
                  <div>
                    <h2 className={styles.infoCardTitle}>Material Inti</h2>
                    <p className={styles.infoCardSubtitle}>Bahan utama proyek</p>
                  </div>
                </div>
                <div className={styles.chipGrid}>
                  {materials.map((mat) => (
                    <span key={mat} className={styles.chip}>{mat}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══ ASSEMBLY STEPS ═══ */}
        <section id="assembly" className={styles.assemblySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <BookIcon className={styles.iconSm} />
            </div>
            <h2 className={styles.sectionTitle}>Langkah-langkah Pembuatan</h2>
          </div>

          <div className={styles.stepList}>
            {steps.map((step) => (
              <div className={styles.stepItem} key={step.stepNumber}>
                <div className={styles.stepTimeline}>
                  <span className={styles.stepNumber}>{step.stepNumber}</span>
                  <div className={styles.stepLine} />
                </div>
                <div className={styles.stepBody}>
                  <div className={styles.stepCard}>
                    <div className={styles.stepIconWrap}>
                      <StepIcon name={step.iconName} />
                    </div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepLabel}>
                        Langkah {step.stepNumber}
                      </span>
                      <h3 className={styles.stepStepTitle}>{step.title}</h3>
                      <p className={styles.stepDesc}>{step.mainDesc || step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className={styles.ctaSection}>
          <p className={styles.ctaLabel}>Proyek Selesai?</p>
          <h2 className={styles.ctaTitle}>
            Verifikasi hasil proyek Anda dan dapatkan SirkuPoin!
          </h2>
          <p className={styles.ctaDesc}>
            Upload foto hasil kreasi daur ulang Anda. AI kami akan memverifikasi
            kualitas dan memberikan feedback.
          </p>
          <button className={styles.ctaButton} type="button" onClick={() => setShowSubmitModal(true)}>
            Klaim +{t.eco_points} SirkuPoin
            <ArrowRightIcon className={styles.iconSm} />
          </button>
          <div className={styles.ctaSublinks}>
            <a href="#" className={styles.ctaSublink}>
              <DownloadIcon className={styles.iconSm} />
              Unduh PDF
            </a>
            <a href="#" className={styles.ctaSublink} onClick={handleShare}>
              {isCopied ? <CheckCircle className={styles.iconSm} /> : <ShareIcon className={styles.iconSm} />}
              {isCopied ? "Tersalin!" : "Bagikan Tutorial"}
            </a>
          </div>
        </section>

      </div>

      {/* ═══ Submit Completion Modal ═══ */}
      {showSubmitModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Success State */}
            {submitSuccess ? (
              <div className={styles.successContent}>
                <div className={styles.successIconWrap}>
                  <div className={styles.successIconRing}>
                    <Trophy className={styles.successIcon} />
                  </div>
                  <Sparkles className={styles.successSparkle1} />
                  <Sparkles className={styles.successSparkle2} />
                </div>
                <h3 className={styles.successTitle}>Selamat! 🎉</h3>
                <p className={styles.successDesc}>
                  Tutorial berhasil diselesaikan. Anda mendapatkan poin eco untuk kontribusi Anda!
                </p>
                <div className={styles.successPointsCard}>
                  <LeafIcon className={styles.successPointsIcon} />
                  <span className={styles.successPointsValue}>+{submitSuccess.ecoPoints}</span>
                  <span className={styles.successPointsLabel}>Eco Points</span>
                </div>
                <div className={styles.successActions}>
                  <button
                    className={styles.successBtnPrimary}
                    type="button"
                    onClick={() => router.push("/tutorial")}
                  >
                    Jelajahi Tutorial Lain
                  </button>
                  <button
                    className={styles.successBtnSecondary}
                    type="button"
                    onClick={() => router.push("/dashboard")}
                  >
                    Ke Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* Upload State */
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.modalHeaderInfo}>
                    <div className={styles.modalHeaderIcon}>
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 className={styles.modalTitle}>Kirim Bukti Hasil</h3>
                      <p className={styles.modalSubtitle}>
                        Upload foto hasil daur ulang Anda untuk mengklaim poin
                      </p>
                    </div>
                  </div>
                  <button className={styles.modalCloseBtn} type="button" onClick={closeModal}>
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {/* Hidden file input */}
                  <input
                    ref={submitFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubmitFile(file);
                    }}
                  />

                  {!submitPreview ? (
                    <div
                      className={`${styles.submitDropZone} ${isDragOver ? styles.submitDropZoneActive : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={onSubmitDrop}
                      onClick={() => submitFileRef.current?.click()}
                    >
                      <div className={styles.submitDropIcon}>
                        <Upload size={28} />
                      </div>
                      <p className={styles.submitDropTitle}>
                        Seret & letakkan foto hasil karya Anda
                      </p>
                      <p className={styles.submitDropHint}>
                        JPEG, PNG, atau HEIC — maksimal 10MB
                      </p>
                      <div className={styles.submitDropActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={styles.submitUploadBtn}
                          type="button"
                          onClick={() => submitFileRef.current?.click()}
                        >
                          <ImageIcon size={16} />
                          Pilih Foto
                        </button>
                        <button
                          className={styles.submitCameraBtn}
                          type="button"
                          onClick={() => {
                            if (submitFileRef.current) {
                              submitFileRef.current.setAttribute("capture", "environment");
                              submitFileRef.current.click();
                              submitFileRef.current.removeAttribute("capture");
                            }
                          }}
                        >
                          <Camera size={16} />
                          Ambil Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.submitPreviewWrap}>
                      <img
                        src={submitPreview}
                        alt="Pratinjau hasil karya"
                        className={styles.submitPreviewImg}
                      />
                      <button
                        className={styles.submitPreviewRemove}
                        type="button"
                        onClick={() => {
                          setSubmitImage(null);
                          setSubmitPreview(null);
                          if (submitFileRef.current) submitFileRef.current.value = "";
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Points preview */}
                  <div className={styles.submitRewardPreview}>
                    <LeafIcon className={styles.submitRewardIcon} />
                    <span className={styles.submitRewardText}>
                      Anda akan mendapatkan <strong>{tutorial.eco_points} Eco Points</strong>
                    </span>
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div className={styles.submitErrorBanner}>
                      <AlertCircle size={16} />
                      <p>{submitError}</p>
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button className={styles.modalCancelBtn} type="button" onClick={closeModal}>
                    Batal
                  </button>
                  <button
                    className={styles.modalSubmitBtn}
                    type="button"
                    onClick={handleSubmitCompletion}
                    disabled={!submitImage || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className={styles.submitSpinner} />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim & Klaim Poin
                        <CheckCircle size={18} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function RecycleTutorialPage() {
  return (
    <Suspense>
      <RecycleTutorialPageContent />
    </Suspense>
  );
}
