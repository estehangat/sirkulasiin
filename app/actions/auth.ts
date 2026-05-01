"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

// ===== LOGIN WITH EMAIL + PASSWORD =====
export async function loginWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Email dan password harus diisi." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  let role = 'user';
  let isActive = true;
  try {
     const userReq = await supabase.auth.getUser();
     if (userReq.data?.user) {
         const uid = userReq.data.user.id;
         const { data: p } = await supabase.from('profiles').select('role, is_active').eq('id', uid).single();
         if (p?.role) role = p.role;
         if (p?.is_active === false) isActive = false;
         if (!p?.role) {
           const { data: u } = await supabase.from('users').select('role, is_active').eq('id', uid).single();
           if (u?.role) role = u.role;
           if (u?.is_active === false) isActive = false;
         }
     }
  } catch (e) {}

  if (!isActive) {
     await supabase.auth.signOut();
     return { error: "Akun Anda telah dinonaktifkan oleh administrator. Hubungi admin untuk informasi lebih lanjut." };
  }
  
  let finalNext = next;
  if (role === 'admin' && next === '/dashboard') {
     finalNext = '/admin';
  }
  redirect(finalNext);
}

// ===== LOGIN WITH PHONE (OTP) =====
export async function loginWithPhone(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;

  if (!phone) {
    return { error: "Nomor telepon harus diisi." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Kode OTP telah dikirim ke nomor telepon Anda." };
}

// ===== VERIFY PHONE OTP =====
export async function verifyPhoneOtp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;
  const token = formData.get("otp") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!phone || !token) {
    return { error: "Nomor telepon dan kode OTP harus diisi." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

// ===== SIGN UP WITH EMAIL + PASSWORD =====
export async function signupWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!firstName || !email || !password) {
    return { error: "Semua field wajib harus diisi." };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName || "",
        full_name: `${firstName} ${lastName || ""}`.trim(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Akun berhasil dibuat! Silakan cek login menggunakan email yang telah didaftarkan.",
  };
}

// ===== LOGIN WITH GOOGLE =====
export async function loginWithGoogle(nextUrl?: string): Promise<AuthState> {
  const supabase = await createServerSupabaseClient();
  const nextParam = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback${nextParam}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return null;
}

// ===== LOGOUT =====
export async function logout(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
