-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allowed user can read expense_categories"
  ON public.expense_categories FOR SELECT TO authenticated
  USING (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can insert expense_categories"
  ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can update expense_categories"
  ON public.expense_categories FOR UPDATE TO authenticated
  USING (is_allowed_user()) WITH CHECK (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can delete expense_categories"
  ON public.expense_categories FOR DELETE TO authenticated
  USING (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS expense_categories_name_unique ON public.expense_categories (lower(name));

-- Replica identity for full row payloads
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.personal_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.life_goals REPLICA IDENTITY FULL;
ALTER TABLE public.expense_categories REPLICA IDENTITY FULL;

-- Add to realtime publication only if missing
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['clients','transactions','personal_expenses','life_goals','expense_categories'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;