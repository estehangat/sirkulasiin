import Image from "next/image";
import Link from "next/link";
import styles from "./marketplace.module.css";

const IconBrandLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2a10 10 0 0 1 3.44 1.66" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

const marketplaceItems = [
  {
    name: "Organic Cotton Linens",
    location: "Palo Alto, CA",
    time: "2h ago",
    price: "$45",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBocev6v5qrmUfYEjA2_sJHut65t8ZZJ6TFidR-TEyVyt_nZcmUq2ID5sV-tUTR8eVKXwmUypGNX9bjUaZpg7tfloyThfNH9x1AbbtdJY3dwQzb05x5OB2colpX6rJWMI4CIjZpUR5iQkspMPvxIOiB3OoRVqIaGOoJVnDL_xHSy7UQKUH4P5b_Exn6uhKCyGuj51f2JAPq1J8Duiy1byTYBOWayDDMIrqSBS8x_Ls5LQhIV2sh5wUynTlOYEp-bSrBLjSfTOKj2fUI",
    verified: true,
  },
  {
    name: "Vintage Ceramic Vase",
    location: "Seattle, WA",
    time: "5h ago",
    price: "$28",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4cvh1uOCo4ltrnmiSjuJQeQHTe9N4ylU2IIyxIFN_f-JvQb8weGSaxc0qQdZSxTNYjM-Fg8l-zKh2UcIPsFoRjVt1CUPHG11r6p7JXWkhcexd70q7SD88notMjL7zEW-vqZjSzd74aMfvER5Uzu9Q4KOdvlHdvC1w8c-Yiyisec3OBZeJFBY55jmZce9_gOfFZCjP_T-UZiTt21_-sgcnZdPN2m33B6otUvQOolBDdb4O14f55rWkUF8pDi9-fTk0F4_vNTMc1sjK",
    verified: true,
  },
  {
    name: "Refurbished Chef Knives",
    location: "Brooklyn, NY",
    time: "Just now",
    price: "$120",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLd-lIbGI0QqpjG5_cKCNqWHlj18hqPp2v84Aej4aoZv1vIAK_t6-a3G1WV6gboEmwXtS-iBC52wx4-uMPIyT9W-PCOEdGSNjfnGbhZIuFTiTUfJsHCRphI3RE-4lvGNmKfrsZD632gCOK1Xn3_9eMSSaJOXkhp7TqihfBPvqW8lztWgJcc5UDOU3_6yMJJvln0d4wcYa1sBTpUxQrpFyzIh3Tz6t3ozUtcOGN84Rr1E0ZlJ9XFqovMxY1ZYKu1pY0RzUERUbUylvA",
    verified: false,
    badge: "MINT",
  },
  {
    name: "Gen 2 Headphones",
    location: "Austin, TX",
    time: "1d ago",
    price: "$85",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnOqNekOPcrRC518O-ueGLtsOqY3PIRINVCvEZDwjYrJ_S-0FFzOYuPL1GXV93k3RD0r7SY6_jUCUEKj5yAvmaQ5srGpv9DpoUME0hiLJYIPvPlOs7MBS7kulGifjurbOJFG8-e3w_IhzRrJ3J6K437dIE1_LrQgG5AmAWNENCfNA8Uon07lkUSgZsSWQZmS6xXfFB-cS0WgHZFiYRj24woAiPElbupPI6A7tcY5W9refRULJpFU3GQNygUAWGzL_-eaYJNbUBDm9c",
    verified: true,
  },
];

export default function MarketplacePage() {
  return (
    <main className={styles.pageShell}>
      {/* ── Navbar ── same as landing page ── */}
      <header className={styles.topbar}>
        <div className={styles.brandWrap}>
          <div className={styles.brandMark} aria-hidden>
            <IconBrandLogo />
          </div>
          <span className={styles.brandName}>SirkulasiIn</span>
        </div>

        <nav className={styles.mainNav} aria-label="Navigasi utama">
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/marketplace" className={styles.navLinkActive}>
            Marketplace
          </Link>
          <a href="#scan" className={styles.navLink}>
            Scan
          </a>
          <a href="#riwayat" className={styles.navLink}>
            Riwayat Scan
          </a>
        </nav>

        <div className={styles.authCta}>
          <Link href="/login" className={styles.loginBtn}>
            Login
          </Link>
          <Link href="/signup" className={styles.signupBtn}>
            Signup
          </Link>
        </div>
      </header>

      {/* ── Hero & Filter Section ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroTextContent}>
            <h1 className={styles.heroTitle}>
              Give items a{" "}
              <span className={styles.heroAccent}>second life.</span>
            </h1>
            <p className={styles.heroDescription}>
              The curated marketplace for premium pre-loved goods. Verified by
              AI, delivered with love for the planet.
            </p>
          </div>
          <div>
            <button className={styles.listItemBtn}>
              <svg
                className={styles.listItemIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              List Your Item
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={styles.searchFilterGrid}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by item, material, or brand..."
              className={styles.searchInput}
            />
          </div>
          <select className={styles.filterSelect}>
            <option>Category</option>
            <option>Home Decor</option>
            <option>Kitchenware</option>
            <option>Electronics</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Price Range</option>
            <option>$0 - $50</option>
            <option>$50 - $200</option>
            <option>$200+</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Location</option>
            <option>Nearby</option>
            <option>Nationwide</option>
          </select>
          <button className={styles.filterButton}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Featured Eco-Friendly Picks ── */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Eco-Friendly Picks</h2>
          <a href="#" className={styles.viewAllLink}>
            View collection →
          </a>
        </div>

        <div className={styles.featuredGrid}>
          {/* Large Featured Card */}
          <div className={styles.featuredLarge}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4RS3iOouHcCon7y4cx5M2n26HvDIpqtkxclYiTNGH3EuhDtJeSu_hm0jV_1XbYYG7kzX6Bh_mmcRSmFEp32EjheYriOiZPU2-mrdyB7WNqXkBHOywntfu31K8sg0xfZ5ESPZHz9BZPTK3B4hg_FUd7o11OONz5bS05cU5u8sYJFqUbYeRw66TrXhYdGCphmTm_FOqt4YWw_oD4-XPXlVRcDS62BWdyUSyuCAhnWQpqjxtNG2GVCVfrX546YKqE5aDr3xjDx1bXtrf"
              alt="minimalist wooden chair"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={styles.featuredImage}
            />
            <div className={styles.featuredOverlay} />
            <div className={styles.featuredContent}>
              <span className={styles.featuredBadge}>Renewed Collection</span>
              <h3 className={styles.featuredTitle}>Sustainable Living Room</h3>
              <p className={styles.featuredText}>
                Hand-picked furniture restored with organic finishes and
                non-toxic materials.
              </p>
              <button className={styles.exploreBtn}>Explore Now</button>
            </div>
          </div>

          {/* Side Grid */}
          <div className={styles.featuredSideGrid}>
            {/* Upcycled Tech Card */}
            <div className={styles.featuredCard}>
              <div className={styles.featuredCardContent}>
                <h3 className={styles.cardTitle}>Upcycled Tech</h3>
                <p className={styles.cardText}>
                  Certified pre-owned with 12 month warranty.
                </p>
                <span className={styles.cardLink}>Browse Tech →</span>
              </div>
              <div className={styles.cardImageBox}>
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTAuWCvCpLlQG1o98FIP6snNfrz9X4DWiOwZq9DiTbieMHvSu6AtM_UrgrAu24aDAJ5DDvFsGCf1bbRlTXuhowZ9ha0vQIutVO0AHPDWlugD3dpmYxACUL4Ooz3SoqW6nlSUODodziDG-G5dbFEnizTuv5UUlVMWNZkAcdZFtkML_hvz6E3ETy5KRoxqY5q3_oWRC0JwfER39Wzha-FOIb1coM8M31DMHLh1f2bwSKMzqjMhy-zKjD6h2gzr5xc6lqgDq0UeC7XFTH"
                  alt="refurbished tablet"
                  fill
                  sizes="140px"
                  className={styles.cardImage}
                />
              </div>
            </div>

            {/* Impact Rewards Card */}
            <div className={styles.rewardCard}>
              <div className={styles.featuredCardContent}>
                <h3 className={styles.cardTitle}>Impact Rewards</h3>
                <p className={styles.cardText}>
                  Earn double Eco-Points on glass items this week.
                </p>
                <span className={styles.rewardBadge}>Learn More</span>
              </div>
              <svg
                className={styles.ecoIcon}
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.66c.48-.17.98-.31 1.49-.44C9.15 17.76 10 16 10 14c0-1.88-.61-3.73-1.56-5.48l.86-1.51C13 8.44 15 10.99 15 14c0 1.94-.74 3.8-2.08 5.3l1.42 1.42C15.96 19.06 17 16.64 17 14c0-5.58-4.71-10.6-10.17-11.36L6 4.64c4.72.66 8 4.48 8 9.36 0 1.28-.3 2.5-.84 3.6l1.73 1C15.58 17.33 16 15.7 16 14c0-4.41-3.59-8-8-8H6.83z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Listings ── */}
      <section className={styles.listingsSection}>
        <div className={styles.listingsHeader}>
          <h2 className={styles.sectionTitle}>Recent Listings</h2>
          <div className={styles.tabGroup}>
            <button className={styles.tab}>Popular</button>
            <button className={`${styles.tab} ${styles.tabActive}`}>
              Newest
            </button>
            <button className={styles.tab}>Ending Soon</button>
          </div>
        </div>

        <div className={styles.productGrid}>
          {marketplaceItems.map((item, index) => (
            <article key={index} className={styles.productCard}>
              <div className={styles.productImageWrap}>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={styles.productImage}
                />
                {item.verified && (
                  <div className={styles.verifiedBadge}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI VERIFIED
                  </div>
                )}
                {item.badge && (
                  <div className={styles.mintBadge}>{item.badge}</div>
                )}
                <button className={styles.favoriteBtn}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productHeader}>
                  <h4 className={styles.productName}>{item.name}</h4>
                  <span className={styles.productPrice}>{item.price}</span>
                </div>
                <div className={styles.productMeta}>
                  <span>{item.location}</span>
                  <span className={styles.dot}>•</span>
                  <span>{item.time}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.loadMoreWrap}>
          <button className={styles.loadMoreBtn}>Load More Items</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <span className={styles.footerBrand}>SirkulasiIn</span>
            <p className={styles.footerCopyright}>
              © 2024 SirkulasiIn. Harvesting a greener future.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">Impact Stats</a>
            <a href="#">Privacy</a>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">Discord</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
