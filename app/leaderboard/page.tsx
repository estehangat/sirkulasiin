import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Zap, Store, Recycle, Camera, Medal } from "lucide-react";
import Navbar from "../components/navbar";
import styles from "./leaderboard.module.css";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Papan Peringkat — SirkulasiIn",
  description: "Lihat peringkat Green Guardian terbaik di SirkulasiIn berdasarkan eco-points, listing marketplace, daur ulang, dan scan.",
};

type TabKey = "points" | "seller" | "recycler" | "scanner";

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  points: <Zap size={15} />,
  seller: <Store size={15} />,
  recycler: <Recycle size={15} />,
  scanner: <Camera size={15} />,
};

const TAB_CONFIG: { key: TabKey; label: string; unit: string }[] = [
  { key: "points", label: "Eco Points", unit: "poin" },
  { key: "seller", label: "Top Seller", unit: "listing" },
  { key: "recycler", label: "Top Recycler", unit: "proyek" },
  { key: "scanner", label: "Top Scanner", unit: "scan" },
];

const AVATAR_COLORS = [
  "#27ae60", "#3b82f6", "#d97706", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f59e0b", "#06b6d4",
  "#ef4444", "#6366f1",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getDisplayName(entry: LeaderboardEntry): string {
  if (entry.full_name) return entry.full_name;
  if (entry.username) return `@${entry.username}`;
  return `Pengguna ${entry.id.slice(0, 6)}...`;
}

type LeaderboardEntry = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  score: number;
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const activeTab = (typeof sp.tab === "string" && TAB_CONFIG.some(t => t.key === sp.tab) ? sp.tab : "points") as TabKey;
  const tabMeta = TAB_CONFIG.find(t => t.key === activeTab)!;

  const supabase = await createServerSupabaseClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  let entries: LeaderboardEntry[] = [];

  if (activeTab === "points") {
    const { data } = await supabase
      .from("user_points")
      .select("user_id, total_points, profiles ( full_name, username, avatar_url )")
      .order("total_points", { ascending: false })
      .limit(50);

    entries = (data ?? []).map((row: any) => ({
      id: row.user_id,
      full_name: row.profiles?.full_name,
      username: row.profiles?.username,
      avatar_url: row.profiles?.avatar_url,
      score: row.total_points ?? 0,
    }));
  } else if (activeTab === "seller") {
    const { data } = await supabase
      .from("marketplace_listings")
      .select("user_id")
      .eq("status", "published");

    const countMap: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      if (!r.user_id) return;
      countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
    });

    const sorted = Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50);

    if (sorted.length > 0) {
      const userIds = sorted.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      entries = sorted.map(([uid, count]) => {
        const p = profileMap.get(uid);
        return {
          id: uid,
          full_name: p?.full_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
          score: count,
        };
      });
    }
  } else if (activeTab === "recycler") {
    const { data } = await supabase
      .from("tutorial_submissions")
      .select("user_id");

    const countMap: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      if (!r.user_id) return;
      countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
    });

    const sorted = Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50);

    if (sorted.length > 0) {
      const userIds = sorted.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      entries = sorted.map(([uid, count]) => {
        const p = profileMap.get(uid);
        return {
          id: uid,
          full_name: p?.full_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
          score: count,
        };
      });
    }
  } else {
    const { data } = await supabase
      .from("scan_history")
      .select("user_id");

    const countMap: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      if (!r.user_id) return;
      countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
    });

    const sorted = Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50);

    if (sorted.length > 0) {
      const userIds = sorted.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      entries = sorted.map(([uid, count]) => {
        const p = profileMap.get(uid);
        return {
          id: uid,
          full_name: p?.full_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
          score: count,
        };
      });
    }
  }

  // Find current user's rank
  const selfIndex = currentUser ? entries.findIndex(e => e.id === currentUser.id) : -1;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const podiumStyles = [styles.podiumSecond, styles.podiumFirst, styles.podiumThird];
  const medalStyles = [styles.medalSilver, styles.medalGold, styles.medalBronze];
  const podiumRanks = [2, 1, 3];

  if (top3.length < 3) {
    // If less than 3, just use sequential
    podiumStyles.splice(0, podiumStyles.length, ...top3.map((_, i) => [styles.podiumFirst, styles.podiumSecond, styles.podiumThird][i]));
    medalStyles.splice(0, medalStyles.length, ...top3.map((_, i) => [styles.medalGold, styles.medalSilver, styles.medalBronze][i]));
    podiumOrder.splice(0, podiumOrder.length, ...top3);
  }

  return (
    <main className={styles.pageShell}>
      <Navbar />

      <div className={styles.container}>
        {/* ─── Header ─── */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>
            <Trophy size={14} /> Papan Peringkat
          </span>
          <h1 className={styles.title}>Green Guardian Terbaik</h1>
          <p className={styles.subtitle}>
            Lihat siapa yang paling aktif berkontribusi dalam ekosistem sirkular SirkulasiIn
          </p>
        </div>

        {/* ─── Tabs ─── */}
        <div className={styles.tabs}>
          {TAB_CONFIG.map(t => (
            <Link
              key={t.key}
              href={`/leaderboard?tab=${t.key}`}
              className={t.key === activeTab ? styles.tabActive : styles.tab}
            >
              {TAB_ICONS[t.key]} {t.label}
            </Link>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Medal size={48} strokeWidth={1.5} /></div>
            <p className={styles.emptyText}>Belum ada data untuk kategori ini</p>
          </div>
        ) : (
          <>
            {/* ─── Podium (Top 3) ─── */}
            {top3.length >= 3 ? (
              <div className={styles.podium}>
                {podiumOrder.map((entry, i) => (
                  <Link href={`/profile?id=${entry.id}`} key={entry.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className={podiumStyles[i]}>
                      <span className={medalStyles[i]}>{podiumRanks[i]}</span>
                      <div className={styles.podiumAvatar} style={{ background: getAvatarColor(entry.id) }}>
                        {entry.avatar_url ? (
                          <Image src={entry.avatar_url} alt="" fill className={styles.podiumAvatarImg} sizes="56px" />
                        ) : (
                          (entry.full_name || entry.username || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <p className={styles.podiumName}>{entry.full_name || entry.username || "Anonim"}</p>
                      {entry.username && <p className={styles.podiumUsername}>@{entry.username}</p>}
                      <p className={styles.podiumScore}>{entry.score.toLocaleString("id-ID")}</p>
                      <p className={styles.podiumLabel}>{tabMeta.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.podium}>
                {top3.map((entry, i) => (
                  <Link href={`/profile?id=${entry.id}`} key={entry.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className={[styles.podiumFirst, styles.podiumSecond, styles.podiumThird][i]}>
                      <span className={[styles.medalGold, styles.medalSilver, styles.medalBronze][i]}>{i + 1}</span>
                      <div className={styles.podiumAvatar} style={{ background: getAvatarColor(entry.id) }}>
                        {entry.avatar_url ? (
                          <Image src={entry.avatar_url} alt="" fill className={styles.podiumAvatarImg} sizes="56px" />
                        ) : (
                          (entry.full_name || entry.username || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <p className={styles.podiumName}>{entry.full_name || entry.username || "Anonim"}</p>
                      {entry.username && <p className={styles.podiumUsername}>@{entry.username}</p>}
                      <p className={styles.podiumScore}>{entry.score.toLocaleString("id-ID")}</p>
                      <p className={styles.podiumLabel}>{tabMeta.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ─── List (Rank 4+) ─── */}
            {rest.length > 0 && (
              <div className={styles.list}>
                {rest.map((entry, i) => {
                  const rank = i + 4;
                  const isSelf = currentUser?.id === entry.id;
                  return (
                    <Link href={`/profile?id=${entry.id}`} key={entry.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className={isSelf ? styles.listItemSelf : styles.listItem}>
                        <span className={styles.rank}>#{rank}</span>
                        <div className={styles.listAvatar} style={{ background: getAvatarColor(entry.id) }}>
                          {entry.avatar_url ? (
                            <Image src={entry.avatar_url} alt="" fill className={styles.listAvatarImg} sizes="40px" />
                          ) : (
                            (entry.full_name || entry.username || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={styles.listInfo}>
                          <p className={styles.listName}>{entry.full_name || entry.username || "Anonim"}</p>
                          {entry.username && <p className={styles.listUsername}>@{entry.username}</p>}
                        </div>
                        <span className={styles.listScore}>{entry.score.toLocaleString("id-ID")}</span>
                        <span className={styles.listLabel}>{tabMeta.unit}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ─── Self Rank ─── */}
            {currentUser && selfIndex >= 0 && selfIndex >= 3 && (
              <div className={styles.selfRank}>
                <span className={styles.selfRankPosition}>#{selfIndex + 1}</span>
                <div className={styles.selfRankInfo}>
                  <p className={styles.selfRankLabel}>Peringkat Anda</p>
                  <p className={styles.selfRankName}>
                    {entries[selfIndex].full_name || entries[selfIndex].username || "Anda"}
                  </p>
                </div>
                <span className={styles.selfRankScore}>
                  {entries[selfIndex].score.toLocaleString("id-ID")} {tabMeta.unit}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
