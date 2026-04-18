import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "../section.module.css";
import TransactionButtons from "./ClientButtons";
import t from "./transactions.module.css";

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
  return `#${id.slice(0, 8)}`;
}

function statusChipStyle(status: string) {
  const base = {
    fontSize: "12px",
    fontWeight: 900,
    borderRadius: "999px",
    padding: "6px 10px",
    border: "1px solid transparent",
  } as const;

  if (status === "paid_escrow") {
    return { ...base, background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" };
  }
  if (status === "pending_payment") {
    return { ...base, background: "#eef2ff", borderColor: "#c7d2fe", color: "#3730a3" };
  }
  if (status === "shipped") {
    return { ...base, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" };
  }
  if (status === "completed") {
    return { ...base, background: "#ecfdf3", borderColor: "#bbf7d0", color: "#166534" };
  }
  if (status === "paid_out") {
    return { ...base, background: "#f0fdf4", borderColor: "#86efac", color: "#14532d" };
  }
  if (status === "payment_failed") {
    return { ...base, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" };
  }
  if (status === "payment_expired") {
    return { ...base, background: "#f3f4f6", borderColor: "#e5e7eb", color: "#374151" };
  }
  if (status === "cancelled") {
    return { ...base, background: "#f3f4f6", borderColor: "#e5e7eb", color: "#374151" };
  }
  return { ...base, background: "#f3f4f6", borderColor: "#e5e7eb", color: "#374151" };
}

function payoutChipStyle(payoutStatus?: string | null) {
  const base = {
    fontSize: "12px",
    fontWeight: 900,
    borderRadius: "999px",
    padding: "6px 10px",
    border: "1px solid transparent",
  } as const;

  if (!payoutStatus) return null;

  if (payoutStatus === "ready_for_payout") {
    return { ...base, background: "#ecfeff", borderColor: "#a5f3fc", color: "#155e75" };
  }
  if (payoutStatus === "requested") {
    return { ...base, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" };
  }
  if (payoutStatus === "approved") {
    return { ...base, background: "#ecfdf3", borderColor: "#bbf7d0", color: "#166534" };
  }
  if (payoutStatus === "processing") {
    return { ...base, background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" };
  }
  if (payoutStatus === "paid_out") {
    return { ...base, background: "#f0fdf4", borderColor: "#86efac", color: "#14532d" };
  }
  if (payoutStatus === "rejected" || payoutStatus === "failed") {
    return { ...base, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" };
  }
  return { ...base, background: "#f3f4f6", borderColor: "#e5e7eb", color: "#374151" };
}

export default async function TransactionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Pembelian
  const { data: purchasesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(id, title)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch Penjualan
  const { data: salesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(id, title)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const purchases = purchasesQuery || [];
  const sales = salesQuery || [];

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
    });
  };

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Transaksi</h1>
      <p className={styles.subtitle}>
        Pantau seluruh aktivitas transaksi Anda, baik pembelian maupun penjualan.
      </p>

      <div className={t.wrap}>
        <section className={t.group} aria-label="Pembelian">
          <div className={t.groupHeader}>
            <div>
              <h2 className={t.groupTitle}>Pembelian Saya</h2>
              <p className={t.groupMeta}>{purchases.length} transaksi</p>
            </div>
          </div>

          {purchases.length === 0 ? (
            <p style={{ color: "var(--color-gray-400)", fontSize: "14px", margin: 0 }}>
              Belum ada pembelian.
            </p>
          ) : (
            <div className={t.list}>
              {purchases.map((item) => (
                <article key={item.id} className={t.item}>
                  <div className={t.left}>
                    <div className={t.titleRow}>
                      <p className={t.title}>{item.marketplace_listings?.title || "Produk Preloved"}</p>
                      <span className={t.orderId}>{formatOrderChip(item.id)}</span>
                    </div>
                    <p className={t.meta}>
                      {formatRupiah(item.total_price)} · {formatDate(item.created_at)}
                    </p>
                    <div className={t.chips}>
                      <span className={t.chip} style={statusChipStyle(item.status)}>
                        {statusMap[item.status] || item.status}
                      </span>
                      {item.status === "paid_escrow" && item.escrow_status ? (
                        <span
                          className={t.chip}
                          style={{
                            fontSize: "12px",
                            fontWeight: 900,
                            borderRadius: "999px",
                            padding: "6px 10px",
                            border: "1px solid #bbf7d0",
                            background: "#ecfdf3",
                            color: "#166534",
                          }}
                        >
                          Escrow: {item.escrow_status}
                        </span>
                      ) : null}
                      {payoutChipStyle(item.payout_status) ? (
                        <span className={t.chip} style={payoutChipStyle(item.payout_status)!}>
                          Payout: {item.payout_status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={t.right}>
                    <TransactionButtons
                      orderId={item.id}
                      status={item.status}
                      isBuyer={true}
                      payoutStatus={item.payout_status}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={t.group} aria-label="Penjualan">
          <div className={t.groupHeader}>
            <div>
              <h2 className={t.groupTitle}>Penjualan Saya</h2>
              <p className={t.groupMeta}>{sales.length} transaksi</p>
            </div>
          </div>

          {sales.length === 0 ? (
            <p style={{ color: "var(--color-gray-400)", fontSize: "14px", margin: 0 }}>
              Belum ada penjualan.
            </p>
          ) : (
            <div className={t.list}>
              {sales.map((item) => (
                <article key={item.id} className={t.item}>
                  <div className={t.left}>
                    <div className={t.titleRow}>
                      <p className={t.title}>{item.marketplace_listings?.title || "Produk Preloved"}</p>
                      <span className={t.orderId}>{formatOrderChip(item.id)}</span>
                    </div>
                    <p className={t.meta}>
                      {formatRupiah(item.total_price)} · {formatDate(item.created_at)}
                    </p>
                    <div className={t.chips}>
                      <span className={t.chip} style={statusChipStyle(item.status)}>
                        {statusMap[item.status] || item.status}
                      </span>
                      {item.status === "paid_escrow" && item.escrow_status ? (
                        <span
                          className={t.chip}
                          style={{
                            fontSize: "12px",
                            fontWeight: 900,
                            borderRadius: "999px",
                            padding: "6px 10px",
                            border: "1px solid #bbf7d0",
                            background: "#ecfdf3",
                            color: "#166534",
                          }}
                        >
                          Escrow: {item.escrow_status}
                        </span>
                      ) : null}
                      {payoutChipStyle(item.payout_status) ? (
                        <span className={t.chip} style={payoutChipStyle(item.payout_status)!}>
                          Payout: {item.payout_status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={t.right}>
                    <TransactionButtons
                      orderId={item.id}
                      status={item.status}
                      isBuyer={false}
                      payoutStatus={item.payout_status}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
