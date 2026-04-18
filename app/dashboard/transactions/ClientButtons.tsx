"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/checkout";
import { requestPayout } from "@/app/actions/payout";

type Props = {
  orderId: string;
  status: string;
  isBuyer: boolean;
  payoutStatus?: string | null;
};

export default function TransactionButtons({ orderId, status, isBuyer, payoutStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleUpdate = (newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      router.refresh();
    });
  };

  const handleRequestPayout = () => {
    startTransition(async () => {
      await requestPayout(orderId);
      router.refresh();
    });
  };

  if (isPending) {
    return (
      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 700 }}>
        Memproses...
      </span>
    );
  }

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
      return (
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
      return <span style={badgeStyle}>Dana Ditahan Aman</span>;
    }
    
    if (status === "shipped") {
      return (
        <button
          onClick={() => handleUpdate("completed")}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          Pesanan Diterima
        </button>
      );
    }
  }

  // Action penjual
  if (!isBuyer) {
    if (status === "paid_escrow") {
      return (
        <button
          onClick={() => handleUpdate("shipped")}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
          }}
          onMouseEnter={btnHoverIn}
          onMouseLeave={btnHoverOut}
        >
          Tandai Dikirim
        </button>
      );
    }

    if (status === "completed" && payoutStatus === "ready_for_payout") {
      return (
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
      return (
        <span style={badgeStyle}>
          {payoutStatus ? `Payout: ${payoutStatus}` : "Payout: -"}
        </span>
      );
    }

    if (status === "paid_out") {
      return <span style={badgeStyle}>Dana Dicairkan</span>;
    }
  }

  return null;
}
