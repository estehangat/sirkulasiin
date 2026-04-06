import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════ CONFIG ═══════════════ */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a waste-analysis AI for a circular economy platform called SirkulasiIn.
Analyze the item and respond ONLY with valid JSON (no markdown fences).
ALL text values must be in Bahasa Indonesia.

{
  "itemName": "string — nama barang",
  "material": "string — material utama, contoh: Kaca Borosilikat, Plastik PET",
  "grade": "string — grade kualitas, contoh: Food Grade (A+), Teknis (B)",
  "weight": "string — perkiraan berat, contoh: 250g, 1.2kg",
  "condition": "good | fair | poor",
  "recommendation": "recycle | sell | dispose",
  "reason": "string — 1-2 kalimat alasan dalam Bahasa Indonesia",
  "marketSentiment": "string — analisis sentimen pasar 1-2 kalimat: apakah item ini diminati? trend pasar?",
  "materialPurity": "string — analisis kemurnian material 1-2 kalimat",
  "circularPotential": "number 0-100 — skor potensi sirkular",
  "carbonOffset": "number 0-100 — skor offset karbon",
  "carbonSaved": "string — perkiraan karbon yang disimpan, contoh: 0.3kg CO2",
  "potentialReward": "string — poin reward, contoh: 120 Poin",
  "estimatedPrice": "string — estimasi harga jual dalam Rupiah, contoh: Rp 50.000 – Rp 100.000 (berikan walau rekomendasi bukan sell)",
  "recycleOptions": ["opsi1","opsi2","opsi3"],
  "upcycleIdea": "string — judul ide upcycle kreatif, contoh: Vas Bunga Unik, Terrarium Premium, Pot Tanaman Gantung",
  "upcycleDescription": "string — deskripsi singkat ide upcycle 1 kalimat",
  "heroHeadline": "string — headline inspiratif sesuai rekomendasi: jika sell → tentang menjual/memberi kehidupan kedua, jika recycle → tentang daur ulang kreatif, jika dispose → tentang pembuangan bertanggung jawab",
  "heroDescription": "string — deskripsi 2-3 kalimat yang menjelaskan mengapa rekomendasi ini dipilih dan dampaknya bagi lingkungan"
}`;

/* ═══════════════ Supabase Client ═══════════════ */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* ═══════════════ Upload image to Supabase Storage ═══════════════ */
async function uploadImage(base64: string): Promise<string | null> {
  try {
    const supabase = getSupabase();

    // Strip data URL prefix → raw base64
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;

    // Infer mime / extension
    let mimeType = "image/jpeg";
    let ext = "jpg";
    if (base64.startsWith("data:")) {
      const m = base64.match(/data:(image\/[^;]+);/);
      if (m) {
        mimeType = m[1];
        ext = m[1].split("/")[1].replace("jpeg", "jpg");
      }
    }

    // Decode base64 → Uint8Array
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

    const filename = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
}

/* ═══════════════ POST Handler ═══════════════ */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API Groq belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageBase64, description } = body as {
      imageBase64?: string;
      description?: string;
    };

    if (!imageBase64 && !description) {
      return NextResponse.json(
        { error: "Harap unggah gambar atau berikan deskripsi." },
        { status: 400 }
      );
    }

    /* ── 1. Call Groq AI ── */
    const hasImage = !!imageBase64;
    const model = hasImage ? VISION_MODEL : TEXT_MODEL;

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    let textPrompt = SYSTEM_PROMPT;
    if (description) {
      textPrompt += `\n\nDeskripsi pengguna: ${description}`;
    }
    userContent.push({ type: "text", text: textPrompt });

    if (imageBase64) {
      let imageUrl = imageBase64;
      if (!imageBase64.startsWith("data:")) {
        imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      }
      userContent.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userContent }],
        temperature: 0.3,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => null);
      const errMsg =
        errData?.error?.message || `Groq API error: ${groqResponse.status}`;
      console.error("Groq API error:", errData);
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const data = await groqResponse.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    // Parse JSON (strip markdown fences if present)
    let jsonStr = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const result = JSON.parse(jsonStr);

    /* ── 2. Upload image to Supabase Storage ── */
    let imageUrl: string | null = null;
    if (imageBase64) {
      imageUrl = await uploadImage(imageBase64);
    }

    /* ── 3. Save to scan_history ── */
    const supabase = getSupabase();
    const { data: inserted, error: dbError } = await supabase
      .from("scan_history")
      .insert({
        image_url: imageUrl,
        description: description || null,
        item_name: result.itemName || "Item Tidak Dikenal",
        material: result.material || null,
        grade: result.grade || null,
        weight: result.weight || null,
        condition: result.condition || null,
        recommendation: result.recommendation || "dispose",
        reason: result.reason || null,
        market_sentiment: result.marketSentiment || null,
        material_purity: result.materialPurity || null,
        circular_potential: result.circularPotential || 0,
        carbon_offset: result.carbonOffset || 0,
        carbon_saved: result.carbonSaved || null,
        potential_reward: result.potentialReward || null,
        estimated_price: result.estimatedPrice || null,
        recycle_options: result.recycleOptions || null,
        upcycle_idea: result.upcycleIdea || null,
        upcycle_description: result.upcycleDescription || null,
        hero_headline: result.heroHeadline || null,
        hero_description: result.heroDescription || null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Still return the result even if DB fails
      return NextResponse.json({ result, scanId: null });
    }

    return NextResponse.json({
      result,
      scanId: inserted.id,
    });
  } catch (err: unknown) {
    console.error("Scan analysis error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
