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

const PRICE_RANGES = [
  { value: "", label: "Semua Harga" },
  { value: "0-50000", label: "< Rp50.000" },
  { value: "50000-200000", label: "Rp50.000 – Rp200.000" },
  { value: "200000-500000", label: "Rp200.000 – Rp500.000" },
  { value: "500000-2000000", label: "Rp500.000 – Rp2.000.000" },
  { value: "2000000-", label: "> Rp2.000.000" },
];

const SORT_TABS = [
  { value: "popular", label: "Populer" },
  { value: "latest", label: "Terbaru" },
  { value: "barter", label: "Bisa Barter" },
  { value: "favorites", label: "Favorit Saya" },
] as const;

export default function MarketplaceFilters({ locations = [] }: { locations?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "latest";
  const currentQ = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentPrice = searchParams.get("price") || "";
  const currentLocation = searchParams.get("location") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      // Reset page on filter change
      params.delete("page");
      startTransition(() => router.push(`/marketplace?${params.toString()}`, { scroll: false }));
    },
    [searchParams, router]
  );

  const handleTabClick = (value: string) => {
    if (value === "favorites") {
      // Check auth via API
      fetch("/api/favorites?listing_id=check", { method: "GET" })
        .then((r) => {
          if (r.status === 401) {
            router.push(`/login?next=/marketplace?sort=favorites`);
            return;
          }
          updateParams({ sort: value });
        })
        .catch(() => updateParams({ sort: value }));
    } else {
      updateParams({ sort: value });
    }
  };

  return (
    <>
      {/* Search & Filters */}
      <div className={styles.searchFilterGrid}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari berdasarkan barang, bahan, atau merek..."
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
          value={currentPrice}
          onChange={(e) => updateParams({ price: e.target.value })}
        >
          {PRICE_RANGES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={currentLocation}
          onChange={(e) => updateParams({ location: e.target.value })}
        >
          <option value="">Semua Lokasi</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {isPending && <span className={styles.filterSpinner} />}
      </div>

      {/* Sort Tabs with Sliding Pill */}
      <div className={styles.sortTabRow}>
        {SORT_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${currentSort === tab.value ? styles.tabActive : ""}`}
            onClick={() => handleTabClick(tab.value)}
          >
            {currentSort === tab.value && (
              <motion.div
                className={styles.tabPill}
                layoutId="activeTabPill"
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
