-- Categorie spese aziendali
CREATE TABLE public.business_expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.business_expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read business_expense_categories"
  ON public.business_expense_categories FOR SELECT TO authenticated
  USING (public.is_allowed_user());
CREATE POLICY "Allowed user can insert business_expense_categories"
  ON public.business_expense_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can update business_expense_categories"
  ON public.business_expense_categories FOR UPDATE TO authenticated
  USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can delete business_expense_categories"
  ON public.business_expense_categories FOR DELETE TO authenticated
  USING (public.is_allowed_user());

-- Categorie entrate (personal incomes)
CREATE TABLE public.income_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read income_categories"
  ON public.income_categories FOR SELECT TO authenticated
  USING (public.is_allowed_user());
CREATE POLICY "Allowed user can insert income_categories"
  ON public.income_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can update income_categories"
  ON public.income_categories FOR UPDATE TO authenticated
  USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can delete income_categories"
  ON public.income_categories FOR DELETE TO authenticated
  USING (public.is_allowed_user());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_expense_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income_categories;