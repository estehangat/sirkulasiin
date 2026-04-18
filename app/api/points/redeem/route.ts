import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const body = await req.json();
    const { pointsCost, description } = body as {
      pointsCost: number;
      description: string;
    };

    if (!pointsCost || pointsCost <= 0) {
      return NextResponse.json({ error: "Jumlah poin tidak valid." }, { status: 400 });
    }

    /* ── Cek saldo dulu (kecepatan UX) ── */
    const { data: balance } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    const current = balance?.total_points ?? 0;
    if (current < pointsCost) {
      return NextResponse.json(
        { error: `Saldo poin tidak mencukupi. Anda hanya memiliki ${current} poin.` },
        { status: 400 }
      );
    }

    /* ── Atomic deduction via RPC ── */
    const { error: rpcErr } = await supabase.rpc("add_points_transaction", {
      p_user_id: user.id,
      p_points: -pointsCost,
      p_source_type: "redeem",
      p_source_id: null,
      p_description: description || "Penukaran Poin",
    });

    if (rpcErr) {
      console.error("Redeem RPC error:", rpcErr);
      // RPC throws 'insufficient_points' if balance check fails at DB level
      if (rpcErr.message?.includes("insufficient_points")) {
        return NextResponse.json(
          { error: "Saldo poin tidak mencukupi." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Gagal menukar poin." }, { status: 500 });
    }

    /* ── Fetch updated balance ── */
    const { data: updated } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      pointsDeducted: pointsCost,
      newBalance: updated?.total_points ?? 0,
    });
  } catch (err: unknown) {
    console.error("Redeem error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
