-- Pending launch migrations (LAUNCH_TODOS #1) — consolidated 2026-07-04.
-- Everything here is idempotent: safe to run even if some parts were already applied.
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run.

-- 1. Stripe: cancel route + webhook write/read this column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- 2. SMS: inbound webhook routes by sender phone number
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile_number text;

-- 3. SMS: approval queue shows the source channel badge
ALTER TABLE requests ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'chat';

-- 4. Contact form: homepage inquiries land here (admin /admin/leads reads it)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  business text NOT NULL,
  plan text,
  message text,
  created_at timestamptz DEFAULT now()
);
