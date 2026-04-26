
-- 1. Add service_sold + actual_price to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS service_sold TEXT,
  ADD COLUMN IF NOT EXISTS actual_price NUMERIC;

-- 2. Add the same to financial_movements (denormalized for AI / reporting)
ALTER TABLE public.financial_movements
  ADD COLUMN IF NOT EXISTS service_sold TEXT,
  ADD COLUMN IF NOT EXISTS actual_price NUMERIC;

-- 3. Update sync_transaction_to_ledger to propagate service info
CREATE OR REPLACE FUNCTION public.sync_transaction_to_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_account uuid;
  client_label text;
  service_label text;
  desc_text text;
  ext_ref text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.financial_movements
     WHERE source = 'transaction' AND external_ref = 'tx:' || OLD.id::text;
    RETURN OLD;
  END IF;

  SELECT id INTO default_account FROM public.bank_accounts
   WHERE type = 'business' ORDER BY sort_order LIMIT 1;
  IF default_account IS NULL THEN
    SELECT id INTO default_account FROM public.bank_accounts ORDER BY sort_order LIMIT 1;
  END IF;
  IF default_account IS NULL THEN
    RAISE LOG 'sync_transaction_to_ledger: no bank account';
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), name)
    INTO client_label FROM public.clients WHERE id = NEW.client_id;
  SELECT name INTO service_label FROM public.services WHERE id = NEW.service_id;
  desc_text := COALESCE(client_label, 'Cliente') ||
               CASE WHEN service_label IS NOT NULL THEN ' — ' || service_label ELSE '' END ||
               ' (' || COALESCE(NEW.payment_type, 'Pagamento') || ')';
  ext_ref := 'tx:' || NEW.id::text;

  IF NEW.status = 'Saldato' THEN
    UPDATE public.financial_movements
       SET account_id  = default_account,
           date        = COALESCE(NEW.payment_date, now()),
           description = desc_text,
           amount      = NEW.amount,
           type        = 'credit',
           classification = 'business',
           is_recurring = COALESCE(NEW.recurring_active, false),
           is_reviewed  = true,
           client_id    = NEW.client_id,
           service_sold = service_label,
           actual_price = NEW.amount,
           updated_at   = now()
     WHERE source = 'transaction' AND external_ref = ext_ref;
    IF NOT FOUND THEN
      INSERT INTO public.financial_movements (
        account_id, date, description, amount, type, classification,
        is_recurring, is_reviewed, source, external_ref, client_id,
        service_sold, actual_price
      ) VALUES (
        default_account, COALESCE(NEW.payment_date, now()), desc_text, NEW.amount,
        'credit', 'business', COALESCE(NEW.recurring_active, false), true,
        'transaction', ext_ref, NEW.client_id,
        service_label, NEW.amount
      );
    END IF;

    -- Mirror service info onto the client for quick reads
    IF NEW.client_id IS NOT NULL AND service_label IS NOT NULL THEN
      UPDATE public.clients
         SET service_sold = service_label,
             actual_price = NEW.amount
       WHERE id = NEW.client_id;
    END IF;
  ELSE
    DELETE FROM public.financial_movements
     WHERE source = 'transaction' AND external_ref = ext_ref;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'sync_transaction_to_ledger error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;

-- 4. Refresh service catalog
-- Rename existing "Light/Base/Plus/Premium X mesi" → "Percorso ... X mesi"
UPDATE public.services SET name = 'Percorso ' || name, category = 'Percorso'
 WHERE category IN ('Light','Base','Plus','Premium');

-- Rename Nutrition → NC Nutrition
UPDATE public.services SET name = REPLACE(name, 'Nutrition ', 'NC Nutrition '), category = 'NC Nutrition'
 WHERE category = 'Nutrition';

-- Replace "Programmazione Mensile" with "Programmazione Avanzata"
UPDATE public.services
   SET name = 'Programmazione Avanzata', category = 'Programmazione', duration_months = 1
 WHERE name = 'Programmazione Mensile';

-- Add PT Pack if missing
INSERT INTO public.services (name, category, price, duration_months, sort_order)
SELECT 'PT Pack — Sessione Gratuita + 3 PT', 'PT Pack', 99, 1, 100
 WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name LIKE 'PT Pack%');
