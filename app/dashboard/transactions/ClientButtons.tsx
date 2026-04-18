"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/checkout";

type Props = {
  orderId: string;
  status: string;
  isBuyer: boolean;
};

export default function TransactionButtons({ orderId, status, isBuyer }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleUpdate = (newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      router.refresh();
    });
  };

  if (isPending) {
    return <span style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>Memproses...</span>;
  }

  const badgeStyle = {
    fontSize: "12px",
    fontWeight: 700,
    color: "#166534",
    background: "#ecfdf3",
    padding: "8px 12px",
    borderRadius: "999px",
  } as const;

  // Action pembeli
  if (isBuyer) {
    if (status === "pending_payment") {
      return (
        <button
          onClick={() => router.push(`/marketplace/order/${orderId}/payment`)}
          style={{
            padding: "8px 16px",
            background: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
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
            padding: "8px 16px",
            background: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
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
            padding: "8px 16px",
            background: "#f39c12",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tandai Dikirim
        </button>
      );
    }

    if (status === "completed") {
      return <span style={badgeStyle}>Siap Dicairkan</span>;
    }
  }

  return null;
}
