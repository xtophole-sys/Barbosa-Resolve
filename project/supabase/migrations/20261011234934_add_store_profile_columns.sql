/*
# Add store profile columns to store_settings

1. Modified Tables
- `store_settings` — adds columns for store profile info:
  - `store_name` (text, nullable) — display name of the store
  - `whatsapp` (text, nullable) — WhatsApp contact number
  - `business_hours` (text, nullable) — human-readable business hours
  - `has_physical_store` (boolean, default false) — whether the store has a physical location

2. Security
- No policy changes — existing RLS policies on store_settings still apply.
*/

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS business_hours text,
  ADD COLUMN IF NOT EXISTS has_physical_store boolean DEFAULT false;
