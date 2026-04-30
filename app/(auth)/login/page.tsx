import type { Metadata } from "next";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - SirkulasiIn",
  description:
    "Masuk ke akun SirkulasiIn Anda dan lanjutkan perjalanan hijau Anda.",
};

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <Suspense>
      <LoginForm userCount={count ?? 0} />
    </Suspense>
  );
}
