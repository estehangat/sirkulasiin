"use client";

import { useState, useEffect, ReactElement } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Pencil, Trash2, AlertTriangle, X, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function ListingActions({ id }: { id: string }): ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // For portal rendering consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setStatusMsg(null);
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    setIsDeleting(false);
    setShowModal(false);

    if (error) {
      setStatusMsg({ type: "error", text: "Gagal menghapus: " + error.message });
      setTimeout(() => setStatusMsg(null), 5000);
    } else {
      setStatusMsg({ type: "success", text: "Produk berhasil dihapus selamanya." });
      setTimeout(() => setStatusMsg(null), 5000);
      router.refresh();
    }
  };

  const modalContent = showModal ? (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)", display: "flex",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999, WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px", padding: "24px",
        width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", gap: "16px",
        animation: "modalFadeIn 0.2s ease-out forwards"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "#fef2f2", color: "#dc2626", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={() => !isDeleting && setShowModal(false)} disabled={isDeleting} style={{
            background: "transparent", border: "none", cursor: isDeleting ? "not-allowed" : "pointer",
            color: "#A3A39B", padding: "4px"
          }}>
            <X size={20} />
          </button>
        </div>

        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "6px" }}>Hapus Produk?</h3>
          <p style={{ fontSize: "14px", color: "#52524C", lineHeight: 1.5 }}>
            Tindakan ini tidak dapat dibatalkan. Barangan akan dihapus secara permanen dari daftar Marketplace Anda beserta riwayatnya.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button onClick={() => setShowModal(false)} disabled={isDeleting} style={{
            flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid #EFEFEB",
            background: "#fff", color: "#3D3D38", fontSize: "14px", fontWeight: 700,
            cursor: isDeleting ? "not-allowed" : "pointer"
          }}>
            Batal
          </button>
          <button onClick={confirmDelete} disabled={isDeleting} style={{
            flex: 1, padding: "10px", borderRadius: "12px", border: "none",
            background: "#dc2626", color: "#fff", fontSize: "14px", fontWeight: 700,
            cursor: isDeleting ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(220,38,38,0.25)"
          }}>
            {isDeleting ? "Menghapus..." : "Hapus Permanen"}
          </button>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes toastSlideDown {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}} />
      </div>
    </div>
  ) : null;

  const toastContent = statusMsg ? (
    <div style={{
      position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      padding: "14px 18px", borderRadius: "14px",
      border: `1px solid ${statusMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
      background: statusMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
      color: statusMsg.type === "success" ? "#166534" : "#991b1b",
      fontWeight: 600, fontSize: "14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      animation: "toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {statusMsg.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        {statusMsg.text}
      </div>
      <button onClick={() => setStatusMsg(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}>
        <X size={16}/>
      </button>
    </div>
  ) : null;

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      <Link
        href={`/dashboard/listings/${id}/edit`}
        title="Edit Produk"
        style={{
          background: "transparent",
          border: "none",
          padding: "8px",
          borderRadius: "8px",
          cursor: isDeleting ? "not-allowed" : "pointer",
          color: "#A3A39B",
          display: "flex",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#f4f4f0")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Pencil size={18} />
      </Link>
      <button
        onClick={() => setShowModal(true)}
        title="Hapus Produk"
        disabled={isDeleting}
        style={{
          background: "transparent",
          border: "none",
          padding: "8px",
          borderRadius: "8px",
          cursor: isDeleting ? "not-allowed" : "pointer",
          color: isDeleting ? "#EFEFEB" : "#ef4444",
          display: "flex",
          transition: "background 0.2s",
          outline: "none",
        }}
        onMouseOver={(e) => {
          if (!isDeleting) e.currentTarget.style.background = "#fef2f2";
        }}
        onMouseOut={(e) => {
          if (!isDeleting) e.currentTarget.style.background = "transparent";
        }}
      >
        <Trash2 size={18} />
      </button>

      {/* Render modal directly in document.body to avoid stacking context issues */}
      {mounted && showModal && createPortal(modalContent, document.body)}
      {mounted && statusMsg && createPortal(toastContent, document.body)}
    </div>
  );
}
