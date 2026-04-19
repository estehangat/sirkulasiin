"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

function getDeviceType() {
   const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
   if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "Tablet";
   }
   if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "Mobile";
   }
   return "Desktop";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Hindari pencatatan berulang pada path yang sama selama sesi singkat
    if (trackedPaths.current.has(pathname)) return;
    // Abaikan jejak rute admin agar statistik hanya mencatat pengguna asli
    if (pathname.startsWith('/admin')) return;

    const recordVisit = async () => {
       const supabase = createClient();
       try {
         await supabase.from('page_visits').insert({
            path: pathname,
            user_agent: navigator.userAgent,
            device_type: getDeviceType()
         });
         trackedPaths.current.add(pathname);
       } catch (err) {
         // Silently fail, it's just analytics
       }
    };

    recordVisit();

  }, [pathname]);

  return null; // Komponen siluman (invisible)
}
