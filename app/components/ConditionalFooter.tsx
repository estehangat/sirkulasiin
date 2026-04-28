"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on admin and user dashboard pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return null;
  }
  
  return <Footer />;
}
