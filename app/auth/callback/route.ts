import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session?.user) {
      let role = "user";
      let isActive = true;
      try {
        const { data: p } = await supabase.from('profiles').select('role, is_active').eq('id', data.session.user.id).single();
        if (p?.role) role = p.role;
        if (p?.is_active === false) isActive = false;
        if (!p?.role) {
          const { data: u } = await supabase.from('users').select('role, is_active').eq('id', data.session.user.id).single();
          if (u?.role) role = u.role;
          if (u?.is_active === false) isActive = false;
        }
      } catch (e) {}

      if (!isActive) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=account_deactivated`);
      }

      if (role === "admin" && next === "/dashboard") {
        next = "/admin";
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
