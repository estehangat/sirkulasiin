import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateContent,
  extractImage,
  decodeBase64,
  AI_API_KEY,
  AI_IMAGE_MODEL,
} from "@/lib/ai";

// Refresh: Triggering Next.js route registration
/* ═══════════════ Supabase ═══════════════ */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function uploadBytes(bytes: Uint8Array, prefix: string, ext: string = "png"): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const filename = "upcycle_" + prefix + "_" + Date.now() + "." + ext;
    const contentType = ext === "jpg" ? "image/jpeg" : "image/" + ext;
    console.log("Uploading to storage:", filename);
    const { error } = await supabase.storage
      .from("scan-images")
      .upload(filename, bytes, { contentType, upsert: false });
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

    if (!AI_API_KEY || AI_API_KEY.includes("YOUR_TOKEN")) {
      console.error("AI API Key is missing or invalid!");
      return NextResponse.json({ error: "AI API Key missing" }, { status: 500 });
    }

    const sessionId = "upcycle_" + scanId + "_" + Date.now();
    const prompt = "Draw a beautiful, realistic product photo of a " + scan.upcycle_idea + " made from recycled " + scan.material + " (originally a " + scan.item_name + "). Clean white studio background, professional product photography, soft lighting, high quality, detailed craftsmanship, eco-friendly upcycled design. Respond with the image only.";
    console.log("Calling AI native endpoint for model:", AI_IMAGE_MODEL);

    const resp = await generateContent({
      model: AI_IMAGE_MODEL,
      sessionId,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!resp) {
      console.error("AI API returned no response.");
      return NextResponse.json({ error: "AI API failed" }, { status: 502 });
    }

    const img = extractImage(resp);
    if (!img) {
      console.error("No image data URI in AI response.");
      return NextResponse.json({ error: "Invalid image response" }, { status: 502 });
    }

    const imageBytes = decodeBase64(img.base64);
    if (imageBytes.length < 1000) {
      console.error("Image received is too small or invalid.");
      return NextResponse.json({ error: "Invalid image received" }, { status: 502 });
    }

    console.log("Image received successfully, size:", imageBytes.length);
    const ext = img.mimeType.split("/")[1].replace("jpeg", "jpg");
    const publicUrl = await uploadBytes(imageBytes, scanId.slice(0, 8), ext);

    if (publicUrl) {
      console.log("Success! New URL:", publicUrl);
      await supabase.from("scan_history").update({ upcycle_image_url: publicUrl }).eq("id", scanId);
      await supabase.from("recycle_tutorials").update({ final_image_url: publicUrl }).eq("scan_id", scanId);
    } else {
      console.error("Failed to upload to Supabase storage.");
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error("Internal Server Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
  }
}
