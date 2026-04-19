"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase";
import { Loader2, ShieldAlert, CheckCircle2, Shield, AlertCircle, XCircle, Trash2, Search, TriangleAlert, Eye, User as UserIcon } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  payout_channel: string | null;
  payout_bank_code: string | null;
  payout_account_number: string | null;
  payout_account_name: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: "success" | "error", msg: string} | null>(null);
  const [search, setSearch] = useState("");
  
  const [confirmRoleTarget, setConfirmRoleTarget] = useState<{ id: string; name: string; currentRole: string | null } | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [viewDetailTarget, setViewDetailTarget] = useState<Profile | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id, full_name, username, phone, role, avatar_url, bio, location, payout_channel, payout_bank_code, payout_account_number, payout_account_name').order('full_name');
      if (data) setUsers(data as Profile[]);
      else if (error) {
         // Coba ambil dari users jika tabel profiles tidak memuat semuanya
         const { data: uData } = await supabase.from('users').select('*');
         if (uData) setUsers(uData as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function executeToggleRole(id: string, currentRole: string | null) {
      setConfirmRoleTarget(null);
      setProcessingId(id);
      setFeedback(null);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      try {
         const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
         if (error) throw error;
         setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
         setFeedback({ type: "success", msg: "Otoritas akun berhasil diperbarui!" });
         setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
         setFeedback({ type: "error", msg: "Gagal merubah otoritas. " + err.message });
      } finally {
         setProcessingId(null);
      }
  }

  async function executeDelete(id: string) {
      setConfirmDeleteTarget(null);
      setProcessingId(id);
      setFeedback(null);
      try {
         const { error } = await supabase.from('profiles').delete().eq('id', id);
         if (error) throw error;
         setUsers(prev => prev.filter(u => u.id !== id));
         setFeedback({ type: "success", msg: "Akun profil tersebut telah dicabut dan dihapus!" });
         setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
         setFeedback({ type: "error", msg: "Penghapusan gagal dilakukan. " + err.message });
      } finally {
         setProcessingId(null);
      }
  }

  const filteredUsers = users.filter(u => 
      (u.full_name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (u.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
             Manajemen Pengguna
           </h2>
           <p style={{ color: "#64748B", fontSize: "13px" }}>
             Kelola daftar identitas, pantau aktivitas, dan tindak lanjuti akun yang mencurigakan.
           </p>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Kontrol dan Filter */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}>
         <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px" }} />
         <input 
           type="text"
           placeholder="Cari nama pengguna..."
           value={search}
           onChange={e => setSearch(e.target.value)}
           style={{ flex: 1, padding: "12px 12px 12px 40px", borderRadius: "14px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
         />
         <div style={{ padding: "12px 18px", borderRadius: "14px", background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "14px", fontWeight: 700, color: "#2563EB" }}>
           {users.length} Akun Terdaftar
         </div>
      </div>

      {loading ? (
         <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Loader2 className="animate-spin" size={32} color="#2563EB" />
         </div>
      ) : (
         <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
               <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ background: "#F8FAFC" }}>
                     <tr>
                        <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0" }}>Informasi Pengguna</th>
                        <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0" }}>ID Registrasi</th>
                        <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0" }}>Otoritas</th>
                        <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #E2E8F0", textAlign: "right" }}>Operasi</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>Belum ada data tersedia.</td>
                        </tr>
                     ) : filteredUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                           <td style={{ padding: "16px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563EB", overflow: "hidden" }}>
                                   {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.full_name ? u.full_name[0].toUpperCase() : "?")}
                                </div>
                                <div>
                                   <p style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", marginBottom: "2px" }}>{u.full_name || "Tanpa Nama"}</p>
                                   <p style={{ fontSize: "12px", color: "#64748B" }}>{u.phone || "No HP Tidak Ada"}</p>
                                </div>
                              </div>
                           </td>
                           <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                              {u.id.substring(0, 16)}...
                           </td>
                           <td style={{ padding: "16px 20px" }}>
                              <span style={{ 
                                  display: "inline-block", 
                                  padding: "4px 10px", 
                                  borderRadius: "8px", 
                                  fontSize: "12px", 
                                  fontWeight: 700, 
                                  background: u.role === 'admin' ? "#EFF6FF" : "#F1F5F9", 
                                  color: u.role === 'admin' ? "#2563EB" : "#475569" 
                              }}>
                                 {u.role === 'admin' ? 'Pemilik Admin' : 'Anggota Publik'}
                              </span>
                           </td>
                           <td style={{ padding: "16px 20px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                 <button 
                                   onClick={() => setViewDetailTarget(u)} 
                                   title="Lihat Detail Profil"
                                   style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569", cursor: "pointer", transition: "0.2s" }}
                                 >
                                    <Eye size={14} />
                                 </button>
                                 <button 
                                   onClick={() => setConfirmRoleTarget({ id: u.id, name: u.full_name || "Tanpa Nama", currentRole: u.role })} 
                                   disabled={processingId === u.id}
                                   title="Ubah Role Otoritas"
                                   style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: u.role === 'admin' ? "#FEF2F2" : "#EFF6FF", border: `1px solid ${u.role === 'admin' ? "#FECACA" : "#BFDBFE"}`, color: u.role === 'admin' ? "#DC2626" : "#2563EB", cursor: processingId ? "wait" : "pointer", transition: "0.2s" }}
                                 >
                                    <Shield size={14} />
                                 </button>
                                 <button 
                                   onClick={() => setConfirmDeleteTarget({ id: u.id, name: u.full_name || "Tanpa Nama" })} 
                                   disabled={processingId === u.id}
                                   title="Cabut & Hapus Akun"
                                   style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fff", border: "1px solid #E2E8F0", color: "#DC2626", cursor: processingId ? "wait" : "pointer", transition: "0.2s" }}
                                 >
                                    {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </section>
      )}

      {confirmRoleTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmRoleTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: "#EFF6FF", color: "#2563EB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ShieldAlert size={28} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Konfirmasi Otoritas</h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin {confirmRoleTarget.currentRole === 'admin' ? "menurunkan peran" : "mengangkat peran"} <strong>{confirmRoleTarget.name}</strong> {confirmRoleTarget.currentRole === 'admin' ? "menjadi pengguna biasa" : "sebagai admin khusus"}?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmRoleTarget(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Batal</button>
              <button 
                onClick={() => executeToggleRole(confirmRoleTarget.id, confirmRoleTarget.currentRole)} 
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                Ya, Otentikasi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmDeleteTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmDeleteTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: "#FEF2F2", color: "#DC2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <TriangleAlert size={28} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Hapus Akun Permanen?</h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.5 }}>
              Data profil <strong>{confirmDeleteTarget.name}</strong> akan dhapus. Mereka akan ditolak secara berulang jika menyiarkan login kembali dengan SID lama.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDeleteTarget(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Batal</button>
              <button 
                onClick={() => executeDelete(confirmDeleteTarget.id)} 
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewDetailTarget && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setViewDetailTarget(null)} />
          <div style={{ position: "relative", background: "#fff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                 <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563EB", overflow: "hidden", border: "2px solid #E2E8F0" }}>
                    {viewDetailTarget.avatar_url ? <img src={viewDetailTarget.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (viewDetailTarget.full_name ? viewDetailTarget.full_name[0].toUpperCase() : "?")}
                 </div>
                 <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>{viewDetailTarget.full_name || "Tanpa Nama"}</h3>
                    <p style={{ fontSize: "14px", color: "#64748B", fontFamily: "monospace" }}>ID: {viewDetailTarget.id.substring(0, 12)}...</p>
                 </div>
               </div>
               <button onClick={() => setViewDetailTarget(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}><XCircle size={24} /></button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
               <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Informasi Personal</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                     <div>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Username</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{viewDetailTarget.username || "-"}</p>
                     </div>
                     <div>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Nomor HP</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{viewDetailTarget.phone || "-"}</p>
                     </div>
                     <div style={{ gridColumn: "1 / -1" }}>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Lokasi</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{viewDetailTarget.location || "-"}</p>
                     </div>
                     <div style={{ gridColumn: "1 / -1" }}>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Bio Singkat</p>
                       <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>{viewDetailTarget.bio || "Belum ada bio."}</p>
                     </div>
                  </div>
               </div>

               <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Data Penarikan (Payout)</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                     <div>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Bank / E-Wallet</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{viewDetailTarget.payout_bank_code?.toUpperCase() || (viewDetailTarget.payout_channel === 'ewallet' ? 'E-Wallet' : 'Bank Transfer') || "-"}</p>
                     </div>
                     <div>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Atas Nama</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{viewDetailTarget.payout_account_name || "-"}</p>
                     </div>
                     <div style={{ gridColumn: "1 / -1" }}>
                       <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>Nomor Rekening / Platform</p>
                       <p style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>{viewDetailTarget.payout_account_number || "Tidak Diatur"}</p>
                     </div>
                  </div>
               </div>
            </div>

            <button onClick={() => setViewDetailTarget(null)} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: "14px", marginTop: "24px", cursor: "pointer" }}>
              Tutup Panel
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
