"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";

type GalleryItem = {
  id: string;
  photo_url: string | null;
  tutorial_id: string | null;
  recycle_tutorials: any;
};

export default function GalleryGridClient({ items }: { items: GalleryItem[] }) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
        {items.length > 0 ? items.map((item) => {
          const title = Array.isArray(item.recycle_tutorials)
            ? item.recycle_tutorials[0]?.title
            : item.recycle_tutorials?.title;
            
          return (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              style={{ cursor: "pointer", position: "relative", aspectRatio: "1/1", borderRadius: "24px", overflow: "hidden", border: "1px solid #EFEFEB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              {item.photo_url ? (
                <Image
                  alt={title || "Galeri"}
                  src={item.photo_url}
                  fill
                  style={{ objectFit: "cover", transition: "transform 0.4s" }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.transform = "scale(1.05)";
                    const overlay = img.nextElementSibling as HTMLDivElement;
                    if(overlay) overlay.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.transform = "scale(1)";
                    const overlay = img.nextElementSibling as HTMLDivElement;
                    if(overlay) overlay.style.opacity = "0";
                  }}
                  unoptimized
                />
              ) : (
                <div style={{width: "100%", height: "100%", backgroundColor: "#e2e3de"}} />
              )}
              
              <div 
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", pointerEvents: "none" }}
              >
                <span style={{ color: "#fff", fontWeight: 700 }}>{title || "Proyek Daur Ulang"}</span>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#5a5c59" }}>
            Belum ada proyek daur ulang yang diselesaikan.
          </div>
        )}
      </div>

      {/* Modal popup */}
      {selectedItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
          backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", 
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
        }} onClick={() => setSelectedItem(null)}>
          <div 
            style={{
              position: "relative", backgroundColor: "#ffffff", borderRadius: "24px",
              overflow: "hidden", maxWidth: "480px", width: "100%", padding: "0",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex", flexDirection: "column", animation: "modalIn 0.3s ease-out"
            }} 
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
            <button 
              onClick={() => setSelectedItem(null)}
              style={{
                position: "absolute", top: "16px", right: "16px", 
                backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)",
                border: "1px solid rgba(0,0,0,0.05)", color: "#1A1A1A", 
                borderRadius: "50%", width: "36px", height: "36px", 
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                zIndex: 10, transition: "all 0.2s ease", boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.backgroundColor = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)"; }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", backgroundColor: "#f8fafc" }}>
              {selectedItem.photo_url ? (
                  <Image alt="Foto Upcycle" src={selectedItem.photo_url} fill style={{ objectFit: "cover" }} unoptimized />
                ) : <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af"}}>Tidak ada foto</div>}
            </div>

            <div style={{ padding: "32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#27AE60", background: "#e8f5e9", padding: "4px 10px", borderRadius: "99px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Karya Komunitas
                </span>
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1A1A", marginBottom: "24px", lineHeight: 1.3 }}>
                {Array.isArray(selectedItem.recycle_tutorials) ? selectedItem.recycle_tutorials[0]?.title : selectedItem.recycle_tutorials?.title || "Proyek Daur Ulang"}
              </h3>
              
              {selectedItem.tutorial_id && (
                <Link 
                  href={`/tutorial/recycle?id=${selectedItem.tutorial_id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    background: "#006a35", color: "#cdffd4", fontWeight: 700, fontSize: "16px", padding: "16px 32px", 
                    borderRadius: "999px", textDecoration: "none", width: "100%", transition: "all 0.2s ease",
                    boxShadow: "0 6px 12px rgba(0, 106, 53, 0.2)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 106, 53, 0.3)"; e.currentTarget.style.background = "#00552a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 106, 53, 0.2)"; e.currentTarget.style.background = "#006a35"; }}
                >
                  Lihat Cara Pembuatan <span className="material-symbols-outlined" style={{ fontSize: "20px", fontWeight: "bold" }}>arrow_forward</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
