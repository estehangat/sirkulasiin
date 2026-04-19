"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Save, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function ContentManagementPage() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: "success" | "error", msg: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: rows, error } = await supabase.from('site_content').select('*');
      if (!error && rows) {
        const obj: any = {};
        rows.forEach(r => { 
           obj[r.id] = r.content; 
        });
        setData(obj);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string) {
    setSavingId(id);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('site_content').update({ content: data[id] }).eq('id', id);
      if (error) {
        setFeedback({ type: "error", msg: "Gagal menyimpan: " + error.message });
      } else {
        setFeedback({ type: "success", msg: `Perubahan pada ${id === 'home_page' ? 'Beranda' : 'Tentang'} berhasil disimpan!` });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e: any) {
       setFeedback({ type: "error", msg: "Terjadi kesalahan server: " + e.message });
    } finally {
      setSavingId(null);
    }
  }


  const handlePropChange = (id: string, prop: string, value: string) => {
    setData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [prop]: value
      }
    }));
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
      <div style={{ marginBottom: "8px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
          Pengaturan Konten
        </h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>
          Lakukan perubahan teks pada halaman publik secara langsung. (Pilih "Simpan" setelah mengedit).
        </p>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Editor Home Page */}
      <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Konten Halaman Beranda (Hero)</h3>
        </div>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Judul Utama (Hero Title)</label>
            <input 
              type="text" 
              value={data['home_page']?.hero_title || ""} 
              onChange={e => handlePropChange('home_page', 'hero_title', e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Sub-judul (Hero Subtitle)</label>
            <textarea 
              rows={3}
              value={data['home_page']?.hero_subtitle || ""} 
              onChange={e => handlePropChange('home_page', 'hero_subtitle', e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button onClick={() => handleSave('home_page')} disabled={savingId === 'home_page'} style={{ background: "#2563EB", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {savingId === 'home_page' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Beranda
            </button>
          </div>
        </div>
      </section>

      {/* Editor About Page */}
      <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
        {/* ... (Dilewati, bagian about diringkas jika perlu, atau kita injek tabel baru di bawahnya) -> Ini replace line 121, jadi kita paste about kembali plus telemetry */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Konten Halaman Tentang</h3>
        </div>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Judul Misi (Mission Title)</label>
            <input 
              type="text" 
              value={data['about_page']?.mission_title || ""} 
              onChange={e => handlePropChange('about_page', 'mission_title', e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Teks Misi (Mission Text)</label>
            <textarea 
              rows={4}
              value={data['about_page']?.mission_text || ""} 
              onChange={e => handlePropChange('about_page', 'mission_text', e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button onClick={() => handleSave('about_page')} disabled={savingId === 'about_page'} style={{ background: "#2563EB", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {savingId === 'about_page' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Tentang
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}
