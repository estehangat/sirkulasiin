"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toggleFollow } from "@/app/actions/follow";
import FollowButton from "@/app/components/FollowButton";
import styles from "./profile.module.css";

export default function ProfileClientActions({ 
  targetUserId, 
  targetUserName,
  isOwnProfile,
  initialIsFollowing = false
}: { 
  targetUserId: string;
  targetUserName: string;
  isOwnProfile?: boolean;
  initialIsFollowing?: boolean;
}) {
  const [messageLoading, setMessageLoading] = useState(false);
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

    setMessageLoading(true);
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
      setMessageLoading(false);
    }
  };

  if (isOwnProfile) {
    return (
      <div className={styles.heroButtons}>
        <button 
          type="button" 
          className={styles.btnEditProfile} 
          onClick={() => router.push("/dashboard/settings")}
        >
          Ubah Profile
        </button>
      </div>
    );
  }

  return (
    <div className={styles.heroButtons}>
      <FollowButton 
        targetUserId={targetUserId}
        targetUserName={targetUserName}
        initialIsFollowing={initialIsFollowing}
      />
      <button 
        type="button" 
        className={styles.btnMessage} 
        onClick={handleMessage}
        disabled={messageLoading}
      >
        {messageLoading ? "Menghubungkan..." : "Pesan"}
      </button>
    </div>
  );
}
