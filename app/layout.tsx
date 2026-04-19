import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ChatFab from "@/app/components/ChatFab";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SirkulasiIn - Platform Ekonomi Sirkular",
  description:
    "SirkulasiIn adalah platform AI companion untuk gaya hidup sirkular. Bergabung dengan komunitas global yang mengubah limbah menjadi kebijaksanaan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} antialiased`}>
      <body className="min-h-screen" style={{ fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif" }}>
        {children}
        <ChatFab />
      </body>
    </html>
  );
}
