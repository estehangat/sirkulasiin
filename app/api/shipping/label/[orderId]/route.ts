import { NextResponse } from "next/server";
import { createElement } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import bwipjs from "bwip-js/node";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import ShippingLabelPDF, { type ShippingLabelData } from "@/app/components/ShippingLabelPDF";

// Node runtime wajib (Buffer + @react-pdf perlu Node APIs)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mapping courier code → display name
const COURIER_LABELS: Record<string, string> = {
  jne: "JNE Express",
  jnt: "J&T Express",
  sicepat: "SiCepat",
  anteraja: "AnterAja",
  pos: "POS Indonesia",
  ninja: "Ninja Xpress",
  tiki: "TIKI",
  gosend: "GoSend",
  grab: "GrabExpress",
};

async function generateBarcodeDataUrl(text: string): Promise<string | null> {
  if (!text) return null;
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text,
      scale: 2,
      height: 10,
      includetext: false,
      backgroundcolor: "FFFFFF",
    });
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (err) {
    console.warn("[label] gagal generate barcode:", err);
    return null;
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logoSirkulasiInPolos.png");
    const buf = await readFile(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn("[label] gagal load logo:", err);
    return null;
  }
}

// GET /api/shipping/label/:orderId
// Generate shipping label PDF (10×15cm thermal format) untuk seller download.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pakai admin client (bypass RLS) — ownership di-verify manual.
  const adminSupabase = createAdminSupabaseClient();
  const { data: order, error } = await adminSupabase
    .from("orders")
    .select(
      `id, buyer_id, seller_id, status, total_price, shipping_cost,
       shipping_courier, shipping_service, shipping_etd,
       shipping_name, shipping_phone, shipping_address, shipping_notes,
       shipping_destination_postal,
       awb, shipping_order_id, created_at,
       marketplace_listings ( title, weight_grams )`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  // Hanya seller (atau buyer) yang boleh akses label
  if (order.seller_id !== user.id && order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  if (!order.shipping_order_id) {
    return NextResponse.json(
      { error: "Resi belum dibuat. Buat resi dulu sebelum download label." },
      { status: 400 }
    );
  }

  // Fetch seller profile (sender)
  const { data: sellerProfile } = await adminSupabase
    .from("profiles")
    .select("full_name, phone, full_address, address, shipping_area_name, shipping_postal")
    .eq("id", order.seller_id)
    .maybeSingle();

  // marketplace_listings bisa berupa array (dari join PostgREST) atau single
  const listingRaw = order.marketplace_listings as unknown;
  const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as
    | { title: string; weight_grams: number | null }
    | null;

  const awb = order.awb || "";
  const barcodeDataUrl = await generateBarcodeDataUrl(awb);
  const logoDataUrl = await loadLogoDataUrl();

  const courierCode = (order.shipping_courier || "").toLowerCase();
  const courierName = COURIER_LABELS[courierCode] || courierCode.toUpperCase() || "Kurir";
  const serviceCode = (order.shipping_service || "").toUpperCase();

  const itemPrice = Math.max(
    0,
    (order.total_price || 0) - (order.shipping_cost || 0)
  );
  const weightG = listing?.weight_grams || 1000;
  const weightDisplay =
    weightG >= 1000 ? `${(weightG / 1000).toFixed(1)} kg` : `${weightG} g`;

  const labelData: ShippingLabelData = {
    courierName,
    courierService: order.shipping_etd
      ? `${serviceCode} · ${order.shipping_etd}`
      : serviceCode,
    awb,
    awbBarcodeDataUrl: barcodeDataUrl,
    orderId: order.id,
    orderShortId: order.id.slice(0, 8).toUpperCase(),
    orderDate: new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    senderName: sellerProfile?.full_name || "Penjual SirkulasiIn",
    senderPhone: sellerProfile?.phone || "-",
    senderAddress:
      sellerProfile?.full_address || sellerProfile?.address || "-",
    senderArea: sellerProfile?.shipping_area_name || "",
    senderPostal: sellerProfile?.shipping_postal || "",
    recipientName: order.shipping_name || "-",
    recipientPhone: order.shipping_phone || "-",
    recipientAddress: order.shipping_address || "-",
    recipientArea: "",
    recipientPostal: order.shipping_destination_postal || "",
    itemName: listing?.title || "Produk SirkulasiIn",
    weightDisplay,
    shippingMethod: `${courierName} ${serviceCode}`.trim(),
    notes: order.shipping_notes || undefined,
    logoDataUrl,
  };

  try {
    const pdfBuffer = await renderToBuffer(
      createElement(ShippingLabelPDF, { data: labelData }) as Parameters<typeof renderToBuffer>[0]
    );

    // Buffer (Node) → Uint8Array supaya cocok dengan BodyInit
    const body = new Uint8Array(pdfBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="label-${labelData.orderShortId}-${awb || "no-awb"}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[label] render PDF error:", err);
    return NextResponse.json(
      { error: "Gagal membuat label PDF." },
      { status: 500 }
    );
  }
}
