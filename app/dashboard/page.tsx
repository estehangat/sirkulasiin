import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  Activity,
  Award,
  Box,
  Leaf,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  PieChart,
  Package,
  Clock,
  ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard — SirkulasiIn",
  description: "Dashboard SirkulasiIn - Kelola aktivitas sirkular Anda.",
};

type ScanHistoryRow = {
  created_at: string;
  item_name: string;
  material: string | null;
  recommendation: string;
  carbon_offset: number | null;
  potential_reward: string | null;
  circular_potential: number | null;
  reason: string | null;
};

type ActivityItem = {
  title: string;
  time: string;
  meta: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toShortDay(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "short" });
}

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${Math.max(diffMins, 1)} m lalu`;
  if (diffHours < 24) return `${diffHours} j lalu`;
  if (diffDays < 7) return `${diffDays} h lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}


function recommendationLabel(rec: string) {
  if (rec === "recycle") return "Daur Ulang";
  if (rec === "sell") return "Jual";
  if (rec === "dispose") return "Buang Terarah";
  return "Lainnya";
}

// ─── Data Aggregators ────────────────────────────────────────────────────────
function buildWeeklyTrend(rows: ScanHistoryRow[]) {
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    return {
      key: date.toISOString().slice(0, 10),
      day: toShortDay(date),
      count: 0,
    };
  });

  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const target = days.find((d) => d.key === key);
    if (target) target.count += 1;
  });

  return days;
}

function buildCategorySplit(rows: ScanHistoryRow[]) {
  const bucket = new Map<string, number>();
  rows.forEach((row) => {
    const label = row.material?.trim() || "Tak Diketahui";
    bucket.set(label, (bucket.get(label) || 0) + 1);
  });

  const total = rows.length || 1;
  return Array.from(bucket.entries())
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / total) * 100),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildRecentActivity(rows: ScanHistoryRow[]): ActivityItem[] {
  return rows.slice(0, 5).map((row) => ({
    title: `Scan ${row.item_name}`,
    time: formatTimeAgo(row.created_at),
    meta: `${recommendationLabel(row.recommendation)} · ${row.reason || "Analisis tersimpan"}`,
  }));
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ─── Data Fetching ───────────────────────────────────────────────────────────
async function getDashboardData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const monthStart = getStartOfMonth().toISOString();

  if (!user) {
    return null;
  }

  const [scanResult, pointsResult] = await Promise.all([
    supabase
      .from("scan_history")
      .select(
        "created_at,item_name,material,recommendation,carbon_offset,potential_reward,circular_potential,reason"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user.id)
      .single(),
  ]);

  const ecoPoints = pointsResult.data?.total_points ?? 0;

  if (scanResult.error || !scanResult.data) {
    return {
      status: "fallback" as const,
      totalScanMonth: 0,
      ecoPoints,
      recycleRate: 0,
      totalCarbonOffset: 0,
      weeklyTrend: buildWeeklyTrend([]),
      categorySplit: [],
      recentActivity: [],
      monthlyTarget: 120,
      materialTracked: 0,
      averageCircularPotential: 0,
      recommendationSplit: [],
      topMaterial: "-",
      todayScanCount: 0,
    };
  }

  const rows = scanResult.data as ScanHistoryRow[];
  const rowsThisMonth = rows.filter((r) => new Date(r.created_at) >= new Date(monthStart));
  
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayScanCount = rows.filter((r) => new Date(r.created_at).toISOString().slice(0, 10) === todayKey).length;
  
  const recycleCount = rowsThisMonth.filter((r) => r.recommendation === "recycle").length;
  const sellCount = rowsThisMonth.filter((r) => r.recommendation === "sell").length;
  const disposeCount = rowsThisMonth.filter((r) => r.recommendation === "dispose").length;
  
  const totalCarbonOffset = rowsThisMonth.reduce((acc, row) => acc + (row.carbon_offset || 0), 0);
  const circularPotentialSum = rowsThisMonth.reduce((acc, row) => acc + (row.circular_potential || 0), 0);
  
  const avgCircularPotential = rowsThisMonth.length ? Math.round(circularPotentialSum / rowsThisMonth.length) : 0;

  const recommendationSplitRaw = [
    { label: "Daur Ulang", value: recycleCount, color: "#10b981", bg: "#d1fae5" },
    { label: "Jual", value: sellCount, color: "#3b82f6", bg: "#dbeafe" },
    { label: "Buang Terarah", value: disposeCount, color: "#ef4444", bg: "#fee2e2" },
  ];

  const recommendationSplit = recommendationSplitRaw.map((item) => ({
    ...item,
    pct: rowsThisMonth.length ? Math.round((item.value / rowsThisMonth.length) * 100) : 0,
  }));

  const categorySplit = buildCategorySplit(rowsThisMonth);
  const topMaterial = categorySplit[0]?.name || "-";

  return {
    status: "live" as const,
    totalScanMonth: rowsThisMonth.length,
    ecoPoints,
    recycleRate: rowsThisMonth.length ? Math.round((recycleCount / rowsThisMonth.length) * 100) : 0,
    totalCarbonOffset,
    weeklyTrend: buildWeeklyTrend(rows),
    categorySplit,
    recentActivity: buildRecentActivity(rows),
    monthlyTarget: 120,
    materialTracked: new Set(rowsThisMonth.map((r) => r.material).filter(Boolean)).size,
    averageCircularPotential: avgCircularPotential,
    recommendationSplit,
    topMaterial,
    todayScanCount,
  };
}

// ─── UI Components ────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <article style={{
      borderRadius: "24px", border: "1px solid #EFEFEB", background: "#ffffff",
      padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", ...style
    }}>
      {children}
    </article>
  );
}

// ─── Render Page ─────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const data = await getDashboardData();
  
  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Silakan login terlebih dahulu untuk mengakses dashboard Anda.
      </div>
    );
  }

  const maxTrend = Math.max(...data.weeklyTrend.map((item) => item.count), 1);
  const progressPct = Math.min(Math.round((data.totalScanMonth / data.monthlyTarget) * 100), 100);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      
      {/* ── Page Header Action ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "4px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px" }}>
            Operasional Harian
          </h2>
          <p style={{ color: "#737369", fontSize: "13px" }}>
            Ringkasan progres daur ulang dan performa Sirkular Anda bulan ini.
          </p>
        </div>
      </div>

      {/* ── Core KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <Card style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#e2e8f0", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <Package size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Scan Hari Ini</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>{data.todayScanCount}</p>
        </Card>

        <Card style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#bbf7d0", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Target size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Total Bulan Ini</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#14532d" }}>{data.totalScanMonth} <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>/ {data.monthlyTarget}</span></p>
        </Card>

        <Card style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#fde68a", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
              <Zap size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#b45309" }}>Eco Points</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#78350f" }}>{data.ecoPoints.toLocaleString("id-ID")}</p>
        </Card>

        <Card style={{ background: "#f5f3ff", borderColor: "#ddd6fe" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#ddd6fe", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
              <Box size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#5b21b6" }}>Material Dominan</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {data.topMaterial}
          </p>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* ── Target & Trend Progress ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="#1A1A1A" />
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1A1A1A" }}>Progress Sirkular</h2>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#27AE60" }}>{progressPct}%</span>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#737369" }}>Penyelesaian Target Bulanan</p>
            <div style={{ height: "12px", borderRadius: "99px", background: "#f5f5f4", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(to right, #4ade80, #16a34a)", borderRadius: "99px" }} />
            </div>
          </div>

          {/* Mini Weekly Chart */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "100px", marginTop: "10px" }}>
            {data.weeklyTrend.map((item) => (
              <div key={item.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1 }}>
                <div style={{ height: "70px", width: "100%", maxWidth: "30px", background: "#f5f5f4", borderRadius: "8px", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                  <div style={{ width: "100%", background: "#10b981", borderRadius: "8px", height: `${Math.max((item.count / maxTrend) * 100, 5)}%`, transition: "height 0.4s ease" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#A3A39B" }}>{item.day}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px", borderTop: "1px solid #EFEFEB", paddingTop: "16px" }}>
             <div>
               <p style={{ fontSize: "12px", color: "#737369", marginBottom: "4px" }}>Daur Ulang</p>
               <p style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A" }}>{data.recycleRate}%</p>
             </div>
             <div>
               <p style={{ fontSize: "12px", color: "#737369", marginBottom: "4px" }}>Karbon Dihemat</p>
               <p style={{ fontSize: "18px", fontWeight: 800, color: "#1E8449" }}>{data.totalCarbonOffset} kg</p>
             </div>
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* ── Recommendation Composition ── */}
          <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <PieChart size={18} color="#1A1A1A" />
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1A1A1A" }}>Keputusan AI</h2>
            </div>
            <div style={{ display: "grid", gap: "16px" }}>
              {data.recommendationSplit.map((rec) => (
                <div key={rec.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: rec.bg, color: rec.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                     {rec.label === "Daur Ulang" ? <TrendingUp size={18} /> : rec.label === "Jual" ? <Award size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#3D3D38" }}>{rec.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#1A1A1A" }}>{rec.value}</span>
                    </div>
                    <div style={{ width: "100%", background: "#f5f5f4", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
                       <div style={{ width: `${rec.pct}%`, background: rec.color, height: "100%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Leaderboard Material ── */}
          <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
             <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A", marginBottom: "12px" }}>Top Material Anda</h2>
             <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
               {data.categorySplit.length === 0 && <p style={{ fontSize: "13px", color: "#A3A39B" }}>Belum ada material terdeteksi.</p>}
               {data.categorySplit.map((item, id) => (
                 <span key={item.name} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f7f7f5", border: "1px solid #EFEFEB", padding: "6px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, color: "#52524C" }}>
                   <span style={{ color: "#A3A39B" }}>#{id + 1}</span> {item.name}
                 </span>
               ))}
             </div>
          </section>

        </div>

        {/* ── Recent Activity Feed ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #EFEFEB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Aktivitas Terbaru</h2>
            <Link href="/dashboard/riwayat-scan" style={{ fontSize: "12px", fontWeight: 700, color: "#27AE60", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid" }}>
             {data.recentActivity.length === 0 ? (
               <div style={{ padding: "40px", textAlign: "center", color: "#A3A39B", fontSize: "14px" }}>
                 Anda belum melakukan scan apapun bulan ini.
               </div>
             ) : (
               data.recentActivity.map((activity, idx) => (
                 <div key={idx} style={{ padding: "16px 24px", borderBottom: idx !== data.recentActivity.length - 1 ? "1px solid #f5f5f4" : "none", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                   <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f7f7f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A39B", flexShrink: 0 }}>
                     <Clock size={16} />
                   </div>
                   <div>
                     <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#1A1A1A", marginBottom: "2px" }}>{activity.title}</h3>
                     <p style={{ fontSize: "13px", color: "#737369", marginBottom: "4px" }}>{activity.meta}</p>
                     <span style={{ fontSize: "11px", fontWeight: 700, color: "#A3A39B" }}>{activity.time}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </section>

      </div>
    </div>
  );
}
