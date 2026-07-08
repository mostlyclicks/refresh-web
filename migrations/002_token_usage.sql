-- Token usage tracking on suggestions (Claude Haiku 4.5 input/output tokens
-- per parse-request call). Run in: Supabase dashboard → SQL Editor → New query → paste → Run.

ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS input_tokens integer;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS output_tokens integer;
