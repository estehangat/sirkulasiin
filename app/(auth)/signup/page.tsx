import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Daftar - SirkulasiIn",
  description:
    "Buat akun SirkulasiIn dan mulai perjalanan gaya hidup sirkular Anda bersama kami.",
};

export default function SignupPage() {
  return <SignupForm />;
}
