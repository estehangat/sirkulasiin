import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import Navbar from "../components/navbar";
import styles from "../syarat-ketentuan/legal.module.css";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — SirkulasiIn",
  description: "Kebijakan privasi platform SirkulasiIn mengenai pengumpulan, penggunaan, dan perlindungan data pengguna.",
};

const sections = [
  {
    id: "data-dikumpulkan",
    title: "Data yang Kami Kumpulkan",
    content: (
      <>
        <p>Kami mengumpulkan beberapa jenis data untuk menyediakan dan meningkatkan layanan SirkulasiIn:</p>
        <ul>
          <li><strong>Data Akun:</strong> Nama lengkap, username, alamat email, foto profil, dan lokasi yang Anda berikan saat mendaftar atau memperbarui profil.</li>
          <li><strong>Data Scan:</strong> Foto material yang dipindai, hasil analisis AI (jenis material, potensi daur ulang, estimasi karbon, rekomendasi), dan metadata terkait.</li>
          <li><strong>Data Marketplace:</strong> Informasi listing produk (judul, deskripsi, foto, harga, kategori), riwayat transaksi, dan percakapan antar pengguna.</li>
          <li><strong>Data Aktivitas:</strong> Riwayat scan, tutorial yang diselesaikan, eco-points yang diperoleh, dan interaksi dengan fitur platform.</li>
          <li><strong>Data Teknis:</strong> Alamat IP, jenis browser, perangkat, sistem operasi, dan log akses untuk keamanan dan analitik.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penggunaan-data",
    title: "Penggunaan Data",
    content: (
      <>
        <p>Data yang dikumpulkan digunakan untuk tujuan berikut:</p>
        <ul>
          <li><strong>Penyediaan Layanan:</strong> Memproses scan AI, menampilkan listing marketplace, menghitung eco-points, dan menyediakan fitur-fitur platform.</li>
          <li><strong>Personalisasi:</strong> Memberikan rekomendasi daur ulang yang relevan, menyesuaikan dashboard, dan menampilkan konten yang sesuai.</li>
          <li><strong>Dampak Lingkungan:</strong> Menghitung dan menampilkan metrik lingkungan seperti CO₂ yang dicegah, sampah yang dialihkan dari TPA, dan kontribusi komunitas.</li>
          <li><strong>Leaderboard & Sosial:</strong> Menampilkan peringkat pengguna, profil publik (nama, username, avatar), dan statistik aktivitas.</li>
          <li><strong>Pengembangan:</strong> Menganalisis pola penggunaan secara agregat untuk meningkatkan akurasi AI, fitur platform, dan pengalaman pengguna.</li>
          <li><strong>Komunikasi:</strong> Mengirimkan notifikasi terkait aktivitas akun, pembaruan fitur, dan informasi penting lainnya.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penyimpanan-keamanan",
    title: "Penyimpanan & Keamanan Data",
    content: (
      <>
        <p>Kami menerapkan langkah-langkah keamanan untuk melindungi data Anda:</p>
        <ul>
          <li><strong>Infrastruktur:</strong> Data disimpan di server Supabase yang aman dengan enkripsi at-rest dan in-transit (TLS/SSL).</li>
          <li><strong>Autentikasi:</strong> Sistem login menggunakan standar keamanan modern termasuk hashing password dan sesi terproteksi.</li>
          <li><strong>Akses Terbatas:</strong> Hanya personel yang berwenang yang memiliki akses ke data pengguna, dengan prinsip least privilege.</li>
          <li><strong>Row Level Security:</strong> Database menggunakan kebijakan keamanan tingkat baris sehingga pengguna hanya dapat mengakses data miliknya sendiri.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pembagian-data",
    title: "Pembagian Data dengan Pihak Ketiga",
    content: (
      <>
        <p>Kami tidak menjual data pribadi Anda. Data hanya dibagikan dalam situasi berikut:</p>
        <ul>
          <li><strong>Marketplace:</strong> Informasi yang Anda tampilkan di listing (nama, foto produk, deskripsi) bersifat publik dan dapat dilihat oleh pengguna lain.</li>
          <li><strong>Profil Publik:</strong> Nama, username, avatar, dan statistik aktivitas yang ditampilkan di profil publik dan leaderboard.</li>
          <li><strong>Layanan Pihak Ketiga:</strong> Kami menggunakan layanan pihak ketiga (Google AI/Gemini untuk scan, Supabase untuk database) yang memproses data sesuai kebijakan privasi masing-masing.</li>
          <li><strong>Kewajiban Hukum:</strong> Data dapat dibagikan jika diwajibkan oleh hukum, regulasi, atau proses hukum yang berlaku.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookie-tracking",
    title: "Cookie & Tracking",
    content: (
      <>
        <p>Informasi mengenai penggunaan cookie dan teknologi pelacakan:</p>
        <ul>
          <li><strong>Cookie Esensial:</strong> Digunakan untuk autentikasi sesi dan fungsionalitas dasar platform. Cookie ini diperlukan agar layanan berfungsi dengan baik.</li>
          <li><strong>Cookie Analitik:</strong> Digunakan untuk memahami bagaimana pengguna berinteraksi dengan platform, membantu kami meningkatkan layanan.</li>
          <li>Kami tidak menggunakan cookie untuk iklan pihak ketiga.</li>
          <li>Anda dapat mengelola preferensi cookie melalui pengaturan browser Anda.</li>
        </ul>
      </>
    ),
  },
  {
    id: "hak-pengguna",
    title: "Hak Pengguna",
    content: (
      <>
        <p>Sebagai pengguna SirkulasiIn, Anda memiliki hak-hak berikut atas data pribadi Anda:</p>
        <ul>
          <li><strong>Hak Akses:</strong> Anda dapat melihat dan mengunduh data pribadi yang kami simpan melalui halaman profil dan dashboard.</li>
          <li><strong>Hak Koreksi:</strong> Anda dapat memperbarui atau memperbaiki informasi profil Anda kapan saja.</li>
          <li><strong>Hak Hapus:</strong> Anda dapat meminta penghapusan akun dan seluruh data terkait dengan menghubungi tim dukungan kami.</li>
          <li><strong>Hak Portabilitas:</strong> Anda dapat meminta salinan data Anda dalam format yang dapat dibaca mesin.</li>
          <li><strong>Hak Keberatan:</strong> Anda dapat menolak pemrosesan data tertentu dengan menghubungi kami.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retensi-data",
    title: "Retensi Data",
    content: (
      <>
        <p>Kebijakan penyimpanan data kami:</p>
        <ul>
          <li><strong>Akun Aktif:</strong> Data disimpan selama akun Anda aktif dan layanan digunakan.</li>
          <li><strong>Setelah Penghapusan:</strong> Setelah akun dihapus, data pribadi akan dihapus dalam 30 hari, kecuali data yang diwajibkan hukum untuk disimpan lebih lama.</li>
          <li><strong>Data Agregat:</strong> Data yang telah dianonimkan dan diagregasi (misalnya total CO₂ dicegah komunitas) dapat disimpan tanpa batas waktu karena tidak dapat dikaitkan dengan individu.</li>
          <li><strong>Backup:</strong> Salinan cadangan mungkin memerlukan waktu tambahan hingga 90 hari untuk dihapus sepenuhnya.</li>
        </ul>
      </>
    ),
  },
  {
    id: "anak-di-bawah-umur",
    title: "Perlindungan Anak",
    content: (
      <p>SirkulasiIn tidak ditujukan untuk anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan data dari anak di bawah 13 tahun. Jika Anda mengetahui bahwa anak di bawah umur telah memberikan data pribadi kepada kami, silakan hubungi kami agar kami dapat mengambil tindakan yang diperlukan untuk menghapus data tersebut.</p>
    ),
  },
  {
    id: "perubahan-kebijakan",
    title: "Perubahan Kebijakan",
    content: (
      <p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu untuk mencerminkan perubahan praktik kami atau persyaratan hukum. Perubahan signifikan akan diberitahukan melalui notifikasi di platform. Versi terbaru akan selalu tersedia di halaman ini beserta tanggal pembaruan terakhir. Penggunaan berkelanjutan atas layanan setelah perubahan dianggap sebagai persetujuan terhadap kebijakan yang diperbarui.</p>
    ),
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <main className={styles.pageShell}>
      <Navbar />

      <div className={styles.container}>
        {/* ─── Header ─── */}
        <div className={styles.header}>
          <span className={styles.eyebrow}><ShieldCheck size={14} /> Legal</span>
          <h1 className={styles.title}>Kebijakan Privasi</h1>
          <p className={styles.lastUpdated}>Terakhir diperbarui: 25 April 2025</p>
        </div>

        {/* ─── Table of Contents ─── */}
        <nav className={styles.toc}>
          <p className={styles.tocTitle}>Daftar Isi</p>
          <ol className={styles.tocList}>
            {sections.map((s, i) => (
              <li key={s.id} className={styles.tocItem}>
                <span className={styles.tocNumber}>{i + 1}</span>
                <a href={`#${s.id}`} className={styles.tocLink}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ─── Sections ─── */}
        <div className={styles.content}>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.section}>
              <span className={styles.sectionNumber}>{i + 1}</span>
              <h2 className={styles.sectionTitle}>{s.title}</h2>
              <div className={styles.sectionText}>
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* ─── Contact ─── */}
        <div className={styles.contactBox}>
          <h3 className={styles.contactTitle}>Pertanyaan Privasi?</h3>
          <p className={styles.contactText}>
            Jika Anda memiliki pertanyaan atau permintaan terkait data pribadi Anda, hubungi Data Protection Officer kami.
          </p>
          <a href="mailto:privacy@sirkulasiin.id" className={styles.contactEmail}>
            privacy@sirkulasiin.id
          </a>
        </div>
      </div>
    </main>
  );
}
