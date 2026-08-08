"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PackageSearch, Handshake, Clock, PlusCircle } from "lucide-react";
import { cancelWtbOffer } from "@/app/actions/wtb";

export type MyRequest = {
  id: string;
  title: string;
  category: string;
  budget_max: number;
  city: string;
  status: string;
  created_at: string;
  expires_at: string;
  offerCount: number;
  pendingOfferCount: number;
};

export type MyOffer = {
  id: string;
  wtb_id: string;
  item_name: string;
  price: number;
  status: string;
  created_at: string;
  wtb_title: string;
  wtb_status: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  glass: "Kaca",
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  textile: "Tekstil",
  electronic: "Elektronik",
  other: "Lainnya",
};

const REQUEST_STATUS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  open: { label: "Aktif", bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" },
  in_checkout: { label: "Menunggu Bayar", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  fulfilled: { label: "Terpenuhi", bg: "#f0fdf4", border: "#86efac", text: "#14532d" },
  closed: { label: "Ditutup", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
  expired: { label: "Kedaluwarsa", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
};

const OFFER_STATUS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  pending: { label: "Menunggu Respon", bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  accepted: { label: "Diterima", bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" },
  rejected: { label: "Ditolak", bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  cancelled: { label: "Dibatalkan", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
};

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function chipStyle(d: { bg: string; border: string; text: string }): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    background: d.bg,
    color: d.text,
    border: `1px solid ${d.border}`,
    padding: "4px 12px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  };
}

export default function WtbDashboard({
  requests,
  offers,
}: {
  requests: MyRequest[];
  offers: MyOffer[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"requests" | "offers">("requests");
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleCancelOffer = (offerId: string) => {
    setError("");
    setCancellingId(offerId);
    startTransition(async () => {
      const result = await cancelWtbOffer(offerId);
      if (result?.error) setError(result.error);
      router.refresh();
      setCancellingId(null);
    });
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    border: active ? "1px solid rgba(39,174,96,0.3)" : "1px solid transparent",
    background: active ? "rgba(39,174,96,0.1)" : "transparent",
    color: active ? "#1E8449" : "#737369",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", marginBottom: 4 }}>
            Permintaan WTB
          </h2>
          <p style={{ color: "#737369", fontSize: 13 }}>
            Posting barang yang Anda cari, atau pantau tawaran yang Anda kirim.
          </p>
        </div>
        <Link
          href="/wtb/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #d97706, #b45309)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            padding: "11px 20px",
            borderRadius: 999,
            textDecoration: "none",
            boxShadow: "0 6px 16px rgba(180,83,9,0.25)",
          }}
        >
          <PlusCircle size={15} />
          Buat Permintaan
        </Link>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 14, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 999, padding: 5, width: "fit-content", border: "1px solid #EFEFEB" }}>
        <button style={tabBtn(tab === "requests")} onClick={() => setTab("requests")}>
          <PackageSearch size={15} />
          Permintaan Saya ({requests.length})
        </button>
        <button style={tabBtn(tab === "offers")} onClick={() => setTab("offers")}>
          <Handshake size={15} />
          Tawaran Terkirim ({offers.length})
        </button>
      </div>

      {tab === "requests" ? (
        <section style={{ borderRadius: 24, border: "1px solid #EFEFEB", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {requests.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                <Search size={28} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1A" }}>Belum Ada Permintaan</p>
              <p style={{ fontSize: 13, color: "#A3A39B" }}>Cari barang bekas yang Anda butuhkan — biar penjual yang datang kepada Anda.</p>
            </div>
          ) : (
            requests.map((r) => {
              const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.open;
              const expired = r.status === "open" && daysLeft(r.expires_at) <= 0;
              return (
                <Link
                  key={r.id}
                  href={`/wtb/${r.id}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 24px", borderBottom: "1px solid #EFEFEB", textDecoration: "none", color: "inherit", flexWrap: "wrap" }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1A" }}>{r.title}</h3>
                      <span style={chipStyle(expired ? REQUEST_STATUS.expired : st)}>
                        {expired ? REQUEST_STATUS.expired.label : st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#A3A39B" }}>
                      {CATEGORY_LABELS[r.category] || r.category} · {r.city} · {formatDate(r.created_at)}
                      {r.status === "open" && !expired && ` · sisa ${daysLeft(r.expires_at)} hari`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    {r.pendingOfferCount > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e", background: "#fef9c3", border: "1px solid #fde047", padding: "4px 12px", borderRadius: 999 }}>
                        {r.pendingOfferCount} tawaran baru
                      </span>
                    )}
                    {r.status === "in_checkout" && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>
                        Lanjut bayar →
                      </span>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#b45309" }}>
                      {formatRupiah(r.budget_max)}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      ) : (
        <section style={{ borderRadius: 24, border: "1px solid #EFEFEB", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {offers.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                <Handshake size={28} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1A" }}>Belum Ada Tawaran Terkirim</p>
              <p style={{ fontSize: 13, color: "#A3A39B" }}>Jelajahi papan &quot;Sedang Dicari&quot; dan tawarkan barang Anda di sana.</p>
            </div>
          ) : (
            offers.map((o) => {
              const st = OFFER_STATUS[o.status] ?? OFFER_STATUS.pending;
              return (
                <div
                  key={o.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 24px", borderBottom: "1px solid #EFEFEB", flexWrap: "wrap" }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1A1A1A" }}>{o.item_name}</h3>
                      <span style={chipStyle(st)}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#A3A39B" }}>
                      untuk permintaan{" "}
                      <Link href={`/wtb/${o.wtb_id}`} style={{ color: "#1E8449", fontWeight: 700, textDecoration: "none" }}>
                        {o.wtb_title}
                      </Link>
                      {" "}· {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1E8449" }}>
                      {formatRupiah(o.price)}
                    </span>
                    {o.status === "pending" && (
                      <button
                        onClick={() => handleCancelOffer(o.id)}
                        disabled={isPending && cancellingId === o.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#b91c1c",
                          background: "#fff",
                          border: "1px solid #fecaca",
                          padding: "7px 14px",
                          borderRadius: 999,
                          cursor: isPending && cancellingId === o.id ? "wait" : "pointer",
                          opacity: isPending && cancellingId === o.id ? 0.6 : 1,
                        }}
                      >
                        <Clock size={13} />
                        {isPending && cancellingId === o.id ? "Membatalkan..." : "Batalkan"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
