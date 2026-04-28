# Biteship Integration — Setup Guide

## 1. Daftar & API Key

1. Daftar di **https://biteship.com** (gratis, instan)
2. Login dashboard → **Settings → API Keys**
3. Generate API key sandbox (mulai dengan `biteship_test_...`)
4. Production key (`biteship_live_...`) generate setelah top-up saldo

## 2. Environment Variables

Tambahkan ke `.env.local`:

```bash
# ─── Biteship ──────────────────────────────────────────────────────
BITESHIP_BASE_URL=https://api.biteship.com
BITESHIP_API_KEY=biteship_test_xxxxxxxxxxxxxxxxxxxxxxxx

# Origin pickup (warehouse / seller default)
# Cari area_id via: GET /v1/maps/areas?countries=ID&input=jakarta
BITESHIP_ORIGIN_AREA_ID=IDNP6IDNC151IDND2271IDZ12345
BITESHIP_ORIGIN_POSTAL_CODE=10110
BITESHIP_ORIGIN_NAME="Warehouse SirkulasiIn"
BITESHIP_ORIGIN_PHONE=081234567890
BITESHIP_ORIGIN_ADDRESS="Jl. SirkulasiIn No. 1, Jakarta"
BITESHIP_ORIGIN_EMAIL=warehouse@sirkulasiin.id

# Receiver area_id fallback (DEV only — production wajib mapping per order)
BITESHIP_FALLBACK_RECEIVER_AREA_ID=IDNP9IDNC456IDND789IDZ67890

# Webhook secret (random 32+ chars) — set sama persis di dashboard Biteship
BITESHIP_WEBHOOK_SECRET=<random_string>
```

## 3. Cari `area_id`

```bash
curl -X GET "https://api.biteship.com/v1/maps/areas?countries=ID&input=jakarta&type=single" \
  -H "Authorization: Bearer biteship_test_xxx"
```

Pilih `id` yang sesuai dari response, set ke `BITESHIP_ORIGIN_AREA_ID`.

## 4. Database Migration

Jalankan SQL `supabase/biteship_migration.sql` lewat Supabase SQL editor.
Migration ini:
- DROP kolom `komship_*` lama (jika sudah dibuat sebelumnya)
- ADD kolom generic: `shipping_provider`, `shipping_order_id`,
  `shipping_tracking_id`, `shipping_raw`, `public_tracking_url`
- Pastikan kolom `awb`, `pickup_*`, `delivery_*`, `shipping_label_url` ada

Aman dijalankan berulang (idempotent).

## 5. Webhook Setup

1. Login dashboard Biteship → **Settings → Webhooks**
2. Set URL: `https://your-domain.com/api/shipping/webhook`
3. Set secret = nilai `BITESHIP_WEBHOOK_SECRET`
4. Pilih event: `order.status` (minimal)
5. Test ping via dashboard

**Local dev** pakai ngrok:

```bash
ngrok http 3000
# Daftarkan URL ngrok ke webhook Biteship
```

## 6. Smoke Test API

```bash
# Cek search area
curl "https://api.biteship.com/v1/maps/areas?countries=ID&input=jakarta&type=single" \
  -H "Authorization: Bearer biteship_test_xxx"

# Cek rates
curl -X POST "https://api.biteship.com/v1/rates/couriers" \
  -H "Authorization: Bearer biteship_test_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_area_id":"IDNP6IDNC151IDND2271IDZ12345",
    "destination_area_id":"IDNP9IDNC456IDND789IDZ67890",
    "couriers":"jne,jnt,sicepat",
    "items":[{"name":"test","value":50000,"weight":500,"quantity":1}]
  }'
```

## 7. Flow E2E Test

1. Login sebagai pembeli → checkout → bayar via Midtrans sandbox
2. Login sebagai penjual → buka `/marketplace/order/<id>/payment`
3. Klik **"Buat Order & Pickup Otomatis"** → Biteship create order + auto-pickup
4. Cek DB: `shipping_order_id`, `shipping_tracking_id`, `public_tracking_url` terisi
5. Klik **"Lacak Pengiriman"** → buka halaman public tracking Biteship
6. Trigger webhook test dari dashboard → status update di DB
7. Pembeli klik **Selesai** → escrow released

## 8. Endpoint Internal SirkulasiIn

| Path | Method | Role | Fungsi |
|------|--------|------|--------|
| `/api/shipping/webhook` | POST | Biteship | Receive update status (HMAC verified) |
| `/api/shipping/label/[orderId]` | GET | Buyer/Seller | Redirect ke label URL atau public tracking |
| `/api/shipping/track/[orderId]` | GET | Buyer/Seller | Read-only tracking |

## 9. Server Actions (`app/actions/shipping.ts`)

| Action | Role | Trigger |
|--------|------|---------|
| `createShippingOrderAction(orderId)` | Seller | Klik "Buat Order & Pickup Otomatis" |
| `syncTrackingAction(orderId)` | Buyer/Seller | Klik "Refresh Status" |
| `cancelShippingAction(orderId, reason?)` | Seller | Klik "Batalkan Order" |

> **Tidak ada `requestPickupAction`** karena Biteship auto-handle pickup
> saat `delivery_type: "now"` di create order.

## 10. Catatan Penting

- **`area_id` mapping**: Biteship pakai ID format `IDNP6IDNC151IDND2271IDZ12345`,
  bukan `city_id` RajaOngkir. Untuk MVP saat ini pakai
  `BITESHIP_FALLBACK_RECEIVER_AREA_ID`. Untuk production wajib tambah step di
  checkout: panggil `searchAreas(keyword)` dan simpan `area_id` ke order.

- **AWB delay**: `waybill_id` (AWB) kadang null saat create order — Biteship
  akan kasih lewat webhook setelah kurir konfirmasi. UI menampilkan
  *"Menunggu kurir..."* sampai AWB terisi.

- **Auto-promote status**: Webhook & sync tracking auto-set
  `orders.status = 'shipped'` saat `delivery_status` jadi `in_transit` /
  `picked_up`. **Tidak** auto-complete saat `delivered` — buyer wajib
  konfirmasi manual demi safety escrow.

- **Cancel charge**: Cek dengan Biteship apakah ada charge cancel
  fee per kurir.

- **Label PDF**: Tidak universal di Biteship — fallback ke
  `public_tracking_url` (halaman tracking Biteship).

## 11. File Lama yang Bisa Dihapus

Setelah migrasi sukses, hapus manual:

```
lib/komship.ts
supabase/komship_migration.sql
docs/komship-setup.md
app/actions/shipping.ts.tmp   (file kosong sisa proses migrasi)
```
