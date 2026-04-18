import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/* ═══════════════ CONFIG ═══════════════ */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_IMAGE_MODEL}`;

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
  "upcycleIdea": "string — judul ide upcycle kreatif dalam bahasa Inggris (untuk prompt gambar), contoh: Flower Vase, Premium Terrarium, Hanging Plant Pot, Decorative Lamp, Pencil Holder",
  "upcycleIdeaId": "string — judul ide upcycle dalam Bahasa Indonesia, contoh: Vas Bunga Unik, Terrarium Premium, Pot Tanaman Gantung",
  "upcycleDescription": "string — deskripsi singkat ide upcycle 1 kalimat dalam Bahasa Indonesia",
  "heroHeadline": "string — headline inspiratif sesuai rekomendasi: jika sell → tentang menjual/memberi kehidupan kedua, jika recycle → tentang daur ulang kreatif, jika dispose → tentang pembuangan bertanggung jawab",
  "heroDescription": "string — deskripsi 2-3 kalimat yang menjelaskan mengapa rekomendasi ini dipilih dan dampaknya bagi lingkungan"
}`;

const TUTORIAL_SYSTEM_PROMPT = `You are a creative DIY tutorial writer for SirkulasiIn, a circular economy platform.
Given an item name, material, and upcycle idea, generate a complete upcycling tutorial.
Respond ONLY with valid JSON (no markdown fences). ALL text in Bahasa Indonesia.

{
  "title": "string — Judul tutorial yang menarik, contoh: Pot Self-Watering dari Botol Kaca",
  "description": "string — Deskripsi singkat 1-2 kalimat tentang proyek ini",
  "difficulty": "Pemula | Menengah | Mahir",
  "duration": "string — perkiraan waktu, contoh: 15 Menit, 30 Menit",
  "ecoPoints": 150,
  "tools": ["string — alat yang dibutuhkan"],
  "materials": ["string — material yang dibutuhkan"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "string — judul langkah",
      "description": "string — penjelasan detail 2-3 kalimat tentang langkah ini"
    }
  ]
}

Buatlah 4-6 langkah yang jelas dan mudah diikuti. Sertakan tips keselamatan jika diperlukan.`;



/* ═══════════════ Upload image to Supabase Storage ═══════════════ */
async function uploadImage(supabase: any, base64: string): Promise<string | null> {
  try {

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

    const { data: urlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
}

/* ═══════════════ Upload raw bytes to Supabase Storage ═══════════════ */
async function uploadBytes(supabase: any, bytes: Uint8Array, prefix: string): Promise<string | null> {
  try {
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Bytes upload failed:", err);
    return null;
  }
}

/* ═══════════════ Generate upcycle image via Hugging Face ═══════════════ */
async function generateUpcycleImage(
  supabase: any,
  itemName: string,
  material: string,
  upcycleIdea: string
): Promise<string | null> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfKey || hfKey === "hf_YOUR_TOKEN_HERE") {
    console.warn("Hugging Face API key not configured, skipping image gen.");
    return null;
  }

  try {
    const prompt = `A beautiful, realistic product photo of a ${upcycleIdea} made from recycled ${material} (originally a ${itemName}). ` +
      `Clean white studio background, professional product photography, soft lighting, high quality, detailed craftsmanship, eco-friendly upcycled design.`;

    console.log("[HF] Generating upcycle image:", prompt.slice(0, 100) + "...");

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 4,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[HF] Image gen failed: ${response.status}`, errText.slice(0, 300));
      return null;
    }

    // Response is raw image bytes (PNG/JPEG)
    const imageBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    if (imageBytes.length < 1000) {
      console.error("[HF] Image too small, likely an error response.");
      return null;
    }

    // Upload to Supabase
    const publicUrl = await uploadBytes(supabase, imageBytes, "upcycle");
    console.log("[HF] Upcycle image uploaded:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("[HF] Image generation error:", err);
    return null;
  }
}

/* ═══════════════ Generate tutorial steps via Groq ═══════════════ */
async function generateTutorialSteps(
  itemName: string,
  material: string,
  upcycleIdea: string
): Promise<{
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  ecoPoints: number;
  tools: string[];
  materials: string[];
  steps: Array<{ stepNumber: number; title: string; description: string }>;
} | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `${TUTORIAL_SYSTEM_PROMPT}\n\nItem: ${itemName}\nMaterial: ${material}\nIde Upcycle: ${upcycleIdea}`;

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("[Tutorial] Groq error:", res.status);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    let jsonStr = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    console.log("[Tutorial] Generated steps:", parsed.title);
    return parsed;
  } catch (err) {
    console.error("[Tutorial] Generation error:", err);
    return null;
  }
}

/* ═══════════════ POST Handler ═══════════════ */
export async function POST(req: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

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

    /* ── 2. Upload scan image to Supabase Storage ── */
    let scanImageUrl: string | null = null;
    if (imageBase64) {
      scanImageUrl = await uploadImage(serverSupabase, imageBase64);
    }

    /* ── 3. Generate upcycle thumbnail if recommendation is recycle ── */
    let upcycleImageUrl: string | null = null;
    if (result.recommendation === "recycle" && result.upcycleIdea) {
      upcycleImageUrl = await generateUpcycleImage(
        serverSupabase,
        result.itemName || "item",
        result.material || "recycled material",
        result.upcycleIdea
      );
    }

    /* ── 3b. Generate tutorial steps if recycle ── */
    let tutorialData: Awaited<ReturnType<typeof generateTutorialSteps>> = null;
    if (result.recommendation === "recycle" && result.upcycleIdea) {
      tutorialData = await generateTutorialSteps(
        result.itemName || "item",
        result.material || "material",
        result.upcycleIdeaId || result.upcycleIdea
      );
    }

    /* ── 4. Save to scan_history ── */
    const { data: inserted, error: dbError } = await serverSupabase
      .from("scan_history")
      .insert({
        user_id: user?.id || null,
        image_url: scanImageUrl,
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
        upcycle_idea: result.upcycleIdeaId || result.upcycleIdea || null,
        upcycle_description: result.upcycleDescription || null,
        upcycle_image_url: upcycleImageUrl,
        hero_headline: result.heroHeadline || null,
        hero_description: result.heroDescription || null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json({ result, scanId: null });
    }

    /* ── 5. Save tutorial to recycle_tutorials if generated ── */
    let tutorialId: string | null = null;
    if (tutorialData && inserted?.id) {
      const { data: tutInserted, error: tutError } = await serverSupabase
        .from("recycle_tutorials")
        .insert({
          scan_id: inserted.id,
          title: tutorialData.title || "Tutorial Daur Ulang",
          description: tutorialData.description || null,
          difficulty: tutorialData.difficulty || "Pemula",
          duration: tutorialData.duration || "10 Menit",
          eco_points: tutorialData.ecoPoints || 100,
          tools: tutorialData.tools || [],
          materials: tutorialData.materials || [],
          steps: tutorialData.steps || [],
          final_image_url: upcycleImageUrl,
        })
        .select("id")
        .single();

      if (tutError) {
        console.error("Tutorial insert error:", tutError);
      } else {
        tutorialId = tutInserted.id;
        console.log("[Tutorial] Saved with ID:", tutorialId);
      }
    }

    /* ── 5b. Record eco points from scan ── */
    if (user && inserted?.id) {
      const rewardText = result.potentialReward || "";
      const pointsEarned = parseInt(rewardText.replace(/[^\d]/g, ""), 10) || 0;
      if (pointsEarned > 0) {
        await serverSupabase.rpc("add_points_transaction", {
          p_user_id: user.id,
          p_points: pointsEarned,
          p_source_type: "scan",
          p_source_id: inserted.id,
          p_description: `Scan: ${result.itemName || "Item"}`,
        });
      }
    }

    return NextResponse.json({
      result,
      scanId: inserted.id,
      tutorialId,
    });
  } catch (err: unknown) {
    console.error("Scan analysis error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
