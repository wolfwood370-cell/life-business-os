-- Drop old check constraint on payment_type if present
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_type_check;

-- Recreate check including 'Ricorrente'
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_type_check
  CHECK (payment_type IN ('Unica Soluzione', 'A Rate', 'Ricorrente'));

-- Recurring tracking columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_stopped_at timestamp with time zone;