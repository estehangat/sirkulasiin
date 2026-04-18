import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import TransactionButtons from "./ClientButtons";
import { ShoppingBag, Box, ArrowDownRight, ArrowUpRight, Clock, CheckCircle2, AlertCircle, AlertTriangle, Package, ShieldCheck, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Transaksi — SirkulasiIn",
  description: "Riwayat transaksi marketplace dan rewards Anda.",
};

const statusMap: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid_escrow: "Dana Ditahan di Escrow",
  payment_failed: "Pembayaran Gagal",
  payment_expired: "Pembayaran Kedaluwarsa",
  shipped: "Sedang Dikirim",
  completed: "Selesai",
  paid_out: "Dana Dicairkan",
  cancelled: "Dibatalkan",
};

function formatOrderChip(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function getStatusDesign(status: string) {
  if (status === "paid_escrow") {
    return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", icon: <ShieldCheck size={14} /> };
  }
  if (status === "pending_payment") {
    return { bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3", icon: <Clock size={14} /> };
  }
  if (status === "shipped") {
    return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: <Package size={14} /> };
  }
  if (status === "completed") {
    return { bg: "#ecfdf3", border: "#bbf7d0", text: "#166534", icon: <CheckCircle2 size={14} /> };
  }
  if (status === "paid_out") {
    return { bg: "#f0fdf4", border: "#86efac", text: "#14532d", icon: <Wallet size={14} /> };
  }
  if (status === "payment_failed") {
    return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <AlertCircle size={14} /> };
  }
  if (status === "payment_expired" || status === "cancelled") {
    return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <AlertTriangle size={14} /> };
  }
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: null };
}

function getPayoutDesign(payoutStatus?: string | null) {
  if (!payoutStatus) return null;

  if (payoutStatus === "ready_for_payout") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" };
  if (payoutStatus === "requested") return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
  if (payoutStatus === "approved") return { bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" };
  if (payoutStatus === "processing") return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" };
  if (payoutStatus === "paid_out") return { bg: "#f0fdf4", border: "#86efac", text: "#14532d" };
  if (payoutStatus === "rejected" || payoutStatus === "failed") return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" };
  
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
}

export default async function TransactionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Pembelian
  const { data: purchasesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(id, title)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch Penjualan
  const { data: salesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(id, title)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const purchases = purchasesQuery || [];
  const sales = salesQuery || [];

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(" pukul ", ", ");
  };

  const renderTransactionCard = (item: any, isBuyer: boolean) => {
    const sDesign = getStatusDesign(item.status);
    const pDesign = getPayoutDesign(item.payout_status);

    return (
      <article
        key={item.id}
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          borderBottom: "1px solid #EFEFEB",
          background: "#fff",
          transition: "background 0.2s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: isBuyer ? "#f0fdf4" : "#eff6ff", border: `1px solid ${isBuyer ? "#bbf7d0" : "#bfdbfe"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isBuyer ? "#16a34a" : "#2563eb", flexShrink: 0 }}>
              {isBuyer ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>
                  {item.marketplace_listings?.title || "Produk Preloved"}
                </h3>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#737369", background: "#f5f5f4", padding: "2px 8px", borderRadius: "6px" }}>
                  {formatOrderChip(item.id)}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#A3A39B" }}>
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "16px", fontWeight: 800, color: isBuyer ? "#1E8449" : "#1A1A1A" }}>
              {isBuyer ? "-" : "+"}{formatRupiah(item.total_price)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: sDesign.bg, color: sDesign.text, border: `1px solid ${sDesign.border}`, padding: "6px 12px", borderRadius: "99px" }}>
              {sDesign.icon} {statusMap[item.status] || item.status}
            </span>
            
            {item.status === "paid_escrow" && item.escrow_status && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: "#ecfdf3", color: "#166534", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: "99px" }}>
                <ShieldCheck size={14} /> Escrow: {item.escrow_status}
              </span>
            )}
            
            {pDesign && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: pDesign.bg, color: pDesign.text, border: `1px solid ${pDesign.border}`, padding: "6px 12px", borderRadius: "99px" }}>
                <Wallet size={14} /> Payout: {item.payout_status}
              </span>
            )}
          </div>

          <div>
            <TransactionButtons
              orderId={item.id}
              status={item.status}
              isBuyer={isBuyer}
              payoutStatus={item.payout_status}
            />
          </div>
        </div>
      </article>
    );
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* ── Page Header Action ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "4px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px" }}>
            Riwayat Transaksi
          </h2>
          <p style={{ color: "#737369", fontSize: "13px" }}>
            Pantau seluruh aktivitas jual-beli dan pencairan dana Anda.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", alignItems: "start" }}>
        
        {/* ── Pembelian Saya ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #EFEFEB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShoppingBag size={18} color="#1E8449" />
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Pembelian</h2>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#737369", background: "#F4F4F0", padding: "4px 12px", borderRadius: "99px" }}>
              {purchases.length} transaksi
            </span>
          </div>
          
          <div>
            {purchases.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Belum Ada Pembelian</p>
                  <p style={{ fontSize: "13px", color: "#A3A39B", marginTop: "4px" }}>Temukan barang sirkular menarik di marketplace.</p>
                </div>
              </div>
            ) : (
              purchases.map(p => renderTransactionCard(p, true))
            )}
          </div>
        </section>

        {/* ── Penjualan Saya ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #EFEFEB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box size={18} color="#2563eb" />
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Penjualan</h2>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#737369", background: "#F4F4F0", padding: "4px 12px", borderRadius: "99px" }}>
              {sales.length} pesanan
            </span>
          </div>
          
          <div>
            {sales.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  <Box size={28} />
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>Belum Ada Penjualan</p>
                  <p style={{ fontSize: "13px", color: "#A3A39B", marginTop: "4px" }}>Listing Anda sedang menunggu pembeli yang tepat.</p>
                </div>
              </div>
            ) : (
              sales.map(s => renderTransactionCard(s, false))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
