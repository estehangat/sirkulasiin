import type { Metadata } from "next";
import { FileText } from "lucide-react";
import Navbar from "../components/navbar";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — SirkulasiIn",
  description: "Syarat dan ketentuan penggunaan platform SirkulasiIn untuk ekonomi sirkular berbasis AI.",
};

const sections = [
  {
    id: "ketentuan-umum",
    title: "Ketentuan Umum",
    content: (
      <>
        <p>Dengan mengakses dan menggunakan platform SirkulasiIn, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan berikut. Jika Anda tidak menyetujui ketentuan ini, harap tidak menggunakan layanan kami.</p>
        <ul>
          <li>Platform SirkulasiIn dioperasikan dan dikelola oleh tim SirkulasiIn.</li>
          <li>Pengguna wajib berusia minimal <strong>13 tahun</strong> atau didampingi oleh wali sah untuk menggunakan layanan ini.</li>
          <li>Satu akun hanya boleh digunakan oleh satu individu. Berbagi akun tidak diperkenankan.</li>
          <li>SirkulasiIn berhak memperbarui ketentuan ini sewaktu-waktu tanpa pemberitahuan terlebih dahulu.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penggunaan-layanan",
    title: "Penggunaan Layanan",
    content: (
      <>
        <p>SirkulasiIn menyediakan berbagai layanan untuk mendukung ekonomi sirkular:</p>
        <ul>
          <li><strong>AI Scan:</strong> Fitur pemindaian material sampah menggunakan teknologi AI untuk mengidentifikasi jenis, potensi daur ulang, estimasi jejak karbon, dan rekomendasi tindakan. Hasil scan bersifat estimasi dan tidak menjadi jaminan absolut.</li>
          <li><strong>Marketplace:</strong> Platform jual-beli dan barter produk daur ulang antar pengguna. SirkulasiIn bertindak sebagai fasilitator, bukan pihak dalam transaksi.</li>
          <li><strong>Tutorial Daur Ulang:</strong> Panduan langkah demi langkah untuk mendaur ulang material berdasarkan hasil scan. Pengguna bertanggung jawab atas keselamatan saat mengikuti tutorial.</li>
          <li><strong>Dashboard & Analitik:</strong> Pelacakan riwayat scan, dampak lingkungan, dan statistik personal pengguna.</li>
        </ul>
      </>
    ),
  },
  {
    id: "marketplace",
    title: "Ketentuan Marketplace",
    content: (
      <>
        <p>Ketentuan khusus yang berlaku untuk aktivitas marketplace:</p>
        <ul>
          <li><strong>Listing:</strong> Pengguna bertanggung jawab penuh atas keakuratan informasi, deskripsi, foto, dan harga produk yang dipasang.</li>
          <li><strong>Transaksi:</strong> Seluruh transaksi dilakukan secara langsung antara penjual dan pembeli. SirkulasiIn tidak bertanggung jawab atas sengketa, kualitas barang, atau kerugian yang timbul dari transaksi.</li>
          <li><strong>Barter:</strong> Fitur barter memungkinkan pertukaran barang tanpa uang. Kedua pihak wajib menyepakati ketentuan barter secara mandiri.</li>
          <li><strong>Konten Terlarang:</strong> Dilarang keras memperdagangkan barang ilegal, berbahaya, palsu, atau yang melanggar hukum yang berlaku di Indonesia.</li>
          <li><strong>Carbon Saved:</strong> Estimasi karbon yang ditampilkan pada setiap listing dihitung oleh AI dan bersifat perkiraan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "eco-points",
    title: "Eco-Points & Rewards",
    content: (
      <>
        <p>Sistem poin dan reward yang berlaku di SirkulasiIn:</p>
        <ul>
          <li><strong>Perolehan Poin:</strong> Eco-points diperoleh melalui aktivitas seperti scan sampah, menyelesaikan tutorial daur ulang, dan listing produk di marketplace.</li>
          <li><strong>Penukaran:</strong> Poin dapat ditukarkan dengan reward yang tersedia di halaman Rewards. Ketersediaan reward dapat berubah sewaktu-waktu.</li>
          <li><strong>Non-Transferable:</strong> Eco-points tidak dapat diperjualbelikan, ditransfer, atau ditukar dengan uang tunai.</li>
          <li><strong>Penyesuaian:</strong> SirkulasiIn berhak menyesuaikan jumlah poin yang diperoleh dari setiap aktivitas dan membekukan poin jika ditemukan indikasi penyalahgunaan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "konten-pengguna",
    title: "Konten Pengguna",
    content: (
      <>
        <p>Terkait konten yang dibuat dan diunggah oleh pengguna:</p>
        <ul>
          <li>Pengguna tetap memiliki hak atas konten yang diunggah (foto, deskripsi, ulasan), namun memberikan lisensi non-eksklusif kepada SirkulasiIn untuk menampilkan, mendistribusikan, dan memproses konten tersebut dalam platform.</li>
          <li>Konten yang mengandung SARA, pornografi, kekerasan, atau materi ilegal akan dihapus tanpa pemberitahuan.</li>
          <li>SirkulasiIn berhak menggunakan data anonim dan agregat untuk keperluan riset dan pengembangan fitur.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pembatasan",
    title: "Pembatasan & Larangan",
    content: (
      <>
        <p>Pengguna dilarang melakukan tindakan berikut:</p>
        <ul>
          <li>Menggunakan bot, scraper, atau metode otomatis untuk mengakses layanan SirkulasiIn.</li>
          <li>Memanipulasi sistem poin, scan, atau leaderboard dengan cara tidak sah.</li>
          <li>Mengunggah konten yang melanggar hak kekayaan intelektual pihak lain.</li>
          <li>Melakukan spam, phishing, atau aktivitas merugikan pengguna lain.</li>
          <li>Mencoba mengakses, merusak, atau mengganggu infrastruktur dan keamanan platform.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penghentian-akun",
    title: "Penghentian Akun",
    content: (
      <>
        <p>Terkait pengelolaan dan penghentian akun pengguna:</p>
        <ul>
          <li>Pengguna dapat menghapus akun kapan saja melalui pengaturan profil atau dengan menghubungi tim dukungan kami.</li>
          <li>SirkulasiIn berhak menangguhkan atau menghapus akun tanpa pemberitahuan jika ditemukan pelanggaran terhadap syarat dan ketentuan ini.</li>
          <li>Setelah penghapusan akun, seluruh data personal akan dihapus sesuai dengan kebijakan privasi, kecuali data yang diwajibkan oleh hukum untuk disimpan.</li>
          <li>Eco-points dan riwayat yang terkait akun yang dihapus tidak dapat dipulihkan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "batasan-tanggung-jawab",
    title: "Batasan Tanggung Jawab",
    content: (
      <>
        <p>Batasan tanggung jawab SirkulasiIn terhadap penggunaan platform:</p>
        <ul>
          <li>Layanan disediakan sebagaimana adanya (<em>&quot;as is&quot;</em>) tanpa jaminan apapun, baik tersurat maupun tersirat.</li>
          <li>Hasil analisis AI bersifat estimasi dan tidak menjadi acuan ilmiah atau hukum.</li>
          <li>SirkulasiIn tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan platform.</li>
          <li>SirkulasiIn tidak menjamin ketersediaan layanan secara terus-menerus tanpa gangguan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "perubahan-ketentuan",
    title: "Perubahan Ketentuan",
    content: (
      <p>SirkulasiIn berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku efektif sejak dipublikasikan di halaman ini. Penggunaan berkelanjutan atas layanan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan yang diperbarui. Kami menyarankan pengguna untuk meninjau halaman ini secara berkala.</p>
    ),
  },
];

export default function SyaratKetentuanPage() {
  return (
    <main className={styles.pageShell}>
      <Navbar />

      <div className={styles.container}>
        {/* ─── Header ─── */}
        <div className={styles.header}>
          <span className={styles.eyebrow}><FileText size={14} /> Legal</span>
          <h1 className={styles.title}>Syarat & Ketentuan</h1>
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
          <h3 className={styles.contactTitle}>Ada Pertanyaan?</h3>
          <p className={styles.contactText}>
            Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, jangan ragu untuk menghubungi kami.
          </p>
          <a href="mailto:support@sirkulasiin.id" className={styles.contactEmail}>
            support@sirkulasiin.id
          </a>
        </div>
      </div>
    </main>
  );
}
