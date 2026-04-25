import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - SirkulasiIn",
  description:
    "Masuk ke akun SirkulasiIn Anda dan lanjutkan perjalanan hijau Anda.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
