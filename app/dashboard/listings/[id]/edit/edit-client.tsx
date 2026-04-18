"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Camera, CheckCircle2, ChevronLeft, Save, X, XCircle } from "lucide-react";
import Link from "next/link";

type ListingForm = {
  title: string;
  description: string;
  price: string;
  category: string;
  status: string;
  image_url: string;
};

type EditableListing = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  status: string | null;
  image_url: string | null;
};

export default function EditListingClient({ listing }: { listing: EditableListing }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<ListingForm>({
    title: listing.title || "",
    description: listing.description || "",
    price: listing.price?.toString() || "0",
    category: listing.category || "other",
    status: listing.status || "draft",
    image_url: listing.image_url || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onChange = (key: keyof ListingForm, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleUploadImage = async (file: File) => {
    setStatusMsg(null);
    if (!file.type.startsWith("image/")) {
      setStatusMsg({ type: "error", text: "File harus berupa gambar." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Ukuran maksimal 2MB." });
      return;
    }
    setUploadingImage(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `listings/${listing.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("scan-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploadingImage(false);
      setStatusMsg({ type: "error", text: uploadError.message });
      return;
    }

    const { data } = supabase.storage.from("scan-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    setUploadingImage(false);
    setStatusMsg({ type: "success", text: "Gambar diunggah. Jangan lupa simpan!" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const priceNum = parseInt(form.price, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      setStatusMsg({ type: "error", text: "Harga tidak valid." });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("marketplace_listings")
      .update({
        title: form.title,
        description: form.description,
        price: priceNum,
        category: form.category,
        status: form.status,
        image_url: form.image_url,
      })
      .eq("id", listing.id);

    setSaving(false);
    if (error) {
      setStatusMsg({ type: "error", text: "Gagal menyimpan: " + error.message });
    } else {
      setStatusMsg({ type: "success", text: "Produk berhasil diperbarui!" });
      router.refresh();
      setTimeout(() => router.push("/dashboard/listings"), 1500);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #EFEFEB",
    background: "#f7f7f5",
    fontSize: "14px",
    color: "#1A1A1A",
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <div style={{ display: "grid", gap: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Toast Notification */}
      {statusMsg && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderRadius: "14px",
          border: `1px solid ${statusMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          background: statusMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: statusMsg.type === "success" ? "#166534" : "#991b1b",
          fontWeight: 600, fontSize: "14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {statusMsg.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {statusMsg.text}
          </div>
          <button onClick={() => setStatusMsg(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}><X size={16}/></button>
        </div>
      )}

      {/* Header Back Link */}
      <Link href="/dashboard/listings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#737369", fontSize: "13px", fontWeight: 700, textDecoration: "none", width: "fit-content" }}>
        <ChevronLeft size={16} /> Kembali ke daftar
      </Link>

      <form onSubmit={handleSave} style={{
        borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff",
        padding: "24px", display: "flex", flexDirection: "column", gap: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px" }}>Edit Produk</h1>
          <p style={{ fontSize: "13px", color: "#737369" }}>Perbarui detail barang Anda sebelum ditawarkan di Marketplace.</p>
        </div>

        {/* Gambar Preview */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", padding: "16px", borderRadius: "16px", background: "#f7f7f5", border: "1px solid #EFEFEB" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "12px", background: "#EFEFEB",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0
          }}>
            {form.image_url ? (
              <Image src={form.image_url} alt="Preview" width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
            ) : (
              <Camera size={24} color="#A3A39B" />
            )}
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#1A1A1A", marginBottom: "8px" }}>Foto Produk</p>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "10px", background: "#fff", border: "1px solid #EFEFEB",
              fontSize: "13px", fontWeight: 700, color: uploadingImage ? "#A3A39B" : "#3D3D38",
              cursor: uploadingImage ? "not-allowed" : "pointer"
            }}>
              <Camera size={14} /> {uploadingImage ? "Mengunggah..." : "Ganti Foto"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingImage} onChange={(e) => {
                if (e.target.files?.[0]) void handleUploadImage(e.target.files[0]);
              }}/>
            </label>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#52524C" }}>Judul Produk</span>
            <input required style={inputStyle} value={form.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Contoh: Kotak Kardus Bekas" />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#52524C" }}>Harga (Rp)</span>
            <input required type="number" min="0" style={inputStyle} value={form.price} onChange={(e) => onChange("price", e.target.value)} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#52524C" }}>Status</span>
            <select style={inputStyle} value={form.status} onChange={(e) => onChange("status", e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Publikasikan (Aktif)</option>
              <option value="reserved" disabled>Ditahan Sistem</option>
              <option value="sold">Terjual</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#52524C" }}>Kategori</span>
            <select style={inputStyle} value={form.category} onChange={(e) => onChange("category", e.target.value)}>
              <option value="glass">Kaca</option>
              <option value="plastic">Plastik</option>
              <option value="paper">Kertas & Kardus</option>
              <option value="metal">Logam / Metal</option>
              <option value="textile">Kain / Tekstil</option>
              <option value="electronic">Elektronik</option>
              <option value="other">Lainnya</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#52524C" }}>Deskripsi</span>
            <textarea style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Tuliskan kondisi barang, ukuran, dsb." />
          </label>

        </div>

        {/* Action bounds */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid #EFEFEB" }}>
          <button type="submit" disabled={saving} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "10px 20px", borderRadius: "12px", border: "none",
            background: saving ? "#A3A39B" : "#27AE60", color: "#fff",
            fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer"
          }}>
            <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>

      </form>
    </div>
  );
}
