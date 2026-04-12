import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════ CONFIG ═══════════════ */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_IMAGE_MODEL}`;

const TUTORIAL_SYSTEM_PROMPT = `You are a creative DIY tutorial writer for SirkulasiIn, a circular economy platform.
Given an item name, material, and upcycle idea, generate a complete upcycling tutorial.
Respond ONLY with valid JSON (no markdown fences). ALL text in Bahasa Indonesia.

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
async function uploadBytes(bytes: Uint8Array, prefix: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, { contentType: "image/png", upsert: false });

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

/* ═══════════════ Generate image via HuggingFace ═══════════════ */
async function generateImage(itemName: string, material: string, upcycleIdea: string): Promise<string | null> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfKey || hfKey === "hf_YOUR_TOKEN_HERE") return null;

  try {
    const prompt = `A beautiful, realistic product photo of a ${upcycleIdea} made from recycled ${material} (originally a ${itemName}). ` +
      `Clean white studio background, professional product photography, soft lighting, high quality, detailed craftsmanship, eco-friendly upcycled design.`;

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 4 },
      }),
    });

    if (!response.ok) return null;

    const imageBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    if (imageBytes.length < 1000) return null;

    return await uploadBytes(imageBytes, "upcycle");
  } catch {
    return null;
  }
}

/* ═══════════════ POST Handler ═══════════════ */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const { scanId } = (await req.json()) as { scanId: string };
    if (!scanId) {
      return NextResponse.json({ error: "scanId is required." }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if tutorial already exists for this scan
    const { data: existing } = await supabase
      .from("recycle_tutorials")
      .select("id")
      .eq("scan_id", scanId)
      .single();

    if (existing) {
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

    // Generate tutorial steps via Groq
    const userPrompt = `Buatkan tutorial upcycling lengkap untuk:
- Item: ${itemName}
- Material: ${material}
- Ide Upcycle: ${upcycleIdea}

WAJIB ikuti format JSON yang ada di system prompt. Setiap step HARUS memiliki field: stepNumber, label, title, iconName, mainDesc, detailDesc, dos (array 2 string), donts (array 2 string). Field expertInsight dan techniqueRef opsional.
JANGAN gunakan field "description". Gunakan "mainDesc" dan "detailDesc" saja.`;

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: TUTORIAL_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_completion_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      return NextResponse.json({ error: "Failed to generate tutorial." }, { status: 502 });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    let jsonStr = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const tutorial = JSON.parse(jsonStr);

    // Normalize steps: ensure AI output uses mainDesc/detailDesc, not description
    const rawSteps = Array.isArray(tutorial.steps) ? tutorial.steps : [];
    const normalizedSteps = rawSteps.map((s: Record<string, unknown>, i: number) => ({
      stepNumber: s.stepNumber || i + 1,
      label: s.label || `Langkah ${(s.stepNumber as number) || i + 1}`,
      title: s.title || "",
      iconName: s.iconName || "Recycle",
      mainDesc: s.mainDesc || s.description || "",
      detailDesc: s.detailDesc || "",
      dos: Array.isArray(s.dos) ? s.dos : [],
      donts: Array.isArray(s.donts) ? s.donts : [],
      expertInsight: s.expertInsight ?? null,
      techniqueRef: s.techniqueRef ?? null,
    }));

    // Generate upcycle image if not already present
    let finalImageUrl = scan.upcycle_image_url || null;
    if (!finalImageUrl) {
      finalImageUrl = await generateImage(itemName, material, upcycleIdea);

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
