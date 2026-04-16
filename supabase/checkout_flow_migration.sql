-- ============================================
-- SirkulasiIn: Checkout Flow Migration Layer
-- ============================================

-- Function ini berjalan sebagai SECURITY DEFINER, artinya dieksekusi 
-- dengan hak akses "creator" (admin) sehingga dapat meng-update
-- table marketplace_listings yang sebelumnya diblokir oleh RLS.
CREATE OR REPLACE FUNCTION rpc_place_order(
  p_listing_id UUID,
  p_seller_id UUID,
  p_shipping_name TEXT,
  p_shipping_phone TEXT,
  p_shipping_address TEXT,
  p_shipping_notes TEXT,
  p_total_price INTEGER
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_order_id UUID;
  v_listing_status TEXT;
BEGIN
  -- 1. Validasi Autentikasi
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validasi Diri Sendiri
  IF v_buyer_id = p_seller_id THEN
    RAISE EXCEPTION 'Anda tidak bisa membeli listing Anda sendiri.';
  END IF;

  -- 3. Cek Status Listing Lock (mencegah double purchase)
  SELECT status INTO v_listing_status
  FROM marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE; -- Mengunci baris ini untuk transaksi saat ini

  IF v_listing_status != 'published' THEN
    RAISE EXCEPTION 'Listing ini sudah tidak tersedia atau telah terjual.';
  END IF;

  -- 4. Buat record Order baru
  INSERT INTO orders (
    buyer_id, listing_id, seller_id,
    shipping_name, shipping_phone, shipping_address, shipping_notes,
    total_price, status
  ) VALUES (
    v_buyer_id, p_listing_id, p_seller_id,
    p_shipping_name, p_shipping_phone, p_shipping_address, p_shipping_notes,
    p_total_price, 'pending_payment'
  ) RETURNING id INTO v_order_id;

  -- 5. Ubah Status Listing menjadi Sold
  UPDATE marketplace_listings
  SET status = 'sold', updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN v_order_id;
END;
$$;
