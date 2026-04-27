"use client";

import { useState, useTransition } from "react";
import {
  Package,
  Truck,
  FileText,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  cancelShippingAction,
  createShippingOrderAction,
  syncTrackingAction,
} from "@/app/actions/shipping";
import styles from "./payment.module.css";

type Props = {
  orderId: string;
  isSeller: boolean;
  status: string;
  awb: string | null;
  shippingOrderId: string | null;
  pickupStatus: string | null;
  deliveryStatus: string | null;
  shippingCourier: string | null;
  shippingService: string | null;
  shippingLabelUrl: string | null;
  publicTrackingUrl: string | null;
  deliveryHistory: unknown;
};

type HistoryItem = {
  date?: string;
  description?: string;
  status?: string;
};

function isHistoryArray(value: unknown): value is HistoryItem[] {
  return Array.isArray(value);
}

const STATUS_LABEL: Record<string, string> = {
  on_process: "Diproses",
  picked_up: "Sudah Dipickup",
  in_transit: "Dalam Perjalanan",
  delivered: "Sampai Tujuan",
  returned: "Dikembalikan",
  failed: "Gagal Kirim",
  cancelled: "Dibatalkan",
  unknown: "Belum Diketahui",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  on_process: <Clock size={14} />,
  picked_up: <Package size={14} />,
  in_transit: <Truck size={14} />,
  delivered: <CheckCircle2 size={14} />,
  returned: <AlertCircle size={14} />,
  failed: <XCircle size={14} />,
  cancelled: <XCircle size={14} />,
};

export default function ShippingPanel(props: Props) {
  const {
    orderId,
    isSeller,
    awb,
    shippingOrderId,
    pickupStatus,
    deliveryStatus,
    shippingCourier,
    shippingService,
    publicTrackingUrl,
    deliveryHistory,
  } = props;

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = (action: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(res.message ?? "Berhasil.");
      } else {
        setError(res.error ?? "Terjadi kesalahan.");
      }
    });
  };

  const handleCancel = () => {
    if (!confirm("Batalkan resi pengiriman ini? Aksi ini tidak bisa di-undo.")) return;
    handleAction(() => cancelShippingAction(orderId));
  };

  const history = isHistoryArray(deliveryHistory) ? deliveryHistory : [];
  const hasOrder = Boolean(shippingOrderId);
  const isPickedUp = pickupStatus === "picked_up";

  return (
    <div className={styles.shippingPanel}>
      <div className={styles.shippingHeader}>
        <Truck size={18} />
        <h2 className={styles.shippingTitle}>Pengiriman</h2>
      </div>

      {/* ─── Info Kurir ─── */}
      <div className={styles.shippingInfoRow}>
        <span className={styles.shippingInfoLabel}>Kurir</span>
        <span className={styles.shippingInfoValue}>
          {shippingCourier?.toUpperCase() || "-"} {shippingService || ""}
        </span>
      </div>

      {hasOrder ? (
        <>
          <div className={styles.shippingInfoRow}>
            <span className={styles.shippingInfoLabel}>No. Resi (AWB)</span>
            <span className={styles.shippingAwb}>{awb || "Menunggu kurir..."}</span>
          </div>
          {shippingOrderId && (
            <div className={styles.shippingInfoRow}>
              <span className={styles.shippingInfoLabel}>Order ID</span>
              <span className={styles.shippingInfoValue}>{shippingOrderId.slice(0, 12)}...</span>
            </div>
          )}
          {deliveryStatus && (
            <div className={styles.shippingInfoRow}>
              <span className={styles.shippingInfoLabel}>Status</span>
              <span className={`${styles.shippingBadge} ${styles[`shippingBadge_${deliveryStatus}`] ?? ""}`}>
                {STATUS_ICON[deliveryStatus] ?? <Clock size={14} />}
                {STATUS_LABEL[deliveryStatus] ?? deliveryStatus}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className={styles.shippingEmpty}>
          {isSeller
            ? "Belum ada order pengiriman. Klik tombol di bawah untuk membuat order & pickup otomatis."
            : "Penjual belum membuat order pengiriman."}
        </div>
      )}

      {/* ─── Timeline ─── */}
      {history.length > 0 && (
        <div className={styles.shippingTimeline}>
          <p className={styles.timelineTitle}>Riwayat Pengiriman</p>
          <ul className={styles.timelineList}>
            {history.slice(0, 8).map((h, i) => (
              <li key={i} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <p className={styles.timelineDesc}>{h.description ?? h.status ?? "-"}</p>
                  {h.date && <p className={styles.timelineDate}>{h.date}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Feedback ─── */}
      {message && <p className={styles.shippingMessage}>{message}</p>}
      {error && <p className={styles.shippingError}>{error}</p>}

      {/* ─── Actions ─── */}
      <div className={styles.shippingActions}>
        {isSeller && !hasOrder && (
          <button
            type="button"
            onClick={() => handleAction(() => createShippingOrderAction(orderId))}
            disabled={isPending}
            className={styles.shippingBtnPrimary}
          >
            <Package size={16} /> {isPending ? "Membuat order..." : "Buat Order & Pickup Otomatis"}
          </button>
        )}

        {hasOrder && publicTrackingUrl && (
          <a
            href={publicTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shippingBtnSecondary}
          >
            <Truck size={16} /> Lacak Pengiriman <ExternalLink size={12} />
          </a>
        )}

        {hasOrder && (
          <a
            href={`/api/shipping/label/${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shippingBtnSecondary}
          >
            <FileText size={16} /> Lihat Label / Tracking <ExternalLink size={12} />
          </a>
        )}

        {hasOrder && (
          <button
            type="button"
            onClick={() => handleAction(() => syncTrackingAction(orderId))}
            disabled={isPending}
            className={styles.shippingBtnSecondary}
          >
            <RefreshCw size={16} /> {isPending ? "Sinkron..." : "Refresh Status"}
          </button>
        )}

        {isSeller && hasOrder && !isPickedUp && pickupStatus !== "cancelled" && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className={styles.shippingBtnDanger}
          >
            <XCircle size={16} /> Batalkan Order
          </button>
        )}
      </div>
    </div>
  );
}
