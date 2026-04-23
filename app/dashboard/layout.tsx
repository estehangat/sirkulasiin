"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  ScanLine,
  ShoppingBag,
  ArrowLeftRight,
  Gift,
  ReceiptText,
  Settings,
  ArrowLeft,
  Leaf,
  LogOut,
  Loader2,
} from "lucide-react";
import NotificationBell from "@/app/components/NotificationBell";

type AccountNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type AccountUser = {
  name: string;
  email: string;
  avatar: string | null;
};

const iconSize = 17;

const accountNavItems: AccountNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={iconSize} />,
  },
  {
    label: "Riwayat Scan",
    href: "/dashboard/riwayat-scan",
    icon: <ScanLine size={iconSize} />,
  },
  {
    label: "Marketplace Saya",
    href: "/dashboard/listings",
    icon: <ShoppingBag size={iconSize} />,
  },
  {
    label: "Tawaran Barter",
    href: "/dashboard/barter",
    icon: <ArrowLeftRight size={iconSize} />,
  },
  {
    label: "Rewards",
    href: "/dashboard/rewards",
    icon: <Gift size={iconSize} />,
  },
  {
    label: "Transaksi",
    href: "/dashboard/transactions",
    icon: <ReceiptText size={iconSize} />,
  },
  // Admin gate is enforced on the page.
  {
    label: "Profil & Pengaturan",
    href: "/dashboard/settings",
    icon: <Settings size={iconSize} />,
  },
];

function isActiveItem(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
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
    "/dashboard/barter": {
      title: "Tawaran Barter",
      subtitle: "Kelola tawaran barter masuk dan yang Anda kirim.",
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
      title: "Profil dan Pengaturan",
      subtitle: "Atur profil, notifikasi, dan keamanan akun Anda.",
    },
  };
  return map[pathname] || map["/dashboard"];
}

// ─── Nav Item (client component needs hover state) ──────────────────────────
function NavItem({
  item,
  active,
}: {
  item: AccountNavItem;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    textDecoration: "none",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    fontWeight: active ? 700 : 600,
    transition: "all 0.18s ease",
    color: active
      ? "#1E8449"
      : hovered
        ? "#1E8449"
        : "#52524C",
    background: active
      ? "rgba(39, 174, 96, 0.12)"
      : hovered
        ? "rgba(39, 174, 96, 0.07)"
        : "transparent",
    border: active
      ? "1px solid rgba(39, 174, 96, 0.22)"
      : "1px solid transparent",
    position: "relative",
  };

  const iconWrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    flexShrink: 0,
    background: active
      ? "rgba(39, 174, 96, 0.18)"
      : hovered
        ? "rgba(39, 174, 96, 0.1)"
        : "rgba(0,0,0,0.04)",
    color: active ? "#1E8449" : hovered ? "#27AE60" : "#737369",
    transition: "all 0.18s ease",
  };

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={iconWrapStyle}>{item.icon}</span>
      {item.label}
      {active && (
        <span
          style={{
            marginLeft: "auto",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#27AE60",
            flexShrink: 0,
          }}
        />
      )}
    </Link>
  );
}

// ─── Back Link ────────────────────────────────────────────────────────────────
function BackLink() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRadius: "14px",
        textDecoration: "none",
        padding: "11px 12px",
        background: hovered ? "#1E8449" : "#27AE60",
        color: "#fff",
        fontWeight: 700,
        fontSize: "14px",
        transition: "background 0.18s ease",
        boxShadow: "0 2px 8px rgba(39,174,96,0.3)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ArrowLeft size={15} />
      Kembali ke Area Publik
    </Link>
  );
}

// ─── Logout Button ────────────────────────────────────────────────────────────
function LogoutButton() {
  const [hovered, setHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoggingOut}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Keluar dari akun"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          border: hovered ? "1px solid #fecaca" : "1px solid transparent",
          background: hovered ? "#fef2f2" : "transparent",
          color: hovered ? "#ef4444" : "#A3A39B",
          cursor: "pointer",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        <LogOut size={16} />
      </button>

      {showConfirm && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
          animation: "fadeIn 0.2s ease-out"
        }}>
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          <div style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "32px",
            width: "100%",
            maxWidth: "380px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.1)",
            animation: "slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <LogOut size={32} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
              Keluar dari Akun?
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "32px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin mengakhiri sesi ini? Anda harus login kembali untuk mengakses profil Anda.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  background: "#F4F4F0",
                  border: "1px solid #EFEFEB",
                  color: "#52524C",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isLoggingOut ? "wait" : "pointer",
                  opacity: isLoggingOut ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                }}
              >
                {isLoggingOut ? "Memproses..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [verifyingRole, setVerifyingRole] = useState(true);
  const [user, setUser] = useState<AccountUser | null>(null);
  const headerMeta = useMemo(() => getHeaderMeta(pathname), [pathname]);

  useEffect(() => {
    const supabase = createClient();

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

    const checkAdminRedirect = async (userId: string) => {
      let isAdmin = false;
      let isActive = true;
      try {
        const { data: p } = await supabase.from('profiles').select('role, is_active').eq('id', userId).single();
        if (p?.role === 'admin') isAdmin = true;
        if (p?.is_active === false) isActive = false;
        if (!p?.role) {
          const { data: u } = await supabase.from('users').select('role, is_active').eq('id', userId).single();
          if (u?.role === 'admin') isAdmin = true;
          if (u?.is_active === false) isActive = false;
        }
      } catch (e) {}

      if (!isActive) {
        await supabase.auth.signOut();
        router.push('/login?error=account_deactivated');
        return;
      }

      if (isAdmin) {
        router.push('/admin');
      } else {
        setVerifyingRole(false);
      }
    };

    const refreshUserFromDatabase = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setUserFromSession(authUser);
        checkAdminRedirect(authUser.id);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setVerifyingRole(false);
        return;
      }
      setUserFromSession(session.user);
      checkAdminRedirect(session.user.id);
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

  if (verifyingRole) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F5F5F4", flexDirection: "column", gap: "16px" }}>
        <Loader2 className="animate-spin" size={32} color="#27AE60" />
        <p style={{ color: "#737369", fontSize: "14px", fontWeight: 600 }}>Memuat profil...</p>
      </div>
    );
  }

  return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "272px minmax(0, 1fr)",
          background: "#F4F4F0",
        }}
      >
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "20px 14px",
          borderRight: "1px solid #EFEFEB",
          background:
            "linear-gradient(180deg, #ffffff 0%, #f7faf7 100%)",
          overflowY: "auto",
        }}
      >
        {/* Brand Block */}
        <div
          style={{
            borderRadius: "18px",
            background: "rgba(39,174,96,0.08)",
            border: "1px solid rgba(39,174,96,0.14)",
            padding: "14px 16px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "rgba(39,174,96,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Leaf size={20} style={{ color: "#1E8449" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#829E60",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "2px",
              }}
            >
              Area Akun
            </p>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#1A1A1A",
                lineHeight: 1,
              }}
            >
              SirkulasiIn
            </h2>
          </div>
        </div>

        {/* Section label */}
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#A3A39B",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            padding: "0 4px",
            marginBottom: "2px",
          }}
        >
          Menu Utama
        </p>

        {/* Nav Items */}
        <nav
          style={{ display: "flex", flexDirection: "column", gap: "3px" }}
          aria-label="Navigasi akun"
        >
          {accountNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActiveItem(pathname, item.href)}
            />
          ))}
        </nav>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "#EFEFEB",
            margin: "8px 4px",
          }}
        />

        {/* Back button */}
        <BackLink />

        {/* User card at bottom */}
        {user && (
          <div
            style={{
              marginTop: "auto",
              borderRadius: "16px",
              border: "1px solid #EFEFEB",
              background: "#fff",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(39,174,96,0.25)",
                background: "rgba(39,174,96,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={36}
                  height={36}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#1E8449",
                  }}
                >
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#737369",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </p>
            </div>
            <LogoutButton />
          </div>
        )}
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <main style={{ padding: "22px 24px 36px" }}>
        {/* Page Header */}
        {/* Page Header */}
        <header
          style={{
            position: "relative",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(246,251,248,0.8) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(39, 174, 96, 0.04), inset 0 0 0 1px rgba(255,255,255,1)",
            padding: "24px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
            // overflow: "hidden", // Removed to prevent cutting off the notification dropdown
          }}
        >
          {/* Aesthetic background blobs clipped container */}
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            borderRadius: "24px", 
            overflow: "hidden", 
            pointerEvents: "none",
            zIndex: 0 
          }}>
            <div style={{ position: "absolute", top: "-50px", right: "-20px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(39,174,96,0.15) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "-30px", left: "20%", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "8px", background: "rgba(39,174,96,0.12)", color: "#1E8449" }}>
                <LayoutDashboard size={14} />
              </span>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "#27AE60",
                }}
              >
                Area Akun
              </p>
            </div>
            <h1
              style={{
                fontSize: "28px",
                lineHeight: 1.2,
                color: "#111827",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                marginBottom: "4px",
              }}
            >
              {headerMeta.title}
            </h1>
            <p style={{ color: "#6B7280", fontSize: "15px", fontWeight: 500 }}>
              {headerMeta.subtitle}
            </p>
          </div>

          <div 
            style={{ 
              marginLeft: "auto", 
              marginRight: "16px", 
              position: "relative", 
              zIndex: 2,
              background: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              borderRadius: "50%",
              width: "46px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(39,174,96,0.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
            }}
          >
            <NotificationBell />
          </div>

          {/* Profile pill */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "8px 8px 8px 20px",
              borderRadius: "9999px",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              background: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              flexShrink: 0,
              cursor: "pointer",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(39,174,96,0.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
            }}
          >
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                {user?.name || "Pengguna"}
              </p>
              <p style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.3, fontWeight: 500 }}>
                {user?.email || "Belum login"}
              </p>
            </div>

            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #fff",
                boxShadow: "0 0 0 2px rgba(39,174,96,0.2)",
                background: "rgba(39,174,96,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={46}
                  height={46}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#1E8449",
                  }}
                >
                  {getInitials(user?.name || "User")}
                </span>
              )}
            </div>
          </div>
        </header>

          {children}
        </main>
      </div>
  );
}
