ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS training_start_date date,
  ADD COLUMN IF NOT EXISTS training_end_date date;