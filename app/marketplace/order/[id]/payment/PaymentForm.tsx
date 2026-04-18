"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshPaymentStatus } from "@/app/actions/checkout";
import styles from "./payment.module.css";

type Props = {
  orderId: string;
  status: string;
  paymentUrl: string | null;
  paymentExpiredAt: string | null;
};

export default function PaymentForm({
  orderId,
  status,
  paymentUrl,
  paymentExpiredAt,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshPaymentStatus(orderId);
      setMessage(result.error || (result.success ? "Status pembayaran diperbarui." : null));
      router.refresh();
    });
  };

  if (status === "paid_escrow") {
    return (
      <div className={styles.payForm}>
        <div className={styles.statusBox}>
          Pembayaran terverifikasi. Dana ditahan aman sampai barang diterima pembeli.
        </div>
        <button type="button" onClick={handleRefresh} disabled={isPending} className={styles.secondaryButton}>
          {isPending ? "Memeriksa..." : "Cek Ulang Status"}
        </button>
        <Link href="/dashboard/transactions" className={styles.cancelLink}>
          Lihat Transaksi
        </Link>
      </div>
    );
  }

  if (status === "payment_expired" || status === "payment_failed") {
    return (
      <div className={styles.payForm}>
        <div className={styles.statusBoxError}>
          Pembayaran tidak berhasil. Listing sudah dibuka kembali dan Anda bisa checkout ulang.
        </div>
        <button type="button" onClick={handleRefresh} disabled={isPending} className={styles.secondaryButton}>
          {isPending ? "Memeriksa..." : "Sinkronkan Status"}
        </button>
        <Link href="/dashboard/transactions" className={styles.cancelLink}>
          Kembali ke Transaksi
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.payForm}>
        <a
          href={paymentUrl || "#"}
          className={styles.payButtonLink}
          aria-disabled={!paymentUrl}
        >
        <span className={styles.payButton}>{paymentUrl ? "Bayar via Midtrans" : "Sesi Pembayaran Tidak Tersedia"}</span>
      </a>

      <button type="button" onClick={handleRefresh} disabled={isPending} className={styles.secondaryButton}>
        {isPending ? "Memeriksa..." : "Cek Status Pembayaran"}
      </button>

      {paymentExpiredAt && (
        <p className={styles.helperText}>
          Batas pembayaran: {new Date(paymentExpiredAt).toLocaleString("id-ID")}
        </p>
      )}

      {message && <p className={styles.helperText}>{message}</p>}

      <Link href="/dashboard/transactions" className={styles.cancelLink}>
        Bayar Nanti
      </Link>
    </div>
  );
}
