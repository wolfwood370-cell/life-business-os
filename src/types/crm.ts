export type LeadSource =
  | 'Gym-provided'
  | 'PT Pack 99€'
  | 'Gym Floor'
  | 'Referral'
  | 'Social Media';

export type PipelineStage =
  | 'Lead Acquired'
  | 'Nurturing'
  | 'Trial Active'
  | 'Pitch Presented'
  | 'Closed Won'
  | 'Closed Lost';

export type ChurnRisk = 'Basso' | 'Medio' | 'Alto';

export interface RoiMetric {
  id: string;
  date: string;       // ISO date
  metric: string;     // es. "Squat 1RM", "Peso", "% massa grassa"
  value: string;      // es. "+10kg", "-4kg", "22%"
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  lead_source: LeadSource;
  pipeline_stage: PipelineStage;
  root_motivator: string;
  objection_stated: string;
  objection_real: string;
  created_at: string;
  stage_updated_at: string;
  monthly_value?: number;
  next_renewal_date?: string;
  last_contacted_at?: string;
  pt_pack_sessions_used?: number;
  lead_score?: number;          // 0-100
  churn_risk?: ChurnRisk;
  roi_metrics?: RoiMetric[];
  notes?: string;
  phone?: string;
}

export interface Financials {
  fixed_monthly_cost: number;
  current_monthly_revenue: number;
  monthly_target: number;
}

export const LEAD_SOURCES: LeadSource[] = [
  'Gym-provided',
  'PT Pack 99€',
  'Gym Floor',
  'Referral',
  'Social Media',
];

export const PIPELINE_STAGES: PipelineStage[] = [
  'Lead Acquired',
  'Nurturing',
  'Trial Active',
  'Pitch Presented',
  'Closed Won',
  'Closed Lost',
];

export const CHURN_RISKS: ChurnRisk[] = ['Basso', 'Medio', 'Alto'];

export const FIXED_MONTHLY_COST = 366;

export const leadSourceLabel: Record<LeadSource, string> = {
  'Gym-provided': 'Contatto Palestra',
  'PT Pack 99€': 'PT Pack 99€',
  'Gym Floor': 'Approccio Sala',
  'Referral': 'Passaparola',
  'Social Media': 'Social Media',
};

export const pipelineStageLabel: Record<PipelineStage, string> = {
  'Lead Acquired': 'Contatto Acquisito',
  'Nurturing': 'In Trattativa',
  'Trial Active': 'Prova/Trial Attivo',
  'Pitch Presented': 'Proposta Presentata',
  'Closed Won': 'Cliente Attivo',
  'Closed Lost': 'Perso / Recupero',
};

export const sourceColorMap: Record<LeadSource, string> = {
  'Gym-provided': 'source-gym',
  'PT Pack 99€': 'source-pack',
  'Gym Floor': 'source-floor',
  'Referral': 'source-referral',
  'Social Media': 'source-social',
};

export const stageColorMap: Record<PipelineStage, string> = {
  'Lead Acquired': 'stage-lead',
  'Nurturing': 'stage-nurture',
  'Trial Active': 'stage-trial',
  'Pitch Presented': 'stage-pitch',
  'Closed Won': 'stage-won',
  'Closed Lost': 'stage-lost',
};

export const formatEuro = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
