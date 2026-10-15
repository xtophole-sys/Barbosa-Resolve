/*
# Add store settings table for Pix QR code

1. New Tables
- `store_settings` — single-row table for store-wide configuration.
  - `id` (int, primary key, always 1)
  - `pix_key` (text, nullable) — Pix key (telefone, e-mail, CPF/CNPJ ou aleatória)
  - `pix_qr_code_url` (text, nullable) — URL of the uploaded QR code image in Supabase Storage
  - `pix_receiver_name` (text, nullable) — Name of the Pix receiver (optional)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled on `store_settings`.
- SELECT: public (anon + authenticated) — customers need to see the Pix QR code at checkout.
- INSERT/UPDATE/DELETE: authenticated only — only the admin can change store settings.
*/

CREATE TABLE IF NOT EXISTS store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pix_key text,
  pix_qr_code_url text,
  pix_receiver_name text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_settings" ON store_settings;
CREATE POLICY "public_read_store_settings"
ON store_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_store_settings" ON store_settings;
CREATE POLICY "auth_insert_store_settings"
ON store_settings FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_store_settings" ON store_settings;
CREATE POLICY "auth_update_store_settings"
ON store_settings FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_store_settings" ON store_settings;
CREATE POLICY "auth_delete_store_settings"
ON store_settings FOR DELETE
TO authenticated USING (true);

-- Create storage bucket for Pix QR code
INSERT INTO storage.buckets (id, name, public)
VALUES ('pix-qrcode', 'pix-qrcode', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read the QR code
DROP POLICY IF EXISTS "public_read_pix_bucket" ON storage.objects;
CREATE POLICY "public_read_pix_bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pix-qrcode');

-- Allow authenticated (admin) to upload/manage
DROP POLICY IF EXISTS "auth_write_pix_bucket" ON storage.objects;
CREATE POLICY "auth_write_pix_bucket"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'pix-qrcode');

DROP POLICY IF EXISTS "auth_update_pix_bucket" ON storage.objects;
CREATE POLICY "auth_update_pix_bucket"
ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'pix-qrcode');

DROP POLICY IF EXISTS "auth_delete_pix_bucket" ON storage.objects;
CREATE POLICY "auth_delete_pix_bucket"
ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'pix-qrcode');
