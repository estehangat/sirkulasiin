import type { Metadata } from "next";
import { Suspense } from "react";
import PembuanganAmanClient from "./PembuanganAmanClient";

export const metadata: Metadata = {
  title: "Panduan Pembuangan Aman — SirkulasiIn",
  description: "Panduan lengkap pembuangan aman untuk item yang tidak dapat didaur ulang, termasuk langkah-langkah, peringatan keselamatan, dan lokasi drop-point resmi.",
};

export default function PembuanganAmanPage() {
  return (
    <Suspense fallback={null}>
      <PembuanganAmanClient />
    </Suspense>
  );
}
