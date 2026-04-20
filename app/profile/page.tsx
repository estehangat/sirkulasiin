import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../components/navbar";
import ProfileClientActions from "./ProfileClientActions";
import FollowStatsClient from "./FollowStatsClient";
import GalleryClient from "./GalleryClient";
import styles from "./profile.module.css";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function parseCarbonString(str: string | null): number {
  if (!str) return 0;
  // ambil angka (termasuk desimal) dari string seperti "2.5kg CO2" atau "10"
  const match = str.match(/[\d.]+/);
  if (match) return parseFloat(match[0]);
  return 0;
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;

  const supabase = await createServerSupabaseClient();

  // Get current user session for own-profile check
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // If no ID is provided, try to show the current user's profile, else redirect or show not found
  let targetId = id;
  if (!targetId) {
    if (!currentUser) {
      return (
        <div className={styles.pageShell}>
          <Navbar />
          <main className={styles.main}>
            <div style={{ textAlign: "center", padding: "100px", color: "var(--color-primary-text)" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Profil tidak ditemukan</h1>
              <p>ID pengguna tidak disertakan. <Link href="/login" style={{ color: "#27AE60" }}>Login</Link> untuk melihat profil Anda.</p>
            </div>
          </main>
        </div>
      );
    }
    targetId = currentUser.id;
  }

  // Fetch Profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, username, bio, location, avatar_url, created_at, role")
    .eq("id", targetId)
    .single();

  if (profileErr || !profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  // Fetch Follow Stats
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", targetId);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", targetId);

  let isFollowing = false;
  if (currentUser && !isOwnProfile) {
    const { data: followData } = await supabase
      .from("user_follows")
      .select()
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetId)
      .maybeSingle();
    isFollowing = !!followData;
  }

  const joinDate = new Date(profile.created_at || Date.now()).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });

  // Fetch Marketplace Listings
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, image_url, status, description")
    .eq("user_id", targetId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const activeListingsCount = listings?.length || 0;

  const { data: submissionsData, count: submissionsCount } = await supabase
    .from("tutorial_submissions")
    .select("id, photo_url, tutorial_id, recycle_tutorials(title)", { count: "exact" })
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(15);

  // 1. Kalkulasi CO2 dari Marketplace Listings (mengabaikan status karena item yang sudah terjual juga dihitung dampaknya)
  const { data: allListingsForCarbon } = await supabase
    .from("marketplace_listings")
    .select("carbon_saved")
    .eq("user_id", targetId);
  const marketplaceCo2 = (allListingsForCarbon || []).reduce((acc, row) => acc + parseCarbonString(row.carbon_saved), 0);

  // 2. Kalkulasi CO2 dari Tutorial Submissions melalui relasi scan_history
  const { data: tutorialSubmissionsForCarbon } = await supabase
    .from("tutorial_submissions")
    .select(`
      recycle_tutorials (
        scan_id
      )
    `)
    .eq("user_id", targetId);

  const scanIds = (tutorialSubmissionsForCarbon || [])
    // @ts-expect-error tipe relasi dari supabase dapat berupa array atau objek statis
    .map(sub => Array.isArray(sub.recycle_tutorials) ? sub.recycle_tutorials[0]?.scan_id : sub.recycle_tutorials?.scan_id)
    .filter(Boolean);

  let tutorialsCo2 = 0;
  if (scanIds.length > 0) {
    const { data: scans } = await supabase
      .from("scan_history")
      .select("carbon_offset")
      .in("id", scanIds);
    tutorialsCo2 = (scans || []).reduce((acc, row) => acc + (row.carbon_offset || 0), 0);
  }

  const galleryItems = submissionsData ?? [];
  const marketplaceItemsAll = listings ?? [];
  
  const bentoItems = marketplaceItemsAll.slice(0, 4);
  const rowItems = marketplaceItemsAll.slice(4, 9);
  const hasMoreMarketplace = marketplaceItemsAll.length > 9;
  
  const itemsRecycled = submissionsCount || 0;
  const co2Saved = marketplaceCo2 + tutorialsCo2;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      
      <div className={styles.pageShell}>
        <Navbar />

        <main className={styles.main}>
          {/* ═══ User Hero Section ═══ */}
          <section className={styles.heroSection}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {profile.avatar_url ? (
                  <Image
                    alt={profile.full_name || profile.username || "Avatar"}
                    className={styles.avatarImg}
                    width={160}
                    height={160}
                    unoptimized
                    src={profile.avatar_url}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#e8e9e4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", fontWeight: "bold", color: "#5a5b58" }}>
                    {(profile.full_name || profile.username || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.verifiedBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
            
            <div className={styles.heroContent}>
              <div className={styles.heroHeaderRow}>
                <h1 className={styles.userName}>{profile.full_name || profile.username || "Pengguna Anonim"}</h1>
                <ProfileClientActions 
                  targetUserId={profile.id} 
                  targetUserName={profile.full_name || profile.username || "Pengguna ini"}
                  isOwnProfile={isOwnProfile} 
                  initialIsFollowing={isFollowing} 
                />
              </div>
              <p className={styles.userBio}>
                {profile.bio || "Bergabung dengan komunitas untuk mendukung gaya hidup sirkular dan ramah lingkungan. 🌱"}
              </p>
              <div className={styles.userInfo}>
                <div className={styles.userInfoItem}>
                  <span className={`material-symbols-outlined ${styles.userInfoIcon}`}>location_on</span>
                  <span>{profile.location || "Indonesia"}</span>
                </div>
                <div className={styles.userInfoItem}>
                  <span className={`material-symbols-outlined ${styles.userInfoIcon}`}>calendar_today</span>
                  <span>Bergabung sejak {joinDate}</span>
                </div>
              </div>

              <FollowStatsClient 
                userId={profile.id}
                initialFollowersCount={followersCount || 0}
                initialFollowingCount={followingCount || 0}
              />
            </div>
          </section>

          {/* ═══ Impact Stats ═══ */}
          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconWrapCo2}`}>
                  <span className="material-symbols-outlined">co2</span>
                </div>
                <span className={styles.statLabel}>CO2 Dihemat</span>
              </div>
              <div>
                <span className={styles.statValue}>{co2Saved.toFixed(1)} </span>
                <span className={styles.statUnit}>kg</span>
              </div>
              <p className={styles.statDesc}>Dihemat via marketplace & daur ulang</p>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconWrapRecycle}`}>
                  <span className="material-symbols-outlined">recycling</span>
                </div>
                <span className={styles.statLabel}>Barang Didaur Ulang</span>
              </div>
              <div className={styles.statValue}>{itemsRecycled}</div>
              <p className={styles.statDesc}>Proyek daur ulang berhasil diselesaikan</p>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div className={`${styles.statIconWrap} ${styles.statIconWrapListing}`}>
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <span className={styles.statLabel}>Listing Aktif</span>
              </div>
              <div className={styles.statValue}>{activeListingsCount}</div>
              <p className={styles.statDesc}>Tersedia untuk diambil terdekat</p>
            </div>
          </section>

          {/* ═══ Tabbed Content Section ═══ */}
          <section>
            {/* Tabs Navigation */}
            <div className={styles.tabsContainer}>
              <a href="#marketplace" className={`${styles.tab} ${styles.tabActive}`} style={{ textDecoration: 'none' }}>Marketplace</a>
              <a href="#gallery" className={styles.tab} style={{ textDecoration: 'none' }}>Galeri Daur Ulang</a>
              <a href="#timeline" className={styles.tab} style={{ textDecoration: 'none' }}>Linimasa Dampak</a>
            </div>

            {/* Bento Grid Content */}
            <div id="marketplace" className={styles.bentoGrid} style={{ scrollMarginTop: '80px' }}>
              {bentoItems.length > 0 ? (
                bentoItems.map((item, index) => {
                  let itemClass = styles.bentoItemSmall;
                  let isFeatured = false;
                  
                  if (index === 0) {
                    itemClass = styles.bentoItemLarge;
                    isFeatured = true;
                  } else if (index === 3) {
                    itemClass = styles.bentoItemHorizontal;
                    isFeatured = true;
                  }
                  
                  return (
                    <Link href={`/marketplace/${item.id}`} key={item.id} className={itemClass} style={{textDecoration: "none", color: "inherit"}}>
                      <div className={
                        index === 0 ? styles.bentoImgWrap : 
                        index === 3 ? styles.bentoHorizImgWrap : styles.bentoSmallImgWrap
                      }>
                        {item.image_url ? (
                          <img
                            alt={item.title}
                            className={styles.bentoImg}
                            src={item.image_url}
                          />
                        ) : (
                          <div style={{width: "100%", height: "100%", backgroundColor: "#e2e3de"}} />
                        )}
                      </div>
                      
                      {index === 0 && (
                        <div className={styles.bentoInfoOverlay}>
                           {isFeatured && <span className={styles.badgeFeatured}>Diusulkan</span>}
                           <h3 className={styles.bentoItemLargeTitle}>{item.title}</h3>
                           <p className={styles.bentoItemLargeDesc}>{item.description}</p>
                           <p className={styles.bentoItemLargePrice}>{formatRupiah(item.price)}</p>
                        </div>
                      )}
                      
                      {index > 0 && index < 3 && (
                        <div className={styles.bentoSmallContent}>
                          <h3 className={styles.bentoSmallTitle}>{item.title}</h3>
                          <div className={styles.bentoSmallRow}>
                            <span className={styles.bentoPrice}>{formatRupiah(item.price)}</span>
                          </div>
                        </div>
                      )}
                      
                      {index === 3 && (
                        <div className={styles.bentoHorizContent}>
                           {isFeatured && <span className={styles.badgeFeatured} style={{alignSelf: "flex-start"}}>Terbaru</span>}
                           <h3 className={styles.bentoHorizTitle}>{item.title}</h3>
                           <p className={styles.bentoHorizDesc} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                             {item.description}
                           </p>
                           <div className={styles.bentoHorizRow}>
                             <span className={styles.bentoItemLargePrice} style={{marginTop: 0}}>{formatRupiah(item.price)}</span>
                           </div>
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "#5a5c59" }}>Belum ada barang di marketplace.</p>
                </div>
              )}
            </div>

            {/* Extra Row Component */}
            {rowItems.length > 0 && (
              <div style={{
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
                gap: "16px", 
                marginTop: "24px"
              }}>
                {rowItems.map((item) => (
                  <Link href={`/marketplace/${item.id}`} key={item.id} className={styles.smallMarketplaceLink}>
                    <div className={styles.smallMarketplaceCard}>
                      <div className={styles.smallMarketplaceImgWrap}>
                         {item.image_url ? (
                           <img src={item.image_url} alt={item.title} className={styles.smallMarketplaceImg} />
                         ) : <div className={styles.smallMarketplaceImgPlaceholder} />}
                      </div>
                      <div className={styles.smallMarketplaceContent}>
                         <h3 className={styles.smallMarketplaceTitle}>
                           {item.title}
                         </h3>
                         <p className={styles.smallMarketplacePrice}>
                           {formatRupiah(item.price)}
                         </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* View All Button for Marketplace */}
            {hasMoreMarketplace && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                <Link href={`/profile/marketplace?id=${targetId}`} style={{
                  padding: "16px 40px", borderRadius: "999px", border: "1px solid #e2e3de", 
                  backgroundColor: "#fff", color: "#2d2f2d", fontWeight: 700, textDecoration: "none",
                  transition: "all 0.2s ease", display: "inline-flex", alignItems: "center", gap: "8px"
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#27AE60"; e.currentTarget.style.color = "#27AE60"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e3de"; e.currentTarget.style.color = "#2d2f2d"; }}>
                  Lihat Semua Koleksi
                </Link>
              </div>
            )}

            {/* ═══ Upcycling Gallery ═══ */}
            <div id="gallery" className={styles.gallerySection} style={{ scrollMarginTop: '80px' }}>
              <div className={styles.galleryHeader}>
                <h2 className={styles.galleryTitle}>Galeri Daur Ulang</h2>
                <Link className={styles.linkViewAll} href={`/profile/gallery?id=${targetId}`}>Lihat Semua Proyek</Link>
              </div>
              <GalleryClient items={galleryItems as any[]} />
            </div>
          </section>
        </main>

        {/* ═══ Footer ═══ */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>SirkulasiIn Community</div>
            <div className={styles.footerLinks}>
              <Link className={styles.footerLink} href="#">Kebijakan Privasi</Link>
              <Link className={styles.footerLink} href="#">Syarat Layanan</Link>
              <Link className={styles.footerLink} href="#">Panduan Komunitas</Link>
              <Link className={styles.footerLink} href="#">Kontak</Link>
            </div>
            <div className={styles.footerCopy}>
              © 2024 SirkulasiIn Community. Menuai masa depan yang lebih hijau.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
