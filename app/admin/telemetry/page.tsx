"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type PathEntry = {
  id: string; // internal id for react map
  path: string;
  label: string;
  isEditing: boolean;
  draftPath: string;
  draftLabel: string;
  isNew: boolean;
};

export default function TelemetryManagementPage() {
  const [entries, setEntries] = useState<PathEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: routeRow, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("id", "telemetry_paths")
        .single();

      const telemetryMap = routeRow?.content || {};
      const parsedEntries: PathEntry[] = Object.entries(telemetryMap).map(([p, l]) => ({
        id: Math.random().toString(36).substr(2, 9),
        path: p,
        label: l as string,
        isEditing: false,
        draftPath: p,
        draftLabel: l as string,
        isNew: false,
      }));
      setEntries(parsedEntries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddNew = () => {
    setEntries((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        path: "",
        label: "",
        isEditing: true,
        draftPath: "/",
        draftLabel: "Halaman Baru",
        isNew: true,
      },
      ...prev,
    ]);
  };

  const handleEdit = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isEditing: true, draftPath: e.path, draftLabel: e.label } : e))
    );
  };

  const handleCancelEdit = (id: string) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target?.isNew) {
        return prev.filter((e) => e.id !== id);
      }
      return prev.map((e) => (e.id === id ? { ...e, isEditing: false } : e));
    });
  };

  const handleConfirmEdit = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              isEditing: false,
              isNew: false,
              path: e.draftPath.trim(),
              label: e.draftLabel.trim(),
            }
          : e
      )
    );
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // Validate: Pastikan tidak ada yang kosong dan tidak duplikat
      const payload: Record<string, string> = {};
      let hasError = false;

      entries.forEach((e) => {
         if (e.isEditing) hasError = true; // Tolak save jika masih ada form terbuka
         if (!e.path.trim() || !e.label.trim()) return; 
         payload[e.path.trim()] = e.label.trim();
      });

      if (hasError) {
         setFeedback({ type: "error", msg: "Harap selesaikan pengeditan baris (centang) sebelum menyimpan." });
         setSaving(false);
         return;
      }

      const supabase = createClient();
      const { error } = await supabase.from("site_content").upsert({ id: "telemetry_paths", content: payload });

      if (error) throw error;
      setFeedback({ type: "success", msg: "Tabel kamus berhasil disinkronkan ke database!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Gagal menyimpan perubahan: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={32} color="#2563EB" />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            Pengaturan Nama Halaman (URL)
          </h2>
          <p style={{ color: "#64748B", fontSize: "13px" }}>
            Ubah nama rute bawaan sistem menjadi bahasa yang mudah dimengerti saat melihat dasbor statistik.
          </p>
          <div style={{ marginTop: "12px", padding: "10px 16px", background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: "10px", fontSize: "12px", color: "#B45309" }}>
            <strong>Catatan:</strong> Perubahan baris tabel tidak akan diimplementasikan ke dasbor utama sebelum Anda menekan tombol <strong>Simpan Perubahan Utama</strong> berwarna biru di ujung kanan.
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <button
             onClick={handleAddNew}
             style={{ background: "#F1F5F9", color: "#334155", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
           >
             <Plus size={16} /> Tambah Rute Baru
           </button>
           <button
             onClick={handleSaveToDatabase}
             disabled={saving}
             style={{ background: "#2563EB", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}
           >
             {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Perubahan Utama
           </button>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Tampilan Tabel */}
      <div style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
         <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rute Browser (Path)</th>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Nama Terjemahan Tampil (Label)</th>
                    <th style={{ padding: "16px 24px", textAlign: "right", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", width: "130px" }}>Aksi</th>
                 </tr>
              </thead>
              <tbody>
                 {entries.length === 0 ? (
                    <tr>
                       <td colSpan={3} style={{ textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: "14px" }}>
                          Daftar URL kosong. Tambahkan pemetaan baru untuk menerjemahkan rute.
                       </td>
                    </tr>
                 ) : (
                    entries.slice((currentPage - 1) * 8, currentPage * 8).map((entry) => (
                       <tr key={entry.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }}>
                          
                          <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                             {entry.isEditing ? (
                                <input 
                                  type="text" 
                                  value={entry.draftPath}
                                  onChange={e => setEntries(p => p.map(x => x.id === entry.id ? { ...x, draftPath: e.target.value } : x))}
                                  placeholder="Contoh: /dashboard/*"
                                  style={{ padding: "10px", width: "100%", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", fontFamily: "monospace", outline: "none" }}
                                />
                             ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                   <LinkIcon size={14} color="#94A3B8" />
                                   <span style={{ fontSize: "14px", fontFamily: "monospace", color: "#334155", fontWeight: 600 }}>{entry.path}</span>
                                </div>
                             )}
                          </td>

                          <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                             {entry.isEditing ? (
                                <input 
                                  type="text" 
                                  value={entry.draftLabel}
                                  onChange={e => setEntries(p => p.map(x => x.id === entry.id ? { ...x, draftLabel: e.target.value } : x))}
                                  placeholder="Contoh: Halaman Dasbor"
                                  style={{ padding: "10px", width: "100%", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none" }}
                                />
                             ) : (
                                <span style={{ fontSize: "14px", color: "#0F172A", fontWeight: 700 }}>{entry.label}</span>
                             )}
                          </td>

                          <td style={{ padding: "16px 24px", textAlign: "right", verticalAlign: "middle" }}>
                             {entry.isEditing ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                                   <button onClick={() => handleConfirmEdit(entry.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", cursor: "pointer" }} title="Selesai">
                                      <Check size={16} />
                                   </button>
                                   <button onClick={() => handleCancelEdit(entry.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", cursor: "pointer" }} title="Batal">
                                      <X size={16} />
                                   </button>
                                </div>
                             ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                                   <button onClick={() => handleEdit(entry.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "transparent", border: "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", cursor: "pointer", transition: "all 0.2s" }} title="Edit Baris">
                                      <Edit2 size={16} />
                                   </button>
                                   <button onClick={() => handleDelete(entry.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", cursor: "pointer", transition: "all 0.2s" }} title="Hapus Kamus">
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             )}
                          </td>

                       </tr>
                    ))
                 )}
              </tbody>
            </table>
         </div>
         {/* Pagination Controls */}
         {entries.length > 8 && (
            <div style={{ padding: "16px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <p style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                 Menampilkan {((currentPage - 1) * 8) + 1} - {Math.min(currentPage * 8, entries.length)} dari {entries.length} Halaman
               </p>
               <div style={{ display: "flex", gap: "8px" }}>
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                   disabled={currentPage === 1}
                   style={{ padding: "8px", borderRadius: "8px", background: "#fff", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", color: currentPage === 1 ? "#94A3B8" : "#334155", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(Math.ceil(entries.length / 8), p + 1))} 
                   disabled={currentPage === Math.ceil(entries.length / 8)}
                   style={{ padding: "8px", borderRadius: "8px", background: "#fff", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", color: currentPage === Math.ceil(entries.length / 8) ? "#94A3B8" : "#334155", cursor: currentPage === Math.ceil(entries.length / 8) ? "not-allowed" : "pointer" }}
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>
            </div>
         )}
      </div>

    </div>
  );
}
