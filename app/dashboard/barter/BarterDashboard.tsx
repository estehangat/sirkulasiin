"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { respondBarterOffer } from "@/app/actions/barter";
import { Inbox, Send, ArrowRightLeft, CheckCircle2, XCircle, Clock, Banknote, ShieldCheck, HelpCircle, Store, X, MessageSquare } from "lucide-react";

export type Listing = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
};

export type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type IncomingOffer = {
  id: string;
  created_at: string;
  status: string;
  offered_item_name: string;
  offered_item_description: string | null;
  cash_addition: number;
  message: string | null;
  seller_response: string | null;
  listing_id: string;
  marketplace_listings: Listing;
  profiles: Profile | null;
};

export type OutgoingOffer = {
  id: string;
  created_at: string;
  status: string;
  offered_item_name: string;
  offered_item_description: string | null;
  cash_addition: number;
  message: string | null;
  seller_response: string | null;
  listing_id: string;
  marketplace_listings: Listing;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusDesign(status: string) {
  switch (status) {
    case "pending": return { label: "Menunggu Respons", bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3", icon: <Clock size={14} /> };
    case "accepted": return { label: "Disepakati", bg: "#ecfdf3", border: "#bbf7d0", text: "#166534", icon: <CheckCircle2 size={14} /> };
    case "rejected": return { label: "Ditolak", bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <XCircle size={14} /> };
    case "cancelled": return { label: "Dibatalkan", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <X size={14} /> };
    default: return { label: status, bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <HelpCircle size={14} /> };
  }
}

export default function BarterDashboard({
  incomingOffers,
  outgoingOffers,
}: {
  incomingOffers: IncomingOffer[];
  outgoingOffers: OutgoingOffer[];
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const pendingIncoming = incomingOffers.filter((o) => o.status === "pending").length;

  const handleRespond = (offerId: string, status: "accepted" | "rejected") => {
    setFeedback(null);
    startTransition(async () => {
      const result = await respondBarterOffer(offerId, status, responseText || undefined);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: result?.success || "Berhasil!" });
        setRespondingId(null);
        setResponseText("");
        // Refresh page to get updated data
        window.location.reload();
      }
    });
  };

  const renderEmptyState = (type: "incoming" | "outgoing") => (
    <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "#fff", borderRadius: "24px", border: "1px solid #EFEFEB" }}>
      <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: type === "incoming" ? "#f0fdf4" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: type === "incoming" ? "#16a34a" : "#2563eb" }}>
        {type === "incoming" ? <Inbox size={28} /> : <Send size={28} />}
      </div>
      <div>
        <p style={{ fontSize: "16px", fontWeight: 800, color: "#1A1A1A" }}>
          {type === "incoming" ? "Belum ada tawaran masuk" : "Belum ada tawaran dikirim"}
        </p>
        <p style={{ fontSize: "14px", color: "#A3A39B", marginTop: "6px", maxWidth: "340px", margin: "6px auto 0", lineHeight: 1.5 }}>
          {type === "incoming" 
            ? "Aktifkan opsi barter saat membuat listing baru agar pengguna lain bisa mengajukan tawaran pada barang Anda." 
            : "Jelajahi marketplace sirkular kami dan tawarkan barang tidak terpakai Anda sebagai alat tukar."}
        </p>
      </div>
      {type === "outgoing" && (
        <Link href="/marketplace" style={{ marginTop: "12px", display: "inline-flex", background: "#27AE60", color: "#fff", padding: "10px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, textDecoration: "none", alignItems: "center", gap: "6px" }}>
          <Store size={16} /> Jelajahi Marketplace
        </Link>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ── Page Header & Tabs ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "4px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px" }}>
            Negosiasi Barter
          </h2>
          <p style={{ color: "#737369", fontSize: "13px" }}>
            Kelola tawaran pertukaran barang masuk dan yang Anda ajukan.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("incoming")}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "999px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2sease", border: "1px solid transparent",
            ...(tab === "incoming" ? { background: "#27AE60", color: "#fff", boxShadow: "0 4px 12px rgba(39, 174, 96, 0.2)" } : { background: "#F4F4F0", color: "#52524C", border: "1px solid #EFEFEB" })
          }}
        >
          <Inbox size={16} /> Tawaran Masuk {pendingIncoming > 0 && <span style={{ background: tab === "incoming" ? "#fff" : "#ef4444", color: tab === "incoming" ? "#27AE60" : "#fff", padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 900, marginLeft: "4px" }}>{pendingIncoming}</span>}
        </button>
        <button
          onClick={() => setTab("outgoing")}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "999px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2sease", border: "1px solid transparent",
            ...(tab === "outgoing" ? { background: "#27AE60", color: "#fff", boxShadow: "0 4px 12px rgba(39, 174, 96, 0.2)" } : { background: "#F4F4F0", color: "#52524C", border: "1px solid #EFEFEB" })
          }}
        >
          <Send size={16} /> Tawaran Terkirim
        </button>
      </div>

      {feedback && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "12px", background: feedback.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: feedback.type === "success" ? "#166534" : "#991b1b", fontSize: "14px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {feedback.type === "success" ? <ShieldCheck size={18} /> : <AlertCircle size={18} />} {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}><X size={16} /></button>
        </div>
      )}

      {/* ── Content Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", alignItems: "start" }}>
        
        {/* INCOMING TAB */}
        {tab === "incoming" && (
          incomingOffers.length === 0 ? renderEmptyState("incoming") : incomingOffers.map(offer => {
            const sDesign = getStatusDesign(offer.status);
            const offererName = offer.profiles?.full_name || offer.profiles?.username || "Pengguna Anonim";
            
            return (
              <article key={offer.id} style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                
                {/* Header Profile */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f4", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {offer.profiles?.avatar_url ? (
                       <Image src={offer.profiles.avatar_url} alt={offererName} width={36} height={36} style={{ borderRadius: "50%", objectFit: "cover" }} unoptimized />
                    ) : (
                       <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3730a3", fontWeight: 800, fontSize: "14px" }}>
                         {offererName.charAt(0).toUpperCase()}
                       </div>
                    )}
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "#1A1A1A" }}>{offererName}</p>
                      <p style={{ fontSize: "12px", color: "#A3A39B" }}>{formatDate(offer.created_at)}</p>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 800, background: sDesign.bg, color: sDesign.text, border: `1px solid ${sDesign.border}`, padding: "4px 10px", borderRadius: "99px" }}>
                     {sDesign.icon} {sDesign.label}
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div style={{ padding: "20px", display: "grid", gap: "16px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <div style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                       <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Tawaran Masuk</p>
                       <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{offer.offered_item_name}</p>
                     </div>
                     <div style={{ background: "#f1f5f9", padding: "8px", borderRadius: "50%", color: "#64748b" }}><ArrowRightLeft size={16} /></div>
                     <Link href={`/marketplace/${offer.marketplace_listings.id}`} style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", textDecoration: "none", display: "block" }}>
                       <p style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "6px", textTransform: "uppercase" }}>Listing Anda</p>
                       <p style={{ fontSize: "14px", fontWeight: 800, color: "#14532d" }}>{offer.marketplace_listings.title}</p>
                     </Link>
                   </div>

                   {/* Addons Cache/Messages */}
                   {(offer.cash_addition > 0 || offer.message || offer.offered_item_description) && (
                     <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                       {offer.cash_addition > 0 && (
                         <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", color: "#b45309", fontSize: "13px", fontWeight: 700 }}>
                           <Banknote size={16} /> + {formatRupiah(offer.cash_addition)} tambahan dana
                         </div>
                       )}
                       {offer.offered_item_description && (
                         <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "12px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "2px" }}>Deskripsi Barang Tambahan:</p>
                           <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>{offer.offered_item_description}</p>
                         </div>
                       )}
                       {offer.message && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><MessageSquare size={12} /> Pesan Pengaju</p>
                           <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #EFEFEB" }}>"{offer.message}"</p>
                         </div>
                       )}
                       {offer.seller_response && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Balasan Anda</p>
                           <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #27AE60" }}>"{offer.seller_response}"</p>
                         </div>
                       )}
                     </div>
                   )}
                </div>

                {/* Accept/Reject Action Area */}
                {offer.status === "pending" && (
                  <div style={{ borderTop: "1px solid #f5f5f4", padding: "16px 20px", background: "#fafaf9" }}>
                     {respondingId === offer.id ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                         <textarea
                           style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit" }}
                           placeholder="Tulis alasan jika menolak, atau sapaan jika menerima (opsional)..."
                           value={responseText}
                           onChange={(e) => setResponseText(e.target.value)}
                           rows={2}
                         />
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                           <button onClick={() => handleRespond(offer.id, "accepted")} disabled={isPending} style={{ padding: "10px", borderRadius: "10px", background: "#27AE60", color: "#fff", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                             {isPending ? "Memproses..." : <><CheckCircle2 size={16} /> Terima</>}
                           </button>
                           <button onClick={() => handleRespond(offer.id, "rejected")} disabled={isPending} style={{ padding: "10px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontWeight: 800, fontSize: "13px", border: "1px solid #fecaca", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                             {isPending ? "Memproses..." : <><XCircle size={16} /> Tolak</>}
                           </button>
                         </div>
                         <button onClick={() => { setRespondingId(null); setResponseText(""); }} style={{ padding: "8px", borderRadius: "8px", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: "12px", border: "none", cursor: "pointer", marginTop: "4px" }}>
                           Batal Respons
                         </button>
                       </div>
                     ) : (
                       <button onClick={() => setRespondingId(offer.id)} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#111827", color: "#f8fafc", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2sease" }}>
                         <MessageSquare size={16} /> Respons Barter Ini
                       </button>
                     )}
                  </div>
                )}
              </article>
            );
          })
        )}

        {/* OUTGOING TAB */}
        {tab === "outgoing" && (
          outgoingOffers.length === 0 ? renderEmptyState("outgoing") : outgoingOffers.map(offer => {
            const sDesign = getStatusDesign(offer.status);
            
            return (
              <article key={offer.id} style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                
                {/* Header Profile */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f4", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                     <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3730a3" }}>
                       <Send size={16} />
                     </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "#1A1A1A" }}>Tawaran Anda</p>
                      <p style={{ fontSize: "12px", color: "#A3A39B" }}>{formatDate(offer.created_at)}</p>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 800, background: sDesign.bg, color: sDesign.text, border: `1px solid ${sDesign.border}`, padding: "4px 10px", borderRadius: "99px" }}>
                     {sDesign.icon} {sDesign.label}
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div style={{ padding: "20px", display: "grid", gap: "16px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <div style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                       <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>Barang Anda</p>
                       <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{offer.offered_item_name}</p>
                     </div>
                     <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "50%", color: "#94a3b8" }}><ArrowRightLeft size={16} /></div>
                     <Link href={`/marketplace/${offer.marketplace_listings.id}`} style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "#f5f3ff", border: "1px dashed #ddd6fe", textDecoration: "none", display: "block" }}>
                       <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", marginBottom: "6px", textTransform: "uppercase" }}>Diinginkan</p>
                       <p style={{ fontSize: "14px", fontWeight: 800, color: "#5b21b6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{offer.marketplace_listings.title}</p>
                     </Link>
                   </div>

                   {/* Addons Cache/Messages */}
                   {(offer.cash_addition > 0 || offer.message || offer.offered_item_description) && (
                     <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                       {offer.cash_addition > 0 && (
                         <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", color: "#b45309", fontSize: "13px", fontWeight: 700 }}>
                           <Banknote size={16} /> + {formatRupiah(offer.cash_addition)} tambahan dana
                         </div>
                       )}
                       {offer.offered_item_description && (
                         <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "12px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "2px" }}>Deskripsi Anda:</p>
                           <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>{offer.offered_item_description}</p>
                         </div>
                       )}
                       {offer.message && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><MessageSquare size={12} /> Pesan Ekto</p>
                           <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #EFEFEB" }}>"{offer.message}"</p>
                         </div>
                       )}
                       {offer.seller_response && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Balasan Penjual</p>
                           <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #27AE60" }}>"{offer.seller_response}"</p>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </article>
            );
          })
        )}

      </div>
    </div>
  );
}
