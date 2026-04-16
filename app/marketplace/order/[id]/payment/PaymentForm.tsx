"use client";

import { useTransition } from "react";
import Link from "next/link";
import { processMockPayment } from "@/app/actions/checkout";
import styles from "./payment.module.css";

export default function PaymentForm({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handlePayment = () => {
    startTransition(async () => {
      await processMockPayment(orderId);
    });
  };

  return (
    <div className={styles.payForm}>
      <button 
        type="button" 
        onClick={handlePayment}
        disabled={isPending}
        className={styles.payButton}
      >
        {isPending ? "Memproses..." : "Simulasikan Pembayaran"}
      </button>
      
      <Link href="/dashboard/transactions" className={styles.cancelLink}>
        Bayar Nanti
      </Link>
    </div>
  );
}
