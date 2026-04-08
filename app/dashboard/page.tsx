import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Dashboard — SirkulasiIn",
  description: "Dashboard SirkulasiIn - Kelola aktivitas sirkular Anda.",
};

type ScanHistoryRow = {
  created_at: string;
  item_name: string;
  material: string | null;
  recommendation: string;
  carbon_offset: number | null;
  potential_reward: string | null;
  circular_potential: number | null;
  reason: string | null;
};

type ActivityItem = {
  title: string;
  time: string;
  meta: string;
};

type RecommendationSplit = {
  label: string;
  value: number;
  pct: number;
};

function toShortDay(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "short" });
}

function formatTimeAgo(value: string) {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffMs = now - target;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${Math.max(diffMins, 1)} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function extractNumber(value: string | null) {
  if (!value) return 0;
  const parsed = value.replace(/[^\d]/g, "");
  if (!parsed) return 0;
  return Number(parsed);
}

function recommendationLabel(rec: string) {
  if (rec === "recycle") return "Daur Ulang";
  if (rec === "sell") return "Jual";
  if (rec === "dispose") return "Buang Terarah";
  return "Lainnya";
}

function buildWeeklyTrend(rows: ScanHistoryRow[]) {
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    return {
      key: date.toISOString().slice(0, 10),
      day: toShortDay(date),
      count: 0,
    };
  });

  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const target = days.find((d) => d.key === key);
    if (target) target.count += 1;
  });

  return days;
}

function buildCategorySplit(rows: ScanHistoryRow[]) {
  const bucket = new Map<string, number>();
  rows.forEach((row) => {
    const label = row.material?.trim() || "Tidak diketahui";
    bucket.set(label, (bucket.get(label) || 0) + 1);
  });

  const total = rows.length || 1;
  return Array.from(bucket.entries())
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / total) * 100),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildRecentActivity(rows: ScanHistoryRow[]): ActivityItem[] {
  return rows.slice(0, 5).map((row) => ({
    title: `Scan ${row.item_name}`,
    time: formatTimeAgo(row.created_at),
    meta: `${recommendationLabel(row.recommendation)} · ${row.reason || "Analisis tersimpan."}`,
  }));
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getDashboardData() {
  const supabase = await createServerSupabaseClient();
  const monthStart = getStartOfMonth().toISOString();

  const { data, error } = await supabase
    .from("scan_history")
    .select(
      "created_at,item_name,material,recommendation,carbon_offset,potential_reward,circular_potential,reason",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error || !data) {
    return {
      status: "fallback" as const,
      totalScanMonth: 0,
      ecoPoints: 0,
      recycleRate: 0,
      totalCarbonOffset: 0,
      weeklyTrend: buildWeeklyTrend([]),
      categorySplit: [],
      recentActivity: [],
      monthlyTarget: 120,
      materialTracked: 0,
      averageCircularPotential: 0,
      recommendationSplit: [] as RecommendationSplit[],
      topMaterial: "-",
      todayScanCount: 0,
    };
  }

  const rows = data as ScanHistoryRow[];
  const rowsThisMonth = rows.filter(
    (r) => new Date(r.created_at) >= new Date(monthStart),
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayScanCount = rows.filter(
    (r) => new Date(r.created_at).toISOString().slice(0, 10) === todayKey,
  ).length;
  const recycleCount = rowsThisMonth.filter(
    (r) => r.recommendation === "recycle",
  ).length;
  const sellCount = rowsThisMonth.filter(
    (r) => r.recommendation === "sell",
  ).length;
  const disposeCount = rowsThisMonth.filter(
    (r) => r.recommendation === "dispose",
  ).length;
  const ecoPoints = rowsThisMonth.reduce(
    (acc, row) => acc + extractNumber(row.potential_reward),
    0,
  );
  const totalCarbonOffset = rowsThisMonth.reduce(
    (acc, row) => acc + (row.carbon_offset || 0),
    0,
  );
  const circularPotentialSum = rowsThisMonth.reduce(
    (acc, row) => acc + (row.circular_potential || 0),
    0,
  );
  const avgCircularPotential = rowsThisMonth.length
    ? Math.round(circularPotentialSum / rowsThisMonth.length)
    : 0;

  const recommendationSplitRaw = [
    { label: "Daur Ulang", value: recycleCount },
    { label: "Jual", value: sellCount },
    { label: "Buang Terarah", value: disposeCount },
  ];

  const recommendationSplit = recommendationSplitRaw.map((item) => ({
    ...item,
    pct: rowsThisMonth.length
      ? Math.round((item.value / rowsThisMonth.length) * 100)
      : 0,
  }));

  const categorySplit = buildCategorySplit(rowsThisMonth);
  const topMaterial = categorySplit[0]?.name || "-";

  return {
    status: "live" as const,
    totalScanMonth: rowsThisMonth.length,
    ecoPoints,
    recycleRate: rowsThisMonth.length
      ? Math.round((recycleCount / rowsThisMonth.length) * 100)
      : 0,
    totalCarbonOffset,
    weeklyTrend: buildWeeklyTrend(rows),
    categorySplit,
    recentActivity: buildRecentActivity(rows),
    monthlyTarget: 120,
    materialTracked: new Set(
      rowsThisMonth.map((r) => r.material).filter(Boolean),
    ).size,
    averageCircularPotential: avgCircularPotential,
    recommendationSplit,
    topMaterial,
    todayScanCount,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxTrend = Math.max(...data.weeklyTrend.map((item) => item.count), 1);
  const maxRecommendation = Math.max(
    ...data.recommendationSplit.map((item) => item.value),
    1,
  );
  const progressPct = Math.min(
    Math.round((data.totalScanMonth / data.monthlyTarget) * 100),
    100,
  );

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTopRow}>
            <span className={styles.heroLabel}>Circular Intelligence</span>
            <span
              className={
                data.status === "live"
                  ? styles.dataStatusLive
                  : styles.dataStatusFallback
              }
            >
              {data.status === "live" ? "Data Live Supabase" : "Mode Fallback"}
            </span>
          </div>

          <h1 className={styles.heroTitle}>Dashboard Operasional Harian</h1>
          <p className={styles.heroSubtitle}>
            Ringkasan performa akun Anda dengan visual modern, berbasis data
            scan nyata dari Supabase.
          </p>

          <div className={styles.heroKpiRow}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Scan Hari Ini</p>
              <p className={styles.kpiValue}>{data.todayScanCount}</p>
              <p className={styles.kpiMeta}>Aktivitas terbaru</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Total Scan Bulan Ini</p>
              <p className={styles.kpiValue}>{data.totalScanMonth}</p>
              <p className={styles.kpiMeta}>Target {data.monthlyTarget} item</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Eco Points</p>
              <p className={styles.kpiValue}>
                {data.ecoPoints.toLocaleString("id-ID")}
              </p>
              <p className={styles.kpiMeta}>Akumulasi berjalan</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Material Dominan</p>
              <p className={styles.kpiValueCompact}>{data.topMaterial}</p>
              <p className={styles.kpiMeta}>Bulan ini</p>
            </article>
          </div>
        </div>

        <article className={styles.heroInsightCard}>
          <div className={styles.heroInsightHeader}>
            <h2 className={styles.heroInsightTitle}>Progress Target Bulanan</h2>
            <span className={styles.heroInsightValue}>{progressPct}%</span>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className={styles.weekMiniChart}>
            {data.weeklyTrend.map((item) => (
              <div className={styles.miniBarCol} key={`mini-${item.day}`}>
                <div className={styles.miniBarTrack}>
                  <div
                    className={styles.miniBarFill}
                    style={{
                      height: `${Math.max((item.count / maxTrend) * 100, 6)}%`,
                    }}
                  />
                </div>
                <span className={styles.miniBarLabel}>{item.day}</span>
              </div>
            ))}
          </div>

          <div className={styles.quickMetaGrid}>
            <div>
              <p className={styles.quickMetaLabel}>Rekomendasi Daur Ulang</p>
              <p className={styles.quickMetaValue}>{data.recycleRate}%</p>
            </div>
            <div>
              <p className={styles.quickMetaLabel}>Jenis Material</p>
              <p className={styles.quickMetaValue}>{data.materialTracked}</p>
            </div>
            <div>
              <p className={styles.quickMetaLabel}>Offset Karbon</p>
              <p className={styles.quickMetaValue}>{data.totalCarbonOffset}%</p>
            </div>
          </div>
        </article>
      </section>

      <div className={styles.grid2}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Tren Scan 7 Hari</h2>
            <span className={styles.panelBadge}>Mingguan</span>
          </div>
          <div className={styles.trendList}>
            {data.weeklyTrend.map((item) => (
              <div key={item.day} className={styles.trendRow}>
                <p className={styles.trendLabel}>{item.day}</p>
                <div className={styles.trendTrack}>
                  <div
                    className={styles.trendFill}
                    style={{ width: `${(item.count / maxTrend) * 100}%` }}
                  />
                </div>
                <p className={styles.trendValue}>{item.count} item</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Komposisi Rekomendasi</h2>
            <span className={styles.panelBadge}>Keputusan AI</span>
          </div>
          <div className={styles.recommendationList}>
            {data.recommendationSplit.map((item) => (
              <article className={styles.recommendationRow} key={item.label}>
                <div className={styles.recommendationTop}>
                  <p className={styles.recommendationLabel}>{item.label}</p>
                  <p className={styles.recommendationValue}>
                    {item.value} scan
                  </p>
                </div>
                <div className={styles.recommendationTrack}>
                  <div
                    className={styles.recommendationFill}
                    style={{
                      width: `${Math.max((item.value / maxRecommendation) * 100, 4)}%`,
                    }}
                  />
                </div>
                <p className={styles.recommendationPct}>
                  {item.pct}% dari bulan ini
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Leaderboard Material</h2>
          <span className={styles.panelBadge}>Top 5 bulan ini</span>
        </div>
        <div className={styles.categoryList}>
          {data.categorySplit.length === 0 && (
            <article className={styles.categoryCard}>
              <div className={styles.categoryTop}>
                <p className={styles.categoryName}>Belum ada data</p>
                <p className={styles.categoryPct}>0%</p>
              </div>
              <div className={styles.categoryTrack}>
                <div className={styles.categoryFill} style={{ width: "0%" }} />
              </div>
            </article>
          )}
          {data.categorySplit.map((item, idx) => (
            <article className={styles.categoryCard} key={item.name}>
              <div className={styles.categoryTop}>
                <p className={styles.categoryName}>
                  #{idx + 1} {item.name}
                </p>
                <p className={styles.categoryPct}>{item.pct}%</p>
              </div>
              <div className={styles.categoryTrack}>
                <div
                  className={styles.categoryFill}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Aktivitas Terbaru</h2>
          <span className={styles.panelBadge}>Real-time feed</span>
        </div>
        <div className={styles.activityList}>
          {data.recentActivity.length === 0 && (
            <article className={styles.activityItem}>
              <div className={styles.activityTop}>
                <h3 className={styles.activityTitle}>
                  Belum ada aktivitas scan
                </h3>
                <p className={styles.activityTime}>-</p>
              </div>
              <p className={styles.activityMeta}>
                Mulai dari halaman Scan untuk membuat data pertama di dashboard.
              </p>
            </article>
          )}
          {data.recentActivity.map((item) => (
            <article
              className={styles.activityItem}
              key={item.title + item.time}
            >
              <div className={styles.activityTop}>
                <h3 className={styles.activityTitle}>{item.title}</h3>
                <p className={styles.activityTime}>{item.time}</p>
              </div>
              <p className={styles.activityMeta}>{item.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Impact Snapshot</h2>
          <span className={styles.panelBadge}>Bulan berjalan</span>
        </div>
        <div className={styles.goalGrid}>
          <article className={styles.goalCard}>
            <p className={styles.goalLabel}>Rata-rata Potensi Sirkular</p>
            <p className={styles.goalValue}>{data.averageCircularPotential}%</p>
            <p className={styles.goalNote}>
              Dihitung dari scan bulan berjalan.
            </p>
          </article>
          <article className={styles.goalCard}>
            <p className={styles.goalLabel}>Jenis Material Terpetakan</p>
            <p className={styles.goalValue}>{data.materialTracked}</p>
            <p className={styles.goalNote}>
              Berdasarkan material terdeteksi bulan ini.
            </p>
          </article>
          <article className={styles.goalCard}>
            <p className={styles.goalLabel}>Skor Konsistensi Bulanan</p>
            <p className={styles.goalValue}>
              {Math.min(progressPct + 12, 100)}%
            </p>
            <p className={styles.goalNote}>
              Turunan dari progres target dan tren 7 hari terbaru.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
