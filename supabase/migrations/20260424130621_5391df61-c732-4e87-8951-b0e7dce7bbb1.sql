CREATE TABLE IF NOT EXISTS public.sales_coach_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_script TEXT NOT NULL DEFAULT '',
  free_session_process TEXT NOT NULL DEFAULT '',
  pt_pack_process TEXT NOT NULL DEFAULT '',
  latest_report JSONB,
  last_report_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_coach_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allowed user can read sales_coach_config"
  ON public.sales_coach_config FOR SELECT TO authenticated
  USING (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can insert sales_coach_config"
  ON public.sales_coach_config FOR INSERT TO authenticated
  WITH CHECK (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can update sales_coach_config"
  ON public.sales_coach_config FOR UPDATE TO authenticated
  USING (is_allowed_user()) WITH CHECK (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allowed user can delete sales_coach_config"
  ON public.sales_coach_config FOR DELETE TO authenticated
  USING (is_allowed_user());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_sales_coach_config_updated_at ON public.sales_coach_config;
CREATE TRIGGER update_sales_coach_config_updated_at
BEFORE UPDATE ON public.sales_coach_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sales_coach_config REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sales_coach_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_coach_config;
  END IF;
END $$;

INSERT INTO public.sales_coach_config (sales_script, free_session_process, pt_pack_process)
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.sales_coach_config);