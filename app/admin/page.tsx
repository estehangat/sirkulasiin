import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  Users,
  ScanLine,
  ShoppingBag,
  Activity,
  MousePointerClick,
  Smartphone,
  Laptop
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard — SirkulasiIn",
  description: "Dashboard Control Panel SirkulasiIn",
};

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${Math.max(diffMins, 1)} m lalu`;
  if (diffHours < 24) return `${diffHours} j lalu`;
  if (diffDays < 7) return `${diffDays} h lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

// Fungsi resolusi path UI sekarang diproses secara dinamis dari database (telemetry_paths)

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <article style={{
      borderRadius: "24px", border: "1px solid #E2E8F0", background: "#ffffff",
      padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
      boxShadow: "0 1px 4px rgba(15,23,42,0.03)", ...style
    }}>
      {children}
    </article>
  );
}

async function getAdminData() {
  const supabase = await createServerSupabaseClient();
  
  // 1. Ambil Metric Utama
  const [profilesRes, scansRes, listingsRes, recentRes, visitsRes, contentRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('scan_history').select('*', { count: 'exact', head: true }),
    supabase.from('marketplace_listings').select('*', { count: 'exact', head: true }),
    supabase.from('scan_history').select('id, item_name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('page_visits').select('path, device_type').order('created_at', { ascending: false }).limit(2000),
    supabase.from('site_content').select('content').eq('id', 'telemetry_paths').single()
  ]);

  const telemetryMapping = contentRes.data?.content || {};

  // Aggregasi Kunjungan
  // Filter kunjungan untuk mengecualikan rute admin (jika ada data historis yang sudah terekam)
  const visits = (visitsRes.data || []).filter(v => !v.path.startsWith('/admin'));
  const totalVisits = visits.length;

  const pathCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };

  visits.forEach(v => {
      // Group Path
      pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
      // Group Device
      const dt = v.device_type || 'Desktop';
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
  });

  const topPaths = Object.entries(pathCounts)
     .sort((a, b) => b[1] - a[1])
     .slice(0, 5);

  return {
    totalUsers: profilesRes.count || 0,
    totalScans: scansRes.count || 0,
    totalListings: listingsRes.count || 0,
    recentScans: recentRes.data || [],
    totalVisits,
    topPaths,
    deviceCounts,
    telemetryMapping
  };
}

export default async function AdminPage() {
  const data = await getAdminData();
  
  const resolveMapping = (path: string) => {
    // 1. Exact Match via DB dictionary
    if (data.telemetryMapping[path]) return data.telemetryMapping[path];
    
    // 2. Prefix Match via DB dictionary keys that end with '/*'
    for (const [key, label] of Object.entries(data.telemetryMapping)) {
      if (key.endsWith('/*') && path.startsWith(key.replace('/*', ''))) {
          return label;
      }
    }
    
    // 3. Fallback Format
    const cleanPath = path.substring(1).split('/')[0].replace(/-/g, ' ');
    return cleanPath ? cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1) + " (Sub-halaman)" : 'Halaman Publik';
  };
  
  const getDeviceIcon = (device: string) => {
     if (device === 'Mobile') return <Smartphone size={16} />;
     if (device === 'Tablet') return <rect width={16} height={20} rx={2} fill="currentColor" />; // pseudo-tablet
     return <Laptop size={16} />;
  }
  
  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* ── Page Header Action ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "4px" }}>
        <div>
           <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
             Statistik Real-time Terpadu
           </h2>
           <p style={{ color: "#64748B", fontSize: "13px" }}>
             Seluruh data Analytics & Trafik dipantau penuh melalui infrastruktur Native Database.
           </p>
        </div>
      </div>

      {/* ── Core KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <Card style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#E2E8F0", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <Users size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Total Pengguna</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{data.totalUsers}</p>
        </Card>

        <Card style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#DBEAFE", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
              <ScanLine size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#1D4ED8" }}>Total Scan Berhasil</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#1E3A8A" }}>{data.totalScans}</p>
        </Card>

        <Card style={{ background: "#FDF4FF", borderColor: "#F5D0FE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", width: "34px", height: "34px", borderRadius: "50%", background: "#FAE8FF", alignItems: "center", justifyContent: "center", color: "#C026D3" }}>
              <ShoppingBag size={16} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#A21CAF" }}>Listing Marketplace</p>
          </div>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#701A75" }}>{data.totalListings}</p>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
        
        {/* ── Native Telemetry Panel (Left) ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(15,23,42,0.03)", gap: "0" }}>
           <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <MousePointerClick size={16} color="#059669" /> Analisis Lalu Lintas (Traffic)
               </h2>
               <p style={{ fontSize: "12px", color: "#64748B" }}>Total interaksi dan rute terpopuler</p>
             </div>
             <div style={{ padding: "10px 16px", borderRadius: "14px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#2563EB", textTransform: "uppercase" }}>Total Kunjungan</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#1E3A8A" }}>{data.totalVisits} views</span>
             </div>
           </div>

           <div style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Rute Paling Sering Dikunjungi</h3>
              
              <div style={{ display: "grid", gap: "16px" }}>
                 {data.topPaths.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#94A3B8" }}>Belum ada rute terekam.</p>
                 ) : data.topPaths.map(([path, count], index) => {
                    const percentage = Math.round((count / data.totalVisits) * 100) || 0;
                    return (
                      <div key={path} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                         <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                            <span style={{ color: "#0F172A", fontFamily: "inherit" }}>
                              {resolveMapping(path)} 
                              <span style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 500, marginLeft: "6px", fontFamily: "monospace" }}>{path}</span>
                            </span>
                            <span style={{ color: "#64748B" }}>{count} ({percentage}%)</span>
                         </div>
                         <div style={{ width: "100%", height: "8px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${percentage}%`, height: "100%", background: "#10B981", borderRadius: "4px", transition: "width 1s ease-out" }} />
                         </div>
                      </div>
                    )
                 })}
              </div>

              <div style={{ marginTop: "32px" }}>
                 <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Distribusi Perangkat Browser</h3>
                 <div style={{ display: "flex", gap: "10px" }}>
                    {Object.entries(data.deviceCounts).filter(([_,c]) => c > 0).map(([device, c]) => (
                        <div key={device} style={{ flex: 1, padding: "12px", borderRadius: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                           <div style={{ color: "#475569" }}>{getDeviceIcon(device)}</div>
                           <p style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>{device}</p>
                           <p style={{ fontSize: "16px", fontWeight: 800, color: "#3B82F6" }}>{c}</p>
                        </div>
                    ))}
                    {Object.values(data.deviceCounts).every(c => c === 0) && (
                       <p style={{ fontSize: "13px", color: "#94A3B8" }}>Belum ada distribusi.</p>
                    )}
                 </div>
              </div>
           </div>
        </section>

         {/* ── Recent Global Activity Feed (Right) ── */}
        <section style={{ borderRadius: "24px", border: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Activity size={16} color="#2563EB" /> Transaksi Scan Terbaru
               </h2>
               <p style={{ fontSize: "12px", color: "#64748B" }}>Pemantauan unggahan secara real-time</p>
             </div>
          </div>
          <div style={{ display: "grid" }}>
             {data.recentScans.length === 0 ? (
               <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
                 Belum ada aktivitas scan terdeteksi.
               </div>
             ) : (
               data.recentScans.map((activity, idx) => (
                 <div key={activity.id} style={{ padding: "16px 24px", borderBottom: idx !== data.recentScans.length - 1 ? "1px solid #F8FAFC" : "none", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                   <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
                     <ScanLine size={16} />
                   </div>
                   <div>
                     <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", marginBottom: "2px" }}>Seseorang men-scan {activity.item_name}</h3>
                     <span style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>{formatTimeAgo(activity.created_at)}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </section>
      </div>

    </div>
  );
}
