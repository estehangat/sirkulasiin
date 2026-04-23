import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Refresh: Triggering Next.js route registration
/* ═══════════════ CONFIG ═══════════════ */
const HF_IMAGE_MODEL = "runwayml/stable-diffusion-v1-5";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_IMAGE_MODEL}`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function uploadBytes(bytes: Uint8Array, prefix: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const filename = `upcycle_${prefix}_${Date.now()}.png`;
    console.log("Uploading to storage:", filename);
    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, { contentType: "image/png", upsert: false });
    if (error) {
      console.error("Storage Error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(filename);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload Logic Error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log("=== Generate Upcycle Image Started ===");
  try {
    const { scanId } = await req.json();
    if (!scanId) return NextResponse.json({ error: "scanId required" }, { status: 400 });

    const supabase = getSupabase();
    const { data: scan, error: fetchErr } = await supabase
      .from("scan_history")
      .select("item_name, material, upcycle_idea, upcycle_image_url")
      .eq("id", scanId)
      .single();

    if (fetchErr || !scan) {
      console.error("Scan not found or error:", fetchErr);
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (scan.upcycle_image_url) {
      console.log("Image already exists:", scan.upcycle_image_url);
      return NextResponse.json({ url: scan.upcycle_image_url });
    }

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey || hfKey.includes("YOUR_TOKEN")) {
      console.error("Hugging Face API Key is missing or invalid!");
      return NextResponse.json({ error: "HF Key missing" }, { status: 500 });
    }

    const prompt = `A beautiful, realistic product photo of a ${scan.upcycle_idea} made from recycled ${scan.material} (originally a ${scan.item_name}). Clean white studio background, professional product photography, high quality, 8k.`;
    console.log("Calling HF API for model:", HF_IMAGE_MODEL);
    console.log("Prompt:", prompt);

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${hfKey}`, 
        "Content-Type": "application/json",
        "x-use-cache": "false" 
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`HF API Error (${response.status}):`, errText);
      return NextResponse.json({ error: "HF API failed", detail: errText }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    
    if (imageBytes.length < 1000) {
      console.error("Image received is too small or invalid.");
      return NextResponse.json({ error: "Invalid image received" }, { status: 502 });
    }

    console.log("Image received successfully, size:", imageBytes.length);
    const publicUrl = await uploadBytes(imageBytes, scanId.slice(0, 8));

    if (publicUrl) {
      console.log("Success! New URL:", publicUrl);
      // Update scan_history
      await supabase.from("scan_history").update({ upcycle_image_url: publicUrl }).eq("id", scanId);
      // Update tutorial if exists
      await supabase.from("recycle_tutorials").update({ final_image_url: publicUrl }).eq("scan_id", scanId);
    } else {
      console.error("Failed to upload to Supabase storage.");
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Internal Server Error:", err);
    return NextResponse.json({ error: "Internal error", detail: err.message }, { status: 500 });
  }
}
