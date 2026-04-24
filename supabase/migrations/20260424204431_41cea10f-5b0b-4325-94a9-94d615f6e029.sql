-- Create personal_incomes table
CREATE TABLE public.personal_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT NOT NULL DEFAULT 'Altro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read personal_incomes"
ON public.personal_incomes FOR SELECT TO authenticated
USING (is_allowed_user());

CREATE POLICY "Allowed user can insert personal_incomes"
ON public.personal_incomes FOR INSERT TO authenticated
WITH CHECK (is_allowed_user());

CREATE POLICY "Allowed user can update personal_incomes"
ON public.personal_incomes FOR UPDATE TO authenticated
USING (is_allowed_user())
WITH CHECK (is_allowed_user());

CREATE POLICY "Allowed user can delete personal_incomes"
ON public.personal_incomes FOR DELETE TO authenticated
USING (is_allowed_user());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_incomes;
ALTER TABLE public.personal_incomes REPLICA IDENTITY FULL;