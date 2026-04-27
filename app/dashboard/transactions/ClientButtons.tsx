"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileDown, Package, RefreshCw, XCircle } from "lucide-react";
import { updateOrderStatus } from "@/app/actions/checkout";
import { requestPayout } from "@/app/actions/payout";
import {
  cancelShippingAction,
  createShippingOrderAction,
  syncTrackingAction,
} from "@/app/actions/shipping";

type Props = {
  orderId: string;
  status: string;
  isBuyer: boolean;
  payoutStatus?: string | null;
  shippingOrderId?: string | null;
  pickupStatus?: string | null;
};

export default function TransactionButtons({
  orderId,
  status,
  isBuyer,
  payoutStatus,
  shippingOrderId,
  pickupStatus,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleUpdate = (newStatus: string) => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Aksi gagal diproses." });
        return;
      }

      setMessage({
        type: "success",
        text: newStatus === "completed" ? "Pesanan diselesaikan." : "Status pesanan diperbarui.",
      });
      router.refresh();
    });
  };

  const handleRequestPayout = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await requestPayout(orderId);
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Gagal mengajukan payout." });
        return;
      }

      setMessage({ type: "success", text: "Pengajuan pencairan berhasil dibuat." });
      router.refresh();
    });
  };

  const handleShippingAction = (action: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Aksi pengiriman gagal." });
        return;
      }
      setMessage({ type: "success", text: result.message || "Berhasil." });
      router.refresh();
    });
  };

  const handleCancelShipping = () => {
    if (!confirm("Batalkan order pengiriman ini?")) return;
    handleShippingAction(() => cancelShippingAction(orderId));
  };

  const withFeedback = (node: React.ReactNode) => (
    <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
      {message ? (
        <span
          style={{
            maxWidth: "260px",
            fontSize: "12px",
            lineHeight: 1.4,
            fontWeight: 700,
            textAlign: "right",
            color: message.type === "error" ? "#991b1b" : "#166534",
          }}
        >
          {message.text}
        </span>
      ) : null}
      {isPending ? (
        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 700 }}>Memproses...</span>
      ) : (
        node
      )}
    </div>
  );

  const badgeStyle = {
    fontSize: "12px",
    fontWeight: 900,
    color: "#166534",
    background: "#ecfdf3",
    border: "1px solid #bbf7d0",
    padding: "8px 12px",
    borderRadius: "999px",
  } as const;

  const btnBase: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
    boxShadow: "0 6px 14px rgba(17, 24, 39, 0.08)",
    whiteSpace: "nowrap",
  };

  const btnHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 10px 20px rgba(17, 24, 39, 0.12)";
  };

  const btnHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = btnBase.boxShadow as string;
  };

  // Action pembeli
  if (isBuyer) {
    if (status === "pending_payment") {
      return withFeedback(
        <button
          onClick={() => router.push(`/marketplace/order/${orderId}/payment`)}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          Bayar Sekarang
        </button>
      );
    }

    if (status === "paid_escrow") {
      return withFeedback(<span style={badgeStyle}>Menunggu Penjual Mengirim</span>);
    }

    if (status === "shipped") {
      return withFeedback(
        <button
          onClick={() => handleUpdate("completed")}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          <CheckCircle2 size={14} /> Pesanan Diterima
        </button>
      );
    }

    return null;
  }

  // Action penjual
  if (!isBuyer) {
    // Belum ada order pengiriman → tombol create
    if (status === "paid_escrow" && !shippingOrderId) {
      return withFeedback(
        <button
          onClick={() => handleShippingAction(() => createShippingOrderAction(orderId))}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          <Package size={14} /> Buat Resi & Kirim
        </button>
      );
    }

    // Sudah ada shipping order — tampilkan tombol refresh + cancel saat masih bisa
    if (shippingOrderId && (status === "paid_escrow" || status === "shipped")) {
      const canCancel = pickupStatus !== "picked_up" && pickupStatus !== "cancelled" && status !== "shipped";
      return withFeedback(
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
          <a
            href={`/api/shipping/label/${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...btnBase,
              fontSize: "12px",
              padding: "8px 12px",
              background: "linear-gradient(135deg, #1E8449 0%, #166534 100%)",
              color: "#fff",
              borderColor: "rgba(255,255,255,0.18)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(17, 24, 39, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = btnBase.boxShadow as string;
            }}
          >
            <FileDown size={13} /> Download Label
          </a>
          <button
            onClick={() => handleShippingAction(() => syncTrackingAction(orderId))}
            style={{
              ...btnBase,
              fontSize: "12px",
              padding: "8px 12px",
              background: "#fff",
              color: "#374151",
              borderColor: "#e5e7eb",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
            onMouseEnter={btnHoverIn}
            onMouseLeave={btnHoverOut}
          >
            <RefreshCw size={13} /> Refresh Status
          </button>
          {canCancel && (
            <button
              onClick={handleCancelShipping}
              style={{
                ...btnBase,
                fontSize: "12px",
                padding: "8px 12px",
                background: "#fff",
                color: "#c0392b",
                borderColor: "#fecaca",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
              onMouseEnter={btnHoverIn}
              onMouseLeave={btnHoverOut}
            >
              <XCircle size={13} /> Batalkan Resi
            </button>
          )}
        </div>
      );
    }

    if (status === "completed" && payoutStatus === "ready_for_payout") {
      return withFeedback(
        <button
          onClick={handleRequestPayout}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          Ajukan Pencairan
        </button>
      );
    }

    if (status === "completed") {
      return withFeedback(
        <span style={badgeStyle}>
          {payoutStatus ? `Payout: ${payoutStatus}` : "Payout: -"}
        </span>
      );
    }

    if (status === "paid_out") {
      return withFeedback(<span style={badgeStyle}>Dana Dicairkan</span>);
    }
  }

  return null;
}
