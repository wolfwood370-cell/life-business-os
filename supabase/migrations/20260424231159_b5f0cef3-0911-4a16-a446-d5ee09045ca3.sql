-- Add recurrence pattern columns to expenses & incomes
ALTER TABLE public.personal_expenses
  ADD COLUMN IF NOT EXISTS recurrence_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_value integer;

ALTER TABLE public.business_expenses
  ADD COLUMN IF NOT EXISTS recurrence_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_value integer;

ALTER TABLE public.personal_incomes
  ADD COLUMN IF NOT EXISTS recurrence_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_value integer;

-- Backfill: recurring → fixed_day on the day-of-month of start_date
UPDATE public.personal_expenses
SET recurrence_type = CASE WHEN is_recurring THEN 'fixed_day' ELSE 'none' END,
    recurrence_value = CASE WHEN is_recurring THEN EXTRACT(DAY FROM start_date)::int ELSE NULL END
WHERE recurrence_type = 'none';

UPDATE public.business_expenses
SET recurrence_type = CASE WHEN is_recurring THEN 'fixed_day' ELSE 'none' END,
    recurrence_value = CASE WHEN is_recurring THEN EXTRACT(DAY FROM start_date)::int ELSE NULL END
WHERE recurrence_type = 'none';

-- Validation triggers (instead of CHECK with subqueries) to enforce shape
CREATE OR REPLACE FUNCTION public.validate_recurrence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recurrence_type NOT IN ('none','fixed_day','interval_days') THEN
    RAISE EXCEPTION 'Invalid recurrence_type: %', NEW.recurrence_type;
  END IF;
  IF NEW.recurrence_type = 'fixed_day' THEN
    IF NEW.recurrence_value IS NULL OR NEW.recurrence_value < 1 OR NEW.recurrence_value > 31 THEN
      RAISE EXCEPTION 'recurrence_value must be 1-31 for fixed_day';
    END IF;
  ELSIF NEW.recurrence_type = 'interval_days' THEN
    IF NEW.recurrence_value IS NULL OR NEW.recurrence_value < 1 THEN
      RAISE EXCEPTION 'recurrence_value must be >=1 for interval_days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_recurrence_personal_expenses ON public.personal_expenses;
CREATE TRIGGER validate_recurrence_personal_expenses
  BEFORE INSERT OR UPDATE ON public.personal_expenses
  FOR EACH ROW EXECUTE FUNCTION public.validate_recurrence();

DROP TRIGGER IF EXISTS validate_recurrence_business_expenses ON public.business_expenses;
CREATE TRIGGER validate_recurrence_business_expenses
  BEFORE INSERT OR UPDATE ON public.business_expenses
  FOR EACH ROW EXECUTE FUNCTION public.validate_recurrence();

DROP TRIGGER IF EXISTS validate_recurrence_personal_incomes ON public.personal_incomes;
CREATE TRIGGER validate_recurrence_personal_incomes
  BEFORE INSERT OR UPDATE ON public.personal_incomes
  FOR EACH ROW EXECUTE FUNCTION public.validate_recurrence();