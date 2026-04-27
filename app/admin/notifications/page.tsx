"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle, Search, Bell, Send, Megaphone, Users, User, Trash2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

type Notification = {
  id: string;
  created_at: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  user_name?: string;
};

type Profile = { id: string; full_name: string | null };

const TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  system: { label: "Sistem", color: "#475569", bg: "#F8FAFC" },
  admin_alert: { label: "Admin", color: "#DC2626", bg: "#FEF2F2" },
  transaction: { label: "Transaksi", color: "#D97706", bg: "#FFFBEB" },
  scan: { label: "Scan", color: "#2563EB", bg: "#EFF6FF" },
  social: { label: "Sosial", color: "#8B5CF6", bg: "#F5F3FF" },
  reward: { label: "Reward", color: "#16A34A", bg: "#F0FDF4" },
};

const NOTIF_TYPES = ["system", "admin_alert", "transaction", "reward"] as const;

function TypeBadge({ type }: { type: string }) {
  const t = TYPE_MAP[type] || { label: type, color: "#64748B", bg: "#F8FAFC" };
  return <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: t.bg, color: t.color, textTransform: "uppercase" }}>{t.label}</span>;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationManagementPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // Compose form
  const [showCompose, setShowCompose] = useState(false);
  const [sendMode, setSendMode] = useState<"all" | "single">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [composeType, setComposeType] = useState<string>("system");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeLink, setComposeLink] = useState("");
  const [sending, setSending] = useState(false);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [notifsRes, profilesRes] = await Promise.all([
      supabase.from("notifications").select("id, created_at, user_id, type, title, message, link, is_read").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.id] = p.full_name || "?"; });

    const mapped = (notifsRes.data || []).map(n => ({
      ...n,
      user_name: n.user_id ? (profileMap[n.user_id] || "?") : "Sistem",
    }));

    setNotifications(mapped);
    setAllProfiles(profilesRes.data || []);
    setLoading(false);
  }

  async function handleSend() {
    if (!composeTitle.trim() || !composeMessage.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      if (sendMode === "all") {
        // Send to all users
        const inserts = allProfiles.map(p => ({
          user_id: p.id,
          type: composeType,
          title: composeTitle.trim(),
          message: composeMessage.trim(),
          link: composeLink.trim() || null,
        }));
        if (inserts.length === 0) throw new Error("Tidak ada pengguna terdaftar.");
        const { error } = await supabase.from("notifications").insert(inserts);
        if (error) throw error;
        setFeedback({ type: "success", msg: `Notifikasi berhasil dikirim ke ${inserts.length} pengguna.` });
      } else {
        // Send to single user
        if (!targetUserId) throw new Error("Pilih pengguna target.");
        const { error } = await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: composeType,
          title: composeTitle.trim(),
          message: composeMessage.trim(),
          link: composeLink.trim() || null,
        });
        if (error) throw error;
        const targetName = allProfiles.find(p => p.id === targetUserId)?.full_name || "?";
        setFeedback({ type: "success", msg: `Notifikasi berhasil dikirim ke ${targetName}.` });
      }
      setComposeTitle(""); setComposeMessage(""); setComposeLink(""); setShowCompose(false);
      fetchData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Gagal: " + err.message });
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTarget(null);
    setDeleting(true);
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      setFeedback({ type: "success", msg: "Notifikasi berhasil dihapus." });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Gagal: " + err.message });
    } finally {
      setDeleting(false);
    }
  }

  const filtered = notifications.filter(n => {
    if (filter !== "all" && n.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || (n.user_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredUsers = allProfiles.filter(p => {
    if (!userSearch) return true;
    return (p.full_name || "").toLowerCase().includes(userSearch.toLowerCase());
  }).slice(0, 8);

  // Stats
  const totalSent = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const adminAlerts = notifications.filter(n => n.type === "admin_alert").length;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>Manajemen Notifikasi</h2>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Kirim pengumuman, peringatan, atau notifikasi langsung ke pengguna.</p>
        </div>
        <button onClick={() => setShowCompose(true)} style={{ padding: "10px 20px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
          <Send size={14} /> Kirim Notifikasi
        </button>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {[
          { icon: <Bell size={16} />, label: "Total Terkirim", value: totalSent, bg: "#F8FAFC", color: "#475569", iconBg: "#E2E8F0" },
          { icon: <AlertCircle size={16} />, label: "Belum Dibaca", value: unreadCount, bg: "#FFFBEB", color: "#92400E", iconBg: "#FDE68A" },
          { icon: <Megaphone size={16} />, label: "Admin Alert", value: adminAlerts, bg: "#FEF2F2", color: "#991B1B", iconBg: "#FECACA" },
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
          <input type="text" placeholder="Cari judul, pesan, atau pengguna..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "14px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }} />
        </div>
        {["all", "system", "admin_alert", "transaction", "reward", "social", "scan"].map(s => (
          <button key={s} onClick={() => { setFilter(s); setCurrentPage(1); }} style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, border: filter === s ? "1px solid #2563EB" : "1px solid #E2E8F0", background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? "#2563EB" : "#64748B", cursor: "pointer" }}>
            {s === "all" ? "Semua" : (TYPE_MAP[s]?.label || s)}
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
                  {["Tipe", "Judul", "Penerima", "Status", "Tanggal", ""].map(h => (
                    <th key={h} style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>Tidak ada notifikasi ditemukan.</td></tr>
                ) : paginatedData.map(n => (
                  <tr key={n.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 16px" }}><TypeBadge type={n.type} /></td>
                    <td style={{ padding: "14px 16px", maxWidth: "280px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                      <p style={{ fontSize: "12px", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</p>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{n.user_name}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: n.is_read ? "#16A34A" : "#D97706" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: n.is_read ? "#16A34A" : "#D97706" }} />
                        {n.is_read ? "Dibaca" : "Belum"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{fmtDate(n.created_at)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => setDeleteTarget(n)} title="Hapus" style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} /></button>
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
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} Notifikasi
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

      {/* Compose Modal */}
      {showCompose && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowCompose(false)} />
          <div style={{ position: "relative", background: "#fff", padding: "28px", borderRadius: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>Kirim Notifikasi</h3>
              <button onClick={() => setShowCompose(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}><XCircle size={24} /></button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setSendMode("all")} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, border: sendMode === "all" ? "2px solid #2563EB" : "1px solid #E2E8F0", background: sendMode === "all" ? "#EFF6FF" : "#fff", color: sendMode === "all" ? "#2563EB" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Users size={14} /> Semua Pengguna
                </button>
                <button onClick={() => setSendMode("single")} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, border: sendMode === "single" ? "2px solid #2563EB" : "1px solid #E2E8F0", background: sendMode === "single" ? "#EFF6FF" : "#fff", color: sendMode === "single" ? "#2563EB" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <User size={14} /> Pengguna Tertentu
                </button>
              </div>

              {/* User picker (single mode) */}
              {sendMode === "single" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Target Pengguna</label>
                  <input type="text" placeholder="Cari nama pengguna..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setTargetUserId(""); }} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", fontFamily: "inherit", marginBottom: "6px" }} />
                  {userSearch && !targetUserId && (
                    <div style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "12px", background: "#fff" }}>
                      {filteredUsers.map(p => (
                        <button key={p.id} onClick={() => { setTargetUserId(p.id); setUserSearch(p.full_name || "?"); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#0F172A", cursor: "pointer", borderBottom: "1px solid #F1F5F9" }}>
                          {p.full_name || "?"}
                        </button>
                      ))}
                      {filteredUsers.length === 0 && <p style={{ padding: "10px", fontSize: "12px", color: "#94A3B8" }}>Tidak ditemukan.</p>}
                    </div>
                  )}
                  {targetUserId && <p style={{ fontSize: "12px", color: "#16A34A", fontWeight: 600 }}>✓ {userSearch}</p>}
                </div>
              )}

              {/* Type */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Tipe Notifikasi</label>
                <select value={composeType} onChange={e => setComposeType(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" }}>
                  {NOTIF_TYPES.map(t => <option key={t} value={t}>{TYPE_MAP[t]?.label || t}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Judul</label>
                <input type="text" placeholder="Judul notifikasi..." value={composeTitle} onChange={e => setComposeTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Pesan</label>
                <textarea rows={3} placeholder="Isi pesan notifikasi..." value={composeMessage} onChange={e => setComposeMessage(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </div>

              {/* Link (optional) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Link (opsional)</label>
                <input type="text" placeholder="/dashboard atau URL lainnya..." value={composeLink} onChange={e => setComposeLink(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
              </div>

              <button onClick={handleSend} disabled={sending || !composeTitle.trim() || !composeMessage.trim() || (sendMode === "single" && !targetUserId)} style={{ padding: "14px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: sending ? "wait" : "pointer", opacity: sending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? "Mengirim..." : sendMode === "all" ? `Kirim ke Semua (${allProfiles.length})` : "Kirim"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: "#FEF2F2", color: "#DC2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Trash2 size={28} /></div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Hapus Notifikasi?</h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>Notifikasi "<strong>{deleteTarget.title}</strong>" akan dihapus permanen.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Batal</button>
              <button onClick={() => handleDelete(deleteTarget.id)} disabled={deleting} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Ya, Hapus</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
