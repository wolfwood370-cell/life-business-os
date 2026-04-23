
-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lead_source TEXT NOT NULL,
  pipeline_stage TEXT NOT NULL,
  root_motivator TEXT NOT NULL DEFAULT '',
  objection_stated TEXT NOT NULL DEFAULT '',
  objection_real TEXT NOT NULL DEFAULT '',
  monthly_value NUMERIC,
  next_renewal_date TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  pt_pack_sessions_used INT,
  lead_score INT,
  churn_risk TEXT,
  notes TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROI metrics
CREATE TABLE public.roi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric TEXT NOT NULL,
  value TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roi_metrics_client ON public.roi_metrics(client_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_metrics ENABLE ROW LEVEL SECURITY;

-- Single-user CRM: open access for now (no auth implemented yet)
CREATE POLICY "Open access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access roi" ON public.roi_metrics FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.roi_metrics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roi_metrics;
