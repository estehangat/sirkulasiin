"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";
import styles from "./marketplace.module.css";

const CATEGORIES = [
  { value: "", label: "Semua Kategori" },
  { value: "glass", label: "Kaca" },
  { value: "plastic", label: "Plastik" },
  { value: "paper", label: "Kertas" },
  { value: "metal", label: "Logam" },
  { value: "textile", label: "Tekstil" },
  { value: "electronic", label: "Elektronik" },
  { value: "other", label: "Lainnya" },
];

const SORT_TABS = [
  { value: "latest", label: "Terbaru" },
  { value: "budget_desc", label: "Budget Tertinggi" },
  { value: "budget_asc", label: "Budget Terendah" },
] as const;

export default function WtbFilters({ cities = [] }: { cities?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "latest";
  const currentQ = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentLocation = searchParams.get("location") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "dicari");
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      params.delete("page");
      startTransition(() => router.push(`/marketplace?${params.toString()}`, { scroll: false }));
    },
    [searchParams, router]
  );

  return (
    <>
      <div className={styles.searchFilterGrid}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari permintaan: barang, bahan, atau merek..."
            className={styles.searchInput}
            defaultValue={currentQ}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ q: e.currentTarget.value.trim() });
            }}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={currentCategory}
          onChange={(e) => updateParams({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={currentLocation}
          onChange={(e) => updateParams({ location: e.target.value })}
        >
          <option value="">Semua Kota</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        {isPending && <span className={styles.filterSpinner} />}
      </div>

      <div className={styles.sortTabRow}>
        {SORT_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${currentSort === tab.value ? styles.tabActive : ""}`}
            onClick={() => updateParams({ sort: tab.value })}
          >
            {currentSort === tab.value && (
              <motion.div
                className={styles.tabPill}
                layoutId="activeWtbTabPill"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
