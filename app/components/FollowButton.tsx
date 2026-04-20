"use client";

import { useState } from "react";
import { toggleFollow } from "@/app/actions/follow";
import styles from "../profile/profile.module.css";

interface FollowButtonProps {
  targetUserId: string;
  targetUserName: string;
  initialIsFollowing: boolean;
  onStatusChange?: (newStatus: boolean) => void;
  variant?: "primary" | "secondary" | "list";
}

export default function FollowButton({
  targetUserId,
  targetUserName,
  initialIsFollowing,
  onStatusChange,
  variant = "primary"
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isFollowing) {
      setShowUnfollowModal(true);
      return;
    }

    setLoading(true);
    try {
      const { success, isFollowing: newStatus } = await toggleFollow(targetUserId);
      if (success) {
        setIsFollowing(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status mengikuti");
    } finally {
      setLoading(false);
    }
  };

  const confirmUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUnfollowModal(false);
    setLoading(true);
    try {
      const { success, isFollowing: newStatus } = await toggleFollow(targetUserId);
      if (success) {
        setIsFollowing(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch (err: any) {
      alert(err.message || "Gagal berhenti mengikuti");
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = () => {
    if (variant === "list") {
        return isFollowing ? styles.btnFollowingSmall : styles.btnFollowSmall;
    }
    return isFollowing ? styles.btnFollowing : styles.btnFollow;
  };

  return (
    <>
      <button
        type="button"
        className={getButtonClass()}
        onClick={handleFollow}
        disabled={loading}
      >
        {loading 
          ? (isFollowing ? "..." : "...") 
          : (isFollowing ? "Diikuti" : "Ikuti")
        }
      </button>

      {/* ── Unfollow Confirmation Modal ── */}
      {showUnfollowModal && (
        <div className={styles.modalOverlayHigh} onClick={() => setShowUnfollowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Berhenti mengikuti @{targetUserName}?</h2>
            <p className={styles.modalDesc}>
              Anda tidak akan lagi melihat aktivitas terbaru mereka di linimasa Anda.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalBtnDanger} 
                onClick={confirmUnfollow}
                disabled={loading}
              >
                {loading ? "Memproses..." : "Berhenti Mengikuti"}
              </button>
              <button 
                className={styles.modalBtnSecondary} 
                onClick={() => setShowUnfollowModal(false)}
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
