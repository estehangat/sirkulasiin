import Image from "next/image";
import Link from "next/link";
import styles from "./footer.module.css";

const platformLinks = [
  { label: "Beranda", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Scan", href: "/scan" },
  { label: "Daur Ulang", href: "/tutorial" },
  { label: "Tentang", href: "/tentang" },
];

const dampakLinks = [
  { label: "Papan Peringkat", href: "/leaderboard" },
  { label: "Laporan Keberlanjutan", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Komunitas", href: "#" },
];

const dukunganLinks = [
  { label: "Pusat Bantuan", href: "#" },
  { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
  { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        {/* ── Top Grid ── */}
        <div className={styles.topGrid}>
          {/* Brand */}
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <Image
                src="/logoSirkulasiInPolos.png"
                alt="SirkulasiIn"
                width={32}
                height={32}
                className={styles.brandLogo}
              />
              <span className={styles.brandName}>
                Sirkulasi<span className={styles.brandHighlight}>In</span>
              </span>
            </div>
            <p className={styles.brandDesc}>
              Memberdayakan komunitas melalui prinsip ekonomi sirkular.
              Bergabunglah dalam membangun bumi yang lebih hijau dan
              berkelanjutan untuk generasi mendatang.
            </p>
          </div>

          {/* Platform */}
          <div className={styles.linkCol}>
            <h3 className={styles.linkColTitle}>Platform</h3>
            <ul className={styles.linkList}>
              {platformLinks.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className={styles.linkItem}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dampak */}
          <div className={styles.linkCol}>
            <h3 className={styles.linkColTitle}>Dampak</h3>
            <ul className={styles.linkList}>
              {dampakLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={styles.linkItem}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dukungan */}
          <div className={styles.linkCol}>
            <h3 className={styles.linkColTitle}>Dukungan</h3>
            <ul className={styles.linkList}>
              {dukunganLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={styles.linkItem}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Section ── */}
        <div className={styles.bottomSection}>
          {/* Social */}
          <div className={styles.socialRow}>
            <a href="#" className={styles.socialBtn} aria-label="Website">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>
            <a href="#" className={styles.socialBtn} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className={styles.socialBtn} aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
          </div>

          {/* Newsletter */}
          <div className={styles.newsletterWrap}>
            <label htmlFor="newsletter-email" className={styles.newsletterLabel}>
              Bergabung Bersama Kami
            </label>
            <form className={styles.newsletterForm} action="#">
              <input
                id="newsletter-email"
                type="email"
                placeholder="Masukkan email Anda"
                className={styles.newsletterInput}
              />
              <button type="submit" className={styles.newsletterBtn} aria-label="Kirim">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* ── Copyright ── */}
        <p className={styles.copyright}>
          © {new Date().getFullYear()} SirkulasiIn. Ekonomi sirkular untuk bumi yang lebih hijau.
        </p>
      </div>
    </footer>
  );
}
