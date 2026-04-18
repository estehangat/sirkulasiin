import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  Recycle,
  ShoppingBag,
  Trash2,
  Clock,
  Package,
  Leaf,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Riwayat Scan — SirkulasiIn",
  description: "Riwayat pemindaian material pengguna SirkulasiIn.",
};

type ScanRow = {
  id: string;
  created_at: string;
  item_name: string;
  material: string | null;
  recommendation: string;
  carbon_offset: number | null;
  potential_reward: string | null;
  circular_potential: number | null;
  reason: string | null;
  condition: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${Math.max(diffMins, 1)} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractNumber(value: string | null) {
  if (!value) return 0;
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function RecBadge({ rec }: { rec: string }) {
  if (rec === "recycle")
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          borderRadius: "99px", background: "#f0fdf4", border: "1px solid #bbf7d0",
          padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#15803d",
          whiteSpace: "nowrap"
        }}
      >
        <Recycle size={11} /> Daur Ulang
      </span>
    );
  if (rec === "sell")
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          borderRadius: "99px", background: "#eff6ff", border: "1px solid #bfdbfe",
          padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#1d4ed8",
          whiteSpace: "nowrap"
        }}
      >
        <ShoppingBag size={11} /> Jual
      </span>
    );
  if (rec === "dispose")
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          borderRadius: "99px", background: "#fef2f2", border: "1px solid #fecaca",
          padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#b91c1c",
          whiteSpace: "nowrap"
        }}
      >
        <Trash2 size={11} /> Buang Terarah
      </span>
    );
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        borderRadius: "99px", background: "#f3f4f6", border: "1px solid #e5e7eb",
        padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#4b5563",
        whiteSpace: "nowrap"
      }}
    >
      <AlertCircle size={11} /> Lainnya
    </span>
  );
}

const ITEMS_PER_PAGE = 5;

// Ambil data spesifik untuk kalkulasi bagian atas (tanpa batas limit pagination)
async function getScanStats() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rows: [], error: true };

  const { data, error } = await supabase
    .from("scan_history")
    .select("recommendation, carbon_offset, potential_reward")
    .eq("user_id", user.id);
  
  if (error || !data) return { rows: [], error: true };
  return { rows: data, error: false };
}

// Ambil data spesifik dengan range pagination
async function getPaginatedScans(page: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rows: [] as ScanRow[], count: 0, error: true };

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from("scan_history")
    .select(
      "id,created_at,item_name,material,recommendation,carbon_offset,potential_reward,circular_potential,reason,condition",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { rows: [] as ScanRow[], count: 0, error: true };
  return { rows: data as ScanRow[], count: count || 0, error: false };
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default async function RiwayatScanPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const pageStr = typeof resolvedParams?.page === "string" ? resolvedParams.page : "1";
  const currentPage = Math.max(1, parseInt(pageStr, 10) || 1);

  // Parallel fetch stats & list
  const [statsRes, listRes] = await Promise.all([
    getScanStats(),
    getPaginatedScans(currentPage),
  ]);

  const { rows: allRows, error: statsError } = statsRes;
  const { rows, count, error } = listRes;

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  // ── Metrics Calculation (from all rows) ──
  const totalScans = allRows.length;
  const totalPoints = allRows.reduce((acc, r) => acc + extractNumber(r.potential_reward), 0);
  const totalCarbon = allRows.reduce((acc, r) => acc + (r.carbon_offset ?? 0), 0);
  const recycleCount = allRows.filter((r) => r.recommendation === "recycle").length;
  const sellCount = allRows.filter((r) => r.recommendation === "sell").length;
  const disposeCount = allRows.filter((r) => r.recommendation === "dispose").length;

  const recycleRate = totalScans ? Math.round((recycleCount / totalScans) * 100) : 0;
  const recyclePct = totalScans ? Math.round((recycleCount / totalScans) * 100) : 0;
  const sellPct = totalScans ? Math.round((sellCount / totalScans) * 100) : 0;
  const disposePct = totalScans ? Math.round((disposeCount / totalScans) * 100) : 0;

  const recycleBarWidth = totalScans ? `${(recycleCount / totalScans) * 100}%` : "0%";
  const sellBarWidth = totalScans ? `${(sellCount / totalScans) * 100}%` : "0%";
  const disposeBarWidth = totalScans ? `${(disposeCount / totalScans) * 100}%` : "0%";

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* ── Stats Strip ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {/* Total Scan */}
        <article style={{ display: "flex", flexDirection: "column", gap: "10px", borderRadius: "20px", border: "1px solid #d1fae5", background: "#ecfdf5", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#d1fae5" }}>
              <Package size={17} color="#059669" />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#78716c" }}>Total Scan</p>
          </div>
          <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#1c1917" }}>
            {totalScans.toLocaleString("id-ID")}
          </p>
          <p style={{ fontSize: "12px", color: "#a8a29e" }}>Semua waktu</p>
        </article>

        {/* Eco Points */}
        <article style={{ display: "flex", flexDirection: "column", gap: "10px", borderRadius: "20px", border: "1px solid #fef3c7", background: "#fffbeb", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#fef3c7" }}>
              <Zap size={17} color="#d97706" />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#78716c" }}>Eco Points</p>
          </div>
          <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#1c1917" }}>
            {totalPoints.toLocaleString("id-ID")}
          </p>
          <p style={{ fontSize: "12px", color: "#a8a29e" }}>Akumulasi</p>
        </article>

        {/* Offset Karbon */}
        <article style={{ display: "flex", flexDirection: "column", gap: "10px", borderRadius: "20px", border: "1px solid #ecfccb", background: "#f7fee7", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#ecfccb" }}>
              <Leaf size={17} color="#4d7c0f" />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#78716c" }}>Offset Karbon</p>
          </div>
          <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#1c1917" }}>
            {totalCarbon.toFixed(1)} kg
          </p>
          <p style={{ fontSize: "12px", color: "#a8a29e" }}>CO₂ tersimpan</p>
        </article>

        {/* Tingkat Daur Ulang */}
        <article style={{ display: "flex", flexDirection: "column", gap: "10px", borderRadius: "20px", border: "1px solid #dbeafe", background: "#eff6ff", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#dbeafe" }}>
              <TrendingUp size={17} color="#2563eb" />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#78716c" }}>Tingkat Daur Ulang</p>
          </div>
          <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#1c1917" }}>
            {recycleRate}%
          </p>
          <p style={{ fontSize: "12px", color: "#a8a29e" }}>
            {recycleCount} dari {totalScans} item
          </p>
        </article>
      </div>

      {/* ── Composition Bar ─────────────────────────────────────── */}
      {totalScans > 0 && (
        <section style={{ borderRadius: "24px", border: "1px solid #e5e7eb", background: "#fff", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1c1917" }}>Komposisi Rekomendasi</h2>
            <span style={{ borderRadius: "99px", background: "#f5f5f4", padding: "4px 12px", fontSize: "12px", fontWeight: 700, color: "#57534e" }}>
              {totalScans} item total
            </span>
          </div>

          {/* Stacked bar */}
          <div style={{ display: "flex", height: "10px", overflow: "hidden", borderRadius: "99px", background: "#f5f5f4", marginBottom: "16px" }}>
            {recycleCount > 0 && <div style={{ background: "#10b981", width: recycleBarWidth }} />}
            {sellCount > 0 && <div style={{ background: "#60a5fa", width: sellBarWidth }} />}
            {disposeCount > 0 && <div style={{ background: "#f87171", width: disposeBarWidth }} />}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", columnGap: "24px", rowGap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", flexShrink: 0, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#57534e" }}>Daur Ulang</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#1c1917" }}>{recycleCount}</span>
              <span style={{ fontSize: "12px", color: "#a8a29e" }}>({recyclePct}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", flexShrink: 0, borderRadius: "50%", background: "#60a5fa" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#57534e" }}>Jual</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#1c1917" }}>{sellCount}</span>
              <span style={{ fontSize: "12px", color: "#a8a29e" }}>({sellPct}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", flexShrink: 0, borderRadius: "50%", background: "#f87171" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#57534e" }}>Buang Terarah</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#1c1917" }}>{disposeCount}</span>
              <span style={{ fontSize: "12px", color: "#a8a29e" }}>({disposePct}%)</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Scan List ───────────────────────────────────────────── */}
      <section style={{ borderRadius: "24px", border: "1px solid #e5e7eb", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f5f5f4", padding: "18px 24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1c1917" }}>Semua Riwayat</h2>
          <span style={{ borderRadius: "99px", background: "#f5f5f4", padding: "4px 12px", fontSize: "12px", fontWeight: 700, color: "#57534e" }}>
            {count} entri
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "64px 24px", textAlign: "center" }}>
            <AlertCircle size={32} color="#f87171" />
            <div>
              <p style={{ fontWeight: 800, color: "#44403c" }}>Gagal memuat data</p>
              <p style={{ fontSize: "14px", color: "#a8a29e", marginTop: "4px" }}>Coba refresh halaman. Pastikan koneksi internet Anda stabil.</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!error && rows.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "80px 24px", textAlign: "center" }}>
            <div style={{ display: "flex", width: "64px", height: "64px", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid #ecfccb", background: "#f7fee7" }}>
              <Package size={28} color="#65a30d" />
            </div>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#1c1917" }}>Belum ada riwayat scan</p>
              <p style={{ maxWidth: "320px", fontSize: "14px", lineHeight: 1.6, color: "#a8a29e", margin: "8px auto 0" }}>
                Mulai scan material pertama Anda untuk melihat riwayat dan rekomendasi pengelolaan limbah di sini.
              </p>
            </div>
          </div>
        )}

        {/* List */}
        {!error && rows.length > 0 && (
          <div>
            <style dangerouslySetInnerHTML={{__html: `
              .row-hover { transition: background 0.2s ease; }
              .row-hover:hover { background: #fafaf9 !important; }
            `}} />
            <div style={{ display: "grid" }}>
              {rows.map((row, idx) => {
                const circPct = row.circular_potential ?? 0;
                const reward = extractNumber(row.potential_reward);
                const hasCarbon = (row.carbon_offset ?? 0) > 0;
                const materialInfo = [row.material, row.condition].filter(Boolean).join(" · ");
                const circBarWidth = `${Math.min(circPct, 100)}%`;
                const isLast = idx === rows.length - 1;

                return (
                  <Link 
                    href={`/scan/hasil?id=${row.id}`}
                    key={row.id ?? `${row.item_name}-${idx}`} 
                    className="row-hover"
                    style={{ display: "grid", gap: "10px", padding: "20px 24px", borderBottom: isLast ? "none" : "1px solid #f5f5f4", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ display: "flex", width: "38px", height: "38px", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "12px", border: "1px solid #ecfccb", background: "#f7fee7" }}>
                          <Package size={17} color="#65a30d" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1c1917", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.item_name}
                          </h3>
                          {materialInfo && <p style={{ marginTop: "2px", fontSize: "13px", color: "#a8a29e" }}>{materialInfo}</p>}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexShrink: 0, flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                        <RecBadge rec={row.recommendation} />
                        <time dateTime={row.created_at} title={formatDate(row.created_at)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#a8a29e" }}>
                          <Clock size={11} /> {formatTimeAgo(row.created_at)}
                        </time>
                      </div>
                    </div>

                    {/* Reason */}
                    {row.reason && (
                      <p style={{ borderRadius: "12px", border: "1px solid #f5f5f4", background: "#fafaf9", padding: "10px 12px", fontSize: "13px", lineHeight: 1.6, color: "#78716c" }}>
                        {row.reason}
                      </p>
                    )}

                    {/* Metrics row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                      {/* Circular potential */}
                      {circPct > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ whiteSpace: "nowrap", fontSize: "12px", fontWeight: 700, color: "#a8a29e" }}>Sirkular</span>
                          <div style={{ height: "6px", width: "80px", overflow: "hidden", borderRadius: "99px", background: "#f5f5f4" }}>
                            <div style={{ height: "100%", borderRadius: "99px", background: "linear-gradient(to right, #a3e635, #10b981)", width: circBarWidth }} />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#059669" }}>{circPct}%</span>
                        </div>
                      )}

                      {/* Reward badge */}
                      {reward > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "99px", border: "1px solid #fef3c7", background: "#fffbeb", padding: "2px 10px", fontSize: "12px", fontWeight: 800, color: "#b45309" }}>
                          <Zap size={10} /> +{reward.toLocaleString("id-ID")} pts
                        </span>
                      )}

                      {/* Carbon badge */}
                      {hasCarbon && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "99px", border: "1px solid #ecfccb", background: "#f7fee7", padding: "2px 10px", fontSize: "12px", fontWeight: 800, color: "#4d7c0f" }}>
                          <Leaf size={10} /> {row.carbon_offset} kg CO₂
                        </span>
                      )}
                    </div>
                  </Link>
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
                      href={`/dashboard/riwayat-scan?page=${currentPage - 1}`}
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
                      href={`/dashboard/riwayat-scan?page=${currentPage + 1}`}
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
