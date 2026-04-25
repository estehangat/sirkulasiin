"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle, Search, Eye, XCircle, ShoppingBag, Archive, RotateCcw, ImageOff } from "lucide-react";
import { createPortal } from "react-dom";

type Listing = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category: string;
  status: string;
  location: string | null;
  carbon_saved: string | null;
  eco_points: number;
  user_id: string;
  owner: { full_name: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "Draf", color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  published: { label: "Aktif", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  sold: { label: "Terjual", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  reserved: { label: "Dipesan", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  archived: { label: "Diarsipkan", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

const CATEGORY_LABELS: Record<string, string> = {
  plastic: "Plastik", glass: "Kaca", paper: "Kertas", metal: "Logam",
  textile: "Tekstil", electronic: "Elektronik", other: "Lainnya",
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

function fmt(n: number): string { return n.toLocaleString("id-ID"); }

export default function MarketplaceModerationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Listing | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ listing: Listing; action: "archive" | "publish" } | null>(null);

  const supabase = createClient();

  useEffect(() => { fetchListings(); }, []);

  async function fetchListings() {
    setLoading(true);
    // Fetch listings tanpa FK join (FK mengarah ke auth.users, bukan profiles)
    const { data: rawListings } = await supabase
      .from("marketplace_listings")
      .select("id, created_at, title, description, image_url, price, category, status, location, carbon_saved, eco_points, user_id")
      .order("created_at", { ascending: false });

    if (!rawListings || rawListings.length === 0) { setListings([]); setLoading(false); return; }

    // Batch fetch profiles
    const userIds = [...new Set(rawListings.map(l => l.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || ""; });

    const mapped: Listing[] = rawListings.map(l => ({
      ...l,
      owner: { full_name: profileMap[l.user_id] || null },
    }));

    setListings(mapped);
    setLoading(false);
  }

  async function executeAction(id: string, newStatus: string) {
    setConfirmAction(null);
    setProcessingId(id);
    setFeedback(null);
    const label = newStatus === "archived" ? "diarsipkan" : "dipublikasikan kembali";
    try {
      const { error } = await supabase.from("marketplace_listings").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      setFeedback({ type: "success", msg: `Listing berhasil ${label}.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Gagal: " + err.message });
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = listings.filter(l => {
    if (filter !== "all" && l.status !== filter) return false;
    if (catFilter !== "all" && l.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || (l.owner?.full_name?.toLowerCase().includes(q)) || l.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const publishedCount = listings.filter(l => l.status === "published").length;
  const soldCount = listings.filter(l => l.status === "sold").length;
  const archivedCount = listings.filter(l => l.status === "archived").length;
  const avgPrice = listings.length ? Math.round(listings.reduce((s, l) => s + l.price, 0) / listings.length) : 0;
  const categories = [...new Set(listings.map(l => l.category))].sort();

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Moderasi Marketplace</h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>Tinjau, arsipkan, atau publikasikan ulang listing di marketplace untuk menjaga kualitas platform.</p>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {[
          { label: "Total Listing", value: listings.length, color: "#475569", bg: "#F8FAFC", iconBg: "#E2E8F0" },
          { label: "Aktif", value: publishedCount, color: "#166534", bg: "#F0FDF4", iconBg: "#BBF7D0" },
          { label: "Terjual", value: soldCount, color: "#1E40AF", bg: "#EFF6FF", iconBg: "#BFDBFE" },
          { label: "Diarsipkan", value: archivedCount, color: "#991B1B", bg: "#FEF2F2", iconBg: "#FECACA" },
          { label: "Rata-rata Harga", value: `Rp ${fmt(avgPrice)}`, color: "#92400E", bg: "#FFFBEB", iconBg: "#FDE68A" },
        ].map(k => (
          <div key={k.label} style={{ padding: "14px", borderRadius: "16px", background: k.bg, border: "1px solid rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: k.color, textTransform: "uppercase", marginBottom: "4px" }}>{k.label}</p>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Cari listing atau penjual..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "14px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }} />
        </div>
        {["all", "published", "draft", "sold", "reserved", "archived"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, border: filter === s ? "1px solid #2563EB" : "1px solid #E2E8F0", background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? "#2563EB" : "#64748B", cursor: "pointer" }}>
            {s === "all" ? "Semua" : (STATUS_MAP[s]?.label || s)}
          </button>
        ))}
        {categories.length > 1 && (
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="all">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
          </select>
        )}
      </div>

      {/* Card Grid */}
      {loading ? (
        <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}><Loader2 className="animate-spin" size={32} color="#2563EB" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#94A3B8", fontSize: "14px", background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0" }}>Tidak ada listing ditemukan.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map(l => (
            <article key={l.id} style={{ borderRadius: "20px", border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)", display: "flex", flexDirection: "column" }}>
              {/* Image */}
              <div style={{ height: "140px", background: "#F1F5F9", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {l.image_url ? (
                  <img src={l.image_url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageOff size={32} color="#CBD5E1" />
                )}
                <div style={{ position: "absolute", top: "10px", left: "10px" }}><StatusBadge status={l.status} /></div>
                <div style={{ position: "absolute", top: "10px", right: "10px", padding: "3px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "10px", fontWeight: 700 }}>{CATEGORY_LABELS[l.category] || l.category}</div>
              </div>
              {/* Body */}
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</h3>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#16A34A" }}>Rp {fmt(l.price)}</p>
                <p style={{ fontSize: "12px", color: "#64748B" }}>oleh <strong>{l.owner?.full_name || "?"}</strong> · {l.location || "-"}</p>
              </div>
              {/* Actions */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", gap: "8px" }}>
                <button onClick={() => setDetailTarget(l)} style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Eye size={13} /> Detail
                </button>
                {l.status === "published" && (
                  <button onClick={() => setConfirmAction({ listing: l, action: "archive" })} disabled={processingId === l.id} style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <Archive size={13} /> Arsipkan
                  </button>
                )}
                {(l.status === "archived" || l.status === "draft") && (
                  <button onClick={() => setConfirmAction({ listing: l, action: "publish" })} disabled={processingId === l.id} style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <RotateCcw size={13} /> Publikasi
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setDetailTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "28px", borderRadius: "24px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>Detail Listing</h3>
              <button onClick={() => setDetailTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}><XCircle size={24} /></button>
            </div>

            {detailTarget.image_url && <img src={detailTarget.image_url} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "16px", marginBottom: "16px" }} />}

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>{detailTarget.title}</p>
                <StatusBadge status={detailTarget.status} />
              </div>
              <p style={{ fontSize: "22px", fontWeight: 900, color: "#16A34A" }}>Rp {fmt(detailTarget.price)}</p>
              {detailTarget.description && <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{detailTarget.description}</p>}

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Kategori", value: CATEGORY_LABELS[detailTarget.category] || detailTarget.category },
                  { label: "Penjual", value: detailTarget.owner?.full_name || "-" },
                  { label: "Lokasi", value: detailTarget.location || "-" },
                  { label: "Eco Points", value: detailTarget.eco_points.toString() },
                  { label: "CO₂ Saved", value: detailTarget.carbon_saved || "-" },
                  { label: "Dibuat", value: new Date(detailTarget.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) },
                ].map(r => (
                  <div key={r.label}>
                    <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "2px" }}>{r.label}</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{r.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>ID: {detailTarget.id}</p>
            </div>

            <button onClick={() => setDetailTarget(null)} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", marginTop: "20px", cursor: "pointer" }}>Tutup</button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Action Modal */}
      {confirmAction && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmAction(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: confirmAction.action === "archive" ? "#FEF2F2" : "#F0FDF4", color: confirmAction.action === "archive" ? "#DC2626" : "#16A34A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              {confirmAction.action === "archive" ? <Archive size={28} /> : <RotateCcw size={28} />}
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
              {confirmAction.action === "archive" ? "Arsipkan Listing?" : "Publikasikan Listing?"}
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.5 }}>
              <strong>{confirmAction.listing.title}</strong> akan {confirmAction.action === "archive" ? "diarsipkan dan tidak tampil di marketplace" : "dipublikasikan kembali ke marketplace"}.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Batal</button>
              <button onClick={() => executeAction(confirmAction.listing.id, confirmAction.action === "archive" ? "archived" : "published")} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: confirmAction.action === "archive" ? "#DC2626" : "#16A34A", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                {confirmAction.action === "archive" ? "Ya, Arsipkan" : "Ya, Publikasi"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
