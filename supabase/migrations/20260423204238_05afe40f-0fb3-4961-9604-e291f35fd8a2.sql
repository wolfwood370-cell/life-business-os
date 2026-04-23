
-- 1. SERVICES: aggiungo duration_months
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_months INTEGER NOT NULL DEFAULT 1;

-- Reset catalogo esistente per ripopolarlo con i nuovi servizi
DELETE FROM public.services;

-- Popolamento catalogo
INSERT INTO public.services (category, name, price, duration_months, sort_order) VALUES
  ('Light',          'Light 3 mesi',           450,    3,  10),
  ('Light',          'Light 6 mesi',           900,    6,  11),
  ('Light',          'Light 12 mesi',          1800,   12, 12),
  ('Base',           'Base 3 mesi',            555,    3,  20),
  ('Base',           'Base 6 mesi',            1110,   6,  21),
  ('Base',           'Base 12 mesi',           2220,   12, 22),
  ('Premium',        'Premium 3 mesi',         855,    3,  30),
  ('Premium',        'Premium 6 mesi',         1710,   6,  31),
  ('Premium',        'Premium 12 mesi',        3420,   12, 32),
  ('Plus',           'Plus 3 mesi',            1035,   3,  40),
  ('Plus',           'Plus 6 mesi',            2070,   6,  41),
  ('Plus',           'Plus 12 mesi',           4140,   12, 42),
  ('Nutrition',      'Nutrition Mensile',      34.90,  1,  50),
  ('Nutrition',      'Nutrition Trimestrale',  99,     3,  51),
  ('Nutrition',      'Nutrition Semestrale',   189,    6,  52),
  ('Programmazione', 'Programmazione Mensile', 90,     1,  60);

-- 2. PERSONAL_EXPENSES
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'Altro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read personal_expenses"
  ON public.personal_expenses FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed user can insert personal_expenses"
  ON public.personal_expenses FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can update personal_expenses"
  ON public.personal_expenses FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can delete personal_expenses"
  ON public.personal_expenses FOR DELETE TO authenticated USING (public.is_allowed_user());

-- 3. LIFE_GOALS
CREATE TABLE IF NOT EXISTS public.life_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  total_target_amount NUMERIC NOT NULL DEFAULT 0,
  current_savings NUMERIC NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read life_goals"
  ON public.life_goals FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed user can insert life_goals"
  ON public.life_goals FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can update life_goals"
  ON public.life_goals FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed user can delete life_goals"
  ON public.life_goals FOR DELETE TO authenticated USING (public.is_allowed_user());

-- 4. TRANSACTIONS: link al servizio
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
