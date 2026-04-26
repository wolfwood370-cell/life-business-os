
-- ============================================
-- BANK ACCOUNTS
-- ============================================
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal','business')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated USING (is_allowed_user());
CREATE POLICY "Allowed user can insert bank_accounts" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can update bank_accounts" ON public.bank_accounts FOR UPDATE TO authenticated USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can delete bank_accounts" ON public.bank_accounts FOR DELETE TO authenticated USING (is_allowed_user());

INSERT INTO public.bank_accounts (name, type, sort_order) VALUES
  ('Banca Sella', 'personal', 1),
  ('Hype Next', 'personal', 2),
  ('Hype Business', 'business', 3);

-- ============================================
-- UNIFIED CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'both' CHECK (scope IN ('personal','business','both')),
  kind TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income','both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read categories" ON public.categories FOR SELECT TO authenticated USING (is_allowed_user());
CREATE POLICY "Allowed user can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can update categories" ON public.categories FOR UPDATE TO authenticated USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can delete categories" ON public.categories FOR DELETE TO authenticated USING (is_allowed_user());

-- Migra categorie esistenti deduplicando
INSERT INTO public.categories (name, scope, kind)
SELECT name, 'personal', 'expense' FROM public.expense_categories
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, scope, kind)
SELECT name, 'business', 'expense' FROM public.business_expense_categories
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, scope, kind)
SELECT name, 'personal', 'income' FROM public.income_categories
ON CONFLICT (name) DO NOTHING;

-- Categoria fallback
INSERT INTO public.categories (name, scope, kind) VALUES ('Altro', 'both', 'both')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FINANCIAL MOVEMENTS (LEDGER UNIFICATO)
-- ============================================
CREATE TABLE public.financial_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  classification TEXT NOT NULL DEFAULT 'personal' CHECK (classification IN ('personal','business')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','import','migrated')),
  external_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_date ON public.financial_movements(date DESC);
CREATE INDEX idx_movements_account ON public.financial_movements(account_id);
CREATE INDEX idx_movements_classification ON public.financial_movements(classification, type);

ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read financial_movements" ON public.financial_movements FOR SELECT TO authenticated USING (is_allowed_user());
CREATE POLICY "Allowed user can insert financial_movements" ON public.financial_movements FOR INSERT TO authenticated WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can update financial_movements" ON public.financial_movements FOR UPDATE TO authenticated USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "Allowed user can delete financial_movements" ON public.financial_movements FOR DELETE TO authenticated USING (is_allowed_user());

CREATE TRIGGER update_financial_movements_updated_at
  BEFORE UPDATE ON public.financial_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATA MIGRATION FROM LEGACY TABLES
-- ============================================
DO $$
DECLARE
  v_sella UUID;
BEGIN
  SELECT id INTO v_sella FROM public.bank_accounts WHERE name = 'Banca Sella';

  -- Personal expenses → debit / personal
  INSERT INTO public.financial_movements (account_id, date, description, amount, type, classification, category_id, is_recurring, is_reviewed, source)
  SELECT v_sella, pe.start_date, pe.name, pe.amount, 'debit', 'personal',
         (SELECT id FROM public.categories WHERE name = pe.category LIMIT 1),
         (pe.recurrence_type <> 'none'), true, 'migrated'
  FROM public.personal_expenses pe;

  -- Business expenses → debit / business
  INSERT INTO public.financial_movements (account_id, date, description, amount, type, classification, category_id, is_recurring, is_reviewed, source)
  SELECT v_sella, be.start_date, be.name, be.amount, 'debit', 'business',
         (SELECT id FROM public.categories WHERE name = be.category LIMIT 1),
         (be.recurrence_type <> 'none'), true, 'migrated'
  FROM public.business_expenses be;

  -- Personal incomes → credit / personal
  INSERT INTO public.financial_movements (account_id, date, description, amount, type, classification, category_id, is_recurring, is_reviewed, source)
  SELECT v_sella, pi.date, pi.name, pi.amount, 'credit', 'personal',
         (SELECT id FROM public.categories WHERE name = pi.category LIMIT 1),
         (pi.recurrence_type <> 'none'), true, 'migrated'
  FROM public.personal_incomes pi;

  -- Client transactions saldate → credit / business
  INSERT INTO public.financial_movements (account_id, date, description, amount, type, classification, category_id, client_id, is_reviewed, source, external_ref)
  SELECT v_sella, t.payment_date,
         COALESCE(c.name, 'Cliente') || COALESCE(' — ' || s.name, ''),
         t.amount, 'credit', 'business',
         (SELECT id FROM public.categories WHERE name = 'Altro' LIMIT 1),
         t.client_id, true, 'migrated', t.id::text
  FROM public.transactions t
  LEFT JOIN public.clients c ON c.id = t.client_id
  LEFT JOIN public.services s ON s.id = t.service_id
  WHERE t.status = 'Saldato';
END $$;
