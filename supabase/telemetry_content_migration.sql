-- ============================================
-- SirkulasiIn: Default Telemetry Paths
-- Jalankan di Supabase SQL Editor
-- ============================================

INSERT INTO public.site_content (id, content)
VALUES (
  'telemetry_paths', 
  '{
    "/": "Halaman Utama (Landing Page)",
    "/tentang": "Halaman Tentang Kami",
    "/tutorial": "Halaman Tutorial",
    "/marketplace": "Marketplace",
    "/scan": "Halaman Scan",
    "/dashboard": "Dashboard Pengguna",
    "/dashboard/riwayat-scan": "Riwayat Scan",
    "/dashboard/listings": "Kelola Listing",
    "/dashboard/transactions": "Riwayat Transaksi",
    "/dashboard/settings": "Pengaturan Profil Publik",
    "/login": "Halaman Login",
    "/signup": "Halaman Daftar",
    "/messages": "Ruang Percakapan (Inbox)"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
