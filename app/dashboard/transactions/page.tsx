import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "../section.module.css";
import TransactionButtons from "./ClientButtons";

export const metadata: Metadata = {
  title: "Transaksi — SirkulasiIn",
  description: "Riwayat transaksi marketplace dan rewards Anda.",
};

const statusMap: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  shipped: "Sedang Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default async function TransactionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Pembelian
  const { data: purchasesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(title)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch Penjualan
  const { data: salesQuery } = await supabase
    .from("orders")
    .select("*, marketplace_listings(title)")
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

      {/* Pembelian */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '24px 0 16px' }}>Pembelian Saya</h2>
      {purchases.length === 0 ? (
        <p style={{ color: "var(--color-gray-400)", fontSize: "14px" }}>Belum ada pembelian.</p>
      ) : (
        <div className={styles.list}>
          {purchases.map((item) => (
            <article key={item.id} className={styles.listItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
              <div>
                <h3 className={styles.listTitle} style={{ marginBottom: "4px" }}>
                  {item.marketplace_listings?.title || "Produk Preloved"}
                </h3>
                <p className={styles.listMeta} style={{ fontSize: "13px", color: "var(--color-gray-500)" }}>
                  {formatRupiah(item.total_price)} · {statusMap[item.status] || item.status} · {formatDate(item.created_at)}
                </p>
              </div>
              <TransactionButtons orderId={item.id} status={item.status} isBuyer={true} />
            </article>
          ))}
        </div>
      )}

      {/* Penjualan */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '40px 0 16px' }}>Penjualan Saya</h2>
      {sales.length === 0 ? (
        <p style={{ color: "var(--color-gray-400)", fontSize: "14px" }}>Belum ada penjualan.</p>
      ) : (
        <div className={styles.list}>
          {sales.map((item) => (
            <article key={item.id} className={styles.listItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
              <div>
                <h3 className={styles.listTitle} style={{ marginBottom: "4px" }}>
                  {item.marketplace_listings?.title || "Produk Preloved"}
                </h3>
                <p className={styles.listMeta} style={{ fontSize: "13px", color: "var(--color-gray-500)" }}>
                  {formatRupiah(item.total_price)} · {statusMap[item.status] || item.status} · {formatDate(item.created_at)}
                </p>
              </div>
              <TransactionButtons orderId={item.id} status={item.status} isBuyer={false} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
