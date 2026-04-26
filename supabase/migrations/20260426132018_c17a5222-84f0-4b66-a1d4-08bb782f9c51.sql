-- 1) Abilita la sincronizzazione in tempo reale per le tabelle del Ledger
ALTER TABLE public.financial_movements REPLICA IDENTITY FULL;
ALTER TABLE public.bank_accounts REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'financial_movements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_movements;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bank_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;
END $$;

-- 2) Vincolo di unicità per evitare doppi import dello stesso movimento sullo stesso conto
CREATE UNIQUE INDEX IF NOT EXISTS uniq_movements_account_external_ref
  ON public.financial_movements (account_id, external_ref)
  WHERE external_ref IS NOT NULL;

-- 3) Indice per query mensili sul ledger (performance con storici grandi)
CREATE INDEX IF NOT EXISTS idx_financial_movements_date
  ON public.financial_movements (date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_movements_account_date
  ON public.financial_movements (account_id, date DESC);

-- 4) Vincolo di unicità sul nome categoria per evitare duplicati silenziosi
CREATE UNIQUE INDEX IF NOT EXISTS uniq_categories_name_lower
  ON public.categories (lower(name));