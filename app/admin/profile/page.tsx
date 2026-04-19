"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Save, AlertCircle, Loader2, CheckCircle2, Lock, User, AtSign } from "lucide-react";

export default function AdminProfilePage() {
  const [data, setData] = useState({ fullName: "", email: "" });
  const [password, setPassword] = useState({ newPassword: "", confirmPassword: "" });
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{type: "success" | "error", msg: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         setUserId(user.id);
         setData({
             email: user.email || "",
             fullName: user.user_metadata?.full_name || user.user_metadata?.name || ""
         });
         
         const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
         if (profile?.full_name) {
             setData(prev => ({ ...prev, fullName: profile.full_name }));
         }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      
      const { error: err1 } = await supabase.auth.updateUser({
          data: { full_name: data.fullName.trim() }
      });
      if (err1) throw err1;

      if (userId) {
          const { error: err2 } = await supabase.from('profiles').update({
              full_name: data.fullName.trim()
          }).eq('id', userId);
          if (err2) throw err2;
      }
      
      setFeedback({ type: "success", msg: "Identitas profil berhasil diperbarui!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
       setFeedback({ type: "error", msg: "Gagal menyimpan: " + e.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    setFeedback(null);
    if (password.newPassword.length < 6) {
        setFeedback({ type: "error", msg: "Password baru minimal 6 karakter." });
        return;
    }
    if (password.newPassword !== password.confirmPassword) {
        setFeedback({ type: "error", msg: "Konfirmasi password tidak sama." });
        return;
    }
    
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: password.newPassword });
      if (error) throw error;
      
      setPassword({ newPassword: "", confirmPassword: "" });
      setFeedback({ type: "success", msg: "Kata sandi sistem berhasil dirubah!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
       setFeedback({ type: "error", msg: "Gagal merubah sandi: " + e.message });
    } finally {
      setSavingPassword(false);
    }
  }

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
          Profil & Keamanan
        </h2>
        <p style={{ color: "#64748B", fontSize: "13px" }}>
          Kelola informasi fundamental akun administrator Anda.
        </p>
      </div>

      {feedback && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2", color: feedback.type === "success" ? "#166534" : "#991B1B", border: `1px solid ${feedback.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {feedback.msg}
        </div>
      )}

      {/* Editor Profile */}
      <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "22px" }}>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.18)", flexShrink: 0, color: "#2563EB" }}>
             <User size={18} />
           </div>
           <div>
             <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", marginBottom: "3px" }}>Identitas Admin</h3>
             <p style={{ fontSize: "13px", color: "#64748B" }}>Perbarui nama yang akan tampil pada log sistem.</p>
           </div>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                <AtSign size={14} color="#64748B" /> Alamat Email Utama (Read-only)
            </label>
            <input 
              type="email" 
              value={data.email} 
              disabled
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#F1F5F9", color: "#94A3B8", fontSize: "14px", outline: "none", fontFamily: "inherit", cursor: "not-allowed" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                <User size={14} color="#64748B" /> Nama Admin
            </label>
            <input 
              type="text" 
              value={data.fullName} 
              onChange={e => setData(prev => ({...prev, fullName: e.target.value}))}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button onClick={handleSaveProfile} disabled={savingProfile} style={{ background: "#2563EB", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Identitas
            </button>
          </div>
        </div>
      </section>

      {/* Editor Password */}
      <section style={{ background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "22px" }}>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.18)", flexShrink: 0, color: "#EA580C" }}>
             <Lock size={18} />
           </div>
           <div>
             <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", marginBottom: "3px" }}>Ubah Kata Sandi</h3>
             <p style={{ fontSize: "13px", color: "#64748B" }}>Ubah password agar akses dashboard tetap terlindungi.</p>
           </div>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Kata Sandi Baru</label>
            <input 
              type="password" 
              value={password.newPassword} 
              onChange={e => setPassword(prev => ({...prev, newPassword: e.target.value}))}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Konfirmasi Sandi Baru</label>
            <input 
              type="password" 
              value={password.confirmPassword} 
              onChange={e => setPassword(prev => ({...prev, confirmPassword: e.target.value}))}
              style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
              placeholder="Ketik ulang sandi"
            />
          </div>
          
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button onClick={handleSavePassword} disabled={savingPassword} style={{ background: "#EA580C", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Perbarui Sandi
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
