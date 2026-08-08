import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateContent,
  extractText,
  extractImage,
  extractJsonFromText,
  decodeBase64,
  AI_API_KEY,
  AI_TEXT_MODEL,
  AI_IMAGE_MODEL,
} from "@/lib/ai";

const TUTORIAL_SYSTEM_PROMPT = `You are a creative DIY tutorial writer for SirkulasiIn, a circular economy platform.
Given an item name, material, and upcycle idea, generate a complete upcycling tutorial.
Respond ONLY with valid JSON (no markdown fences). ALL text in Bahasa Indonesia.

CRITICAL OUTPUT RULES:
- Output MUST be a single valid JSON object and NOTHING else.
- DO NOT write any prose, greeting, explanation, or prefix (e.g. "Tentu", "Berikut", "Silakan").
- DO NOT wrap the JSON in markdown code fences.
- The first character of your response MUST be "{". Start with the opening brace immediately.

OUTPUT FORMAT:
{
  "title": "Judul tutorial yang menarik",
  "description": "Deskripsi singkat 1-2 kalimat tentang proyek ini",
  "difficulty": "Pemula | Menengah | Mahir",
  "duration": "perkiraan waktu, contoh: 15 Menit, 30 Menit",
  "ecoPoints": 150,
  "tools": ["alat yang dibutuhkan"],
  "materials": ["material yang dibutuhkan"],
  "steps": [<step objects>]
}

SETIAP STEP HARUS menggunakan format berikut (JANGAN gunakan field "description" di dalam step):
{
  "stepNumber": 1,
  "label": "Persiapan",
  "title": "Persiapan Material",
  "iconName": "Droplets",
  "mainDesc": "Bersihkan botol kaca kosong dari kotoran dan debu. Rendam dalam air hangat selama 10 menit untuk melepas label dan sisa lem.",
  "detailDesc": "Pastikan botol benar-benar kering sebelum melanjutkan. Gunakan kain microfiber untuk mengelap bagian dalam dan luar botol. Periksa apakah ada retakan kecil yang dapat menyebabkan masalah di tahap berikutnya.",
  "dos": ["Gunakan sarung tangan pelindung", "Pastikan area kerja bersih dan terang"],
  "donts": ["Jangan gunakan botol yang sudah retak", "Hindari menyentuh bagian tajam"],
  "expertInsight": "Merendam botol dalam air hangat dengan sedikit sabun selama 10 menit akan melunakkan label dan lem dengan sempurna.",
  "techniqueRef": "Botol yang bersih dan kering menghasilkan potongan yang lebih presisi dan aman."
}

ATURAN KETAT:
- Buatlah 4-6 langkah.
- Setiap step WAJIB memiliki semua field: stepNumber, label, title, iconName, mainDesc, detailDesc, dos (2 item), donts (2 item).
- expertInsight dan techniqueRef opsional (boleh null), tapi sangat disarankan diisi.
- DILARANG menggunakan field "description" di dalam step. Gunakan "mainDesc" dan "detailDesc".
- dos harus diawali kata kerja aktif. donts harus diawali "Jangan" atau "Hindari".
- mainDesc: 2-3 kalimat penjelasan utama. detailDesc: 3-4 kalimat detail teknis.
- iconName harus dari Lucide React: Scissors, Paintbrush, Wrench, Ruler, Hammer, Droplets, Flame, Recycle, CheckCircle, Eye, Lightbulb, Sparkles, Leaf, Shovel, Sun, Package, Settings, Eraser, Layers, Search.`;

/* ═══════════════ Supabase ═══════════════ */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* ═══════════════ Upload raw bytes ═══════════════ */
async function uploadBytes(bytes: Uint8Array, prefix: string, ext: string = "png"): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, { contentType, upsert: false });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(filename);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Bytes upload failed:", err);
    return null;
  }
}

/* ═══════════════ Generate image via native endpoint ═══════════════ */
async function generateImage(itemName: string, material: string, upcycleIdea: string, sessionId: string): Promise<string | null> {
  if (!AI_API_KEY || AI_API_KEY === "sk-YOUR_TOKEN_HERE") return null;

  try {
    const prompt = "Draw a beautiful, realistic product photo of a " + upcycleIdea + " made from recycled " + material + " (originally a " + itemName + "). Clean white studio background, professional product photography, soft lighting, high quality, detailed craftsmanship, eco-friendly upcycled design. Respond with the image only.";

    const resp = await generateContent({
      model: AI_IMAGE_MODEL,
      sessionId,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const img = extractImage(resp);
    if (!img) return null;

    const imageBytes = decodeBase64(img.base64);
    if (imageBytes.length < 1000) return null;

    const ext = img.mimeType.split("/")[1].replace("jpeg", "jpg");
    return await uploadBytes(imageBytes, "upcycle", ext);
  } catch (err) {
    console.error("[AI] Exception during image gen:", err);
    return null;
  }
}

/* ═══════════════ POST Handler ═══════════════ */
export async function POST(req: NextRequest) {
  try {
    if (!AI_API_KEY) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const { scanId } = (await req.json()) as { scanId: string };
    if (!scanId) {
      return NextResponse.json({ error: "scanId is required." }, { status: 400 });
    }

    const supabase = getSupabase();
    const sessionId = "tut_" + scanId + "_" + Date.now();

    // Check if tutorial already exists for this scan
    const { data: existing } = await supabase
      .from("recycle_tutorials")
      .select("id")
      .eq("scan_id", scanId)
      .single();

    if (existing) {
      // Jika tutorial ada tapi gambar masih kosong di scan_history, coba buatkan gambarnya
      const { data: scanCheck } = await supabase
        .from("scan_history")
        .select("item_name, material, upcycle_idea, upcycle_image_url")
        .eq("id", scanId)
        .single();

      if (scanCheck && !scanCheck.upcycle_image_url) {
        const newImg = await generateImage(scanCheck.item_name, scanCheck.material, scanCheck.upcycle_idea, sessionId);
        if (newImg) {
          await Promise.all([
            supabase.from("scan_history").update({ upcycle_image_url: newImg }).eq("id", scanId),
            supabase.from("recycle_tutorials").update({ final_image_url: newImg }).eq("id", existing.id)
          ]);
        }
      }
      return NextResponse.json({ tutorialId: existing.id });
    }

    // Fetch scan data
    const { data: scan, error: scanErr } = await supabase
      .from("scan_history")
      .select("item_name, material, upcycle_idea, upcycle_image_url")
      .eq("id", scanId)
      .single();

    if (scanErr || !scan) {
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    }

    const itemName = scan.item_name || "Item";
    const material = scan.material || "material daur ulang";
    const upcycleIdea = scan.upcycle_idea || "Kreasi Upcycle";

    // Generate tutorial steps via AI (turn 1 of this session)
    const userPrompt = "Buatkan tutorial upcycling lengkap untuk:\n- Item: " + itemName + "\n- Material: " + material + "\n- Ide Upcycle: " + upcycleIdea + "\n\nWAJIB ikuti format JSON di system instruction. Setiap step HARUS memiliki field: stepNumber, label, title, iconName, mainDesc, detailDesc, dos (array 2 string), donts (array 2 string). Field expertInsight dan techniqueRef opsional. JANGAN gunakan field description. Gunakan mainDesc dan detailDesc saja.";

    const aiResp = await generateContent({
      model: AI_TEXT_MODEL,
      sessionId,
      systemInstruction: TUTORIAL_SYSTEM_PROMPT,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      temperature: 0.5,
      maxOutputTokens: 4096,
    });

    if (!aiResp) {
      return NextResponse.json({ error: "Failed to generate tutorial." }, { status: 502 });
    }

    const text = extractText(aiResp);
    const tutorial = extractJsonFromText<Record<string, unknown>>(text);
    if (!tutorial) {
      console.error("[Tutorial] Failed to parse AI response. Raw:", text.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse tutorial response." }, { status: 502 });
    }

    // Normalize steps: ensure AI output uses mainDesc/detailDesc, not description
    const rawSteps = Array.isArray(tutorial.steps) ? tutorial.steps : [];
    const normalizedSteps = rawSteps.map((s: Record<string, unknown>, i: number) => ({
      stepNumber: s.stepNumber || i + 1,
      label: s.label || ("Langkah " + ((s.stepNumber as number) || i + 1)),
      title: s.title || "",
      iconName: s.iconName || "Recycle",
      mainDesc: s.mainDesc || s.description || "",
      detailDesc: s.detailDesc || "",
      dos: Array.isArray(s.dos) ? s.dos : [],
      donts: Array.isArray(s.donts) ? s.donts : [],
      expertInsight: s.expertInsight ?? null,
      techniqueRef: s.techniqueRef ?? null,
    }));

    // Generate upcycle image (turn 2, same session) if not already present
    let finalImageUrl = scan.upcycle_image_url || null;
    if (!finalImageUrl) {
      finalImageUrl = await generateImage(itemName, material, upcycleIdea, sessionId);

      // Also update scan_history with the generated image
      if (finalImageUrl) {
        await supabase
          .from("scan_history")
          .update({ upcycle_image_url: finalImageUrl })
          .eq("id", scanId);
      }
    }

    // Save tutorial
    const { data: inserted, error: insertErr } = await supabase
      .from("recycle_tutorials")
      .insert({
        scan_id: scanId,
        title: tutorial.title || "Tutorial Daur Ulang",
        description: tutorial.description || null,
        difficulty: tutorial.difficulty || "Pemula",
        duration: tutorial.duration || "10 Menit",
        eco_points: tutorial.ecoPoints || 100,
        tools: tutorial.tools || [],
        materials: tutorial.materials || [],
        steps: normalizedSteps,
        final_image_url: finalImageUrl,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Tutorial insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save tutorial." }, { status: 500 });
    }

    return NextResponse.json({ tutorialId: inserted.id });
  } catch (err: unknown) {
    console.error("Generate tutorial error:", err);
    const message = err instanceof Error ? err.message : "Internal error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
