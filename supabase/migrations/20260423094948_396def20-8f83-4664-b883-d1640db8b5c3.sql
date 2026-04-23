ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS gym_signup_date date,
  ADD COLUMN IF NOT EXISTS gym_expiry_date date;