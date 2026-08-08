"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeWtbRequest } from "@/app/actions/wtb";
import styles from "../wtb.module.css";

export default function WtbCloseButton({ wtbId }: { wtbId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    startTransition(async () => {
      const result = await closeWtbRequest(wtbId);
      if (result?.error) {
        setError(result.error);
        setShowConfirm(false);
        return;
      }
      router.refresh();
      setShowConfirm(false);
    });
  };

  return (
    <>
      {error && <div className={styles.alertError}>{error}</div>}
      <button
        type="button"
        className={styles.dangerBtn}
        onClick={() => setShowConfirm(true)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        Tutup Permintaan
      </button>

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Tutup permintaan ini?
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-gray-500)", lineHeight: 1.6, marginBottom: 24 }}>
              Permintaan tidak akan tampil di papan dan semua tawaran pending dibatalkan.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className={styles.smallBtnGhost}
                style={{ flex: 1 }}
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.smallBtnDanger}
                style={{ flex: 1 }}
                onClick={handleClose}
                disabled={isPending}
              >
                {isPending ? "Memproses..." : "Ya, Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
