import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import {
  Tag,
  PackageSearch,
  PackageCheck,
  Store,
  Plus,
  MoreVertical,
  ImageIcon,
  Leaf,
  Zap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ListingActions from "./ListingActions";

export const metadata: Metadata = {
  title: "Marketplace Saya — SirkulasiIn",
  description: "Kelola listing marketplace pribadi Anda.",
};

type ListingRow = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency: string;
  category: string;
  carbon_saved: string | null;
  eco_points: number;
  status: "draft" | "published" | "sold" | "archived";
  location: string | null;
};

// ─── Data Fetching ───────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 5;

// Ambil data spesifik harga & status untuk kalkulasi indikator di atas
async function getListingStats() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: true };

  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("status, price")
    .eq("user_id", user.id);

  if (error || !data) return { data: [], error: true };
  return { data, error: false };
}

// Ambil data lengkap untuk list di bawah, dengan Pagination
async function getPaginatedListings(page: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rows: [] as ListingRow[], count: 0, error: true };

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from("marketplace_listings")
    .select(
      "id, created_at, title, description, image_url, price, currency, category, carbon_saved, eco_points, status, location",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { rows: [] as ListingRow[], count: 0, error: true };
  return { rows: data as ListingRow[], count: count || 0, error: false };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 24)
    return `${Math.max(diffHours, 1)} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", label: "Aktif" };
    case "draft":
      return { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb", label: "Draft" };
    case "sold":
      return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Terjual" };
    case "archived":
      return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca", label: "Diarsipkan" };
    default:
      return { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb", label: "Unknown" };
  }
}

// ─── Reusable Components ─────────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={{
        borderRadius: "24px",
        border: "1px solid #EFEFEB",
        background: "#ffffff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        ...style,
      }}
    >
      {children}
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const pageStr = typeof resolvedParams?.page === "string" ? resolvedParams.page : "1";
  const currentPage = Math.max(1, parseInt(pageStr, 10) || 1);

  // Parallel fetch stats & list
  const [statsRes, listRes] = await Promise.all([
    getListingStats(),
    getPaginatedListings(currentPage),
  ]);

  const { data: statsData } = statsRes;
  const { rows, count, error } = listRes;

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  // Metrics from total dataset
  const totalListings = statsData.length;
  const publishedCount = statsData.filter((r) => r.status === "published").length;
  const soldCount = statsData.filter((r) => r.status === "sold").length;
  const potentialRevenue = statsData
    .filter((r) => r.status === "published" || r.status === "sold")
    .reduce((acc, r) => acc + (r.price || 0), 0);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* ── Page Header Action ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "4px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#1A1A1A",
              marginBottom: "4px",
            }}
          >
            Kelola Listing
          </h2>
          <p style={{ color: "#737369", fontSize: "13px" }}>
            Pasarkan material sirkular Anda dan lacak performanya.
          </p>
        </div>
        <Link
          href="/scan"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "14px",
            background: "#27AE60",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(39,174,96,0.3)",
            transition: "all 0.2s ease",
          }}
        >
          <Plus size={16} />
          Scan Barang
        </Link>
      </div>

      {/* ── Stats Strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <Card style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#e2e8f0", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <Store size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Total Listing</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>{totalListings}</p>
        </Card>

        <Card style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#bbf7d0", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <PackageSearch size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Listing Aktif</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#14532d" }}>{publishedCount}</p>
        </Card>

        <Card style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#bfdbfe", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <PackageCheck size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#1e40af" }}>Barang Terjual</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#1e3a8a" }}>{soldCount}</p>
        </Card>

        <Card style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#fde68a", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
              <Tag size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#b45309" }}>Nilai Valuasi</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#78350f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatRupiah(potentialRevenue)}
          </p>
        </Card>
      </div>

      {/* ── Listing List Section ── */}
      <section
        style={{
          borderRadius: "24px",
          border: "1px solid #EFEFEB",
          background: "#fff",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #EFEFEB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>
            Semua Produk Anda
          </h2>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#737369",
              background: "#F4F4F0",
              padding: "4px 12px",
              borderRadius: "99px",
            }}
          >
            {count} entri terdaftar
          </span>
        </div>

        {error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 24px" }}>
            <AlertCircle size={36} color="#ef4444" />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Gagal memuat produk</p>
              <p style={{ fontSize: "13px", color: "#737369", marginTop: "4px" }}>Silakan refresh halaman untuk mencoba lagi.</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "80px 24px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Store size={32} />
            </div>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A" }}>Belum ada produk</p>
              <p style={{ fontSize: "14px", color: "#737369", marginTop: "8px", maxWidth: "340px", marginInline: "auto" }}>
                Gunakan hasil scan Anda untuk dipasarkan ke publik.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gap: "0" }}>
              {rows.map((row, i) => {
                const sf = getStatusColor(row.status);
                const isLast = i === rows.length - 1;

                return (
                  <div
                    key={row.id}
                    style={{
                      padding: "20px 24px",
                      borderBottom: isLast ? "none" : "1px solid #EFEFEB",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "14px",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                      }}
                    >
                      {row.image_url ? (
                        <Image
                          src={row.image_url}
                          alt={row.title}
                          width={80}
                          height={80}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          unoptimized
                        />
                      ) : (
                        <ImageIcon size={24} />
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "3px" }}>
                            {row.title}
                          </h3>
                          <p style={{ fontSize: "12px", color: "#737369" }}>
                            Kategori: <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{row.category}</span>
                          </p>
                        </div>
                        <span style={{ background: sf.bg, color: sf.text, border: `1px solid ${sf.border}`, padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {sf.label}
                        </span>
                      </div>

                      <p style={{ fontSize: "16px", fontWeight: 800, color: "#1E8449", marginTop: "4px" }}>
                        {formatRupiah(row.price)}
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: "#A3A39B" }}>
                          Dibuat {formatTimeAgo(row.created_at)}
                        </span>
                        {(row.eco_points > 0 || row.carbon_saved) && (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ width: "4px", height: "4px", background: "#EFEFEB", borderRadius: "50%" }} />
                            {row.eco_points > 0 && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
                                <Zap size={11} /> +{row.eco_points} pts
                              </span>
                            )}
                            {row.carbon_saved && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
                                <Leaf size={11} /> {row.carbon_saved}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <ListingActions id={row.id} />
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 24px", borderTop: "1px solid #EFEFEB", background: "#fafaf9"
              }}>
                <p style={{ fontSize: "13px", color: "#737369", fontWeight: 600 }}>
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {currentPage > 1 ? (
                    <Link
                      href={`/dashboard/listings?page=${currentPage - 1}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px", borderRadius: "10px", background: "#fff",
                        border: "1px solid #EFEFEB", color: "#3D3D38", fontWeight: 700,
                        fontSize: "13px", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      <ChevronLeft size={16} /> Sebelumnya
                    </Link>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px",
                      borderRadius: "10px", background: "#f3f4f6", border: "1px solid #EFEFEB",
                      color: "#A3A39B", fontWeight: 700, fontSize: "13px", cursor: "not-allowed"
                    }}>
                      <ChevronLeft size={16} /> Sebelumnya
                    </span>
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={`/dashboard/listings?page=${currentPage + 1}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px", borderRadius: "10px", background: "#fff",
                        border: "1px solid #EFEFEB", color: "#3D3D38", fontWeight: 700,
                        fontSize: "13px", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      Selanjutnya <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px",
                      borderRadius: "10px", background: "#f3f4f6", border: "1px solid #EFEFEB",
                      color: "#A3A39B", fontWeight: 700, fontSize: "13px", cursor: "not-allowed"
                    }}>
                      Selanjutnya <ChevronRight size={16} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
