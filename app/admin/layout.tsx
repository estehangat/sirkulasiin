"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Loader2,
  Map,
  Leaf,
  Receipt,
  Store,
  ArrowLeftRight,
  Bell
} from "lucide-react";

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
    label: "Statistik Sistem",
    href: "/admin",
    icon: <LayoutDashboard size={iconSize} />,
  },
  {
    label: "Dampak Lingkungan",
    href: "/admin/eco-impact",
    icon: <Leaf size={iconSize} />,
  },
  {
    label: "Monitoring Transaksi",
    href: "/admin/transactions",
    icon: <Receipt size={iconSize} />,
  },
  {
    label: "Moderasi Marketplace",
    href: "/admin/marketplace",
    icon: <Store size={iconSize} />,
  },
  {
    label: "Monitor Barter",
    href: "/admin/barter",
    icon: <ArrowLeftRight size={iconSize} />,
  },
  {
    label: "Manajemen Notifikasi",
    href: "/admin/notifications",
    icon: <Bell size={iconSize} />,
  },
  {
    label: "Manajemen Pengguna",
    href: "/admin/users",
    icon: <Users size={iconSize} />,
  },
  {
    label: "Manajemen Konten",
    href: "/admin/content",
    icon: <FileText size={iconSize} />,
  },
  {
    label: "Nama Halaman (URL)",
    href: "/admin/telemetry",
    icon: <Map size={iconSize} />,
  },
  {
    label: "Profil Sistem",
    href: "/admin/profile",
    icon: <Settings size={iconSize} />,
  },
];

function isActiveItem(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
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
    "/admin": {
      title: "Control Panel Admin",
      subtitle: "Monitoring metrik utama dan memantau keseluruhan pertumbuhan sistem pengguna.",
    },
    "/admin/eco-impact": {
      title: "Dampak Lingkungan",
      subtitle: "Pantau kontribusi kolektif platform terhadap ekonomi sirkular dan kelestarian lingkungan.",
    },
    "/admin/transactions": {
      title: "Monitoring Transaksi",
      subtitle: "Pantau seluruh alur transaksi, pembayaran, escrow, dan status pengiriman.",
    },
    "/admin/marketplace": {
      title: "Moderasi Marketplace",
      subtitle: "Tinjau, arsipkan, atau publikasikan ulang listing untuk menjaga kualitas platform.",
    },
    "/admin/barter": {
      title: "Monitor Barter",
      subtitle: "Pantau seluruh tawaran barter, status negosiasi, dan tingkat penerimaan.",
    },
    "/admin/notifications": {
      title: "Manajemen Notifikasi",
      subtitle: "Kirim pengumuman, peringatan, atau notifikasi langsung ke pengguna.",
    },
    "/admin/users": {
      title: "Manajemen Pengguna",
      subtitle: "Tinjau hak akses pengguna, pemblokiran akun, dan kontrol peran.",
    },
    "/admin/content": {
      title: "Manajemen Konten",
      subtitle: "Ubah tulisan dinamis dan gambar pada Beranda dan Tentang aplikasi.",
    },
    "/admin/telemetry": {
      title: "Nama Halaman (URL)",
      subtitle: "Kelola terjemahan pembacaan statistik rute URL menjadi nama halaman yang bersahabat.",
    },
    "/admin/profile": {
      title: "Profil & Keamanan",
      subtitle: "Perbarui identitas admin dan ubah kata sandi sistem.",
    },
  };
  return map[pathname] || map["/admin"];
}

// ─── Nav Item ──────────────────────────────────────────
function NavItem({ item, active }: { item: AccountNavItem; active: boolean }) {
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
    color: active ? "#2563EB" : hovered ? "#2563EB" : "#475569",
    background: active
      ? "rgba(37, 99, 235, 0.1)"
      : hovered
        ? "rgba(37, 99, 235, 0.05)"
        : "transparent",
    border: active
      ? "1px solid rgba(37, 99, 235, 0.2)"
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
      ? "rgba(37, 99, 235, 0.15)"
      : hovered
        ? "rgba(37, 99, 235, 0.08)"
        : "rgba(0,0,0,0.04)",
    color: active ? "#2563EB" : hovered ? "#3B82F6" : "#64748B",
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
            background: "#2563EB",
            flexShrink: 0,
          }}
        />
      )}
    </Link>
  );
}

// ─── Back Link ──────────────────────────────────────────
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
        background: hovered ? "#1E3A8A" : "#1E40AF",
        color: "#fff",
        fontWeight: 700,
        fontSize: "14px",
        transition: "background 0.18s ease",
        boxShadow: "0 2px 8px rgba(30, 58, 138, 0.3)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ArrowLeft size={15} />
      Kembali ke Beranda
    </Link>
  );
}

// ─── Logout Button ──────────────────────────────────────
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
        title="Keluar dari akun admin"
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
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
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
            background: "#1E293B",
            borderRadius: "24px",
            padding: "32px",
            width: "100%",
            maxWidth: "380px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            animation: "slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <LogOut size={32} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#F8FAFC", marginBottom: "8px" }}>
              Keluar dari Admin?
            </h3>
            <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "32px", lineHeight: 1.5 }}>
              Sesi privileged admin Anda akan diakhiri dan harus login ulang untuk kembali.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  background: "#334155",
                  border: "1px solid #475569",
                  color: "#cbd5e1",
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

// ─── Main Layout ──────────────────────────────────────────
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [rolesChecked, setRolesChecked] = useState(false);
  const headerMeta = useMemo(() => getHeaderMeta(pathname), [pathname]);

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login?next=/admin");
        return;
      }

      // Mengecek tabel profiles atau users untuk role admin
      let role = 'user';
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single();
        if (profile?.role) role = profile.role;
      } catch {
        try {
           const { data: userRow } = await supabase
            .from("users")
            .select("role")
            .eq("id", authUser.id)
            .single();
           if (userRow?.role) role = userRow.role;
        } catch (e) { }
      }

      if (role !== "admin") {
        router.push("/dashboard"); // unauthorized 
        return;
      }

      // Valid admin
      const meta = authUser.user_metadata || {};
      const name = (meta.full_name as string) || (meta.name as string) || authUser.email?.split("@")[0] || "Admin";
      setUser({
        name,
        email: authUser.email || "",
        avatar: (meta.avatar_url as string) || (meta.picture as string) || null,
      });
      setVerifying(false);
      setRolesChecked(true);
    };

    checkRole();
  }, [router]);

  if (verifying) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F1F5F9", flexDirection: "column", gap: "16px" }}>
        <Loader2 className="animate-spin" size={32} color="#2563EB" />
        <p style={{ color: "#475569", fontSize: "14px", fontWeight: 600 }}>Memverifikasi otorisasi admin...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "272px minmax(0, 1fr)",
        background: "#F8FAFC",
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
          borderRight: "1px solid #E2E8F0",
          background: "#FFFFFF",
          overflowY: "auto",
        }}
      >
        {/* Brand Block */}
        <div
          style={{
            borderRadius: "18px",
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.14)",
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
              background: "rgba(37, 99, 235, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} style={{ color: "#2563EB" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#1E40AF",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "2px",
              }}
            >
              Control Panel
            </p>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1,
              }}
            >
              System Admin
            </h2>
          </div>
        </div>

        {/* Section label */}
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            padding: "0 4px",
            marginBottom: "2px",
          }}
        >
          Tools
        </p>

        {/* Nav Items */}
        <nav
          style={{ display: "flex", flexDirection: "column", gap: "3px" }}
          aria-label="Navigasi admin"
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
            background: "#F1F5F9",
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
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
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
                border: "2px solid rgba(37,99,235,0.25)",
                background: "rgba(37,99,235,0.1)",
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
                    color: "#2563EB",
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
                  color: "#0F172A",
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
                  color: "#64748B",
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
      <main style={{ padding: "22px 24px 36px", isolation: "isolate" }}>
        {/* Page Header */}
        <header
          style={{
            position: "relative",
            borderRadius: "24px",
            border: "1px solid #E2E8F0",
            background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.8) 100%)",
            boxShadow: "0 8px 32px rgba(15, 23, 42, 0.03)",
            padding: "24px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
            overflow: "hidden",
          }}
        >
          {/* Aesthetic background blobs */}
          <div style={{ position: "absolute", top: "-50px", right: "-20px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "20%", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(79,70,229,0.05) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "8px", background: "rgba(37,99,235,0.12)", color: "#2563EB" }}>
                <ShieldCheck size={14} />
              </span>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "#2563EB",
                }}
              >
                ADMINISTRATOR
              </p>
            </div>
            <h1
              style={{
                fontSize: "28px",
                lineHeight: 1.2,
                color: "#0F172A",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                marginBottom: "4px",
              }}
            >
              {headerMeta.title}
            </h1>
            <p style={{ color: "#64748B", fontSize: "15px", fontWeight: 500 }}>
              {headerMeta.subtitle}
            </p>
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
              border: "1px solid #E2E8F0",
              background: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {user?.name || "Admin"}
              </p>
              <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.3, fontWeight: 500 }}>
                High Privileges
              </p>
            </div>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #fff",
                boxShadow: "0 0 0 2px rgba(37,99,235,0.2)",
                background: "rgba(37,99,235,0.05)",
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
                    color: "#2563EB",
                  }}
                >
                  {getInitials(user?.name || "Admin")}
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
