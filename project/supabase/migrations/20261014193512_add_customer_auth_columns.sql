/*
# Add email and password_hash columns to customers

1. Modified Tables
- `customers` — adds columns for customer authentication:
  - `email` (text, unique, nullable) — customer email for login
  - `password_hash` (text, nullable) — bcrypt-hashed password (hashed server-side via edge function)

2. Notes
- Existing customers (registered with phone-only) will have NULL email and password_hash.
  They can still be found by the admin in the customers list.
- New registrations will require email + password.
- Password hashing is done server-side in an edge function to avoid exposing plaintext.
- RLS policies unchanged — customers table remains accessible to anon+authenticated
  (the edge function uses the service role key to read/write password_hash securely).
*/

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email text UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash text;
