"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import * as LucideIcons from "lucide-react";
import {
  X, Leaf, Settings, ArrowLeft, ArrowRight,
  Check, CheckCircle, XCircle, Lightbulb, Loader2,
  AlertCircle,
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
function StepByStepPageContent() {
  const searchParams = useSearchParams();
  const [tutorial, setTutorial] = useState<TutorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

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
            >
              Selesai & Klaim Poin
              <CheckCircle className={styles.navBtnIcon} />
            </button>
          )}
        </div>
      </nav>
    </main>
  );
}

export default function StepByStepPage() {
  return (
    <Suspense>
      <StepByStepPageContent />
    </Suspense>
  );
}
