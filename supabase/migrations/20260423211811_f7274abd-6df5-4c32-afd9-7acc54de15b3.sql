
ALTER TABLE public.personal_expenses
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Allinea start_date alla data di creazione per le righe esistenti
UPDATE public.personal_expenses
SET start_date = created_at
WHERE start_date IS NULL OR start_date = created_at + INTERVAL '0';
