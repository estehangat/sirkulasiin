"use client";

import { useActionState, useState } from "react";
import { createWtbRequest, WtbState } from "@/app/actions/wtb";
import styles from "../wtb.module.css";

const CATEGORIES = [
  { value: "", label: "Pilih kategori..." },
  { value: "glass", label: "Kaca" },
  { value: "plastic", label: "Plastik" },
  { value: "paper", label: "Kertas" },
  { value: "metal", label: "Logam" },
  { value: "textile", label: "Tekstil" },
  { value: "electronic", label: "Elektronik" },
  { value: "other", label: "Lainnya" },
];

export default function CreateWtbForm({ defaultCity }: { defaultCity: string }) {
  const [state, formAction, isPending] = useActionState<WtbState, FormData>(
    createWtbRequest,
    null
  );
  const [budgetStr, setBudgetStr] = useState("");

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setBudgetStr(val ? new Intl.NumberFormat("id-ID").format(parseInt(val)) : "");
  };

  return (
    <form action={formAction}>
      {state?.error && <div className={styles.alertError}>{state.error}</div>}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="wtb-title">
          Barang yang dicari *
        </label>
        <input
          id="wtb-title"
          type="text"
          name="title"
          className={styles.input}
          placeholder="Contoh: Botol kaca bekas selai ukuran 500ml"
          required
          maxLength={120}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="wtb-desc">
          Detail permintaan{" "}
          <span className={styles.fieldHint}>— kondisi minimal, jumlah, merek, dll.</span>
        </label>
        <textarea
          id="wtb-desc"
          name="description"
          className={styles.textarea}
          placeholder="Contoh: Butuh 10 botol, kondisi bersih tidak pecah, tutup masih ada..."
          rows={4}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="wtb-category">
            Kategori *
          </label>
          <select id="wtb-category" name="category" className={styles.select} required>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} disabled={!c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="wtb-city">
            Kota *
          </label>
          <input
            id="wtb-city"
            type="text"
            name="city"
            className={styles.input}
            placeholder="Contoh: Bandung"
            defaultValue={defaultCity}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="wtb-budget">
          Budget maksimal *{" "}
          <span className={styles.fieldHint}>— penjual masih bisa menawar di atas budget, kamu yang memutuskan</span>
        </label>
        <div className={styles.currencyInput}>
          <span className={styles.currencyPrefix}>Rp</span>
          <input
            id="wtb-budget"
            type="text"
            name="budget_max"
            inputMode="numeric"
            value={budgetStr}
            onChange={handleBudgetChange}
            placeholder="0"
            required
          />
        </div>
      </div>

      <button type="submit" className={styles.amberBtn} disabled={isPending}>
        {isPending ? "Memposting..." : "Posting Permintaan"}
      </button>
    </form>
  );
}
