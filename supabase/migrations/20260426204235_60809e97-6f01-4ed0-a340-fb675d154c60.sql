CREATE TABLE IF NOT EXISTS public.finance_coach_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latest_briefing text,
  last_briefing_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_coach_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed user can read finance_coach_config"
  ON public.finance_coach_config FOR SELECT TO authenticated
  USING (public.is_allowed_user());

CREATE POLICY "Allowed user can insert finance_coach_config"
  ON public.finance_coach_config FOR INSERT TO authenticated
  WITH CHECK (public.is_allowed_user());

CREATE POLICY "Allowed user can update finance_coach_config"
  ON public.finance_coach_config FOR UPDATE TO authenticated
  USING (public.is_allowed_user())
  WITH CHECK (public.is_allowed_user());

CREATE POLICY "Allowed user can delete finance_coach_config"
  ON public.finance_coach_config FOR DELETE TO authenticated
  USING (public.is_allowed_user());

CREATE TRIGGER update_finance_coach_config_updated_at
  BEFORE UPDATE ON public.finance_coach_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.finance_coach_config (id) VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;