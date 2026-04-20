"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./profile.module.css";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryItem = {
  id: string;
  photo_url: string | null;
  tutorial_id: string | null;
  recycle_tutorials: any;
};

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        {items.length > 4 && (
          <button onClick={scrollLeft} style={{
            position: "absolute", left: "-20px", top: "50%", transform: "translateY(-50%)", zIndex: 10,
            background: "#fff", border: "1px solid #EFEFEB", borderRadius: "50%", width: "48px", height: "48px",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            cursor: "pointer", color: "#1A1A1A"
          }} type="button" aria-label="Scroll Left" onMouseEnter={e => e.currentTarget.style.backgroundColor='#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#fff'}>
            <ChevronLeft size={24} />
          </button>
        )}

        <div 
          ref={scrollRef} 
          style={{ 
            display: "flex", gap: "16px", overflowX: "auto", scrollSnapType: "x mandatory", 
            scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "16px" 
          }}
          className="hide-scrollbar"
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>
          
          {items.length > 0 ? (
            items.map((item) => {
              // Supabase joins can return arrays or objects depending on cardinality
              const title = Array.isArray(item.recycle_tutorials)
                ? item.recycle_tutorials[0]?.title
                : item.recycle_tutorials?.title;
                
              return (
                <div 
                  key={item.id} 
                  className={styles.galleryItem}
                  onClick={() => setSelectedItem(item)}
                  style={{ cursor: "pointer", position: "relative", flexShrink: 0, width: "calc(25% - 12px)", minWidth: "240px", scrollSnapAlign: "start" }}
                >
                  {item.photo_url ? (
                    <Image
                      alt={title || "Galeri"}
                      className={styles.galleryImg}
                      src={item.photo_url}
                      fill
                      unoptimized
                    />
                  ) : (
                    <div style={{width: "100%", height: "100%", backgroundColor: "#e2e3de"}} />
                  )}
                  
                  <div className={styles.galleryOverlay}>
                    <span className={styles.galleryOverlayText}>{title || "Proyek Daur Ulang"}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#5a5c59", width: "100%" }}>
              Belum ada proyek daur ulang yang diselesaikan.
            </div>
          )}
        </div>

        {items.length > 4 && (
          <button onClick={scrollRight} style={{
            position: "absolute", right: "-20px", top: "50%", transform: "translateY(-50%)", zIndex: 10,
            background: "#fff", border: "1px solid #EFEFEB", borderRadius: "50%", width: "48px", height: "48px",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            cursor: "pointer", color: "#1A1A1A"
          }} type="button" aria-label="Scroll Right" onMouseEnter={e => e.currentTarget.style.backgroundColor='#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#fff'}>
            <ChevronRight size={24} />
          </button>
        )}
      </div>

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
            {/* Custom Animation Style injected directly */}
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
                zIndex: 10, transition: "all 0.2s ease",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.backgroundColor = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Media Area */}
            <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", backgroundColor: "#f8fafc" }}>
              {selectedItem.photo_url ? (
                  <Image
                    alt="Foto Upcycle"
                    src={selectedItem.photo_url}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af"}}>Tidak ada foto</div>
              )}
            </div>

            {/* Content Area */}
            <div style={{ padding: "32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#27AE60", background: "#e8f5e9", padding: "4px 10px", borderRadius: "99px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Karya Komunitas
                </span>
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A1A1A", marginBottom: "24px", lineHeight: 1.3 }}>
                {Array.isArray(selectedItem.recycle_tutorials)
                  ? selectedItem.recycle_tutorials[0]?.title
                  : selectedItem.recycle_tutorials?.title || "Proyek Daur Ulang"}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 106, 53, 0.3)";
                    e.currentTarget.style.background = "#00552a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 106, 53, 0.2)";
                    e.currentTarget.style.background = "#006a35";
                  }}
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
