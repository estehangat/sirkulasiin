"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getFollowers, getFollowing } from "@/app/actions/follow";
import FollowButton from "@/app/components/FollowButton";
import styles from "./profile.module.css";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_following?: boolean;
}

interface FollowStatsClientProps {
  userId: string;
  initialFollowersCount: number;
  initialFollowingCount: number;
}

export default function FollowStatsClient({
  userId,
  initialFollowersCount,
  initialFollowingCount
}: FollowStatsClientProps) {
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchUsers = useCallback(async (isInitial = false) => {
    if (!modalType) return;
    
    setLoading(true);
    const currentOffset = isInitial ? 0 : offset;
    const limit = 10;

    try {
      let data: UserProfile[] = [];
      if (modalType === "followers") {
        data = await getFollowers(userId, currentOffset, limit);
      } else {
        data = await getFollowing(userId, currentOffset, limit);
      }

      setUsers(prev => isInitial ? data : [...prev, ...data]);
      setHasMore(data.length === limit);
      setOffset(prev => isInitial ? limit : prev + limit);
    } catch (err) {
      console.error("Fetch follows error:", err);
    } finally {
      setLoading(false);
    }
  }, [modalType, userId, offset]);

  useEffect(() => {
    if (modalType) {
      setUsers([]);
      setOffset(0);
      setHasMore(true);
      fetchUsers(true);
    }
  }, [modalType]); // fetchUsers is omitted here to avoid loop, we use isInitial flag

  const lastUserRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchUsers();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchUsers]);

  const closeModal = () => {
    setModalType(null);
    setUsers([]);
  };

  return (
    <>
      <div className={styles.followStats}>
        <div className={styles.followStatItem} onClick={() => setModalType("following")} style={{ cursor: "pointer" }}>
          <strong>{initialFollowingCount}</strong>
          <span>Mengikuti</span>
        </div>
        <div className={styles.followStatItem} onClick={() => setModalType("followers")} style={{ cursor: "pointer" }}>
          <strong>{initialFollowersCount}</strong>
          <span>Pengikut</span>
        </div>
      </div>

      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContentList} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modalType === "followers" ? "Pengikut" : "Mengikuti"}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>×</button>
            </div>
            
            <div className={styles.userListScroll}>
              {users.length === 0 && !loading && (
                <div className={styles.emptyList}>
                  Belum ada data untuk ditampilkan.
                </div>
              )}
              
              {users.map((user, index) => (
                <div 
                  key={`${user.id}-${index}`} 
                  className={styles.userRow}
                  ref={index === users.length - 1 ? lastUserRef : null}
                >
                  <Link href={`/profile?id=${user.id}`} className={styles.userInfoLink} onClick={closeModal}>
                    <div className={styles.listAvatar}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username || "avatar"} />
                      ) : (
                        <div className={styles.listAvatarPlaceholder}>
                          {(user.full_name || user.username || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.listUserDetails}>
                      <span className={styles.listFullName}>{user.full_name || user.username}</span>
                      <span className={styles.listUsername}>@{user.username}</span>
                    </div>
                  </Link>
                  
                  <div className={styles.listAction}>
                    <FollowButton 
                      targetUserId={user.id}
                      targetUserName={user.full_name || user.username || ""}
                      initialIsFollowing={user.is_following || false}
                      variant="list"
                    />
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className={styles.listLoading}>
                  <div className={styles.spinner}></div>
                  <span>Memuat...</span>
                </div>
              )}
              
              {!hasMore && users.length > 0 && (
                <div className={styles.listEnd}>
                  Semua data telah ditampilkan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
