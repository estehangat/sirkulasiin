"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { createPortal } from "react-dom";
import { logout } from "@/app/actions/auth";
import { Home, Store, Camera, Recycle, HelpCircle, User, LayoutDashboard, LogOut, Loader2, XCircle } from "lucide-react";
import styles from "./navbar.module.css";
import NotificationBell from "./NotificationBell";

type NavbarKey = "home" | "marketplace" | "scan" | "tutorial" | "tentang";

type NavbarProps = {
  activeNav?: NavbarKey;
};

type UserInfo = {
  name: string;
  avatar: string | null;
  email: string;
};

const navItems: Array<{ key: NavbarKey; label: string; href: string }> = [
  { key: "home", label: "Beranda", href: "/" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace" },
  { key: "scan", label: "Scan", href: "/scan" },
  { key: "tutorial", label: "Daur Ulang", href: "/tutorial" },
  { key: "tentang", label: "Tentang/Cara Kerja", href: "/tentang" },
];

/* ═══════════════ Logo Component ═══════════════ */
const BrandLogo = () => (
  <Image
    src="/logoSirkulasiInPolos.png"
    alt="SirkulasiIn"
    width={28}
    height={28}
    className={styles.brandLogo}
    priority
  />
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LayoutDashboardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const LogOutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

/* ═══════════════ Helpers ═══════════════ */
const getNavClassName = (active: boolean) => {
  if (active) return `${styles.navLink} ${styles.navLinkActive}`;
  return styles.navLink;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ═══════════════ Component ═══════════════ */
export default function Navbar({ activeNav }: NavbarProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Fetch user session ── */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUser({
          name:
            meta.full_name ||
            meta.name ||
            session.user.email?.split("@")[0] ||
            "User",
          avatar: meta.avatar_url || meta.picture || null,
          email: session.user.email || "",
        });
      }
    });
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <>
      <header className={styles.topbar}>
      <Link href="/" className={styles.brandWrap}>
        <div className={styles.brandMark} aria-hidden>
          <BrandLogo />
        </div>
        <span className={styles.brandName}>Sirkulasi<span className={styles.brandNameHighlight}>In</span></span>
      </Link>

      <nav className={styles.mainNav} aria-label="Navigasi utama">
        <div className={styles.navInner}>
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
        </div>
      </nav>

      <div className={styles.rightSection}>
        {/* ── Notification Bell ── */}
        {user && <NotificationBell />}

        {/* ── Auth Section ── */}
        {!user ? (
          <div className={styles.authCta}>
            <Link href="/login" className={styles.loginBtn}>
              Masuk
            </Link>
            <Link href="/signup" className={styles.signupBtn}>
              Daftar
            </Link>
          </div>
        ) : (
          <div className={styles.profileWrap} ref={dropdownRef}>
            <button
              className={styles.profileBtn}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Menu profil"
              aria-expanded={dropdownOpen}
              type="button"
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={36}
                  height={36}
                  className={styles.profileAvatar}
                  unoptimized
                />
              ) : (
                <span className={styles.profileInitials}>
                  {getInitials(user.name)}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                {/* User info header */}
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{user.name}</p>
                  <p className={styles.dropdownEmail}>{user.email}</p>
                </div>
                <div className={styles.dropdownDivider} />

                {/* Menu items */}
                <Link
                  href="/dashboard"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={16} />
                  Profil
                </Link>

                <div className={styles.dropdownDivider} />

                <button
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

    {/* ── Mobile Bottom Navigation ── */}
    <nav className={styles.bottomNav}>
       <Link href="/" className={`${styles.bottomNavItem} ${activeNav === 'home' ? styles.bottomNavItemActive : ''}`}>
          <Home size={22} strokeWidth={activeNav === 'home' ? 2.5 : 2} />
          <span>Beranda</span>
       </Link>
       
       <Link href="/marketplace" className={`${styles.bottomNavItem} ${activeNav === 'marketplace' ? styles.bottomNavItemActive : ''}`}>
          <Store size={22} strokeWidth={activeNav === 'marketplace' ? 2.5 : 2} />
          <span>Marketplace</span>
       </Link>
       
       <div className={styles.scanBtnContainer}>
         <Link href="/scan" className={styles.scanBtn}>
            <Camera size={28} color="#fff" strokeWidth={2.5} />
            <span className={styles.scanLabel}>SCAN</span>
         </Link>
       </div>
       
       <Link href="/tutorial" className={`${styles.bottomNavItem} ${activeNav === 'tutorial' ? styles.bottomNavItemActive : ''}`}>
          <Recycle size={22} strokeWidth={activeNav === 'tutorial' ? 2.5 : 2} />
          <span>Daur ulang</span>
       </Link>
       
       <Link href="/tentang" className={`${styles.bottomNavItem} ${activeNav === 'tentang' ? styles.bottomNavItemActive : ''}`}>
          <HelpCircle size={22} strokeWidth={activeNav === 'tentang' ? 2.5 : 2} />
          <span>Tentang</span>
       </Link>
    </nav>

    {/* ── Logout Confirm Modal ── */}
    {showLogoutConfirm && createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => !isLoggingOut && setShowLogoutConfirm(false)} />
        <div style={{ position: "relative", background: "#fff", padding: "28px", borderRadius: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", textAlign: "center", animation: "modalIn 0.2s ease-out" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <LogOut size={32} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Keluar dari Akun?</h3>
          <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "28px", lineHeight: 1.5 }}>
            Anda harus masuk kembali untuk bisa mengakses fitur seperti Marketplace, Barter, dan Scan AI.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              disabled={isLoggingOut}
              style={{ flex: 1, padding: "12px", borderRadius: "14px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: isLoggingOut ? "not-allowed" : "pointer", transition: "0.2s" }}
            >
              Batal
            </button>
            <button
              onClick={executeLogout}
              disabled={isLoggingOut}
              style={{ flex: 1, padding: "12px", borderRadius: "14px", background: "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: isLoggingOut ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "0.2s" }}
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : "Ya, Keluar"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
