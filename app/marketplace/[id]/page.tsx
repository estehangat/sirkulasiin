import Image from "next/image";
import Link from "next/link";
import styles from "./productDetail.module.css";

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

const relatedItems = [
  {
    name: "Rak Kayu Reklamasi",
    price: "Rp675.000",
    co2: "-0,8kg CO2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAf5Lgv767RWIuGdXQFONzE0eG4qwMoGXXHDL5nLLQafS-3ckvVC8z94bOqcCxre8i9RTgK1cte_aQtc6KKW2w5huBsf619AVRUrlAQ9WsX7gO9LF5bEticzSgTII8ZmHX0K32gYbT0KYgIG5KjFj8Nnz1wQ1X0pMkGFMfjnf578txIxi5Y3P9YKYNIBMop70Ff_MEaCzX1ntuVwChZwJim9UnCgiDucprOyYO6caTo-DWS2t7EQAiOl1husoXem-lFUAbeGzNoPdjP",
    alt: "rak tanaman kayu reklamasi minimalis",
  },
  {
    name: "Selimut Katun Organik Zaitun",
    price: "Rp1.650.000",
    co2: "-1,2kg CO2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDObjVz74RVeH8B4wmlVQjSWmPqQStHMyjY7YmsMaAUFC0WaKdtdBKMcQxjbJzX2CS5JcNiEPZDiekLTJOPtTluFGnt1ee1IylME42Hr-5waMICdlQOf9CmxPUdk4vlbF2pePwqcm54jCY0h5ggpJAlufbjVa9VIQwHFlFAYxDqruuH_kSc0qUkt7RvbrcooMCS_8boAYc3lmkBX3zsRlUXqjb61IUGwiuUTYs1Qt-Aa4JRwaPD9GvNHKKBPzIBXQQ0JOMLHftsOoQQ",
    alt: "selimut katun organik warna hijau zaitun",
  },
  {
    name: "Set Gelas Amber",
    price: "Rp480.000",
    co2: "-0,4kg CO2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFB99fclbK_pcG_lgPwIu464uwKmjHD_juRmbqnV3Cmbeyran7Kb69dKbn34-bCUydB0k-0VBsrwl38l2zlmBPpl7lH9hwm97ZGnlWrfi1nYM92-rYmFw41HzrNeDW558r5OPIJeLCOuLPxaTYuhzCP7JtRd-d43Luxde3gpARfqljss9j5_61U1g815ijyEpbZj9bFTwHAY2zOrgH8pIsaUrQylwH1f4IHTOoSERQ-VXkwOkUuCSQdhmswAykbehDkdvSA846wJsO",
    alt: "tempat lilin kaca daur ulang warna amber",
  },
  {
    name: "Karpet Anyaman Rami",
    price: "Rp2.370.000",
    co2: "-3,1kg CO2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIkhACudZs-O3Pb1hfHU2FgocZZeEvdR_fE4gH9U4jU2XFGY5s8ooU8AO577EtzBh3CoWTxkZ6mFXD_rX2dC7i_0nS3H8NJ74UOp_xBpin8wqu7_eNuErU3OrcnXOL_moYLt-ktxPyb3daZxdE6nZvRyWaY5AWuoKk_DwClVeU7yf6zqVxC2AH2wD8pFfSF78U8iEjXxwsF5rSTryuwxF0RfcWjznUPbgBqMo6_b3f-l_6lZfgrtmtgcJRRj0CXLTzhpO8Y8nH0VH6",
    alt: "karpet bulat rami alami",
  },
];

const galleryThumbs = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_A1C9Kj7LxbB2OJDOGEcDkt9QqQxHByWSFXNH6KEpPS-4HyfAnmX4kpKYZ12pftVhFVnYLHhfXV3ngDYNGhcFqFY_9toXxD2_GZ47o2QnkgDtpE4Z95uJsZqzFEYIMt6CdS_5U9uQ-yDqVT4Tzjf5Rnqio5wR0BaJaXebAzzpV0C-HBBPe3TA9y2kJljgkGaE9tVGbHpsxTFjgcn0y0WPK9ZT5g3z5UaDAAXsWHPLGXkhsxa1eh_HmYtSpOFt9Kc1CvrfcXXyEr56",
    alt: "tekstur keramik artisan dari dekat",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuMo3YwX_9y2m-wh8iO1oA1F0eATuxzL4VCvMK5czTNgogGW56SQ8nCiuihbaxrGDaYW1526q8hfqfne00-H3oKjfb-98mJmQMsPwtXu-fQ9da5uIcbLE8E5yJNY5gKYJxLj0F8eYPbymu3jRNJlgiv_J-con4oNpRyv3uttHFNTYji02HlZLQJM36gDF5Jd296a-oi5FdriMjmljscM1beX1by3ZQ0M-lUikAvOJYFLeGgbrHs18OduOUfJB2OoQplrAWufXCJobu",
    alt: "barang keramik di samping tanaman hijau",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrp6aI19rnN7YserqfiOwmBxPGHsisedo-NkddHTFO-qtRyQmrb54s6Hs4niqOg94oq7qiBrALPQIAAVuAAtIRhjRveA8JC4NzKGdHLc89Wf6G-g5DvEMOb_k8bhOWdGcm3Tx6N5jzbaJD7ADwU8vXIE4BPmKK3fGXfPs8jhjOSTvxqfzrKa8PWxXrhT4-Q2qvbpf2LrhxiR-3YC9V1QZThQm0EfZ4zmHZMv3JeQg_pltM94T8bUuL8Zj2-eVyOd94fTn0JeofUuUy",
    alt: "tampilan bawah vas buatan tangan",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuASZk77YRRmdQgdZJHzDXlNcSv8cUe9S2dTiYDW6cpjK7Ugv5wOVORqhCq2QodL3aAo6rwl0jffWujJS90UlpFtO4bVBQJ3q_7UWlCF1qlu78F34JS8c7NW_elRWI-iDZOUufQ0-CElJbg-cuyypUxMyyGb8QFkoeqzI8hWhBMkKpAsRl_XOddas_uDPNi08k12XDgvLmAYyv6EpWMYNnVEKyCPmoeG0miUnB8b19ZE7Wm2bJ1lZ3X5kfLiQiIi9lJFgd8zPlDVb8jr",
    alt: "produk di suasana ruang tamu terang",
    hasOverlay: true,
  },
];

export default function ProductDetailPage() {
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
            Beranda
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
            Masuk
          </Link>
          <Link href="/signup" className={styles.signupBtn}>
            Daftar
          </Link>
        </div>
      </header>

      {/* ── Breadcrumbs ── */}
      <nav className={styles.breadcrumbs}>
        <Link href="/marketplace">Marketplace</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <a href="#">Gaya Hidup</a>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>Dekorasi Berkelanjutan</span>
      </nav>

      {/* ── Product Layout ── */}
      <div className={styles.productLayout}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz6K9lGwzIXgCpJzhYN68eQ7fm_P_VeTneFXHyHgtVOEodPpWyVTQqcncNaJ7_ewf0TxfjCeagwnv-F7YtgTghXEaGALKEnvv7ztXHivsG14FY5814BB2ySdkvx7rJOUAo7cg4KLZqP0BzI3TrbhuQZu0u1ftZYORZ4DGrtxfkGCwI_dZsxiZOytZzPwUW8N-G8yo6RGDY7N6YguU7WIpjXDqH6rz4OIdpBoDsaNaRY_voamLdrbOaQmgTMMO4RqgcKqe1llPB6LGu"
              alt="vas keramik buatan tangan dengan tekstur organik"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className={styles.mainImageImg}
            />
            <div className={styles.verifiedBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
               TERVERIFIKASI AI
            </div>
          </div>
          <div className={styles.thumbGrid}>
            {galleryThumbs.map((thumb, i) => (
              <div
                key={i}
                className={`${styles.thumbItem} ${thumb.hasOverlay ? styles.thumbOverlay : ""}`}
              >
                <Image
                  src={thumb.src}
                  alt={thumb.alt}
                  fill
                  sizes="120px"
                  className={`${styles.thumbImg} ${thumb.hasOverlay ? styles.thumbImgFaded : ""}`}
                />
                {thumb.hasOverlay && (
                  <div className={styles.thumbOverlayText}>+2</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <span className={styles.ecoBadge}>Pilihan Terkurasi Ramah Lingkungan</span>
          <h1 className={styles.productTitle}>Vas Terakota Buatan Tangan</h1>
          <p className={styles.productPrice}>Rp1.260.000</p>

          {/* Impact Card */}
          <div className={styles.impactCard}>
            <div className={styles.impactHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Laporan Dampak Buatan AI</span>
            </div>
            <p className={styles.impactText}>
              Dengan memilih vas preloved ini, Anda mencegah{" "}
              <strong className={styles.impactHighlight}>2,4kg emisi CO2</strong> dan
              menghemat <strong className={styles.impactHighlight}>120L air</strong> dibandingkan
              dengan produksi baru.
            </p>
          </div>

          {/* Seller Profile */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerAvatar}>
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu0S-C0gQJItXBkLqfqh52JgyMuvfjmyuc-wBQhxm4hmCsYFBmOI5tJyiXaO9fLkaHnZe7Q52mAb4gkmnqqhw0s8wu1TIwef75FBkkPI7RHfNwyqKgLuVwd4EwWd_w_5nkfnrk7wIHWr2_unLKjvrSL7MA_ct3DxJolhyFRxgjt7Z800G9C_eQVf7u0K71TMg3lBa2V9jxTNfDcEIg5kQWzWMmEDAhIvCMUwohpl1CsMSSHh8DZj7twrwgn3pwz6ThNSaBnH4LsoKD"
                  alt="Elena Green"
                  fill
                  sizes="56px"
                  className={styles.sellerAvatarImg}
                />
              </div>
              <div>
                <h4 className={styles.sellerName}>Elena Green</h4>
                <div className={styles.sellerMeta}>
                  <span className={styles.sellerBadge}>Pendukung Hijau</span>
                  <span className={styles.sellerRating}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ca8a04">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    4.9 (124)
                  </span>
                </div>
              </div>
            </div>
            <span className={styles.sellerArrow}>›</span>
          </div>

          {/* Description */}
          <div className={styles.description}>
            <h3 className={styles.descTitle}>Tentang barang ini</h3>
            <p className={styles.descText}>
              Hiasan tengah meja yang memukau, dibuat dari tanah liat Mediterania
              lokal. Vas ini menampilkan glasir matte unik dan lingkaran lempar
              halus yang menceritakan kisah pembuatannya. Kondisi sangat baik
              tanpa goresan atau retakan.
            </p>
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Asal</span>
                <span className={styles.specValue}>Barcelona</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Material</span>
                <span className={styles.specValue}>Terakota</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Karbon</span>
                <span className={styles.specValue}>-2,4kg</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className={styles.ctaGroup}>
            <button className={styles.buyBtn}>Beli Sekarang</button>
            <button className={styles.chatBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Chat dengan Penjual
            </button>
          </div>
        </div>
      </div>

      {/* ── Related Items ── */}
      <section className={styles.relatedSection}>
        <div className={styles.relatedHeader}>
          <div>
            <span className={styles.relatedLabel}>Kurasi</span>
            <h2 className={styles.relatedTitle}>Mungkin Anda Juga Suka</h2>
          </div>
          <Link href="/marketplace" className={styles.relatedLink}>
            Jelajahi Marketplace →
          </Link>
        </div>

        <div className={styles.relatedGrid}>
          {relatedItems.map((item, i) => (
            <article key={i} className={styles.relatedCard}>
              <div className={styles.relatedImageWrap}>
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={styles.relatedImage}
                />
                <button className={styles.relatedFav}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className={styles.relatedInfo}>
                <h4 className={styles.relatedName}>{item.name}</h4>
                <div className={styles.relatedBottom}>
                  <span className={styles.relatedPrice}>{item.price}</span>
                  <span className={styles.relatedCo2}>{item.co2}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>SirkulasiIn</span>
          <div className={styles.footerLinks}>
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat Layanan</a>
            <a href="#">Metodologi Karbon</a>
            <a href="#">Pusat Bantuan</a>
          </div>
          <p className={styles.footerCopyright}>
            © 2024 SirkulasiIn. Menuai masa depan yang lebih hijau.
          </p>
        </div>
      </footer>
    </main>
  );
}
