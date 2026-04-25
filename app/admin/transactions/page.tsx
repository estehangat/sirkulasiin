"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle, Search, Eye, XCircle, Package, DollarSign, Clock, Truck, Ban } from "lucide-react";
import { createPortal } from "react-dom";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_price: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_notes: string | null;
  payment_method: string | null;
  payment_status: string | null;
  escrow_status: string | null;
  payout_status: string | null;
  payout_amount: number | null;
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  buyer: { full_name: string | null } | null;
  seller: { full_name: string | null } | null;
  listing: { title: string | null; image_url: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending_payment: { label: "Menunggu Bayar", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  paid: { label: "Dibayar", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  shipped: { label: "Dikirim", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  completed: { label: "Selesai", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  cancelled: { label: "Dibatalkan", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TransactionMonitorPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Order | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);

  const supabase = createClient();

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    // 1. Fetch orders (tanpa join FK karena FK mengarah ke auth.users, bukan profiles)
    const { data: rawOrders } = await supabase
      .from("orders")
      .select("id, created_at, status, total_price, shipping_name, shipping_phone, shipping_address, shipping_notes, payment_method, payment_status, escrow_status, payout_status, payout_amount, paid_at, shipped_at, completed_at, buyer_id, seller_id, listing_id")
      .order("created_at", { ascending: false });

    if (!rawOrders || rawOrders.length === 0) { setOrders([]); setLoading(false); return; }

    // 2. Batch fetch profiles & listings
    const userIds = [...new Set(rawOrders.flatMap(o => [o.buyer_id, o.seller_id]))];
    const listingIds = [...new Set(rawOrders.map(o => o.listing_id).filter(Boolean))];

    const [profilesRes, listingsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", userIds),
      listingIds.length > 0
        ? supabase.from("marketplace_listings").select("id, title, image_url").in("id", listingIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.id] = p.full_name || ""; });

    const listingMap: Record<string, { title: string; image_url: string | null }> = {};
    (listingsRes.data || []).forEach(l => { listingMap[l.id] = { title: l.title, image_url: l.image_url }; });

    // 3. Map ke Order type
    const mapped: Order[] = rawOrders.map(o => ({
      ...o,
      buyer: { full_name: profileMap[o.buyer_id] || null },
      seller: { full_name: profileMap[o.seller_id] || null },
      listing: listingMap[o.listing_id] || null,
    }));

    setOrders(mapped);
    setLoading(false);
  }

  async function executeCancel(id: string) {
    setConfirmCancel(null);
    setProcessingId(id);
    setFeedback(null);
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
      setFeedback({ type: "success", msg: "Order berhasil dibatalkan oleh admin." });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Gagal: " + err.message });
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (o.buyer?.full_name?.toLowerCase().includes(q)) ||
        (o.seller?.full_name?.toLowerCase().includes(q)) ||
        (o.listing?.title?.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Summary stats
  const totalGMV = orders.filter(o => ["paid", "shipped", "completed"].includes(o.status)).reduce((s, o) => s + o.total_price, 0);
  const pendingCount = orders.filter(o => o.status === "pending_payment").length;
  const completedCount = orders.filter(o => o.status === "completed").length;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Monitoring Transaksi</h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>Pantau seluruh alur transaksi, pembayaran, escrow, dan pengiriman secara real-time.</p>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {[
          { icon: <Package size={16} />, label: "Total Order", value: orders.length, bg: "#F8FAFC", color: "#475569", iconBg: "#E2E8F0" },
          { icon: <DollarSign size={16} />, label: "GMV Transaksi", value: `Rp ${fmt(totalGMV)}`, bg: "#F0FDF4", color: "#166534", iconBg: "#BBF7D0" },
          { icon: <Clock size={16} />, label: "Menunggu Bayar", value: pendingCount, bg: "#FFFBEB", color: "#92400E", iconBg: "#FDE68A" },
          { icon: <CheckCircle2 size={16} />, label: "Selesai", value: completedCount, bg: "#EFF6FF", color: "#1E40AF", iconBg: "#BFDBFE" },
        ].map(k => (
          <div key={k.label} style={{ padding: "16px", borderRadius: "18px", background: k.bg, border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: k.color, textTransform: "uppercase" }}>{k.label}</p>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Cari pembeli, penjual, atau listing..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "14px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }} />
        </div>
        {["all", "pending_payment", "paid", "shipped", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, border: filter === s ? "1px solid #2563EB" : "1px solid #E2E8F0", background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? "#2563EB" : "#64748B", cursor: "pointer" }}>
            {s === "all" ? "Semua" : (STATUS_MAP[s]?.label || s)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}><Loader2 className="animate-spin" size={32} color="#2563EB" /></div>
      ) : (
        <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  {["Listing", "Pembeli → Penjual", "Total", "Status", "Tanggal", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0", ...(h === "Aksi" ? { textAlign: "right" } : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>Tidak ada transaksi ditemukan.</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 18px", maxWidth: "220px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listing?.title || "Listing Dihapus"}</p>
                      <p style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>{o.id.substring(0, 12)}...</p>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{o.buyer?.full_name || "?"}</p>
                      <p style={{ fontSize: "11px", color: "#64748B" }}>→ {o.seller?.full_name || "?"}</p>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Rp {fmt(o.total_price)}</td>
                    <td style={{ padding: "14px 18px" }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: "14px 18px", fontSize: "12px", color: "#64748B" }}>{fmtDate(o.created_at)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button onClick={() => setDetailTarget(o)} title="Detail" style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={13} /></button>
                        {!["cancelled", "completed"].includes(o.status) && (
                          <button onClick={() => setConfirmCancel(o)} disabled={processingId === o.id} title="Batalkan" style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", cursor: processingId ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {processingId === o.id ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Detail Modal */}
      {detailTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setDetailTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "28px", borderRadius: "24px", width: "100%", maxWidth: "540px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Detail Transaksi</h3>
                <p style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "monospace" }}>{detailTarget.id}</p>
              </div>
              <button onClick={() => setDetailTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}><XCircle size={24} /></button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {/* Listing */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Produk</h4>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {detailTarget.listing?.image_url && <img src={detailTarget.listing.image_url} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} />}
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.listing?.title || "Listing Dihapus"}</p>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: "#16A34A" }}>Rp {fmt(detailTarget.total_price)}</p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#EFF6FF", padding: "14px", borderRadius: "14px", border: "1px solid #BFDBFE" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#1E40AF", marginBottom: "4px" }}>PEMBELI</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.buyer?.full_name || "-"}</p>
                </div>
                <div style={{ background: "#F0FDF4", padding: "14px", borderRadius: "14px", border: "1px solid #BBF7D0" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>PENJUAL</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.seller?.full_name || "-"}</p>
                </div>
              </div>

              {/* Status Grid */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Status Pipeline</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Order", value: detailTarget.status },
                    { label: "Pembayaran", value: detailTarget.payment_status || "-" },
                    { label: "Escrow", value: detailTarget.escrow_status || "-" },
                    { label: "Payout", value: detailTarget.payout_status || "-" },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "3px" }}>{s.label}</p>
                      <StatusBadge status={s.value} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Pengiriman</h4>
                <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                  <p><strong>{detailTarget.shipping_name}</strong> · {detailTarget.shipping_phone}</p>
                  <p style={{ color: "#64748B" }}>{detailTarget.shipping_address}</p>
                  {detailTarget.shipping_notes && <p style={{ color: "#94A3B8", fontStyle: "italic" }}>Catatan: {detailTarget.shipping_notes}</p>}
                </div>
              </div>

              {/* Timeline */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Timeline</h4>
                <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
                  {[
                    { label: "Dibuat", date: detailTarget.created_at },
                    { label: "Dibayar", date: detailTarget.paid_at },
                    { label: "Dikirim", date: detailTarget.shipped_at },
                    { label: "Selesai", date: detailTarget.completed_at },
                  ].map(t => (
                    <div key={t.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>{t.label}</span>
                      <span style={{ color: t.date ? "#0F172A" : "#CBD5E1", fontWeight: 600 }}>{fmtDate(t.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setDetailTarget(null)} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", marginTop: "20px", cursor: "pointer" }}>Tutup</button>
          </div>
        </div>,
        document.body
      )}

      {/* Cancel Confirm Modal */}
      {confirmCancel && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmCancel(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: "#FEF2F2", color: "#DC2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Ban size={28} /></div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Batalkan Transaksi?</h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.5 }}>
              Order <strong>{confirmCancel.listing?.title}</strong> senilai <strong>Rp {fmt(confirmCancel.total_price)}</strong> akan dibatalkan secara paksa oleh admin.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmCancel(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Batal</button>
              <button onClick={() => executeCancel(confirmCancel.id)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Ya, Batalkan</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
