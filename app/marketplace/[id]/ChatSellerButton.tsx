"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./productDetail.module.css";

type Listing = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  carbon_saved: string | null;
};

export default function ChatSellerButton({
  sellerId,
  listing,
}: {
  sellerId: string;
  listing: Listing;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChat = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push(`/login?next=/marketplace/${listing.id}`);
      return;
    }

    setLoading(true);
    try {
      // Get or create room
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId }),
      });
      const { room_id, error } = await res.json();
      if (error || !room_id) throw new Error(error ?? "Gagal membuka chat");

      // Always send a product_card bubble to show context
      await supabase.from("chat_messages").insert({
        room_id,
        sender_id: session.user.id,
        content: "",
        type: "product_card",
        metadata: {
          listing_id: listing.id,
          title: listing.title,
          price: listing.price,
          image_url: listing.image_url,
          carbon_saved: listing.carbon_saved,
        },
      });

      router.push(`/messages?room=${room_id}`);
    } catch (err) {
      console.error("ChatSellerButton error:", err);
      setLoading(false);
    }
  };

  return (
    <button className={styles.chatBtn} onClick={handleChat} disabled={loading}>
      {loading ? (
        "Membuka chat…"
      ) : (
        <>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat dengan Penjual
        </>
      )}
    </button>
  );
}
