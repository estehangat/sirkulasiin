"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./marketplace.module.css";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/favorites?listing_id=${listingId}`)
      .then((r) => r.json())
      .then((d) => { setFavorited(d.favorited); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [listingId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check login via API (401 means not logged in)
    startTransition(async () => {
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: listingId }),
        });

        if (res.status === 401) {
          // Redirect to login with redirect back to current marketplace listing
          router.push(`/login?next=/marketplace/${listingId}`);
          return;
        }

        const d = await res.json();
        if (res.ok) setFavorited(d.favorited);
      } catch {
        // Network error - ignore
      }
    });
  };

  if (!loaded) return null;

  return (
    <button
      type="button"
      className={`${styles.favoriteBtn} ${favorited ? styles.favoriteBtnActive : ""}`}
      onClick={toggle}
      disabled={isPending}
      aria-label={favorited ? "Hapus dari favorit" : "Tambah ke favorit"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
