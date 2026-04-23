"use client";

import { useNotifications, AppNotification } from "@/app/context/NotificationContext";
import Navbar from "@/app/components/navbar";
import { 
  Bell, 
  Check, 
  Clock, 
  Sparkles, 
  Inbox, 
  AlertTriangle, 
  ExternalLink,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styles from "./notifications.module.css";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState<AppNotification["type"] | "all">("all");
  const [search, setSearch] = useState("");

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === "all" || n.type === filter;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                         n.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "scan": return <Sparkles size={20} className="text-emerald-500" />;
      case "transaction": return <Inbox size={20} className="text-blue-500" />;
      case "reward": return <Sparkles size={20} className="text-amber-500" />;
      case "admin_alert": return <AlertTriangle size={20} className="text-rose-500" />;
      default: return <Bell size={20} className="text-slate-500" />;
    }
  };

  return (
    <main className={styles.page}>
      <Navbar />

      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerRow}>
          <div className={styles.titleSection}>
            <div className={styles.titleWrap}>
              <div className={styles.iconBox}>
                <Bell size={24} />
              </div>
              <h1 className={styles.title}>Notifikasi</h1>
            </div>
            <p className={styles.subtitle}>
              Pantau aktivitas scan, transaksi, dan pembaruan sistem Anda di satu tempat.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={styles.markAllBtn}
            >
              <Check className="w-4 h-4 text-emerald-500" />
              Tandai semua sudah dibaca
            </button>
          )}
        </div>

        {/* Filters & Search */}
        <div className={styles.filterSearchRow}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Cari notifikasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterList}>
            {(["all", "scan", "transaction", "reward", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`${styles.filterBtn} ${filter === t ? styles.filterBtnActive : ""}`}
              >
                {t === "all" ? "Semua" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className={styles.list}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBox}>
                <Inbox size={32} />
              </div>
              <h3 className={styles.emptyTitle}>Hening sekali di sini</h3>
              <p className={styles.emptyDesc}>
                Anda belum memiliki notifikasi {filter !== "all" ? `kategori ${filter}` : ""}.
              </p>
              <Link href="/scan" className={styles.scanLink}>
                Scan Sekarang
              </Link>
            </div>
          ) : (
            <div className={styles.listGrid}>
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className={`${styles.item} ${!n.is_read ? styles.itemUnread : ""}`}
                >
                  {!n.is_read && (
                    <div className={styles.unreadDot} />
                  )}
                  
                  <div className={styles.itemIconBox}>
                    {getIcon(n.type)}
                  </div>
                  
                  <div className={styles.itemMain}>
                    <div className={styles.itemTop}>
                      <h4 className={styles.itemTitle}>
                        {n.title}
                      </h4>
                      <div className={styles.itemMeta}>
                        <Clock size={12} />
                        {new Date(n.created_at).toLocaleDateString("id-ID", { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <p className={styles.itemMessage}>
                      {n.message}
                    </p>
                    
                    {n.link && (
                      <div className={styles.itemFooter}>
                        TINDAK LANJUTI <ExternalLink size={12} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
