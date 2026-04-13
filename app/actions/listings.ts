"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type ListingState = {
  error?: string;
  success?: string;
} | null;

// ===== PUBLISH LISTING =====
export async function publishListing(
  _prevState: ListingState,
  formData: FormData
): Promise<ListingState> {
  const supabase = await createServerSupabaseClient();

  // Cek autentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk membuat listing." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const category = formData.get("category") as string;
  const imageUrl = formData.get("image_url") as string;
  const scanId = formData.get("scan_id") as string;
  const carbonSaved = formData.get("carbon_saved") as string;
  const ecoPoints = parseInt(formData.get("eco_points") as string) || 0;
  const aiPriceMin = parseInt(formData.get("ai_price_min") as string) || null;
  const aiPriceMax = parseInt(formData.get("ai_price_max") as string) || null;
  const location = formData.get("location") as string;

  // Barter fields
  const barterEnabled = formData.get("barter_enabled") === "on";
  const barterWithRaw = formData.get("barter_with") as string;
  const barterWith = barterWithRaw
    ? barterWithRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const barterNotes = formData.get("barter_notes") as string;

  // Validasi
  if (!title || !category) {
    return { error: "Nama item dan kategori wajib diisi." };
  }

  // Parse harga - hapus titik pemisah ribuan
  const price = parseInt(priceStr?.replace(/\./g, "") || "0");
  if (!price || price <= 0) {
    return { error: "Harga harus lebih dari 0." };
  }

  const { error } = await supabase.from("marketplace_listings").insert({
    user_id: user.id,
    scan_id: scanId || null,
    title,
    description: description || null,
    image_url: imageUrl || null,
    price,
    ai_price_min: aiPriceMin,
    ai_price_max: aiPriceMax,
    category,
    carbon_saved: carbonSaved || null,
    eco_points: ecoPoints,
    status: "published",
    location: location || null,
    barter_enabled: barterEnabled,
    barter_with: barterWith,
    barter_notes: barterNotes || null,
  });

  if (error) {
    console.error("Error publishing listing:", error);
    return { error: "Gagal mempublikasi listing. Silakan coba lagi." };
  }

  redirect("/marketplace");
}

// ===== SAVE DRAFT =====
export async function saveDraft(
  _prevState: ListingState,
  formData: FormData
): Promise<ListingState> {
  const supabase = await createServerSupabaseClient();

  // Cek autentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk menyimpan draft." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const category = formData.get("category") as string;
  const imageUrl = formData.get("image_url") as string;
  const scanId = formData.get("scan_id") as string;
  const carbonSaved = formData.get("carbon_saved") as string;
  const ecoPoints = parseInt(formData.get("eco_points") as string) || 0;
  const aiPriceMin = parseInt(formData.get("ai_price_min") as string) || null;
  const aiPriceMax = parseInt(formData.get("ai_price_max") as string) || null;
  const location = formData.get("location") as string;

  // Barter fields
  const barterEnabled = formData.get("barter_enabled") === "on";
  const barterWithRaw = formData.get("barter_with") as string;
  const barterWith = barterWithRaw
    ? barterWithRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const barterNotes = formData.get("barter_notes") as string;

  const price = parseInt(priceStr?.replace(/\./g, "") || "0");

  const { error } = await supabase.from("marketplace_listings").insert({
    user_id: user.id,
    scan_id: scanId || null,
    title: title || "Draft Listing",
    description: description || null,
    image_url: imageUrl || null,
    price: price || 0,
    ai_price_min: aiPriceMin,
    ai_price_max: aiPriceMax,
    category: category || "other",
    carbon_saved: carbonSaved || null,
    eco_points: ecoPoints,
    status: "draft",
    location: location || null,
    barter_enabled: barterEnabled,
    barter_with: barterWith,
    barter_notes: barterNotes || null,
  });

  if (error) {
    console.error("Error saving draft:", error);
    return { error: "Gagal menyimpan draft. Silakan coba lagi." };
  }

  return { success: "Draft berhasil disimpan!" };
}
