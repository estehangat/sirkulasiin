import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  Leaf,
  Recycle,
  TreePine,
  Zap,
  Package,
  ArrowLeftRight,
  GraduationCap,
  Award,
  TrendingUp
} from "lucide-react";

export const metadata: Metadata = {
  title: "Eco-Impact Dashboard — SirkulasiIn",
  description: "Pantau dampak lingkungan kolektif platform SirkulasiIn",
};

// ── helpers ──────────────────────────────────────────────────
function parseNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const n = parseFloat(val.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number, decimals = 1): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + " Jt";
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + " Rb";
  return n.toLocaleString("id-ID");
}

// ── data fetcher ────────────────────────────────────────────
async function getEcoData() {
  const supabase = await createServerSupabaseClient();

  const [
    scansRes,
    listingsSoldRes,
    listingsAllRes,
    barterAcceptedRes,
    barterAllRes,
    pointsRes,
    tutorialSubsRes,
    ordersRes,
  ] = await Promise.all([
    // All scans with eco-relevant fields
    supabase.from("scan_history").select("material, carbon_offset, carbon_saved, circular_potential, grade, created_at"),
    // Sold listings
    supabase.from("marketplace_listings").select("carbon_saved, category, price").eq("status", "sold"),
    // All listings for category breakdown
    supabase.from("marketplace_listings").select("category, status"),
    // Accepted barter offers
    supabase.from("barter_offers").select("id").eq("status", "accepted"),
    // All barter offers
    supabase.from("barter_offers").select("status"),
    // Total points distributed 
    supabase.from("point_transactions").select("points, source_type"),
    // Tutorial submissions
    supabase.from("tutorial_submissions").select("eco_points_earned"),
    // Orders for GMV
    supabase.from("orders").select("total_price").in("status", ["paid", "shipped", "completed"]),
  ]);

  const scans = scansRes.data || [];
  const soldListings = listingsSoldRes.data || [];
  const allListings = listingsAllRes.data || [];
  const barterAccepted = barterAcceptedRes.data || [];
  const barterAll = barterAllRes.data || [];
  const pointTxns = pointsRes.data || [];
  const tutorialSubs = tutorialSubsRes.data || [];
  const ordersData = ordersRes.data || [];

  // ── Carbon Metrics ──
  let totalCarbonOffset = 0;
  scans.forEach(s => { totalCarbonOffset += parseNumber(s.carbon_offset); });
  let listingCarbonSaved = 0;
  soldListings.forEach(l => { listingCarbonSaved += parseNumber(l.carbon_saved); });
  const totalCarbonSaved = totalCarbonOffset + listingCarbonSaved;

  // ── Material Distribution (from scans) ──
  const materialCounts: Record<string, number> = {};
  scans.forEach(s => {
    const mat = (s.material || "Lainnya").trim();
    materialCounts[mat] = (materialCounts[mat] || 0) + 1;
  });
  const materialEntries = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]);
  const totalMaterialScans = materialEntries.reduce((s, [, c]) => s + c, 0);

  // ── Circular Potential Average ──
  const circularPotentials = scans.filter(s => s.circular_potential > 0).map(s => s.circular_potential);
  const avgCircularPotential = circularPotentials.length
    ? Math.round(circularPotentials.reduce((s, v) => s + v, 0) / circularPotentials.length)
    : 0;

  // ── Category Distribution (marketplace) ──
  const categoryCounts: Record<string, number> = {};
  allListings.forEach(l => {
    const cat = l.category || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // ── Reuse metrics ──
  const itemsSold = soldListings.length;
  const barterCompleted = barterAccepted.length;
  const totalItemsReused = itemsSold + barterCompleted;
  const barterRate = barterAll.length > 0
    ? Math.round((barterCompleted / barterAll.length) * 100)
    : 0;

  // ── GMV from sold ──
  const totalGMV = ordersData.reduce((s, o) => s + (o.total_price || 0), 0);

  // ── Points ──
  const totalPointsDistributed = pointTxns
    .filter(t => t.points > 0)
    .reduce((s, t) => s + t.points, 0);
  const pointsBySource: Record<string, number> = {};
  pointTxns.filter(t => t.points > 0).forEach(t => {
    pointsBySource[t.source_type] = (pointsBySource[t.source_type] || 0) + t.points;
  });

  // ── Tutorials ──
  const totalTutorialCompletions = tutorialSubs.length;
  const totalTutorialPoints = tutorialSubs.reduce((s, t) => s + (t.eco_points_earned || 0), 0);

  // ── Monthly scan trend (last 6 months) ──
  const now = new Date();
  const monthlyScans: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = scans.filter(s => {
      const sd = new Date(s.created_at);
      return sd >= d && sd < nextD;
    }).length;
    monthlyScans.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      count,
    });
  }
  const maxMonthlyScans = Math.max(...monthlyScans.map(m => m.count), 1);

  return {
    totalScans: scans.length,
    totalCarbonSaved,
    avgCircularPotential,
    materialEntries,
    totalMaterialScans,
    categoryEntries,
    totalItemsReused,
    itemsSold,
    barterCompleted,
    barterRate,
    totalGMV,
    totalPointsDistributed,
    pointsBySource,
    totalTutorialCompletions,
    totalTutorialPoints,
    monthlyScans,
    maxMonthlyScans,
  };
}

// ── Material color map ──
const MATERIAL_COLORS: Record<string, string> = {
  Plastik: "#3B82F6",
  Kaca: "#10B981",
  Kertas: "#F59E0B",
  Logam: "#6366F1",
  Metal: "#6366F1",
  Tekstil: "#EC4899",
  Elektronik: "#8B5CF6",
  Kayu: "#D97706",
  Organik: "#22C55E",
  Lainnya: "#94A3B8",
};

const CATEGORY_LABELS: Record<string, string> = {
  plastic: "Plastik",
  glass: "Kaca",
  paper: "Kertas",
  metal: "Logam",
  textile: "Tekstil",
  electronic: "Elektronik",
  other: "Lainnya",
};

function getMaterialColor(mat: string): string {
  for (const [key, color] of Object.entries(MATERIAL_COLORS)) {
    if (mat.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#94A3B8";
}

// ── Small reusable components ──
function StatCard({ icon, label, value, sub, bg, iconBg, iconColor, valueColor }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  bg: string; iconBg: string; iconColor: string; valueColor: string;
}) {
  return (
    <article style={{
      borderRadius: "20px", padding: "20px", background: bg,
      border: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
          {icon}
        </div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: iconColor, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</p>
      </div>
      <p style={{ fontSize: "28px", fontWeight: 900, color: valueColor, letterSpacing: "-0.5px" }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "#64748B", marginTop: "-6px" }}>{sub}</p>}
    </article>
  );
}

// ── Page ──
export default async function EcoImpactPage() {
  const d = await getEcoData();

  const sourceLabels: Record<string, string> = {
    scan: "Scan AI", tutorial: "Tutorial", redeem: "Redeem", adjustment: "Adjustment",
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* ── Header ── */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
          Dashboard Dampak Lingkungan
        </h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>
          Mengukur kontribusi kolektif komunitas SirkulasiIn terhadap ekonomi sirkular dan lingkungan.
        </p>
      </div>

      {/* ── Hero KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard
          icon={<Leaf size={18} />} label="Karbon Terselamatkan" value={`${fmt(d.totalCarbonSaved)} kg`}
          sub="Dari scan + listing terjual"
          bg="linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)" iconBg="#A7F3D0" iconColor="#065F46" valueColor="#064E3B"
        />
        <StatCard
          icon={<Recycle size={18} />} label="Barang Di-Reuse" value={fmt(d.totalItemsReused, 0)}
          sub={`${d.itemsSold} terjual · ${d.barterCompleted} barter`}
          bg="linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" iconBg="#BFDBFE" iconColor="#1E40AF" valueColor="#1E3A8A"
        />
        <StatCard
          icon={<TreePine size={18} />} label="Potensi Sirkular" value={`${d.avgCircularPotential}%`}
          sub="Rata-rata dari semua scan"
          bg="linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)" iconBg="#BBF7D0" iconColor="#166534" valueColor="#14532D"
        />
        <StatCard
          icon={<Award size={18} />} label="Eco Points" value={fmt(d.totalPointsDistributed, 0)}
          sub={`${d.totalTutorialCompletions} tutorial selesai`}
          bg="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" iconBg="#FDE68A" iconColor="#92400E" valueColor="#78350F"
        />
      </div>

      {/* ── Two Column Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", alignItems: "start" }}>

        {/* ── Material Distribution ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Recycle size={16} color="#10B981" /> Distribusi Material Terscan
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B" }}>{d.totalScans} total scan dianalisis</p>
          </div>
          <div style={{ padding: "24px", display: "grid", gap: "14px" }}>
            {d.materialEntries.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94A3B8" }}>Belum ada data material.</p>
            ) : d.materialEntries.slice(0, 8).map(([mat, count]) => {
              const pct = d.totalMaterialScans > 0 ? Math.round((count / d.totalMaterialScans) * 100) : 0;
              const color = getMaterialColor(mat);
              return (
                <div key={mat} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                    <span style={{ color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: color, flexShrink: 0 }} />
                      {mat}
                    </span>
                    <span style={{ color: "#64748B" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.8s ease-out" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Marketplace Category Breakdown ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Package size={16} color="#8B5CF6" /> Kategori Marketplace
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B" }}>Distribusi listing berdasarkan jenis material</p>
          </div>
          <div style={{ padding: "24px", display: "grid", gap: "10px" }}>
            {d.categoryEntries.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94A3B8" }}>Belum ada listing.</p>
            ) : d.categoryEntries.map(([cat, count]) => {
              const label = CATEGORY_LABELS[cat] || cat;
              const total = d.categoryEntries.reduce((s, [, c]) => s + c, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "14px", background: "#F8FAFC", border: "1px solid #F1F5F9",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "80px", height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#8B5CF6", borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748B", minWidth: "60px", textAlign: "right" }}>{count} ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Monthly Scan Trend ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <TrendingUp size={16} color="#059669" /> Tren Scan Bulanan
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B" }}>Aktivitas identifikasi material 6 bulan terakhir</p>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px" }}>
              {d.monthlyScans.map((m, i) => {
                const barH = d.maxMonthlyScans > 0 ? Math.max((m.count / d.maxMonthlyScans) * 120, 4) : 4;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>{m.count}</span>
                    <div style={{
                      width: "100%", maxWidth: "48px", height: `${barH}px`, borderRadius: "8px 8px 4px 4px",
                      background: i === d.monthlyScans.length - 1
                        ? "linear-gradient(180deg, #10B981 0%, #059669 100%)"
                        : "linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)",
                      transition: "height 0.6s ease-out",
                    }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Eco Points Breakdown ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Zap size={16} color="#F59E0B" /> Distribusi Eco Points
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B" }}>Total {fmt(d.totalPointsDistributed, 0)} poin terdistribusi</p>
          </div>
          <div style={{ padding: "24px", display: "grid", gap: "12px" }}>
            {Object.keys(d.pointsBySource).length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94A3B8" }}>Belum ada poin terdistribusi.</p>
            ) : Object.entries(d.pointsBySource).sort((a, b) => b[1] - a[1]).map(([src, pts]) => {
              const pct = d.totalPointsDistributed > 0 ? Math.round((pts / d.totalPointsDistributed) * 100) : 0;
              return (
                <div key={src} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: "14px", background: "#FFFBEB", border: "1px solid #FEF3C7",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                      {sourceLabels[src] || src}
                    </span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#92400E" }}>
                    {fmt(pts, 0)} pts <span style={{ fontWeight: 500, color: "#B45309", fontSize: "12px" }}>({pct}%)</span>
                  </span>
                </div>
              );
            })}

            {/* Barter & Tutorial mini-stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "#F0F9FF", border: "1px solid #BAE6FD", textAlign: "center" }}>
                <ArrowLeftRight size={18} style={{ color: "#0284C7", marginBottom: "6px" }} />
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E" }}>{d.barterCompleted}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#0369A1" }}>Barter Berhasil</p>
                {d.barterRate > 0 && <p style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{d.barterRate}% acceptance rate</p>}
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "#FDF4FF", border: "1px solid #F5D0FE", textAlign: "center" }}>
                <GraduationCap size={18} style={{ color: "#A21CAF", marginBottom: "6px" }} />
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#701A75" }}>{d.totalTutorialCompletions}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#A21CAF" }}>Tutorial Selesai</p>
                {d.totalTutorialPoints > 0 && <p style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{fmt(d.totalTutorialPoints, 0)} pts earned</p>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Bottom: Circular Economy Summary ── */}
      <section style={{
        borderRadius: "24px", overflow: "hidden",
        background: "linear-gradient(135deg, #064E3B 0%, #065F46 40%, #047857 100%)",
        padding: "32px", color: "#fff",
        boxShadow: "0 8px 32px rgba(6,78,59,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Leaf size={20} />
          <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Ringkasan Dampak Ekonomi Sirkular</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
          {[
            { label: "Total Scan AI", value: fmt(d.totalScans, 0), icon: <Recycle size={16} /> },
            { label: "CO₂ Terselamatkan", value: `${fmt(d.totalCarbonSaved)} kg`, icon: <Leaf size={16} /> },
            { label: "Barang Di-Reuse", value: fmt(d.totalItemsReused, 0), icon: <Package size={16} /> },
            { label: "Nilai Transaksi", value: `Rp ${fmt(d.totalGMV, 0)}`, icon: <TrendingUp size={16} /> },
            { label: "Eco Points", value: fmt(d.totalPointsDistributed, 0), icon: <Award size={16} /> },
            { label: "Potensi Sirkular", value: `${d.avgCircularPotential}%`, icon: <TreePine size={16} /> },
          ].map(item => (
            <div key={item.label} style={{
              padding: "16px", borderRadius: "16px",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(4px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "#A7F3D0" }}>
                {item.icon}
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>{item.label}</span>
              </div>
              <p style={{ fontSize: "22px", fontWeight: 900 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
