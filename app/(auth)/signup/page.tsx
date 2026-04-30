import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Daftar - SirkulasiIn",
  description:
    "Buat akun SirkulasiIn dan mulai perjalanan gaya hidup sirkular Anda bersama kami.",
};

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return <SignupForm userCount={count ?? 0} />;
}
