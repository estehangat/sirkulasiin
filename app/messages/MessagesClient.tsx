"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import styles from "./messages.module.css";

/* ─────────────── Types ─────────────── */
type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: "text" | "product_card" | "barter_card";
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type OtherUser = { id: string; name: string; avatar: string | null };

type Room = {
  id: string;
  other_user: OtherUser;
  last_message: Message | null;
  unread_count?: number;
};

type CurrentUser = { id: string; name: string; avatar: string | null };

/* ─────────────── Helpers ─────────────── */
function formatTime(ts: string): string {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000)
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diff < 172_800_000) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "short" });
}

function formatRupiah(price: unknown): string {
  const num = typeof price === "string" ? parseInt(price) : Number(price);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function getPreview(msg: Message | null, myId: string): string {
  if (!msg) return "Mulai percakapan...";
  if (msg.type === "product_card") return "📦 Menanyakan produk";
  if (msg.type === "barter_card") return "🔄 Tawaran Barter";
  const prefix = msg.sender_id === myId ? "Anda: " : "";
  const text = msg.content;
  return prefix + (text.length > 45 ? text.slice(0, 45) + "…" : text);
}

function getDateLabel(ts: string): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hari Ini";
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/* ─────────────── Sub-components ─────────────── */
function AvatarEl({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar)
    return (
      <div className={styles.avatar} style={{ width: size, height: size }}>
        <Image src={avatar} alt={name} fill sizes={`${size}px`} className={styles.avatarImg} unoptimized />
      </div>
    );
  return (
    <div className={styles.avatarInitials} style={{ width: size, height: size, fontSize: size * 0.37 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ProductCardBubble({ metadata, isSent }: { metadata: Record<string, unknown> | null; isSent: boolean }) {
  if (!metadata) return null;
  const href = metadata.listing_id ? `/marketplace/${metadata.listing_id}` : "#";
  return (
    <Link href={href} className={`${styles.productBubble} ${styles.bubbleLink}`}>
      <div className={`${styles.productBubbleImageWrap} ${!isSent ? styles.productBubbleImageWrapReceived : ""}`}>
        {metadata.image_url ? (
          <Image
            src={metadata.image_url as string}
            alt={metadata.title as string}
            fill
            sizes="80px"
            className={styles.productBubbleImage}
            unoptimized
          />
        ) : (
          <div className={styles.productBubbleImagePlaceholder}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.productBubbleInfo}>
        <p className={`${styles.productBubbleLabel} ${!isSent ? styles.productBubbleLabelReceived : ""}`}>
          Menanyakan Produk
        </p>
        <p className={styles.productBubbleTitle}>{metadata.title as string}</p>
        <p className={styles.productBubblePrice}>{formatRupiah(metadata.price)}</p>
        {!!metadata.carbon_saved && (
          <p className={styles.productBubbleCo2}>🌿 Hemat {String(metadata.carbon_saved)}</p>
        )}
      </div>
    </Link>
  );
}

function BarterCardBubble({ metadata, isSent }: { metadata: Record<string, unknown> | null; isSent: boolean }) {
  if (!metadata) return null;
  return (
    <div className={styles.barterBubble}>
      <div className={styles.barterBubbleHeader}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span>Tawaran Barter</span>
      </div>
      <p className={styles.barterBubbleItem}>
        <span className={styles.barterBubbleItemLabel}>Produk diminta:</span>{" "}
        {metadata.listing_title as string}
      </p>
      <div className={`${styles.barterBubbleDivider} ${!isSent ? styles.barterBubbleDividerReceived : ""}`} />
      <p className={styles.barterBubbleItem}>
        <span className={styles.barterBubbleItemLabel}>Ditawarkan:</span>{" "}
        {metadata.offered_item_name as string}
      </p>
      {!!metadata.offered_item_description && (
        <p className={styles.barterBubbleDesc}>{String(metadata.offered_item_description)}</p>
      )}
      {Number(metadata.cash_addition) > 0 && (
        <p className={styles.barterBubbleItem}>
          <span className={styles.barterBubbleItemLabel}>Tukar tambah:</span>{" "}
          {formatRupiah(metadata.cash_addition)}
        </p>
      )}
      {!!metadata.message && (
        <p className={`${styles.barterBubbleMsg} ${!isSent ? styles.barterBubbleMsgReceived : ""}`}>
          &ldquo;{String(metadata.message)}&rdquo;
        </p>
      )}
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function MessagesClient({
  currentUser,
  initialRoomId,
}: {
  currentUser: CurrentUser;
  initialRoomId?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(initialRoomId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Fetch all rooms ── */
  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    const { data: rawRooms } = await supabase
      .from("chat_rooms")
      .select("id, participant1, participant2, created_at")
      .order("created_at", { ascending: false });

    if (!rawRooms?.length) {
      setLoadingRooms(false);
      return;
    }

    const otherIds = rawRooms.map((r) =>
      r.participant1 === currentUser.id ? r.participant2 : r.participant1
    );
    const uniqueIds = [...new Set(otherIds)];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", uniqueIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

    // Fetch last message per room
    const roomIds = rawRooms.map((r) => r.id);
    const lastMsgMap = new Map<string, Message>();
    const unreadMap = new Map<string, number>();

    await Promise.all(
      roomIds.map(async (rid) => {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("room_id", rid)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data?.[0]) lastMsgMap.set(rid, data[0] as Message);

        // Fetch unread count safely
        const { count, error } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("room_id", rid)
          .neq("sender_id", currentUser.id)
          .or("is_read.eq.false,is_read.is.null");
        
        if (error) {
          console.error("Error fetching unread count:", error);
        } else if (count !== null) {
          unreadMap.set(rid, count);
        }
      })
    );

    const formatted: Room[] = rawRooms.map((r) => {
      const otherId = r.participant1 === currentUser.id ? r.participant2 : r.participant1;
      const p = profileMap.get(otherId);
      return {
        id: r.id,
        other_user: {
          id: otherId,
          name: p?.full_name || p?.username || "User",
          avatar: p?.avatar_url || null,
        },
        last_message: lastMsgMap.get(r.id) ?? null,
        unread_count: unreadMap.get(r.id) || 0,
      };
    });

    // Sort by last message time descending
    formatted.sort((a, b) => {
      const ta = a.last_message?.created_at ?? a.id;
      const tb = b.last_message?.created_at ?? b.id;
      return tb.localeCompare(ta);
    });

    setRooms(formatted);
    setLoadingRooms(false);
  }, [currentUser.id, supabase]);

  /* ── Fetch messages for a room ── */
  const fetchMessages = useCallback(
    async (roomId: string) => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
      setLoadingMessages(false);
    },
    [supabase]
  );

  /* ── Stale-closure-safe refs ── */
  const activeRoomIdRef = useRef(activeRoomId);
  const currentUserIdRef = useRef(currentUser.id);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { currentUserIdRef.current = currentUser.id; }, [currentUser.id]);

  /* ── Per-room channel: renders messages inside the open chat ── */
  useEffect(() => {
    if (!activeRoomId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase
      .channel(`room-${activeRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id !== currentUserIdRef.current) {
            supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id).then();
          }
          setRooms((prev) =>
            prev.map((r) =>
              r.id === activeRoomId ? { ...r, last_message: msg, unread_count: 0 } : r
            ).sort((a, b) => (b.last_message?.created_at ?? b.id).localeCompare(a.last_message?.created_at ?? a.id))
          );
        }
      )
      .subscribe((status) => {
        console.log(`[room-${activeRoomId}] status:`, status);
      });

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [activeRoomId, supabase]);

  /* ── Global channel: updates sidebar for OTHER rooms ── */
  useEffect(() => {
    const globalCh = supabase
      .channel("global-sidebar")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as Message;
          // Skip if this is for the currently open room (handled above)
          if (msg.room_id === activeRoomIdRef.current) return;
          // Skip messages I sent
          if (msg.sender_id === currentUserIdRef.current) return;

          setRooms((prev) => {
            if (!prev.some((r) => r.id === msg.room_id)) {
              fetchRooms();
              return prev;
            }
            return prev
              .map((r) =>
                r.id === msg.room_id
                  ? { ...r, last_message: msg, unread_count: (r.unread_count || 0) + 1 }
                  : r
              )
              .sort((a, b) =>
                (b.last_message?.created_at ?? b.id).localeCompare(a.last_message?.created_at ?? a.id)
              );
          });
        }
      )
      .subscribe((status) => {
        console.log("[global-sidebar] status:", status);
      });

    return () => { supabase.removeChannel(globalCh); };
  }, [supabase, fetchRooms]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    if (!activeRoomId) return;
    fetchMessages(activeRoomId);
    setRooms((prev) =>
      prev.map((r) => (r.id === activeRoomId ? { ...r, unread_count: 0 } : r))
    );
    supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", activeRoomId)
      .neq("sender_id", currentUser.id)
      .then((res) => {
        if (res.error) console.error("Mark read error:", res.error);
      });
  }, [activeRoomId, fetchMessages, currentUser.id, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Send message ── */
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !activeRoomId || sending) return;
    setSending(true);
    setInputText("");
    
    const { data, error } = await supabase.from("chat_messages").insert({
      room_id: activeRoomId,
      sender_id: currentUser.id,
      content: text,
      type: "text",
    }).select().single();

    if (data && !error) {
      const msg = data as Message;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setRooms((prev) =>
        prev.map((r) => (r.id === activeRoomId ? { ...r, last_message: msg } : r))
      );
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Render messages with date separators ── */
  const renderMessages = () => {
    const els: React.ReactNode[] = [];
    let lastLabel = "";
    for (const msg of messages) {
      const label = getDateLabel(msg.created_at);
      if (label !== lastLabel) {
        lastLabel = label;
        els.push(
          <div key={`sep-${msg.id}`} className={styles.dateSeparator}>
            <span>{label}</span>
          </div>
        );
      }
      const isSent = msg.sender_id === currentUser.id;
      els.push(
        <div key={msg.id} className={isSent ? styles.bubbleWrapSent : styles.bubbleWrapReceived}>
          {!isSent && (
            <AvatarEl name={activeRoom?.other_user.name ?? "U"} avatar={activeRoom?.other_user.avatar ?? null} size={32} />
          )}
          <div className={isSent ? styles.bubbleSent : styles.bubbleReceived}>
            {msg.type === "text" && <p className={styles.bubbleText}>{msg.content}</p>}
            {msg.type === "product_card" && <ProductCardBubble metadata={msg.metadata} isSent={isSent} />}
            {msg.type === "barter_card" && <BarterCardBubble metadata={msg.metadata} isSent={isSent} />}
            <span className={isSent ? styles.bubbleTimeSent : styles.bubbleTimeReceived}>
              {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      );
    }
    return els;
  };

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Kembali">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className={styles.sidebarTitle}>Pesan</h1>
        </div>
        <label className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Cari percakapan..." className={styles.searchInput} />
        </label>
        <div className={styles.roomList}>
          {loadingRooms ? (
            <p className={styles.stateText}>Memuat percakapan…</p>
          ) : rooms.length === 0 ? (
            <div className={styles.emptyRooms}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Belum ada percakapan</p>
              <Link href="/marketplace" className={styles.emptyLink}>
                Jelajahi Marketplace →
              </Link>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                className={`${styles.roomItem} ${activeRoomId === room.id ? styles.roomItemActive : ""}`}
                onClick={() => setActiveRoomId(room.id)}
              >
                <AvatarEl name={room.other_user.name} avatar={room.other_user.avatar} size={44} />
                <div className={styles.roomInfo}>
                  <div className={styles.roomTop}>
                    <span className={styles.roomName}>{room.other_user.name}</span>
                    {room.last_message && (
                      <span className={styles.roomTime}>{formatTime(room.last_message.created_at)}</span>
                    )}
                  </div>
                  <div className={styles.roomBottom}>
                    <p className={`${styles.roomPreview} ${room.unread_count ? styles.roomPreviewUnread : ""}`}>
                      {getPreview(room.last_message, currentUser.id)}
                    </p>
                    {!!room.unread_count && (
                      <span className={styles.unreadBadge}>{room.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <main className={styles.chatArea}>
        {!activeRoom ? (
          <div className={styles.noChatSelected}>
            <div className={styles.noChatIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.noChatTitle}>Pilih percakapan</h3>
            <p className={styles.noChatSub}>
              Pilih kontak di sebelah kiri atau mulai chat dengan penjual dari halaman produk.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderUser}>
                <AvatarEl name={activeRoom.other_user.name} avatar={activeRoom.other_user.avatar} size={40} />
                <div>
                  <p className={styles.chatHeaderName}>{activeRoom.other_user.name}</p>
                  <p className={styles.chatHeaderStatus}>
                    <span className={styles.onlineDot} />
                    Online
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
              {loadingMessages ? (
                <p className={styles.stateText}>Memuat pesan…</p>
              ) : messages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <p>Belum ada pesan. Mulai percakapan!</p>
                </div>
              ) : (
                <>
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className={styles.inputBar}>
              <textarea
                className={styles.chatInput}
                placeholder="Tulis pesan…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                aria-label="Kirim"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
