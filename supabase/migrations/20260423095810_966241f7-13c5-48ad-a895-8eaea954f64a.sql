ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

UPDATE public.clients
SET
  first_name = split_part(trim(name), ' ', 1),
  last_name = NULLIF(trim(substring(trim(name) FROM position(' ' IN trim(name)) + 1)), '')
WHERE first_name IS NULL AND last_name IS NULL AND name IS NOT NULL;