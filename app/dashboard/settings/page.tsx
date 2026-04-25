import type { Metadata } from "next";
import SettingsClientPage from "./settings-client";

export const metadata: Metadata = {
  title: "Profil dan Settings — SirkulasiIn",
  description: "Atur profil dan preferensi akun Anda.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ alert?: string }>;
}) {
  const params = await searchParams;
  return <SettingsClientPage alertParam={params.alert} />;
}
