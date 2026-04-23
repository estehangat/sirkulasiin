"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, ExternalLink, Inbox, Sparkles } from "lucide-react";
import { useNotifications, AppNotification } from "../context/NotificationContext";
import Link from "next/link";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "scan": return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "transaction": return <Inbox className="w-4 h-4 text-blue-400" />;
      case "reward": return <Sparkles className="w-4 h-4 text-amber-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.bellBtn}
        aria-label="Notifikasi"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? styles.swing : ''}`} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            <span className={styles.ping}></span>
            <span className={styles.count}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.headerTitle}>
                Notifikasi
                {unreadCount > 0 && (
                  <span className={styles.newBadge}>
                    {unreadCount} Baru
                  </span>
                )}
              </h3>
              <p className={styles.headerSubtitle}>Update terbaru dari aktivitas Anda</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={styles.markReadBtn}
              >
                <Check className="w-3 h-3" />
                Tandai dibaca
              </button>
            )}
          </div>

          <div className={`${styles.list} ${styles.customScrollbar}`}>
            {isLoading ? (
              <div className={styles.emptyState}>
                 <p>Memuat notifikasi...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Bell className="w-8 h-8" />
                </div>
                <div className={styles.emptyText}>
                  <h4>Belum ada kabar baru</h4>
                  <p>Notifikasi Anda akan muncul di sini.</p>
                </div>
              </div>
            ) : (
              <div className={styles.listInner}>
                {notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className={`${styles.item} ${!n.is_read ? styles.itemUnread : ''}`}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                      if (n.link) window.location.href = n.link;
                    }}
                  >
                    {!n.is_read && (
                      <div className={styles.unreadIndicator} />
                    )}
                    <div className="flex gap-4">
                      <div className={`${styles.iconWrap} ${!n.is_read ? styles.iconWrapUnread : ''}`}>
                        {getTypeIcon(n.type)}
                      </div>
                      <div className={styles.content}>
                        <div className={styles.itemHeader}>
                          <p className={`${styles.itemTitle} ${!n.is_read ? styles.itemTitleUnread : ''}`}>
                            {n.title}
                          </p>
                          <span className={styles.itemTime}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`${styles.itemMessage} ${!n.is_read ? styles.itemMessageUnread : ''}`}>
                          {n.message}
                        </p>
                        {n.link && (
                          <div className={styles.itemAction}>
                            Detail <ExternalLink className="w-2.5 h-2.5 ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/notifications"
            className={styles.viewAll}
            onClick={() => setIsOpen(false)}
          >
            Lihat Semua Notifikasi
          </Link>
        </div>
      )}
    </div>
  );
}
