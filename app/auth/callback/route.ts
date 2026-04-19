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
      try {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single();
        if (p?.role) role = p.role;
        else {
          const { data: u } = await supabase.from('users').select('role').eq('id', data.session.user.id).single();
          if (u?.role) role = u.role;
        }
      } catch (e) {}

      if (role === "admin" && next === "/dashboard") {
        next = "/admin";
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
