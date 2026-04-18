"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminApprovePayout, adminRefreshPayout, adminRejectPayout } from "@/app/actions/payout";

type OrderRow = {
  id: string;
  created_at: string;
  seller_id: string;
  total_price: number;
  status: string;
  payout_status: string | null;
  payout_reference: string | null;
  payout_requested_at: string | null;
  payout_completed_at: string | null;
  profiles?: Array<{ full_name: string | null }> | null;
};

export default function PayoutAdminClient({ orders }: { orders: OrderRow[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [otp, setOtp] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (orders.length === 0) {
    return <p style={{ color: "var(--color-gray-400)", fontSize: "14px" }}>Belum ada payout.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {orders.map((o) => (
        <article
          key={o.id}
          style={{
            border: "1px solid #EFEFEB",
            borderRadius: "16px",
            padding: "14px 16px",
            background: "#fff",
            display: "grid",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#1A1A1A" }}>
                Order {o.id.slice(0, 8)}
              </div>
              <div style={{ fontSize: "12px", color: "#737369" }}>
                Seller: {o.profiles?.[0]?.full_name || o.seller_id} · {formatRupiah(o.total_price)}
              </div>
              <div style={{ fontSize: "12px", color: "#737369" }}>
                Payout: {o.payout_status || "-"} · Ref: {o.payout_reference || "-"}
              </div>
              <div style={{ fontSize: "12px", color: "#737369" }}>
                Requested: {formatDate(o.payout_requested_at)} · Completed: {formatDate(o.payout_completed_at)}
              </div>
            </div>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await adminRefreshPayout(o.id);
                  router.refresh();
                })
              }
              style={{
                border: "1px solid #EFEFEB",
                borderRadius: "12px",
                padding: "10px 12px",
                background: "#f7f7f5",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {o.payout_status === "requested" && (
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  value={otp[o.id] || ""}
                  onChange={(e) => setOtp((p) => ({ ...p, [o.id]: e.target.value }))}
                  placeholder="OTP Midtrans"
                  style={{
                    flex: "1 1 220px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #EFEFEB",
                    background: "#fff",
                    fontSize: "13px",
                  }}
                />
                <button
                  disabled={isPending || !(otp[o.id] || "").trim()}
                  onClick={() =>
                    startTransition(async () => {
                      await adminApprovePayout(o.id, (otp[o.id] || "").trim());
                      router.refresh();
                    })
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#27ae60",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Approve
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  value={rejectReason[o.id] || ""}
                  onChange={(e) => setRejectReason((p) => ({ ...p, [o.id]: e.target.value }))}
                  placeholder="Reject reason"
                  style={{
                    flex: "1 1 220px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #EFEFEB",
                    background: "#fff",
                    fontSize: "13px",
                  }}
                />
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await adminRejectPayout(o.id, (rejectReason[o.id] || "").trim() || "Rejected");
                      router.refresh();
                    })
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #fecaca",
                    background: "#fff",
                    color: "#991b1b",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
