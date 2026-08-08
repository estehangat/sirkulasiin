"use client";

import { useActionState, useState } from "react";
import { updateWtbRequest, WtbState } from "@/app/actions/wtb";
import styles from "../wtb.module.css";

const CATEGORIES = [
  { value: "glass", label: "Kaca" },
  { value: "plastic", label: "Plastik" },
  { value: "paper", label: "Kertas" },
  { value: "metal", label: "Logam" },
  { value: "textile", label: "Tekstil" },
  { value: "electronic", label: "Elektronik" },
  { value: "other", label: "Lainnya" },
];

type Wtb = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  budget_max: number;
  city: string;
};

export default function WtbEditForm({ wtb }: { wtb: Wtb }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<WtbState, FormData>(
    updateWtbRequest,
    null
  );
  const [budgetStr, setBudgetStr] = useState(
    new Intl.NumberFormat("id-ID").format(wtb.budget_max)
  );

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setBudgetStr(val ? new Intl.NumberFormat("id-ID").format(parseInt(val)) : "");
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.ghostBtn}
        onClick={() => setIsOpen(true)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        Edit Permintaan
      </button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="wtb_id" value={wtb.id} />

      {state?.error && <div className={styles.alertError}>{state.error}</div>}
      {state?.success && <div className={styles.alertSuccess}>{state.success}</div>}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="edit-title">Judul *</label>
        <input
          id="edit-title"
          type="text"
          name="title"
          className={styles.input}
          defaultValue={wtb.title}
          required
          maxLength={120}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="edit-desc">Detail</label>
        <textarea
          id="edit-desc"
          name="description"
          className={styles.textarea}
          defaultValue={wtb.description || ""}
          rows={3}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="edit-category">Kategori *</label>
          <select
            id="edit-category"
            name="category"
            className={styles.select}
            defaultValue={wtb.category}
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="edit-city">Kota *</label>
          <input
            id="edit-city"
            type="text"
            name="city"
            className={styles.input}
            defaultValue={wtb.city}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="edit-budget">Budget maksimal *</label>
        <div className={styles.currencyInput}>
          <span className={styles.currencyPrefix}>Rp</span>
          <input
            id="edit-budget"
            type="text"
            name="budget_max"
            inputMode="numeric"
            value={budgetStr}
            onChange={handleBudgetChange}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className={styles.smallBtnPrimary} disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          className={styles.smallBtnGhost}
          onClick={() => setIsOpen(false)}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
