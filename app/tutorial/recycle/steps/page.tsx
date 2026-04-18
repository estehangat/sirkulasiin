"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import * as LucideIcons from "lucide-react";
import {
  X, Leaf, Settings, ArrowLeft, ArrowRight,
  Check, CheckCircle, XCircle, Lightbulb, Loader2,
  AlertCircle, Camera, Upload, Image as ImageIcon, Trophy, Sparkles,
} from "lucide-react";
import styles from "./steps.module.css";

/* ═══════════════ Dynamic Lucide Icon ═══════════════ */
const lucideMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && lucideMap[name]) || lucideMap["Recycle"];
  return <Icon className={className} />;
}

/* ═══════════════ Types ═══════════════ */
type RawStep = {
  stepNumber: number;
  title: string;
  label?: string;
  iconName?: string;
  description?: string;
  mainDesc?: string;
  detailDesc?: string;
  dos?: string[];
  donts?: string[];
  expertInsight?: string | null;
  techniqueRef?: string | null;
};

type NormalizedStep = {
  stepNumber: number;
  label: string;
  title: string;
  iconName?: string;
  mainDesc: string;
  detailDesc: string;
  dos: string[];
  donts: string[];
  expertInsight?: string | null;
  techniqueRef?: string | null;
};

type TutorialData = {
  id: string;
  title: string;
  eco_points: number;
  steps: RawStep[];
};

/** Backward compat: old steps only have `description`, new ones have rich fields */
function normalizeStep(s: RawStep): NormalizedStep {
  return {
    stepNumber: s.stepNumber,
    label: s.label || `Langkah ${s.stepNumber}`,
    title: s.title,
    iconName: s.iconName,
    mainDesc: s.mainDesc || s.description || "",
    detailDesc: s.detailDesc || "",
    dos: Array.isArray(s.dos) ? s.dos : [],
    donts: Array.isArray(s.donts) ? s.donts : [],
    expertInsight: s.expertInsight ?? null,
    techniqueRef: s.techniqueRef ?? null,
  };
}

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ Component ═══════════════ */
function StepByStepPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tutorial, setTutorial] = useState<TutorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  /* ── Submit Modal State ── */
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitImage, setSubmitImage] = useState<string | null>(null);
  const [submitPreview, setSubmitPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ ecoPoints: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const submitFileRef = useRef<HTMLInputElement>(null);

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
          .select("id, title, eco_points, steps")
          .eq("id", id)
          .single();

        if (dbErr || !data) {
          setError("Tutorial tidak ditemukan.");
        } else {
          setTutorial(data as TutorialData);
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
      <main className={styles.shell}>
        <div className={styles.loadingWrap}>
          <Loader2 className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Memuat langkah-langkah...</p>
        </div>
      </main>
    );
  }

  /* ── Error State ── */
  if (error || !tutorial) {
    return (
      <main className={styles.shell}>
        <div className={styles.loadingWrap}>
          <AlertCircle className={styles.errorIcon} />
          <p className={styles.loadingText}>{error || "Data tidak ditemukan."}</p>
          <Link href="/tutorial" className={styles.navBtnOverview}>
            ← Kembali
          </Link>
        </div>
      </main>
    );
  }

  const rawSteps = Array.isArray(tutorial.steps) ? tutorial.steps : [];
  const steps = rawSteps.map(normalizeStep);
  const totalSteps = steps.length;
  const step = steps[currentStep];

  if (!step) {
    return (
      <main className={styles.shell}>
        <div className={styles.loadingWrap}>
          <p className={styles.loadingText}>Tutorial ini belum memiliki langkah-langkah.</p>
          <Link href="/tutorial" className={styles.navBtnOverview}>
            ← Kembali
          </Link>
        </div>
      </main>
    );
  }

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const goBack = () => setCurrentStep((p) => Math.max(0, p - 1));
  const goNext = () => setCurrentStep((p) => Math.min(totalSteps - 1, p + 1));

  const getState = (idx: number) => {
    if (idx < currentStep) return "completed";
    if (idx === currentStep) return "active";
    return "upcoming";
  };

  const tutorialId = tutorial.id;

  return (
    <main className={styles.shell}>
      {/* ═══ Top Bar ═══ */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href={`/tutorial/recycle?id=${tutorialId}`} className={styles.closeBtn}>
            <X size={18} />
          </Link>
          <span className={styles.brandName}>EcoStep</span>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.pointsBadge}>
            <Leaf className={styles.pointsIcon} />
            {tutorial.eco_points} pts
          </span>
          <button className={styles.settingsBtn} type="button">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressHeader}>
          <div className={styles.progressTitleRow}>
            <h1 className={styles.progressTitle}>{tutorial.title}</h1>
            <span className={styles.progressCounter}>
              Langkah {currentStep + 1} dari {totalSteps}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className={styles.stepCard} key={currentStep}>
          <div className={styles.stepCardInner}>
            {/* Left */}
            <div className={styles.stepCardLeft}>
              <div className={styles.stepMeta}>
                <div className={styles.stepMetaIcon}>
                  <DynamicIcon name={step.iconName} />
                </div>
                <span className={styles.stepMetaLabel}>
                  Langkah {step.stepNumber}: {step.label}
                </span>
              </div>

              <h2 className={styles.stepCardTitle}>{step.title}</h2>

              <p className={styles.stepMainDesc}>{step.mainDesc}</p>
              <p className={styles.stepDetailDesc}>{step.detailDesc}</p>

              {/* Tips Grid */}
              {(step.dos.length > 0 || step.donts.length > 0) && (
                <div className={styles.tipsGrid}>
                  {step.dos.map((tip) => (
                    <div className={styles.tipItem} key={tip}>
                      <span className={styles.tipIconDo}>
                        <CheckCircle />
                      </span>
                      {tip}
                    </div>
                  ))}
                  {step.donts.map((tip) => (
                    <div className={styles.tipItem} key={tip}>
                      <span className={styles.tipIconDont}>
                        <XCircle />
                      </span>
                      {tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Expert Insight (optional) */}
              {step.expertInsight && (
                <div className={styles.expertInsight}>
                  <div className={styles.expertInsightHeader}>
                    <Lightbulb className={styles.expertInsightIcon} />
                    <span className={styles.expertInsightLabel}>Saran Ahli</span>
                  </div>
                  <p className={styles.expertInsightText}>{step.expertInsight}</p>
                </div>
              )}

              {/* Technique Ref (optional) */}
              {step.techniqueRef && (
                <div className={styles.techniqueRef}>
                  <p className={styles.techniqueRefLabel}>Referensi Teknik</p>
                  <p className={styles.techniqueRefText}>{step.techniqueRef}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step Previews */}
        <div className={styles.stepPreviews}>
          {steps.map((s, i) => (
            <button
              key={s.stepNumber}
              className={styles.previewCard}
              data-active={i === currentStep ? "true" : "false"}
              onClick={() => setCurrentStep(i)}
              type="button"
              style={{ border: i === currentStep ? `1.5px solid var(--color-primary)` : `1px solid rgba(0,0,0,0.06)` }}
            >
              <span className={styles.previewDot} data-state={getState(i)}>
                {getState(i) === "completed" ? <Check size={14} /> : s.stepNumber}
              </span>
              <div className={styles.previewInfo}>
                <p className={styles.previewTitle}>{s.title}</p>
                <p className={styles.previewSubtitle}>{s.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Bottom Navigation ═══ */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <button
            className={styles.navBtnBack}
            onClick={goBack}
            disabled={currentStep === 0}
            type="button"
          >
            <ArrowLeft className={styles.navBtnIcon} />
            Kembali
          </button>

          <Link href={`/tutorial/recycle?id=${tutorialId}`} className={styles.navBtnOverview}>
            Kembali ke Ringkasan
          </Link>

          {currentStep < totalSteps - 1 ? (
            <button className={styles.navBtnNext} onClick={goNext} type="button">
              Langkah Selanjutnya
              <ArrowRight className={styles.navBtnIcon} />
            </button>
          ) : (
            <button
              className={`${styles.navBtnNext} ${styles.navBtnComplete}`}
              type="button"
              onClick={() => setShowSubmitModal(true)}
            >
              Selesai & Klaim Poin
              <CheckCircle className={styles.navBtnIcon} />
            </button>
          )}
        </div>
      </nav>

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
                  <Leaf className={styles.successPointsIcon} />
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
                    <Leaf className={styles.submitRewardIcon} />
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

export default function StepByStepPage() {
  // Next.js requires hooks like `useSearchParams()` to live under a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <StepByStepPageClient />
    </Suspense>
  );
}
