"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, Search, Eye, XCircle, ArrowLeftRight, Clock, CheckCircle2, XOctagon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

type BarterOffer = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  offered_item_name: string;
  offered_item_description: string | null;
  offered_item_image_url: string | null;
  cash_addition: number;
  message: string | null;
  seller_response: string | null;
  listing_id: string;
  offerer_id: string;
  accepted_at: string | null;
  offerer_name: string;
  listing_title: string;
  listing_owner_name: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Menunggu", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  accepted: { label: "Diterima", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  rejected: { label: "Ditolak", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  cancelled: { label: "Dibatalkan", color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  shipped: { label: "Dikirim", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  completed: { label: "Selesai", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[(status || "").toLowerCase().trim()] || { label: status, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function fmt(n: number): string { return n.toLocaleString("id-ID"); }
function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BarterMonitorPage() {
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState<BarterOffer | null>(null);

  const supabase = createClient();

  useEffect(() => { fetchOffers(); }, []);

  async function fetchOffers() {
    setLoading(true);
    const { data: raw } = await supabase
      .from("barter_offers")
      .select("id, created_at, updated_at, status, offered_item_name, offered_item_description, offered_item_image_url, cash_addition, message, seller_response, listing_id, offerer_id, accepted_at")
      .order("created_at", { ascending: false });

    if (!raw || raw.length === 0) { setOffers([]); setLoading(false); return; }

    // Batch fetch profiles & listings
    const offererIds = [...new Set(raw.map(o => o.offerer_id))];
    const listingIds = [...new Set(raw.map(o => o.listing_id))];

    const [profilesRes, listingsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", offererIds),
      supabase.from("marketplace_listings").select("id, title, user_id").in("id", listingIds),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.id] = p.full_name || "?"; });

    const listingMap: Record<string, { title: string; user_id: string }> = {};
    (listingsRes.data || []).forEach(l => { listingMap[l.id] = { title: l.title, user_id: l.user_id }; });

    // Fetch owner profiles
    const ownerIds = [...new Set(Object.values(listingMap).map(l => l.user_id))];
    const missingOwners = ownerIds.filter(id => !profileMap[id]);
    if (missingOwners.length > 0) {
      const { data: ownerProfiles } = await supabase.from("profiles").select("id, full_name").in("id", missingOwners);
      (ownerProfiles || []).forEach(p => { profileMap[p.id] = p.full_name || "?"; });
    }

    const mapped: BarterOffer[] = raw.map(o => ({
      ...o,
      offerer_name: profileMap[o.offerer_id] || "?",
      listing_title: listingMap[o.listing_id]?.title || "Listing Dihapus",
      listing_owner_name: profileMap[listingMap[o.listing_id]?.user_id] || "?",
    }));

    setOffers(mapped);
    setLoading(false);
  }

  const filtered = offers.filter(o => {
    if (filter !== "all") {
      const s = (o.status || "").toLowerCase().trim();
      if (filter === "accepted") {
        if (!["accepted", "shipped", "completed"].includes(s)) return false;
      } else if (s !== filter) {
        return false;
      }
    }
    if (search) {
      const q = search.toLowerCase();
      return o.offerer_name.toLowerCase().includes(q) || o.listing_title.toLowerCase().includes(q) || o.offered_item_name.toLowerCase().includes(q) || o.listing_owner_name.toLowerCase().includes(q);
    }
    return true;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const pendingCount = offers.filter(o => { const s = (o.status || "").toLowerCase().trim(); return s === "pending"; }).length;
  const acceptedCount = offers.filter(o => { const s = (o.status || "").toLowerCase().trim(); return ["accepted", "completed", "shipped"].includes(s); }).length;
  const rejectedCount = offers.filter(o => { const s = (o.status || "").toLowerCase().trim(); return s === "rejected"; }).length;
  const acceptanceRate = offers.length > 0 ? Math.round((acceptedCount / offers.length) * 100) : 0;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Monitor Barter</h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>Pantau seluruh tawaran barter, status negosiasi, dan tingkat penerimaan.</p>
      </div>

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {[
          { icon: <ArrowLeftRight size={16} />, label: "Total Tawaran", value: offers.length, bg: "#F8FAFC", color: "#475569", iconBg: "#E2E8F0" },
          { icon: <Clock size={16} />, label: "Menunggu", value: pendingCount, bg: "#FFFBEB", color: "#92400E", iconBg: "#FDE68A" },
          { icon: <CheckCircle2 size={16} />, label: "Diterima", value: acceptedCount, bg: "#F0FDF4", color: "#166534", iconBg: "#BBF7D0" },
          { icon: <XOctagon size={16} />, label: "Ditolak", value: rejectedCount, bg: "#FEF2F2", color: "#991B1B", iconBg: "#FECACA" },
          { icon: <AlertCircle size={16} />, label: "Acceptance Rate", value: `${acceptanceRate}%`, bg: "#EFF6FF", color: "#1E40AF", iconBg: "#BFDBFE" },
        ].map(k => (
          <div key={k.label} style={{ padding: "14px", borderRadius: "16px", background: k.bg, border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "12px" }}>
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
          <input type="text" placeholder="Cari penawar, pemilik listing, atau barang..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "14px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }} />
        </div>
        {["all", "pending", "accepted", "rejected", "shipped", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => { setFilter(s); setCurrentPage(1); }} style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, border: filter === s ? "1px solid #2563EB" : "1px solid #E2E8F0", background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? "#2563EB" : "#64748B", cursor: "pointer" }}>
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
                  {["Penawar → Pemilik", "Barang Ditawarkan", "Untuk Listing", "Tambahan", "Status", "Tanggal", ""].map(h => (
                    <th key={h} style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>Tidak ada tawaran barter ditemukan.</td></tr>
                ) : paginatedData.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{o.offerer_name}</p>
                      <p style={{ fontSize: "11px", color: "#64748B" }}>→ {o.listing_owner_name}</p>
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.offered_item_name}</p>
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                      <p style={{ fontSize: "13px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listing_title}</p>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: o.cash_addition > 0 ? "#16A34A" : "#94A3B8" }}>
                      {o.cash_addition > 0 ? `+Rp ${fmt(o.cash_addition)}` : "-"}
                    </td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{fmtDate(o.created_at)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => setDetailTarget(o)} title="Detail" style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div style={{ padding: "14px 18px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} Tawaran
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  style={{ padding: "6px", borderRadius: "8px", background: "#fff", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", color: currentPage === 1 ? "#94A3B8" : "#334155", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  style={{ padding: "6px", borderRadius: "8px", background: "#fff", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", color: currentPage === totalPages ? "#94A3B8" : "#334155", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Detail Modal */}
      {detailTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setDetailTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "28px", borderRadius: "24px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Detail Barter</h3>
                <StatusBadge status={detailTarget.status} />
              </div>
              <button onClick={() => setDetailTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}><XCircle size={24} /></button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {/* Participants */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", alignItems: "center" }}>
                <div style={{ background: "#EFF6FF", padding: "14px", borderRadius: "14px", border: "1px solid #BFDBFE", textAlign: "center" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#1E40AF", marginBottom: "4px" }}>PENAWAR</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.offerer_name}</p>
                </div>
                <ArrowLeftRight size={18} color="#94A3B8" />
                <div style={{ background: "#F0FDF4", padding: "14px", borderRadius: "14px", border: "1px solid #BBF7D0", textAlign: "center" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>PEMILIK</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.listing_owner_name}</p>
                </div>
              </div>

              {/* Offered Item */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Barang Ditawarkan</h4>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {detailTarget.offered_item_image_url && <img src={detailTarget.offered_item_image_url} style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover" }} />}
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.offered_item_name}</p>
                    {detailTarget.offered_item_description && <p style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{detailTarget.offered_item_description}</p>}
                    {detailTarget.cash_addition > 0 && <p style={{ fontSize: "13px", fontWeight: 700, color: "#16A34A", marginTop: "4px" }}>+ Rp {fmt(detailTarget.cash_addition)} tukar tambah</p>}
                  </div>
                </div>
              </div>

              {/* Target Listing */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Listing Target</h4>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>{detailTarget.listing_title}</p>
              </div>

              {/* Messages */}
              {(detailTarget.message || detailTarget.seller_response) && (
                <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Pesan</h4>
                  {detailTarget.message && (
                    <div style={{ marginBottom: "10px" }}>
                      <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "2px" }}>Dari Penawar:</p>
                      <p style={{ fontSize: "13px", color: "#0F172A", fontStyle: "italic" }}>"{detailTarget.message}"</p>
                    </div>
                  )}
                  {detailTarget.seller_response && (
                    <div>
                      <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "2px" }}>Respons Pemilik:</p>
                      <p style={{ fontSize: "13px", color: "#0F172A", fontStyle: "italic" }}>"{detailTarget.seller_response}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Timeline</h4>
                <div style={{ display: "grid", gap: "6px", fontSize: "12px" }}>
                  {[
                    { label: "Dibuat", date: detailTarget.created_at },
                    { label: "Diterima", date: detailTarget.accepted_at },
                    { label: "Terakhir Diperbarui", date: detailTarget.updated_at },
                  ].map(t => (
                    <div key={t.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#475569", fontWeight: 600 }}>{t.label}</span>
                      <span style={{ color: t.date ? "#0F172A" : "#CBD5E1", fontWeight: 600 }}>{fmtDate(t.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>ID: {detailTarget.id}</p>
            </div>

            <button onClick={() => setDetailTarget(null)} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", marginTop: "20px", cursor: "pointer" }}>Tutup</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
