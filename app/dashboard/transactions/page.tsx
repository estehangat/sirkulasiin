import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import TransactionButtons from "./ClientButtons";
import styles from "./transactions.module.css";
import {
  ShoppingBag,
  Box,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Package,
  ShieldCheck,
  Wallet,
  Truck,
  ExternalLink,
  ImageIcon,
  Inbox,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Transaksi — SirkulasiIn",
  description: "Riwayat transaksi marketplace dan rewards Anda.",
};

const statusMap: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid_escrow: "Dana Ditahan di Escrow",
  payment_failed: "Pembayaran Gagal",
  payment_expired: "Pembayaran Kedaluwarsa",
  shipped: "Sedang Dikirim",
  completed: "Selesai",
  paid_out: "Dana Dicairkan",
  cancelled: "Dibatalkan",
};

function formatOrderChip(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

type OrderRow = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  payout_status?: string | null;
  delivery_status?: string | null;
  shipping_courier?: string | null;
  shipping_service?: string | null;
  shipping_order_id?: string | null;
  escrow_status?: string | null;
  pickup_status?: string | null;
  awb?: string | null;
  public_tracking_url?: string | null;
  listing_id?: string | null;
  wtb_offer_id?: string | null;
  marketplace_listings?: { id: string; title: string; image_url: string } | null;
  wtb_offers?: { item_name: string; item_image_url: string } | null;
};

const COURIER_LABELS: Record<string, string> = {
  jne: "JNE",
  pos: "POS Indonesia",
  jnt: "J&T Express",
  sicepat: "SiCepat",
  tiki: "TIKI",
  anteraja: "AnterAja",
  ninja: "Ninja Xpress",
  gosend: "GoSend",
  grab: "GrabExpress",
};

const DELIVERY_STATUS_LABELS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  pending: { label: "Menunggu Pickup", bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  picked_up: { label: "Sudah Diambil Kurir", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  in_transit: { label: "Dalam Perjalanan", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  out_for_delivery: { label: "Pengiriman Akhir", bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  delivered: { label: "Sudah Sampai", bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" },
  returned: { label: "Dikembalikan", bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  cancelled: { label: "Dibatalkan", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
};

function getDeliveryDesign(status?: string | null) {
  if (!status || status === "unknown") return null;
  return DELIVERY_STATUS_LABELS[status] || { label: status.replace(/_/g, " "), bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
}

function formatCourierLabel(courier?: string | null, service?: string | null) {
  if (!courier) return null;
  const name = COURIER_LABELS[courier.toLowerCase()] || courier.toUpperCase();
  return service ? `${name} ${service.toUpperCase()}` : name;
}

function getStatusDesign(status: string) {
  if (status === "paid_escrow") {
    return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", icon: <ShieldCheck size={14} /> };
  }
  if (status === "pending_payment") {
    return { bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3", icon: <Clock size={14} /> };
  }
  if (status === "shipped") {
    return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: <Package size={14} /> };
  }
  if (status === "completed") {
    return { bg: "#ecfdf3", border: "#bbf7d0", text: "#166534", icon: <CheckCircle2 size={14} /> };
  }
  if (status === "paid_out") {
    return { bg: "#f0fdf4", border: "#86efac", text: "#14532d", icon: <Wallet size={14} /> };
  }
  if (status === "payment_failed") {
    return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <AlertCircle size={14} /> };
  }
  if (status === "payment_expired" || status === "cancelled") {
    return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: <AlertTriangle size={14} /> };
  }
  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: null };
}

function getPayoutDesign(payoutStatus?: string | null) {
  if (!payoutStatus) return null;

  if (payoutStatus === "ready_for_payout") return { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75" };
  if (payoutStatus === "requested") return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
  if (payoutStatus === "approved") return { bg: "#ecfdf3", border: "#bbf7d0", text: "#166534" };
  if (payoutStatus === "processing") return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" };
  if (payoutStatus === "paid_out") return { bg: "#f0fdf4", border: "#86efac", text: "#14532d" };
  if (payoutStatus === "rejected" || payoutStatus === "failed") return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" };

  return { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };
}

/* ── Tab model ─────────────────────────────────────────────────────────── */

type TabKey = "pembelian" | "penjualan";
type BucketKey = "all" | "action" | "escrow" | "shipped" | "done" | "cancelled" | "payout";

const TAB_META: Record<TabKey, { label: string; icon: React.ReactNode; emptyTitle: string; emptyHint: string; cta: { label: string; href: string } | null }> = {
  pembelian: {
    label: "Pembelian",
    icon: <ShoppingBag size={16} />,
    emptyTitle: "Belum ada pembelian",
    emptyHint: "Temukan barang sirkular yang layak dipakai kembali di Marketplace.",
    cta: { label: "Jelajahi Marketplace", href: "/marketplace" },
  },
  penjualan: {
    label: "Penjualan",
    icon: <Box size={16} />,
    emptyTitle: "Belum ada penjualan",
    emptyHint: "Daftarkan barang yang masih layak pakai dan mulai jual.",
    cta: { label: "Buat Listing", href: "/marketplace/create" },
  },
};

const BUCKETS: { key: BucketKey; label: string; dot: string; hint: string }[] = [
  { key: "all", label: "Semua", dot: "#27AE60", hint: "Semua pesanan dalam tab ini." },
  { key: "action", label: "Perlu Aksi", dot: "#F59E0B", hint: "Pembayaran yang belum selesai atau gagal." },
  { key: "escrow", label: "Diproses", dot: "#14B8A6", hint: "Dana ditahan escrow, menunggu pengiriman." },
  { key: "shipped", label: "Dikirim", dot: "#3B82F6", hint: "Pesanan yang sedang dalam pengiriman." },
  { key: "done", label: "Selesai", dot: "#22C55E", hint: "Pesanan selesai dan dana telah/pending dicairkan." },
  { key: "cancelled", label: "Gagal & Batal", dot: "#9CA3AF", hint: "Pesanan dibatalkan atau tidak jadi." },
  { key: "payout", label: "Pencairan Dana", dot: "#0D9488", hint: "Dana penjualan yang sedang menuju ke rekening Anda." },
];

const STATUS_BUCKET: Record<string, BucketKey> = {
  pending_payment: "action",
  payment_failed: "action",
  payment_expired: "action",
  paid_escrow: "escrow",
  shipped: "shipped",
  completed: "done",
  paid_out: "done",
  cancelled: "cancelled",
};

function filterByBucket(list: OrderRow[], bucket: BucketKey): OrderRow[] {
  if (bucket === "all") return list;
  if (bucket === "payout") return list.filter((o) => !!o.payout_status);
  return list.filter((o) => STATUS_BUCKET[o.status] === bucket);
}

function countByBucket(list: OrderRow[], bucket: BucketKey): number {
  return filterByBucket(list, bucket).length;
}

function bucketLabel(bucket: BucketKey): string {
  return BUCKETS.find((b) => b.key === bucket)?.label || "Semua";
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pakai admin client untuk bypass RLS pada join marketplace_listings.
  // Setelah order paid, listing status berubah jadi reserved/sold sehingga
  // user-context RLS memblokir join dan membuat listing tampak null.
  // Filter buyer_id/seller_id eksplisit menjaga keamanan akses.
  const adminSupabase = createAdminSupabaseClient();

  const { data: purchasesQuery } = await adminSupabase
    .from("orders")
    .select("*, marketplace_listings(id, title, image_url), wtb_offers(item_name, item_image_url)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: salesQuery } = await adminSupabase
    .from("orders")
    .select("*, marketplace_listings(id, title, image_url), wtb_offers(item_name, item_image_url)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const purchases: OrderRow[] = (purchasesQuery || []) as OrderRow[];
  const sales: OrderRow[] = (salesQuery || []) as OrderRow[];

  const params = await searchParams;
  const tab: TabKey = params.tab === "penjualan" ? "penjualan" : "pembelian";
  const rawBucket = (params.status || "all") as BucketKey;
  const isValidBucket = BUCKETS.some((b) => b.key === rawBucket);
  const bucket: BucketKey =
    tab === "pembelian" && rawBucket === "payout"
      ? "all"
      : isValidBucket
        ? rawBucket
        : "all";

  const source = tab === "penjualan" ? sales : purchases;
  const visible = filterByBucket(source, bucket);
  const totalAmount = visible.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalLabel = bucket === "payout" ? "Total dana diproses" : tab === "penjualan" ? "Total pendapatan" : "Total belanja";

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(" pukul ", ", ");
  };

  const renderTransactionCard = (item: OrderRow, isBuyer: boolean) => {
    const sDesign = getStatusDesign(item.status);
    const pDesign = getPayoutDesign(item.payout_status);
    const dDesign = getDeliveryDesign(item.delivery_status);
    const courierLabel = formatCourierLabel(item.shipping_courier, item.shipping_service);
    const hasShipping = !!item.shipping_order_id;
    const isWtb = !item.listing_id && !!item.wtb_offer_id;
    const itemTitle = item.marketplace_listings?.title || item.wtb_offers?.item_name || "Listing telah dihapus";
    const itemImage = item.marketplace_listings?.image_url || item.wtb_offers?.item_image_url || null;

    return (
      <article key={item.id} className={styles.row} style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "16px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "16px", overflow: "hidden", background: "#f7f7f5", border: "1px solid #EFEFEB", display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A39B", flexShrink: 0, position: "relative" }}>
              {itemImage ? (
                <Image
                  src={itemImage}
                  alt={itemTitle}
                  fill
                  sizes="60px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <ImageIcon size={20} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.3 }}>{itemTitle}</h3>
                {isWtb && (
                  <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px", color: "#9a3412", background: "#fff7ed", border: "1px solid #fed7aa", padding: "2px 8px", borderRadius: "999px", textTransform: "uppercase" }}>
                    WTB
                  </span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#737369", background: "#f4f4f0", padding: "2px 8px", borderRadius: "999px" }}>
                  {formatOrderChip(item.id)}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#A3A39B" }}>{formatDate(item.created_at)}</p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "16px", fontWeight: 800, color: isBuyer ? "#1E8449" : "#1A1A1A", lineHeight: 1.3 }}>
              {isBuyer ? "-" : "+"}{formatRupiah(item.total_price)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: sDesign.bg, color: sDesign.text, border: `1px solid ${sDesign.border}`, padding: "5px 10px", borderRadius: "999px" }}>
            {sDesign.icon} {statusMap[item.status] || item.status}
          </span>

          {item.status === "paid_escrow" && item.escrow_status && !isBuyer && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: "#ecfdf3", color: "#166534", border: "1px solid #bbf7d0", padding: "5px 10px", borderRadius: "999px" }}>
              <ShieldCheck size={14} /> Escrow Aman
            </span>
          )}

          {pDesign && !isBuyer && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, background: pDesign.bg, color: pDesign.text, border: `1px solid ${pDesign.border}`, padding: "5px 10px", borderRadius: "999px" }}>
              <Wallet size={14} /> Payout: {item.payout_status}
            </span>
          )}
        </div>

        {/* ── Shipping Info Card ── */}
        {hasShipping && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "#f5fcf8",
              border: "1px solid #d9f0e2",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fff", border: "1px solid #d9f0e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E8449", flexShrink: 0 }}>
                <Truck size={16} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#737369", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Informasi Pengiriman
                </span>
                {courierLabel && (
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#1A1A1A" }}>{courierLabel}</span>
                )}
              </div>
              {dDesign && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 800, background: dDesign.bg, color: dDesign.text, border: `1px solid ${dDesign.border}`, padding: "5px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                  {dDesign.label}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#737369", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Nomor Resi
                </span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: item.awb ? "#1A1A1A" : "#9a3412", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.5px" }}>
                  {item.awb || "Menunggu kurir..."}
                </span>
              </div>

              {item.public_tracking_url && (
                <a
                  href={item.public_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#1d4ed8",
                    background: "#fff",
                    border: "1px solid #bfdbfe",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    textDecoration: "none",
                  }}
                >
                  <Truck size={13} /> Lacak Resi <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Action Row ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <TransactionButtons
            orderId={item.id}
            status={item.status}
            isBuyer={isBuyer}
            payoutStatus={item.payout_status}
            shippingOrderId={item.shipping_order_id}
            pickupStatus={item.pickup_status}
          />
        </div>
      </article>
    );
  };

  const tabMeta = TAB_META[tab];
  const isTotallyEmpty = source.length === 0;

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {/* ── Level 1: Pembelian / Penjualan ── */}
      <nav aria-label="Jenis transaksi">
        <div style={{ display: "inline-flex", gap: "6px", padding: "6px", borderRadius: "18px", background: "#fff", border: "1px solid #EFEFEB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>
          {(["pembelian", "penjualan"] as TabKey[]).map((key) => {
            const active = tab === key;
            const meta = TAB_META[key];
            const count = key === "pembelian" ? purchases.length : sales.length;
            return (
              <Link
                key={key}
                href={`?tab=${key}&status=${bucket === "payout" ? "all" : bucket}`}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "13px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: active ? "#fff" : "#737369",
                  background: active ? "#27AE60" : "transparent",
                  boxShadow: active ? "0 4px 12px rgba(39,174,96,0.25)" : "none",
                  transition: "all 0.18s ease",
                }}
              >
                {meta.icon}
                {meta.label}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "22px",
                    height: "22px",
                    padding: "0 7px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: active ? "#fff" : "#A3A39B",
                    background: active ? "rgba(255,255,255,0.2)" : "#F4F4F0",
                    transition: "all 0.18s ease",
                  }}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Level 2: Status buckets ── */}
      <nav aria-label="Filter status transaksi">
        <div className={styles.pillBar}>
          {BUCKETS.filter((b) => b.key !== "payout" || tab === "penjualan").map((b) => {
            const active = bucket === b.key;
            const count = countByBucket(source, b.key);
            return (
              <Link
                key={b.key}
                href={`?tab=${tab}&status=${b.key}`}
                aria-current={active ? "true" : undefined}
                title={b.hint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: active ? "#1E8449" : "#52524C",
                  background: active ? "#eaf6ef" : "#fff",
                  border: active ? "1px solid #c4e8d5" : "1px solid #EFEFEB",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  whiteSpace: "nowrap",
                  transition: "all 0.16s ease",
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: b.dot, flexShrink: 0, opacity: active ? 1 : 0.55 }} />
                {b.label}
                <span style={{ fontSize: "11px", fontWeight: 800, color: active ? "#1E8449" : "#A3A39B" }}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Ledger ── */}
      <section className={styles.ledger}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #EFEFEB", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "12px", background: "rgba(39,174,96,0.1)", color: "#1E8449", flexShrink: 0 }}>
              {tabMeta.icon}
            </span>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.2 }}>
                {bucketLabel(bucket)}
                {bucket !== "all" && (
                  <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 800, color: "#1E8449", background: "#EAF6EF", padding: "2px 9px", borderRadius: "999px", verticalAlign: "2px" }}>
                    {visible.length}
                  </span>
                )}
              </h2>
              <p style={{ fontSize: "12px", color: "#A3A39B", marginTop: "2px" }}>
                {BUCKETS.find((b) => b.key === bucket)?.hint || BUCKETS[0].hint}
              </p>
            </div>
          </div>

          {visible.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "#A3A39B", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                {totalLabel}
              </p>
              <p style={{ fontSize: "17px", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.3 }}>
                {formatRupiah(totalAmount)}
              </p>
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: "72px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "22px",
                background: isTotallyEmpty ? (tab === "pembelian" ? "#effaf3" : "#eef7fb") : "#F4F4F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isTotallyEmpty ? (tab === "pembelian" ? "#16a34a" : "#2563eb") : "#A3A39B",
              }}
            >
              {isTotallyEmpty ? tabMeta.icon : <Inbox size={26} />}
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A" }}>
                {isTotallyEmpty ? tabMeta.emptyTitle : `Tidak ada transaksi ${bucketLabel(bucket).toLowerCase()}`}
              </p>
              <p style={{ fontSize: "13px", color: "#A3A39B", marginTop: "6px", maxWidth: "360px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                {isTotallyEmpty ? tabMeta.emptyHint : BUCKETS.find((b) => b.key === bucket)?.hint}
              </p>
            </div>
            {isTotallyEmpty && tabMeta.cta && (
              <Link
                href={tabMeta.cta.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 20px",
                  borderRadius: "14px",
                  background: "#27AE60",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(39,174,96,0.22)",
                  transition: "background 0.18s ease",
                }}
              >
                {tabMeta.cta.label} →
              </Link>
            )}
          </div>
        ) : (
          visible.map((item) => renderTransactionCard(item, tab === "pembelian"))
        )}
      </section>
    </div>
  );
}