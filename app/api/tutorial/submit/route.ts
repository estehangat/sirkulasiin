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
    const { tutorialId, imageBase64 } = body as {
      tutorialId: string;
      imageBase64: string;
    };

    if (!tutorialId || !imageBase64) {
      return NextResponse.json(
        { error: "Tutorial ID dan foto hasil wajib diisi." },
        { status: 400 }
      );
    }

    /* ── 1. Upload image ── */
    const raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    let mimeType = "image/jpeg";
    let ext = "jpg";
    if (imageBase64.startsWith("data:")) {
      const m = imageBase64.match(/data:(image\/[^;]+);/);
      if (m) {
        mimeType = m[1];
        ext = m[1].split("/")[1].replace("jpeg", "jpg");
      }
    }

    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const filename = `submission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, { contentType: mimeType, upsert: false });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return NextResponse.json({ error: "Gagal mengunggah foto." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(filename);

    const photoUrl = urlData.publicUrl;

    /* ── 2. Fetch tutorial eco_points ── */
    const { data: tutorial } = await supabase
      .from("recycle_tutorials")
      .select("eco_points, title")
      .eq("id", tutorialId)
      .single();

    const ecoPoints = tutorial?.eco_points || 100;

    /* ── 3. Insert submission record ── */
    const { error: insertErr } = await supabase
      .from("tutorial_submissions")
      .insert({
        user_id: user.id,
        tutorial_id: tutorialId,
        photo_url: photoUrl,
        eco_points_earned: ecoPoints,
      });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return NextResponse.json({ error: "Gagal menyimpan submission." }, { status: 500 });
    }

    /* ── 4. Record eco points transaction ── */
    const { data: submissionRow } = await supabase
      .from("tutorial_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("tutorial_id", tutorialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (submissionRow?.id) {
      await supabase.rpc("add_points_transaction", {
        p_user_id: user.id,
        p_points: ecoPoints,
        p_source_type: "tutorial",
        p_source_id: submissionRow.id,
        p_description: `Tutorial: ${tutorial?.title || "Daur Ulang"}`,
      });
    }

    return NextResponse.json({
      success: true,
      photoUrl,
      ecoPoints,
      tutorialTitle: tutorial?.title || "Tutorial",
    });
  } catch (err: unknown) {
    console.error("Tutorial submit error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

