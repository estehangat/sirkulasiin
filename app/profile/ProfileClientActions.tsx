"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./profile.module.css";

export default function ProfileClientActions({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMessage = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push(`/login?next=/profile?id=${targetUserId}`);
      return;
    }

    if (session.user.id === targetUserId) {
      // User is viewing their own profile via public link, redirect to dashboard or ignore
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: targetUserId }), // API expects seller_id
      });
      const { room_id, error } = await res.json();
      if (error || !room_id) throw new Error(error ?? "Gagal membuka chat");

      router.push(`/messages?room=${room_id}`);
    } catch (err) {
      console.error("Message error:", err);
      // In a real app we'd show a toast here
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    // Follow fungsinya nanti dulu as requested
    alert("Fungsi Follow akan segera hadir!");
  };

  return (
    <div className={styles.heroButtons}>
      <button 
        type="button" 
        className={styles.btnFollow} 
        onClick={handleFollow}
      >
        Ikuti
      </button>
      <button 
        type="button" 
        className={styles.btnMessage} 
        onClick={handleMessage}
        disabled={loading}
      >
        {loading ? "Menghubungkan..." : "Pesan"}
      </button>
    </div>
  );
}
