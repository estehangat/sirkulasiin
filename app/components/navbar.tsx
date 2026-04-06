import Link from "next/link";
import styles from "./navbar.module.css";

type NavbarKey = "home" | "marketplace" | "scan" | "riwayat";

type NavbarProps = {
  activeNav?: NavbarKey;
};

const navItems: Array<{ key: NavbarKey; label: string; href: string }> = [
  { key: "home", label: "Beranda", href: "/" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace" },
  { key: "scan", label: "Scan", href: "/scan" },
  { key: "riwayat", label: "Riwayat Scan", href: "#riwayat" },
];

const IconBrandLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2a10 10 0 0 1 3.44 1.66" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const getNavClassName = (active: boolean) => {
  if (active) {
    return `${styles.navLink} ${styles.navLinkActive}`;
  }

  return styles.navLink;
};

export default function Navbar({ activeNav }: NavbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.brandWrap}>
        <div className={styles.brandMark} aria-hidden>
          <IconBrandLogo />
        </div>
        <span className={styles.brandName}>SirkulasiIn</span>
      </div>

      <nav className={styles.mainNav} aria-label="Navigasi utama">
        {navItems.map((item) => {
          const isActive = item.key === activeNav;
          const className = getNavClassName(isActive);

          if (item.href.startsWith("#")) {
            return (
              <a
                key={item.key}
                href={item.href}
                className={className}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={className}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.authCta}>
        <Link href="/login" className={styles.loginBtn}>
          Masuk
        </Link>
        <Link href="/signup" className={styles.signupBtn}>
          Daftar
        </Link>
      </div>
    </header>
  );
}
