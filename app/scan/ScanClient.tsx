"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "../components/navbar";
import styles from "./scan.module.css";

/* ── Tipe Data ── */
type AnalysisResult = {
  itemName: string;
  material: string;
  condition: "good" | "fair" | "poor";
  recommendation: "recycle" | "sell" | "dispose";
  reason: string;
  recycleOptions?: string[];
};

/* ── Data riwayat scan terbaru (statis) ── */
const riwayatScan = [
  {
    nama: "Botol Plastik PET",
    badge: "Dapat Didaur Ulang",
    badgeStyle: "badgeRecyclable" as const,
    waktu: "2 jam lalu",
  },
  {
    nama: "Baterai Alkaline",
    badge: "Berbahaya",
    badgeStyle: "badgeHazardous" as const,
    waktu: "1 hari lalu",
  },
  {
    nama: "Kardus Bekas",
    badge: "Dapat Dikompos",
    badgeStyle: "badgeCompostable" as const,
    waktu: "3 hari lalu",
  },
];

/* ================================================================
   Ikon SVG Inline
   ================================================================ */
const UploadCloudIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 13v8" />
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="m8 17 4-4 4 4" />
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m7 11 4-4 4 4 5-5" />
    <path d="m16 6 4 0 0 4" />
  </svg>
);

const BoltIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const RecycleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

/* ================================================================
   Komponen Utama
   ================================================================ */
export default function ScanClient({ riwayatScan }: { riwayatScan: Array<{ id: string; nama: string; badge: string; badgeStyle: string; waktu: string; image_url: string | null }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── State ── */
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [scanStatusText, setScanStatusText] = useState("Memulai analisis...");

  /* ── Cycling scan status messages ── */
  useEffect(() => {
    if (!isLoading) return;
    const messages = [
      "Memulai analisis...",
      "Mendeteksi objek...",
      "Menganalisis material...",
      "Memeriksa kondisi...",
      "Mengevaluasi rekomendasi...",
      "Mengkalkulasi dampak...",
      "Menyiapkan hasil...",
    ];
    let idx = 0;
    setScanStatusText(messages[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setScanStatusText(messages[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  /* ── Handler: baca file → base64 (dengan resize) ── */
  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error("Ukuran file melebihi 10MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

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
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataUrl);
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

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const base64 = await readFileAsBase64(file);
      setImageBase64(base64);
      setImagePreview(base64);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memproses file.");
    }
  }, []);

  /* ── Drag & Drop ── */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
      else setError("Harap unggah file gambar (JPEG, PNG, HEIC).");
    },
    [handleFile]
  );

  /* ── File Input ── */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  /* ── Kamera (media capture) ── */
  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
      fileInputRef.current.removeAttribute("capture");
    }
  };

  /* ── Hapus gambar ── */
  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Auto Resume Scan ── */
  useEffect(() => {
    const checkPendingScan = async () => {
      const trigger = sessionStorage.getItem("pendingScanTrigger");
      if (trigger === "true") {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const storedImg = sessionStorage.getItem("pendingScanImage") || null;
          const storedDesc = sessionStorage.getItem("pendingScanDesc") || "";
          
          if (storedImg) {
            setImageBase64(storedImg);
            setImagePreview(storedImg);
          }
          if (storedDesc) {
             setDescription(storedDesc);
          }
          
          sessionStorage.removeItem("pendingScanTrigger");
          sessionStorage.removeItem("pendingScanImage");
          sessionStorage.removeItem("pendingScanDesc");

          handleAnalyze(storedImg || undefined, storedDesc);
        }
      }
    };
    checkPendingScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Analisis ── */
  const handleAnalyze = async (overrideImg?: string, overrideDesc?: string) => {
    setError(null);

    const targetImage = overrideImg !== undefined ? overrideImg : imageBase64;
    const targetDesc = overrideDesc !== undefined ? overrideDesc : description;

    if (!targetImage && !targetDesc.trim()) {
      setError("Harap unggah gambar atau berikan deskripsi terlebih dahulu.");
      return;
    }

    // Check Auth Status
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      sessionStorage.setItem("pendingScanImage", targetImage || "");
      sessionStorage.setItem("pendingScanDesc", targetDesc || "");
      sessionStorage.setItem("pendingScanTrigger", "true");
      router.push("/login?next=/scan");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: targetImage ?? undefined,
          description: targetDesc.trim() || undefined,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Terjadi kesalahan pada server (atau ukuran payload terlalu besar). Harap coba lagi.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menganalisis. Coba lagi.");
      }

      // Redirect ke halaman hasil
      if (data.scanId) {
        router.push(`/scan/hasil?id=${data.scanId}`);
      } else {
        // Fallback: simpan result di localStorage jika DB gagal
        localStorage.setItem("scanResult", JSON.stringify(data.result));
        if (targetImage) {
          localStorage.setItem("scanImage", targetImage);
        }
        router.push("/scan/hasil?fallback=true");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    setImageBase64(null);
    setImagePreview(null);
    setDescription("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Helper: label kondisi ── */
  const conditionLabel = (c: string) => {
    switch (c) {
      case "good": return "Baik";
      case "fair": return "Cukup";
      case "poor": return "Buruk";
      default: return c;
    }
  };

  const conditionStyle = (c: string) => {
    switch (c) {
      case "good": return styles.conditionGood;
      case "fair": return styles.conditionFair;
      case "poor": return styles.conditionPoor;
      default: return "";
    }
  };

  /* ── Helper: rekomendasi pill ── */
  const recoPill = (r: string) => {
    switch (r) {
      case "recycle":
        return { label: "♻ DAUR ULANG", style: styles.recoRecycle };
      case "sell":
        return { label: "🏷 JUAL", style: styles.recoSell };
      case "dispose":
        return { label: "🗑 BUANG", style: styles.recoDispose };
      default:
        return { label: r, style: "" };
    }
  };

  /* ================================================================
     JSX
     ================================================================ */
  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="scan" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={onFileChange}
        id="file-input"
      />

      <div className={styles.mainLayout}>
        {/* ── Kolom Kiri ── */}
        <div className={styles.leftColumn}>
          <div className={styles.headline}>
            <h1 className={styles.headlineTitle}>
              Identifikasi{" "}
              <span className={styles.headlineAccent}>Sampahmu.</span>
            </h1>
            <p className={styles.headlineDesc}>
              Unggah foto barang Anda. AI kami akan mengklasifikasikan dan
              memberikan instruksi daur ulang atau pemanfaatan ulang yang
              spesifik.
            </p>
          </div>

          {/* Drop Zone / Preview */}
          {!imagePreview ? (
            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""}`}
              id="drop-zone"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropIconWrap}>
                <UploadCloudIcon />
              </div>
              <p className={styles.dropTitle}>Seret &amp; letakkan foto Anda</p>
              <p className={styles.dropHint}>
                Mendukung file JPEG, PNG, atau HEIC beresolusi tinggi hingga 10MB
              </p>
              <div className={styles.dropActions} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`${styles.uploadBtn} ${styles.uploadBtnPrimary}`}
                  type="button"
                  id="upload-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon />
                  Unggah Foto
                </button>
                <button
                  className={`${styles.uploadBtn} ${styles.uploadBtnSecondary}`}
                  type="button"
                  id="take-photo-btn"
                  onClick={triggerCamera}
                >
                  <CameraIcon />
                  Ambil Foto
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.previewBox} id="preview-box">
              <img
                src={imagePreview}
                alt="Pratinjau gambar yang diunggah"
                className={styles.previewImage}
              />
              <button
                className={styles.previewRemove}
                type="button"
                onClick={removeImage}
                aria-label="Hapus gambar"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {/* Deskripsi Opsional */}
          <div className={styles.descriptionBox}>
            <label className={styles.descLabel} htmlFor="desc-textarea">
              Deskripsi Opsional
            </label>
            <textarea
              className={styles.descTextarea}
              id="desc-textarea"
              placeholder="Tambahkan detail tentang kondisi barang atau material jika diketahui…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Error inline */}
          {error && (
            <div className={styles.errorBanner} id="error-banner">
              <span>⚠</span>
              <p>{error}</p>
            </div>
          )}

          {/* Bottom Bar */}
          <div className={styles.bottomBar}>
            <div className={styles.bottomTags}>
              <span className={`${styles.tagChip} ${styles.tagAI}`}>
                <BoltIcon />
                Model AI: Llama 4 Scout (Multimodal)
              </span>
            </div>
            <button
              className={`${styles.analyzeBtn} ${isLoading ? styles.analyzeBtnLoading : ""}`}
              type="button"
              id="analyze-btn"
              onClick={() => handleAnalyze()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Menganalisis...
                </>
              ) : (
                <>
                  Analisis dengan AI
                  <span className={styles.analyzeBtnIcon}>
                    <RecycleIcon />
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ── Panel Hasil Analisis ── */}
          {result && (
            <div className={styles.resultPanel} id="result-panel">
              <div className={styles.resultHeader}>
                <div className={styles.resultTitleRow}>
                  <CheckCircleIcon />
                  <h3 className={styles.resultTitle}>Hasil Analisis</h3>
                </div>
              </div>

              <div className={styles.resultGrid}>
                {/* Nama Item */}
                <div className={styles.resultField}>
                  <span className={styles.resultFieldLabel}>Nama Item</span>
                  <span className={styles.resultFieldValue}>
                    {result.itemName}
                  </span>
                </div>

                {/* Material */}
                <div className={styles.resultField}>
                  <span className={styles.resultFieldLabel}>Material</span>
                  <span className={styles.resultFieldValue}>
                    {result.material}
                  </span>
                </div>

                {/* Kondisi */}
                <div className={styles.resultField}>
                  <span className={styles.resultFieldLabel}>Kondisi</span>
                  <span
                    className={`${styles.conditionBadge} ${conditionStyle(result.condition)}`}
                  >
                    {conditionLabel(result.condition)}
                  </span>
                </div>

                {/* Rekomendasi */}
                <div className={styles.resultField}>
                  <span className={styles.resultFieldLabel}>Rekomendasi</span>
                  <span
                    className={`${styles.recoPillBadge} ${recoPill(result.recommendation).style}`}
                  >
                    {recoPill(result.recommendation).label}
                  </span>
                </div>
              </div>

              {/* Alasan */}
              <div className={styles.resultReason}>
                <p>{result.reason}</p>
              </div>

              {/* Opsi Daur Ulang */}
              {result.recommendation === "recycle" && result.recycleOptions && (
                <div className={styles.recycleOptions}>
                  <span className={styles.recycleOptionsLabel}>
                    Opsi Daur Ulang
                  </span>
                  <ul className={styles.recycleOptionsList}>
                    {result.recycleOptions.map((opt) => (
                      <li key={opt} className={styles.recycleOptionItem}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className={styles.resultActions}>
                {result.recommendation === "recycle" && (
                  <button
                    className={`${styles.resultActionBtn} ${styles.resultActionPrimary}`}
                    type="button"
                    onClick={() => router.push("/recycle/hasil")}
                  >
                    ♻ Lihat Opsi Daur Ulang
                  </button>
                )}
                {result.recommendation === "sell" && (
                  <button
                    className={`${styles.resultActionBtn} ${styles.resultActionSell}`}
                    type="button"
                    onClick={() =>
                      router.push("/marketplace/create?from=scan")
                    }
                  >
                    🏷 Buat Listing
                  </button>
                )}
                {result.recommendation === "dispose" && (
                  <button
                    className={`${styles.resultActionBtn} ${styles.resultActionDispose}`}
                    type="button"
                    onClick={() => setShowDisposeModal(true)}
                  >
                    📋 Panduan Pembuangan
                  </button>
                )}
                <button
                  className={`${styles.resultActionBtn} ${styles.resultActionSecondary}`}
                  type="button"
                  onClick={handleReset}
                >
                  🔄 Scan Ulang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Kolom Kanan: Sidebar ── */}
        <div className={styles.rightColumn}>
          <div className={styles.recentScans} id="recent-scans">
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>Scan Terbaru</h2>
              <a href="#" className={styles.recentViewAll}>
                Lihat Semua
              </a>
            </div>
            <div className={styles.recentList}>
              {riwayatScan.map((item) => (
                <a key={item.id} href={`/scan/hasil?id=${item.id}`} className={styles.recentItem}>
                  <div className={styles.recentItemImage} style={{ backgroundImage: item.image_url ? `url(${item.image_url})` : `none`, backgroundSize: `cover`, backgroundPosition: `center` }} aria-hidden />
                  <div className={styles.recentItemInfo}>
                    <p className={styles.recentItemName}>{item.nama}</p>
                    <div className={styles.recentItemMeta}>
                      <span
                        className={`${styles.recentBadge} ${styles[item.badgeStyle]}`}
                      >
                        {item.badge}
                      </span>
                      <span className={styles.recentItemTime}>
                        • {item.waktu}
                      </span>
                    </div>
                  </div>
                  <span className={styles.recentItemArrow}>
                    <ChevronRight />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className={styles.impactCard} id="impact-tracking">
            <div className={styles.impactIconWrap}>
              <ChartIcon />
            </div>
            <p className={styles.impactCardTitle}>Pelacakan Dampak</p>
            <p className={styles.impactCardText}>
              Anda telah mengalihkan 12kg sampah dari TPA bulan ini.
            </p>
            <a href="#" className={styles.impactReportBtn}>
              Lihat Laporan Tahunan
            </a>
          </div>
        </div>
      </div>

      {/* ── AI Scanning Modal ── */}
      {isLoading && (
        <div className={styles.scanModalOverlay}>
          <div className={styles.scanModalContent}>
            {/* Decorative blobs */}
            <div className={styles.scanModalBlob1} aria-hidden />
            <div className={styles.scanModalBlob2} aria-hidden />

            {/* Glassmorphism phone frame */}
            <div className={styles.scanModalFrame}>
              <div className={styles.scanModalImageWrap}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Gambar yang sedang dianalisis"
                    className={styles.scanModalImage}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2e1a, #0d1f0d)' }} />
                )}

                {/* Overlay effects */}
                <div className={styles.scanModalVignette} />
                <div className={styles.scanModalGrid} />

                {/* Scan overlay */}
                <div className={styles.scanModalScanOverlay}>
                  <div className={styles.scanModalLine} />
                  <div className={styles.scanModalCorners} />
                  <div className={styles.scanModalCornersBottom} />
                </div>
              </div>

              {/* Status chip */}
              <div className={styles.scanModalStatus}>
                <div className={styles.scanModalStatusDot} />
                <span className={styles.scanModalStatusText}>{scanStatusText}</span>
              </div>
            </div>

            {/* Info below frame */}
            <div className={styles.scanModalInfo}>
              <h3 className={styles.scanModalTitle}>AI Sedang Menganalisis</h3>
              <p className={styles.scanModalDesc}>
                Mohon tunggu sebentar, AI sedang memproses gambar dan menyusun rekomendasi terbaik untuk Anda.
              </p>
              <div className={styles.scanModalProgressWrap}>
                <div className={styles.scanModalProgressBar} />
              </div>
              <div className={styles.scanModalTag}>
                <BoltIcon />
                Llama 4 Scout · Multimodal
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Panduan Pembuangan ── */}
      {showDisposeModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDisposeModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispose-modal-title"
          >
            <div className={styles.modalHeader}>
              <h3 id="dispose-modal-title" className={styles.modalTitle}>
                📋 Panduan Pembuangan Aman
              </h3>
              <button
                className={styles.modalClose}
                type="button"
                onClick={() => setShowDisposeModal(false)}
                aria-label="Tutup"
              >
                <CloseIcon />
              </button>
            </div>
            <div className={styles.modalBody}>
              <ul className={styles.disposeTips}>
                <li>
                  <strong>Pisahkan dari sampah lain</strong> — Pastikan item
                  ini tidak tercampur dengan sampah organik atau daur ulang.
                </li>
                <li>
                  <strong>Gunakan wadah tertutup</strong> — Letakkan dalam
                  kantong plastik tertutup rapat untuk mencegah kontaminasi.
                </li>
                <li>
                  <strong>Hubungi layanan khusus</strong> — Untuk bahan
                  berbahaya (baterai, elektronik, bahan kimia), gunakan
                  layanan pengumpulan limbah B3 di daerah Anda.
                </li>
                <li>
                  <strong>Cek jadwal pengangkutan</strong> — Pastikan Anda
                  mengetahui jadwal pengangkutan sampah non-organik di
                  lingkungan Anda.
                </li>
                <li>
                  <strong>Jangan dibakar</strong> — Membakar sampah
                  menghasilkan emisi berbahaya bagi kesehatan dan lingkungan.
                </li>
              </ul>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCloseBtn}
                type="button"
                onClick={() => setShowDisposeModal(false)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p className={styles.footerBrand}>SirkulasiIn</p>
        <nav className={styles.footerLinks} aria-label="Tautan kaki halaman">
          <a href="#" className={styles.footerLink}>Kebijakan Privasi</a>
          <a href="#" className={styles.footerLink}>Ketentuan Layanan</a>
          <a href="#" className={styles.footerLink}>Metodologi Karbon</a>
          <a href="#" className={styles.footerLink}>Pusat Bantuan</a>
        </nav>
        <p className={styles.footerCopy}>
          © 2025 SirkulasiIn. Berakar pada keberlanjutan.
        </p>
      </footer>
    </main>
  );
}
