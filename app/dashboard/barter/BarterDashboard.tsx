"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { cancelBarterOffer, respondBarterOffer, updateBarterLifecycle } from "@/app/actions/barter";
import { Inbox, Send, ArrowRightLeft, CheckCircle2, XCircle, Clock, Banknote, ShieldCheck, HelpCircle, Store, X, MessageSquare, AlertCircle, Truck, PackageCheck } from "lucide-react";

export type Listing = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
};

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type IncomingOffer = {
  id: string;
  created_at: string;
  status: string;
  accepted_at?: string | null;
  owner_shipped_at?: string | null;
  offerer_shipped_at?: string | null;
  owner_completed_at?: string | null;
  offerer_completed_at?: string | null;
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
  accepted_at?: string | null;
  owner_shipped_at?: string | null;
  offerer_shipped_at?: string | null;
  owner_completed_at?: string | null;
  offerer_completed_at?: string | null;
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
    case "completed": return { label: "Barter Selesai", bg: "#f0fdf4", border: "#86efac", text: "#14532d", icon: <PackageCheck size={14} /> };
    case "rejected": return { label: "Ditolak", bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <XCircle size={14} /> };
    case "cancelled": return { label: "Dibatalkan", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <X size={14} /> };
    default: return { label: status, bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <HelpCircle size={14} /> };
  }
}

function lifecycleLabel(offer: IncomingOffer | OutgoingOffer) {
  if (offer.status === "completed") return "Selesai";
  if (offer.owner_completed_at || offer.offerer_completed_at) return "Menunggu Konfirmasi Akhir";
  if (offer.owner_shipped_at || offer.offerer_shipped_at) return "Sedang Dikirim / Diserahkan";
  if (offer.status === "accepted") return "Siap Diproses";
  return null;
}

export default function BarterDashboard({
  incomingOffers,
  outgoingOffers,
}: {
  incomingOffers: IncomingOffer[];
  outgoingOffers: OutgoingOffer[];
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "completed" | "rejected" | "cancelled">("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const pendingIncoming = incomingOffers.filter((o) => o.status === "pending").length;
  const totalOutgoing = outgoingOffers.length;

  useEffect(() => {
    if (incomingOffers.length === 0 && outgoingOffers.length > 0) {
      setTab("outgoing");
    }
  }, [incomingOffers.length, outgoingOffers.length]);
  const activeOffers = tab === "incoming" ? incomingOffers : outgoingOffers;
  const filteredIncomingOffers =
    statusFilter === "all"
      ? incomingOffers
      : incomingOffers.filter((offer) => offer.status === statusFilter);
  const filteredOutgoingOffers =
    statusFilter === "all"
      ? outgoingOffers
      : outgoingOffers.filter((offer) => offer.status === statusFilter);
  const summary = {
    all: activeOffers.length,
    pending: activeOffers.filter((offer) => offer.status === "pending").length,
    accepted: activeOffers.filter((offer) => offer.status === "accepted").length,
    completed: activeOffers.filter((offer) => offer.status === "completed").length,
    rejected: activeOffers.filter((offer) => offer.status === "rejected").length,
    cancelled: activeOffers.filter((offer) => offer.status === "cancelled").length,
  };

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

  const handleCancel = (offerId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await cancelBarterOffer(offerId);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: result?.success || "Tawaran dibatalkan." });
        window.location.reload();
      }
    });
  };

  const handleLifecycle = (offerId: string, action: "mark_shipped" | "mark_completed") => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateBarterLifecycle(offerId, action);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: result?.success || "Progres barter diperbarui." });
        window.location.reload();
      }
    });
  };

  const renderLifecycle = (offer: IncomingOffer | OutgoingOffer, isOwnerView: boolean) => {
    if (!["accepted", "completed"].includes(offer.status)) return null;

    const selfShipped = isOwnerView ? offer.owner_shipped_at : offer.offerer_shipped_at;
    const otherShipped = isOwnerView ? offer.offerer_shipped_at : offer.owner_shipped_at;
    const selfCompleted = isOwnerView ? offer.owner_completed_at : offer.offerer_completed_at;
    const otherCompleted = isOwnerView ? offer.offerer_completed_at : offer.owner_completed_at;

    const steps = [
      { label: "Barter disepakati", done: !!offer.accepted_at },
      { label: isOwnerView ? "Barang Anda dikirim/diserahkan" : "Barang Anda dikirim/diserahkan", done: !!selfShipped },
      { label: isOwnerView ? "Pihak lawan mengirim barang" : "Pihak lawan mengirim barang", done: !!otherShipped },
      { label: "Konfirmasi selesai dari Anda", done: !!selfCompleted },
      { label: "Konfirmasi selesai kedua pihak", done: !!selfCompleted && !!otherCompleted },
    ];

    return (
      <div style={{ marginTop: "4px", display: "grid", gap: "12px" }}>
        <div style={{ padding: "14px", borderRadius: "16px", background: "#fafaf9", border: "1px solid #EFEFEB" }}>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "#737369", marginBottom: "8px" }}>Timeline Barter</p>
          <div style={{ display: "grid", gap: "8px" }}>
            {steps.map((step) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: step.done ? "#dcfce7" : "#f3f4f6",
                    color: step.done ? "#166534" : "#6b7280",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={12} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: step.done ? 700 : 600, color: step.done ? "#166534" : "#52525b" }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {lifecycleLabel(offer) ? (
            <p style={{ margin: "10px 0 0", fontSize: "12px", fontWeight: 800, color: "#1d4ed8" }}>
              Status Operasional: {lifecycleLabel(offer)}
            </p>
          ) : null}
        </div>

        {offer.status !== "completed" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {!selfShipped && (
              <button
                onClick={() => handleLifecycle(offer.id, "mark_shipped")}
                disabled={isPending}
                style={{ padding: "10px 12px", borderRadius: "12px", background: "#2563eb", color: "#fff", border: "none", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Truck size={15} /> {isPending ? "Memproses..." : "Tandai Sudah Dikirim"}
              </button>
            )}
            {selfShipped && otherShipped && !selfCompleted && (
              <button
                onClick={() => handleLifecycle(offer.id, "mark_completed")}
                disabled={isPending}
                style={{ padding: "10px 12px", borderRadius: "12px", background: "#16a34a", color: "#fff", border: "none", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <PackageCheck size={15} /> {isPending ? "Memproses..." : "Tandai Barter Selesai"}
              </button>
            )}
          </div>
        )}
      </div>
    );
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
          {totalOutgoing > 0 && (
            <span
              style={{
                background: tab === "outgoing" ? "#fff" : "#2563eb",
                color: tab === "outgoing" ? "#27AE60" : "#fff",
                padding: "2px 8px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 900,
                marginLeft: "4px",
              }}
            >
              {totalOutgoing}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
        {([
          ["all", "Semua"],
          ["pending", "Pending"],
          ["accepted", "Disepakati"],
          ["completed", "Selesai"],
          ["rejected", "Ditolak"],
          ["cancelled", "Dibatalkan"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              textAlign: "left",
              padding: "12px 14px",
              borderRadius: "16px",
              border: statusFilter === key ? "1px solid #86efac" : "1px solid #EFEFEB",
              background: statusFilter === key ? "#f0fdf4" : "#fff",
              cursor: "pointer",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#737369", margin: 0 }}>{label}</p>
            <p style={{ fontSize: "20px", fontWeight: 900, color: "#1A1A1A", margin: "4px 0 0" }}>
              {summary[key]}
            </p>
          </button>
        ))}
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
          filteredIncomingOffers.length === 0 ? renderEmptyState("incoming") : filteredIncomingOffers.map(offer => {
            const sDesign = getStatusDesign(offer.status);
            const offererName = offer.profiles?.full_name || offer.profiles?.username || "Pengguna Anonim";
            
            return (
              <article key={offer.id} style={{ borderRadius: "24px", border: "1px solid #EFEFEB", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                
                {/* Header Profile */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f4", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf9" }}>
                  <Link href={`/profile?id=${offer.profiles?.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
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
                  </Link>
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
                            <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #EFEFEB" }}>&ldquo;{offer.message}&rdquo;</p>
                         </div>
                       )}
                       {offer.seller_response && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Balasan Anda</p>
                            <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #27AE60" }}>&ldquo;{offer.seller_response}&rdquo;</p>
                      </div>
                    )}

                    {renderLifecycle(offer, true)}
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
          filteredOutgoingOffers.length === 0 ? renderEmptyState("outgoing") : filteredOutgoingOffers.map(offer => {
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
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><MessageSquare size={12} /> Pesan Anda</p>
                            <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #EFEFEB" }}>&ldquo;{offer.message}&rdquo;</p>
                         </div>
                       )}
                       {offer.seller_response && (
                         <div style={{ paddingTop: "8px" }}>
                           <p style={{ fontSize: "12px", fontWeight: 700, color: "#A3A39B", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Balasan Penjual</p>
                            <p style={{ fontSize: "14px", color: "#3D3D38", fontStyle: "italic", paddingLeft: "10px", borderLeft: "2px solid #27AE60" }}>&ldquo;{offer.seller_response}&rdquo;</p>
                      </div>
                     )}

                   {renderLifecycle(offer, false)}
                  </div>
                    )}
                 </div>

                 {offer.status === "pending" && (
                   <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
                     <button
                       onClick={() => handleCancel(offer.id)}
                       disabled={isPending}
                       style={{
                         padding: "10px 14px",
                         borderRadius: "12px",
                         background: "#fff",
                         color: "#991b1b",
                         border: "1px solid #fecaca",
                         fontWeight: 800,
                         fontSize: "13px",
                         cursor: "pointer",
                       }}
                     >
                       {isPending ? "Memproses..." : "Batalkan Tawaran"}
                     </button>
                   </div>
                 )}
               </article>
             );
           })
        )}

      </div>
    </div>
  );
}
