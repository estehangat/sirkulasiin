import type { Metadata } from "next";
import SettingsClientPage from "./settings-client";

export const metadata: Metadata = {
  title: "Profil dan Settings — SirkulasiIn",
  description: "Atur profil dan preferensi akun Anda.",
};

export default function SettingsPage() {
  return <SettingsClientPage />;
}
