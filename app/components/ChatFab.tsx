"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./ChatFab.module.css";

export default function ChatFab() {
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Hide on the messages page itself
  const isMessagesPage = pathname?.startsWith("/messages");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setShow(!!session?.user);
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setShow(!!session?.user);
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const supabase = createClient();

    const fetchUnread = async () => {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`participant1.eq.${userId},participant2.eq.${userId}`);
      
      if (!rooms?.length) {
        setUnreadCount(0);
        return;
      }
      
      const roomIds = rooms.map((r) => r.id);

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('room_id', roomIds)
        .neq('sender_id', userId)
        .or('is_read.eq.false,is_read.is.null');

      if (count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnread();

    const channel = supabase
      .channel('global-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!show || isMessagesPage) return null;

  return (
    <button
      id="chat-fab-btn"
      className={styles.fab}
      onClick={() => router.push("/messages")}
      aria-label="Buka pesan"
      title="Pesan"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unreadCount > 0 && (
        <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}
