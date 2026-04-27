"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  TriangleAlert,
  Trash2,
  AlertCircle,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ListChecks,
  Leaf,
  XCircle,
  CheckCircle2,
  Lightbulb,
  HeartHandshake,
  Sparkles,
  ImageOff,
} from "lucide-react";
import Navbar from "../../../components/navbar";
import styles from "./pembuangan.module.css";

/* ═══════════════ Types ═══════════════ */
type ScanData = {
  id: string;
  image_url: string | null;
  item_name: string;
  material: string | null;
  weight: string | null;
  condition: string | null;
  recommendation: string;
  reason: string | null;
  carbon_offset: number | null;
  carbon_saved: string | null;
};

type GuideKey = "battery" | "electronic" | "medical" | "hazardous" | "contaminated" | "asbestos" | "default";

type Step = { title: string; desc: string };

type Guide = {
  whyNotRecycle: string;
  steps: Step[];
  warnings: string[];
  dropPointQuery: string;
  dropPointLabel: string;
};

/* ═══════════════ Supabase ═══════════════ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════ Disposal Guides ═══════════════ */
const DISPOSAL_GUIDES: Record<GuideKey, Guide> = {
  battery: {
    whyNotRecycle:
      "Baterai bekas mengandung logam berat seperti merkuri, kadmium, dan timbal yang berbahaya jika masuk ke jalur daur ulang umum. Bahan-bahan ini dapat mencemari tanah dan air tanah, sehingga memerlukan penanganan khusus oleh fasilitas e-waste resmi.",
    steps: [
      { title: "Lepaskan dari perangkat", desc: "Keluarkan baterai dari alat elektronik dengan hati-hati. Gunakan obeng jika perlu, hindari menusuk atau menjatuhkan baterai." },
      { title: "Bungkus terminal", desc: "Tutup kutub positif dan negatif baterai dengan selotip listrik untuk mencegah hubungan singkat dan kebocoran." },
      { title: "Simpan di wadah tertutup", desc: "Letakkan di kotak plastik atau toples kaca yang kering, jauh dari panas dan jangkauan anak-anak." },
      { title: "Antar ke titik kumpul resmi", desc: "Bawa ke drop-point e-waste, toko elektronik yang menerima baterai bekas, atau bank sampah yang mengelola B3." },
    ],
    warnings: [
      "Jangan dibakar — dapat meledak dan melepaskan asap beracun.",
      "Jangan dibuang ke tempat sampah biasa atau saluran air.",
      "Jangan disimpan di tempat lembap atau terkena cahaya matahari langsung.",
      "Hindari membuka casing baterai walaupun tampak rusak.",
    ],
    dropPointQuery: "drop+point+baterai+bekas+terdekat",
    dropPointLabel: "Pusat E-Waste & Baterai",
  },
  electronic: {
    whyNotRecycle:
      "Limbah elektronik (e-waste) mengandung campuran logam mulia, plastik berpenghambat api, dan komponen beracun seperti timah dan brom. Daur ulang biasa tidak mampu memisahkannya secara aman, sehingga dibutuhkan fasilitas khusus.",
    steps: [
      { title: "Hapus data pribadi", desc: "Reset pabrik dan hapus seluruh akun dari perangkat. Cabut kartu SIM, microSD, dan media penyimpanan eksternal." },
      { title: "Cabut sumber daya", desc: "Lepaskan baterai, kabel, dan adaptor. Bungkus secara terpisah agar tidak korslet selama pengangkutan." },
      { title: "Kemas dengan aman", desc: "Gunakan kardus berisi peredam (kertas/bubble wrap) untuk melindungi komponen rapuh seperti layar dan papan sirkuit." },
      { title: "Antar ke fasilitas e-waste", desc: "Bawa ke drop-point e-waste resmi, program take-back produsen, atau acara pengumpulan e-waste komunitas." },
    ],
    warnings: [
      "Jangan dibuka paksa — kapasitor dapat menyimpan listrik berbahaya.",
      "Jangan dipanggang atau dibakar untuk mengambil logam.",
      "Jangan dibuang sembarangan — ini melanggar regulasi pengelolaan B3.",
      "Hindari kontak dengan layar pecah karena dapat berisi merkuri.",
    ],
    dropPointQuery: "drop+point+e-waste+terdekat",
    dropPointLabel: "Pusat Pengumpulan E-Waste",
  },
  medical: {
    whyNotRecycle:
      "Limbah medis seperti jarum suntik, perban bekas, dan obat kadaluarsa berpotensi mengandung patogen dan bahan kimia farmasi. Daur ulang umum tidak aman karena risiko penularan penyakit dan kontaminasi.",
    steps: [
      { title: "Pisahkan tajam dari lunak", desc: "Pisahkan benda tajam (jarum, scalpel) dari kapas, perban, atau kemasan obat." },
      { title: "Gunakan wadah anti-tusuk", desc: "Masukkan benda tajam ke dalam botol plastik tebal bertutup rapat, lalu tandai dengan label 'Sampah Medis'." },
      { title: "Bungkus sampah lunak", desc: "Masukkan kapas/perban bekas ke kantong plastik dobel, ikat rapat untuk mencegah kebocoran." },
      { title: "Antar ke fasilitas kesehatan", desc: "Serahkan ke puskesmas, rumah sakit, atau apotek yang memiliki program take-back limbah medis." },
    ],
    warnings: [
      "Jangan menutup kembali (recap) jarum suntik — risiko tertusuk meningkat.",
      "Jangan dibuang ke toilet atau wastafel.",
      "Jangan dicampur dengan sampah daur ulang plastik.",
      "Jangan dibakar di tempat terbuka — asap mengandung dioksin.",
    ],
    dropPointQuery: "puskesmas+rumah+sakit+terdekat",
    dropPointLabel: "Fasilitas Kesehatan Terdekat",
  },
  hazardous: {
    whyNotRecycle:
      "Bahan kimia rumah tangga seperti cat, oli bekas, pestisida, dan pelarut tergolong B3 (Bahan Berbahaya & Beracun). Bahan ini dapat meledak, menyala, atau mencemari air jika diolah dalam jalur daur ulang biasa.",
    steps: [
      { title: "Pakai pelindung diri", desc: "Gunakan sarung tangan karet, masker, dan kacamata pelindung sebelum menangani." },
      { title: "Pertahankan kemasan asli", desc: "Jangan pindahkan ke wadah lain. Pastikan label dan tutup masih utuh untuk identifikasi." },
      { title: "Simpan di tempat berventilasi", desc: "Letakkan di luar rumah, jauh dari sumber api dan jangkauan anak. Jauhkan dari makanan." },
      { title: "Antar ke fasilitas B3", desc: "Hubungi DLH (Dinas Lingkungan Hidup) setempat atau perusahaan pengolah B3 berlisensi untuk pengambilan/penyerahan." },
    ],
    warnings: [
      "Jangan dituang ke wastafel, toilet, got, atau tanah.",
      "Jangan mencampur bahan kimia berbeda — dapat memicu reaksi berbahaya.",
      "Jangan dibakar — uap beracun dapat terhirup.",
      "Jangan menggunakan kembali wadah B3 untuk makanan/minuman.",
    ],
    dropPointQuery: "dinas+lingkungan+hidup+terdekat",
    dropPointLabel: "Fasilitas Pengolahan B3",
  },
  contaminated: {
    whyNotRecycle:
      "Plastik atau kemasan yang terkontaminasi minyak, makanan basi, atau bahan kimia tidak dapat diproses ulang. Kontaminan akan merusak batch daur ulang yang lain, sehingga lebih baik dibuang sebagai residu.",
    steps: [
      { title: "Tiriskan sisa cairan", desc: "Buang sisa minyak/makanan ke wadah penampungan terpisah. Jangan buang minyak ke wastafel." },
      { title: "Bersihkan jika memungkinkan", desc: "Lap bagian dalam dengan kertas bekas. Jika kontaminasi ringan, item bisa diselamatkan untuk daur ulang." },
      { title: "Bungkus rapat", desc: "Masukkan ke kantong plastik bersih, ikat rapat agar bau dan cairan tidak bocor." },
      { title: "Buang ke TPS residu", desc: "Tempatkan di tempat sampah residu (tidak bisa daur ulang) untuk diangkut petugas kebersihan." },
    ],
    warnings: [
      "Jangan dicampur dengan plastik bersih untuk daur ulang — merusak seluruh batch.",
      "Jangan dibakar di halaman — asap plastik beracun.",
      "Jangan dibuang ke saluran air atau sungai.",
      "Hindari menumpuk terlalu lama agar tidak menarik hama.",
    ],
    dropPointQuery: "TPS+residu+terdekat",
    dropPointLabel: "TPS Residu Terdekat",
  },
  asbestos: {
    whyNotRecycle:
      "Material seperti asbes, eternit lama, atau bahan bangunan mengandung serat berbahaya yang jika terhirup dapat menyebabkan penyakit paru serius. Penanganan harus dilakukan oleh tenaga profesional bersertifikat.",
    steps: [
      { title: "Jangan dipotong atau dibor", desc: "Hindari aktivitas yang dapat menghasilkan debu serat. Biarkan material dalam kondisi utuh." },
      { title: "Basahi permukaan", desc: "Semprot dengan air untuk meminimalisir penyebaran debu jika harus dipindahkan." },
      { title: "Bungkus dengan plastik tebal", desc: "Lapis material dengan plastik kedap minimal 200 mikron, lalu rekatkan dengan lakban kuat." },
      { title: "Hubungi jasa profesional", desc: "Panggil kontraktor pengelola B3 atau DLH untuk penjemputan. Jangan diangkut sendiri." },
    ],
    warnings: [
      "Jangan tangani tanpa masker N95/respirator dan baju pelindung.",
      "Jangan dibakar — partikel asbes terbang dan tetap berbahaya.",
      "Jangan dibuang di TPS umum atau lahan kosong.",
      "Jangan mencuci pakaian kerja bersama pakaian rumah.",
    ],
    dropPointQuery: "jasa+pengolahan+B3+terdekat",
    dropPointLabel: "Kontraktor B3 Profesional",
  },
  default: {
    whyNotRecycle:
      "Item ini tergolong sampah residu — tidak memiliki nilai daur ulang yang ekonomis atau bahan dasarnya tidak dapat diproses oleh fasilitas daur ulang umum. Pembuangan yang benar tetap penting untuk mencegah pencemaran lingkungan.",
    steps: [
      { title: "Pisahkan dari sampah organik", desc: "Pastikan item kering dan tidak tercampur sisa makanan agar tidak mengundang bau dan hama." },
      { title: "Bungkus dalam kantong plastik", desc: "Masukkan ke kantong sampah, ikat rapat untuk mencegah ceceran selama pengangkutan." },
      { title: "Tempatkan di tempat sampah residu", desc: "Gunakan tempat sampah berlabel residu (warna abu-abu/hitam pada sistem pemilahan)." },
      { title: "Setor ke TPS terdekat", desc: "Serahkan ke petugas kebersihan atau bank sampah komunitas yang melayani sampah residu." },
    ],
    warnings: [
      "Jangan dibakar di halaman — melanggar Perda dan menghasilkan polusi udara.",
      "Jangan dibuang ke sungai, got, atau lahan kosong.",
      "Jangan dicampur dengan sampah daur ulang.",
      "Jangan menumpuk lebih dari 2 hari untuk menghindari bau & hama.",
    ],
    dropPointQuery: "TPS+terdekat",
    dropPointLabel: "TPS Terdekat",
  },
};

/* ═══════════════ Material Detection ═══════════════ */
function detectGuide(material: string | null, itemName: string, reason: string | null): GuideKey {
  const text = `${material ?? ""} ${itemName} ${reason ?? ""}`.toLowerCase();

  if (/baterai|battery|aki|power\s*bank|lithium|li-ion|alkali/.test(text)) return "battery";
  if (/asbes|asbestos|eternit|gypsum.*lama|fiber\s*semen/.test(text)) return "asbestos";
  if (/jarum|suntik|medis|medical|obat|farmasi|infus|sharps|kapas\s*bekas|perban/.test(text)) return "medical";
  if (/elektronik|electronic|gadget|hp|smartphone|laptop|komputer|tv|televisi|monitor|kabel\s*data|charger|pcb|sirkuit/.test(text)) return "electronic";
  if (/cat|paint|oli|pestisida|pelarut|solvent|tiner|kimia|chemical|aerosol|kaleng\s*semprot|pembersih\s*kuat/.test(text)) return "hazardous";
  if (/terkontaminasi|contaminated|berminyak|bekas\s*makanan|kemasan\s*minyak|tinta|crayon/.test(text)) return "contaminated";

  return "default";
}

/* ═══════════════ Helpers ═══════════════ */
function parseCarbonString(str: string | null): number {
  if (!str) return 0;
  const match = str.match(/[\d.]+/);
  if (!match) return 0;
  return parseFloat(match[0]);
}

/* ═══════════════ Component ═══════════════ */
export default function PembuanganAmanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.replace("/scan");
      return;
    }

    const fetchScan = async () => {
      try {
        const { data: scan, error: fetchError } = await supabase
          .from("scan_history")
          .select("id, image_url, item_name, material, weight, condition, recommendation, reason, carbon_offset, carbon_saved")
          .eq("id", id)
          .single();

        if (fetchError || !scan) {
          setError("Hasil scan tidak ditemukan.");
          setLoading(false);
          return;
        }

        if (scan.recommendation !== "dispose") {
          router.replace(`/scan/hasil?id=${id}`);
          return;
        }

        setData(scan as ScanData);
        setLoading(false);
      } catch {
        setError("Terjadi kesalahan saat memuat data.");
        setLoading(false);
      }
    };

    fetchScan();
  }, [id, router]);

  /* ── Loading ── */
  if (loading) {
    return (
      <main className={styles.pageShell}>
        <Navbar />
        <div className={styles.container}>
          <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
          <div className={`${styles.skeleton} ${styles.skeletonSection}`} />
          <div className={`${styles.skeleton} ${styles.skeletonSection}`} />
        </div>
      </main>
    );
  }

  /* ── Error / Not Found ── */
  if (error || !data) {
    return (
      <main className={styles.pageShell}>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <XCircle size={64} strokeWidth={1.5} />
            </div>
            <p className={styles.emptyTitle}>{error || "Data tidak ditemukan"}</p>
            <p className={styles.emptyDesc}>Hasil scan mungkin telah dihapus atau ID tidak valid.</p>
            <Link href="/scan" className={styles.btnPrimary} style={{ display: "inline-flex", maxWidth: 220, margin: "0 auto" }}>
              <Sparkles size={16} /> Mulai Scan Baru
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const guideKey = detectGuide(data.material, data.item_name, data.reason);
  const guide = DISPOSAL_GUIDES[guideKey];
  const carbonValue = parseCarbonString(data.carbon_saved) || (data.carbon_offset ? data.carbon_offset / 1000 : 0);
  const showImpact = carbonValue > 0;

  return (
    <main className={styles.pageShell}>
      <Navbar />

      <div className={styles.container}>
        {/* ─── Back ─── */}
        <Link href={`/scan/hasil?id=${data.id}`} className={styles.backLink}>
          <ArrowLeft size={14} /> Kembali ke hasil scan
        </Link>

        {/* ─── Hero ─── */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <TriangleAlert size={32} strokeWidth={2.2} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>
              <Trash2 size={12} /> Pembuangan Aman
            </span>
            <h1 className={styles.heroTitle}>Panduan Pembuangan {data.item_name}</h1>
            <p className={styles.heroSubtitle}>
              {data.reason || "Item ini perlu dibuang dengan cara yang tepat untuk melindungi kesehatan dan lingkungan."}
            </p>
          </div>
        </div>

        {/* ─── Mini Item Card ─── */}
        <div className={styles.itemCard}>
          <div className={styles.itemThumb}>
            {data.image_url ? (
              <Image src={data.image_url} alt={data.item_name} fill sizes="72px" style={{ objectFit: "cover" }} />
            ) : (
              <div className={styles.itemThumbPlaceholder}>
                <ImageOff size={24} />
              </div>
            )}
          </div>
          <div className={styles.itemInfo}>
            <p className={styles.itemName}>{data.item_name}</p>
            <div className={styles.itemMeta}>
              {data.material && <span>{data.material}</span>}
              {data.weight && <span>· {data.weight}</span>}
              {data.condition && <span>· {data.condition}</span>}
            </div>
          </div>
          <span className={styles.itemBadge}>Dispose</span>
        </div>

        {/* ─── Why Not Recycle ─── */}
        <Section icon={<AlertCircle size={20} />} title="Mengapa Tidak Bisa Didaur Ulang?">
          <p className={styles.sectionText}>{guide.whyNotRecycle}</p>
        </Section>

        {/* ─── Steps ─── */}
        <Section icon={<ListChecks size={20} />} title="Langkah-langkah Pembuangan Aman">
          <ol className={styles.steps}>
            {guide.steps.map((s, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>{s.title}</p>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ─── Warnings ─── */}
        <Section icon={<TriangleAlert size={20} />} title="Peringatan Keselamatan" warning>
          <ul className={styles.warnings}>
            {guide.warnings.map((w, i) => (
              <li key={i} className={styles.warning}>
                <span className={styles.warningIcon}><XCircle size={16} /></span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ─── Drop Point ─── */}
        <Section icon={<MapPin size={20} />} title="Cari Lokasi Pembuangan">
          <a
            href={`https://www.google.com/maps/search/${guide.dropPointQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dropPoint}
          >
            <div className={styles.dropPointIcon}>
              <MapPin size={24} />
            </div>
            <div className={styles.dropPointBody}>
              <p className={styles.dropPointTitle}>{guide.dropPointLabel}</p>
              <p className={styles.dropPointDesc}>
                Buka Google Maps untuk menemukan fasilitas resmi terdekat dari lokasi Anda.
              </p>
            </div>
            <span className={styles.dropPointArrow}><ExternalLink size={20} /></span>
          </a>
        </Section>

        {/* ─── Impact ─── */}
        {showImpact && (
          <Section icon={<Leaf size={20} />} title="Dampak Lingkungan">
            <div className={styles.impactGrid}>
              <div className={`${styles.impactCard} ${styles.impactCardBad}`}>
                <div className={styles.impactHeader}>
                  <XCircle size={14} /> Jika Dibuang Sembarangan
                </div>
                <p className={styles.impactValue}>+{(carbonValue * 2).toFixed(2)} kg</p>
                <p className={styles.impactLabel}>
                  Estimasi pencemaran tambahan dari kontaminasi tanah & air, plus emisi gas dari penguraian tidak terkendali.
                </p>
              </div>
              <div className={`${styles.impactCard} ${styles.impactCardGood}`}>
                <div className={styles.impactHeader}>
                  <CheckCircle2 size={14} /> Jika Dibuang dengan Benar
                </div>
                <p className={styles.impactValue}>−{carbonValue.toFixed(2)} kg</p>
                <p className={styles.impactLabel}>
                  CO₂ tercegah karena material ditangani fasilitas khusus, mengurangi kontaminasi & risiko kesehatan publik.
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ─── Tips ─── */}
        <Section icon={<Lightbulb size={20} />} title="Tips Tambahan">
          <div className={styles.tipsGrid}>
            <TipCard icon={<Sparkles size={18} />} title="Kurangi di Sumber" desc="Pilih produk dengan kemasan minimal dan tahan lama untuk mengurangi sampah residu di masa depan." />
            <TipCard icon={<HeartHandshake size={18} />} title="Edukasi Sekitar" desc="Bagikan panduan ini ke keluarga dan tetangga agar pengelolaan sampah komunitas semakin baik." />
            <TipCard icon={<ShieldCheck size={18} />} title="Patuhi Regulasi" desc="Ikuti aturan pemilahan dari pemerintah daerah Anda — pelanggaran dapat dikenakan sanksi." />
          </div>
        </Section>

        {/* ─── Action Footer ─── */}
        <div className={styles.actionFooter}>
          <Link href={`/scan/hasil?id=${data.id}`} className={styles.btnSecondary}>
            <ArrowLeft size={16} /> Hasil Scan
          </Link>
          <Link href="/tutorial" className={styles.btnPrimary}>
            Pelajari Daur Ulang <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════ Sub-components ═══════════════ */
function Section({ icon, title, warning, children }: { icon: ReactNode; title: string; warning?: boolean; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIcon} ${warning ? styles.sectionIconWarning : ""}`}>
          {icon}
        </div>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TipCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className={styles.tipCard}>
      <div className={styles.tipIcon}>{icon}</div>
      <p className={styles.tipTitle}>{title}</p>
      <p className={styles.tipDesc}>{desc}</p>
    </div>
  );
}
