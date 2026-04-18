import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  Leaf, ScanLine, BookOpen, Gift, ArrowRight, History,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Eco Points — SirkulasiIn",
  description: "Lihat total poin dan riwayat transaksi Eco Points Anda.",
};

type Transaction = {
  id: string;
  points: number;
  source_type: string;
  description: string;
  created_at: string;
};

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${Math.max(diffMins, 1)} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function SourceBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; bg: string; color: string; Icon: React.ComponentType<{ size?: number }> }> = {
    scan:       { label: "Scan",     bg: "#d1fae5", color: "#065f46", Icon: ScanLine },
    tutorial:   { label: "Tutorial", bg: "#ede9fe", color: "#4c1d95", Icon: BookOpen },
    redeem:     { label: "Tukar",    bg: "#fee2e2", color: "#7f1d1d", Icon: Gift },
    adjustment: { label: "Koreksi", bg: "#fef3c7", color: "#78350f", Icon: Leaf },
  };
  const c = config[type] || config.adjustment;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: c.bg, color: c.color,
      padding: "4px 10px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 700,
    }}>
      <c.Icon size={12} />
      {c.label}
    </span>
  );
}

export default async function RewardsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let totalPoints = 0;
  let transactions: Transaction[] = [];

  if (user) {
    const [pointsRes, txRes] = await Promise.all([
      supabase.from("user_points").select("total_points").eq("user_id", user.id).single(),
      supabase.from("point_transactions")
        .select("id, points, source_type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    totalPoints = pointsRes.data?.total_points ?? 0;
    transactions = (txRes.data ?? []) as Transaction[];
  }

  const earnedTotal = transactions.filter(t => t.points > 0).reduce((a, t) => a + t.points, 0);
  const spentTotal  = transactions.filter(t => t.points < 0).reduce((a, t) => a + Math.abs(t.points), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px" }}>
          Eco Points
        </h1>
        <p style={{ color: "#737369", fontSize: "13px" }}>
          Akumulasi poin dari setiap aktivitas sirkular Anda.
        </p>
      </div>

      {/* ── Saldo Utama ── */}
      <div style={{
        borderRadius: "24px",
        background: "linear-gradient(135deg, #052e16 0%, #166534 60%, #16a34a 100%)",
        padding: "32px 28px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative ring */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }} />
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "14px", opacity: 0.8,
        }}>
          <Leaf size={18} />
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            Total Saldo
          </span>
        </div>
        <p style={{ fontSize: "48px", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1 }}>
          {totalPoints.toLocaleString("id-ID")}
        </p>
        <p style={{ fontSize: "14px", opacity: 0.7, marginTop: "6px" }}>Eco Points</p>

        {/* Mini stat strip */}
        <div style={{
          display: "flex", gap: "24px", marginTop: "24px",
          paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.15)",
        }}>
          <div>
            <p style={{ fontSize: "11px", opacity: 0.65, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Diperoleh</p>
            <p style={{ fontSize: "18px", fontWeight: 800 }}>+{earnedTotal.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p style={{ fontSize: "11px", opacity: 0.65, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Digunakan</p>
            <p style={{ fontSize: "18px", fontWeight: 800 }}>−{spentTotal.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Link href="/scan" style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px", borderRadius: "16px",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          textDecoration: "none", color: "#14532d",
          transition: "all 0.2s",
        }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#bbf7d0", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <ScanLine size={18} color="#15803d" />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800 }}>Scan Item</p>
            <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>Dapatkan poin baru</p>
          </div>
          <ArrowRight size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
        </Link>
        <Link href="/tutorial" style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px", borderRadius: "16px",
          background: "#f5f3ff", border: "1px solid #ddd6fe",
          textDecoration: "none", color: "#4c1d95",
          transition: "all 0.2s",
        }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ddd6fe", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <BookOpen size={18} color="#6d28d9" />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800 }}>Tutorial</p>
            <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>Selesaikan & klaim</p>
          </div>
          <ArrowRight size={16} style={{ marginLeft: "auto", opacity: 0.5 }} />
        </Link>
      </div>

      {/* ── Transaction History ── */}
      <section style={{
        borderRadius: "20px", border: "1px solid #EFEFEB",
        background: "#fff", overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid #EFEFEB",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <History size={16} color="#1A1A1A" />
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>
            Riwayat Transaksi
          </h2>
          <span style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: 700,
            color: "#737369", background: "#f5f5f4",
            padding: "3px 8px", borderRadius: "99px",
          }}>
            {transactions.length} transaksi
          </span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#A3A39B" }}>
            <Leaf size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "14px", fontWeight: 600 }}>Belum ada transaksi poin.</p>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>
              Mulai scan item atau selesaikan tutorial untuk mendapatkan poin.
            </p>
          </div>
        ) : (
          <div>
            {transactions.map((tx, idx) => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 22px",
                borderBottom: idx < transactions.length - 1 ? "1px solid #f5f5f4" : "none",
              }}>
                {/* Source icon */}
                <div style={{
                  width: "38px", height: "38px", borderRadius: "12px", flexShrink: 0,
                  background: tx.points > 0 ? "#f0fdf4" : "#fef2f2",
                  display: "grid", placeItems: "center",
                  color: tx.points > 0 ? "#16a34a" : "#dc2626",
                }}>
                  {tx.points > 0
                    ? (tx.source_type === "tutorial" ? <BookOpen size={16} /> : <ScanLine size={16} />)
                    : <Gift size={16} />}
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "13px", fontWeight: 700, color: "#1A1A1A",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {tx.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                    <SourceBadge type={tx.source_type} />
                    <span style={{ fontSize: "11px", color: "#A3A39B" }}>
                      {formatTimeAgo(tx.created_at)}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <p style={{
                  fontSize: "16px", fontWeight: 800, flexShrink: 0,
                  color: tx.points > 0 ? "#16a34a" : "#dc2626",
                }}>
                  {tx.points > 0 ? `+${tx.points}` : `${tx.points}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
