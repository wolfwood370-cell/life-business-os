CREATE TABLE public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Altro',
  is_recurring boolean NOT NULL DEFAULT true,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read business_expenses"
ON public.business_expenses FOR SELECT TO authenticated USING (is_allowed_user());

CREATE POLICY "Allowed user can insert business_expenses"
ON public.business_expenses FOR INSERT TO authenticated WITH CHECK (is_allowed_user());

CREATE POLICY "Allowed user can update business_expenses"
ON public.business_expenses FOR UPDATE TO authenticated USING (is_allowed_user()) WITH CHECK (is_allowed_user());

CREATE POLICY "Allowed user can delete business_expenses"
ON public.business_expenses FOR DELETE TO authenticated USING (is_allowed_user());

ALTER PUBLICATION supabase_realtime ADD TABLE public.business_expenses;
ALTER TABLE public.business_expenses REPLICA IDENTITY FULL;