/*
# Create customers table and link orders

1. New Tables
- `customers`: Customer profiles with name, birthday, phone
  - id (uuid, PK), name, phone (unique), birthday (date), created_at

2. Modified Tables
- `orders`: added `customer_id` column (nullable FK to customers)

3. Security
- RLS enabled on customers.
- Single-tenant app: TO anon, authenticated so the anon-key frontend can operate.

4. Notes
- customer_id on orders is nullable so existing orders without a customer still work.
- Phone is the unique identifier for login (no password needed for a local store).
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  birthday date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- Add customer_id to orders (nullable for backward compat)
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
