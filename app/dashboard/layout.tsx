"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./layout.module.css";

type AccountNavItem = {
  label: string;
  href: string;
};

type AccountUser = {
  name: string;
  email: string;
  avatar: string | null;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getHeaderMeta(pathname: string) {
  const map: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": {
      title: "Dashboard Akun",
      subtitle: "Ringkasan performa aktivitas sirkular Anda.",
    },
    "/dashboard/riwayat-scan": {
      title: "Riwayat Scan",
      subtitle: "Pantau semua hasil identifikasi material Anda.",
    },
    "/dashboard/listings": {
      title: "Marketplace Saya",
      subtitle: "Kelola listing dan performa produk Anda.",
    },
    "/dashboard/rewards": {
      title: "Rewards",
      subtitle: "Lihat poin dan hadiah yang sudah Anda kumpulkan.",
    },
    "/dashboard/transactions": {
      title: "Transaksi",
      subtitle: "Monitor status transaksi secara real-time.",
    },
    "/dashboard/settings": {
      title: "Profil dan Settings",
      subtitle: "Atur profil, notifikasi, dan keamanan akun Anda.",
    },
  };

  return map[pathname] || map["/dashboard"];
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [user, setUser] = useState<AccountUser | null>(null);

  const headerMeta = useMemo(() => getHeaderMeta(pathname), [pathname]);

  useEffect(() => {
    const supabase = createClient();

    const refreshUserFromDatabase = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUserFromSession(authUser);
      }
    };

    const setUserFromSession = (sessionUser: {
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }) => {
      const meta = sessionUser.user_metadata || {};
      const name =
        (meta.full_name as string) ||
        (meta.name as string) ||
        sessionUser.email?.split("@")[0] ||
        "User";

      setUser({
        name,
        email: sessionUser.email || "",
        avatar: (meta.avatar_url as string) || (meta.picture as string) || null,
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUserFromSession(session.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) return;
        setUserFromSession(session.user);
      },
    );

    const onProfileUpdated = (event: Event) => {
      const custom = event as CustomEvent<{
        name?: string;
        email?: string;
        avatar?: string | null;
      }>;

      if (custom.detail) {
        setUser((prev) => ({
          name: custom.detail?.name || prev?.name || "User",
          email: custom.detail?.email || prev?.email || "",
          avatar:
            custom.detail?.avatar === undefined
              ? (prev?.avatar ?? null)
              : custom.detail.avatar,
        }));
      }

      void refreshUserFromDatabase();
    };

    window.addEventListener(
      "account-profile-updated",
      onProfileUpdated as EventListener,
    );

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener(
        "account-profile-updated",
        onProfileUpdated as EventListener,
      );
    };
  }, []);

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

      <main className={styles.content}>
        <header className={styles.accountHeader}>
          <div>
            <p className={styles.headerEyebrow}>Area Akun</p>
            <h1 className={styles.headerTitle}>{headerMeta.title}</h1>
            <p className={styles.headerSubtitle}>{headerMeta.subtitle}</p>
          </div>

          <div className={styles.headerProfile}>
            <div className={styles.headerProfileInfo}>
              <p className={styles.headerProfileName}>
                {user?.name || "Pengguna"}
              </p>
              <p className={styles.headerProfileEmail}>
                {user?.email || "Belum login"}
              </p>
            </div>

            <div className={styles.headerAvatarWrap}>
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={44}
                  height={44}
                  className={styles.headerAvatarImg}
                  unoptimized
                />
              ) : (
                <span className={styles.headerAvatarFallback}>
                  {getInitials(user?.name || "User")}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
