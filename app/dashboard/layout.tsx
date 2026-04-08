"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

type AccountNavItem = {
  label: string;
  href: string;
};

const accountNavItems: AccountNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Riwayat Scan", href: "/dashboard/riwayat-scan" },
  { label: "Marketplace Saya", href: "/dashboard/listings" },
  { label: "Rewards", href: "/dashboard/rewards" },
  { label: "Transaksi", href: "/dashboard/transactions" },
  { label: "Profil/Settings", href: "/dashboard/settings" },
];

function isActiveItem(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <p className={styles.brandCaption}>Area Akun</p>
          <h2 className={styles.brandTitle}>SirkulasiIn</h2>
        </div>

        <nav className={styles.nav} aria-label="Navigasi akun">
          {accountNavItems.map((item) => {
            const active = isActiveItem(pathname, item.href);
            const className = active
              ? `${styles.navItem} ${styles.navItemActive}`
              : styles.navItem;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={className}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/" className={styles.backLink}>
          Kembali ke Area Publik
        </Link>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
