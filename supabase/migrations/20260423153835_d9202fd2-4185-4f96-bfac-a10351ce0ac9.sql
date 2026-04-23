ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'Stripe';

ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_payment_method_check
CHECK (payment_method IN ('Stripe', 'Bonifico', 'Contanti'));