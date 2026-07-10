-- Client-site contact form centralization (shared endpoint model).
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run.

-- 1. Where a client's contact-form submissions should be emailed.
--    Falls back to clients.email at send time if left null.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS form_email text;

-- 2. Audit trail for every submission, independent of whether the
--    email actually delivered (mirrors the `leads` table pattern).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  name text NOT NULL,
  contact text NOT NULL,
  message text,
  page text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_submissions_client_id_created_at_idx
  ON contact_submissions (client_id, created_at DESC);
