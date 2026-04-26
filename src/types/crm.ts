export type LeadSource =
  | 'Gym-provided'
  | 'Gym Floor'
  | 'Referral'
  | 'Social Media'
  | 'Other';

export type ServiceType =
  | 'Percorso Base'
  | 'Percorso Light'
  | 'Percorso Plus'
  | 'Percorso Premium'
  | 'Programmazione Avanzata'
  | 'NC Nutrition'
  | 'PT Pack Premium'
  | 'Percorso Online'
  | 'Founders Circle'
  | 'Altro';

export const SERVICE_TYPES: ServiceType[] = [
  'Percorso Base',
  'Percorso Light',
  'Percorso Plus',
  'Percorso Premium',
  'Programmazione Avanzata',
  'NC Nutrition',
  'PT Pack Premium',
  'Percorso Online',
  'Founders Circle',
  'Altro',
];

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
  first_name?: string;
  last_name?: string;
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
  email?: string;
  birth_date?: string;        // ISO date (YYYY-MM-DD)
  gender?: Gender;
  gym_signup_date?: string;   // ISO date
  gym_expiry_date?: string;   // ISO date
  gdpr_consent?: boolean;
  service_sold?: ServiceType;
  actual_price?: number;
  training_start_date?: string; // ISO date YYYY-MM-DD
  training_end_date?: string;   // ISO date YYYY-MM-DD
}

// Grouped service catalog for UI selection
export const SERVICE_GROUPS: { label: string; items: ServiceType[] }[] = [
  { label: 'Percorsi Base', items: ['Percorso Base'] },
  { label: 'Percorsi Light', items: ['Percorso Light'] },
  { label: 'Percorsi Plus', items: ['Percorso Plus'] },
  { label: 'Percorsi Premium', items: ['Percorso Premium'] },
  { label: 'Programmazione', items: ['Programmazione Avanzata'] },
  { label: 'Nutrizione', items: ['NC Nutrition'] },
  { label: 'Entry Level', items: ['PT Pack Premium'] },
  { label: 'Coaching Online', items: ['Percorso Online'] },
  { label: 'Programmi Esclusivi', items: ['Founders Circle'] },
  { label: 'Altro', items: ['Altro'] },
];

// Services with custom pricing (no default price, fully editable)
export const CUSTOM_PRICE_SERVICES: ServiceType[] = ['Founders Circle', 'Percorso Online'];

// Servizi a durata fissa di 28 giorni (no Durata Percorso selector, fine_data auto)
export const SHORT_DURATION_SERVICES: ServiceType[] = [
  'Founders Circle',
  'Programmazione Avanzata',
];

// Servizi senza durata configurabile (training_end_date non viene calcolata)
export const NO_DURATION_SERVICES: ServiceType[] = [
  'PT Pack Premium',
];

// Opzioni durata in mesi per i servizi standard (1 mese = 28 giorni)
export type ContractDurationMonths = 1 | 3 | 6 | 12;
export const CONTRACT_DURATION_OPTIONS: { value: ContractDurationMonths; label: string }[] = [
  { value: 1, label: '1 Mese' },
  { value: 3, label: '3 Mesi' },
  { value: 6, label: '6 Mesi' },
  { value: 12, label: '12 Mesi' },
];

export type Gender = 'M' | 'F' | 'Altro';
export const GENDERS: Gender[] = ['M', 'F', 'Altro'];
export const genderLabel: Record<Gender, string> = {
  M: 'Uomo',
  F: 'Donna',
  Altro: 'Altro',
};

export interface Financials {
  current_monthly_revenue: number;
  monthly_target: number;
}

export const LEAD_SOURCES: LeadSource[] = [
  'Gym-provided',
  'Gym Floor',
  'Referral',
  'Social Media',
  'Other',
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

export const TAX_RATE = 0.249; // 24.90% imposte/contributi

export type PaymentType = 'Unica Soluzione' | 'A Rate' | 'Ricorrente';
export const PAYMENT_TYPES: PaymentType[] = ['Unica Soluzione', 'A Rate', 'Ricorrente'];

export const RECURRING_INTERVAL_DAYS = 28;

export type PaymentMethod = 'Stripe' | 'Bonifico' | 'Contanti';
export const PAYMENT_METHODS: PaymentMethod[] = ['Stripe', 'Bonifico', 'Contanti'];

export type TransactionStatus = 'Saldato' | 'In Attesa';
export const TRANSACTION_STATUSES: TransactionStatus[] = ['Saldato', 'In Attesa'];

export interface Transaction {
  id: string;
  client_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  installments_count: number;
  payment_date: string; // ISO
  created_at: string;
  recurring_active?: boolean;
  recurring_stopped_at?: string;
  status: TransactionStatus;
  due_date: string; // ISO
}

export interface FinancialSummary {
  gross_monthly: number;
  net_monthly: number;
  gross_ytd: number;
  net_ytd: number;
  monthly_target: number;
  current_month_number: number;
}

export interface MonthlyBreakdown {
  year: number;
  month: number;            // 0-11
  label: string;            // es. "Gen 2026"
  gross: number;            // ricavi business totali (Saldato)
  taxes: number;            // gross * TAX_RATE
  business_expenses: number;// somma spese aziendali attive nel mese
  net_business: number;     // gross - taxes - business_expenses
  personal_expenses: number;// somma spese personali del mese
  personal_incomes: number; // somma ricavi personali del mese
  free_cash_flow: number;   // (net_business + personal_incomes) - personal_expenses
  // Backward compat: alcuni vecchi consumer leggono `net` come utile residuo dopo spese
  net: number;
}

export type RecurrenceType = 'none' | 'fixed_day' | 'interval_days';
export const RECURRENCE_TYPES: RecurrenceType[] = ['none', 'fixed_day', 'interval_days'];
export const recurrenceTypeLabel: Record<RecurrenceType, string> = {
  none: 'Occasionale / Una Tantum',
  fixed_day: 'Giorno Fisso del Mese',
  interval_days: 'Intervallo di Giorni',
};

export interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
  is_recurring: boolean;        // legacy/derived: true se recurrence_type !== 'none'
  recurrence_type: RecurrenceType;
  recurrence_value?: number;    // day-of-month (1-31) o numero giorni
  category: string;
  created_at: string;
  start_date: string;
  end_date?: string;
}

export const STANDARD_BUSINESS_EXPENSE_CATEGORIES = [
  'Affitto Studio', 'Marketing', 'Software', 'Attrezzatura', 'Formazione',
  'Commercialista', 'Tasse Locali', 'Utenze', 'Trasferte', 'Altro',
] as const;

export interface PersonalIncome {
  id: string;
  name: string;
  amount: number;
  date: string;          // ISO — start_date per le ricorrenti
  category: string;
  created_at: string;
  recurrence_type: RecurrenceType;
  recurrence_value?: number;
}

export const STANDARD_INCOME_CATEGORIES = [
  'Regalo', 'Consulto Extra', 'Rimborso', 'Investimento', 'Altro',
] as const;

export interface Service {
  id: string;
  category: string;
  name: string;
  price: number;
  sort_order: number;
  duration_months: number;
}

export interface PersonalExpense {
  id: string;
  name: string;
  amount: number;
  is_recurring: boolean;        // legacy/derived
  recurrence_type: RecurrenceType;
  recurrence_value?: number;
  category: string;
  created_at: string;
  start_date: string;
  end_date?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface BusinessExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  created_at: string;
}

export const STANDARD_EXPENSE_CATEGORIES = [
  'Casa', 'Bollette', 'Trasporti', 'Spesa', 'Tempo Libero', 'Abbonamenti', 'Salute', 'Altro',
] as const;

export interface LifeGoal {
  id: string;
  title: string;
  total_target_amount: number;
  current_savings: number;
  deadline: string;        // ISO date YYYY-MM-DD
  is_active: boolean;
  created_at: string;
}

export interface DynamicTarget {
  monthlyGoalSaving: number;            // risparmio mensile per l'obiettivo attivo
  totalRecurringExpenses: number;       // baseline mese corrente: spese personali ricorrenti
  totalRecurringBusinessExpenses: number;// baseline mese corrente: spese business ricorrenti
  fixedBaseline: number;                // somma personali + business ricorrenti previsti questo mese
  adaptiveBuffer: number;               // media 90gg delle spese "Occasionale"
  totalNetNeeded: number;               // fixedBaseline + adaptiveBuffer + monthlyGoalSaving
  dynamicGrossTarget: number;           // totalNetNeeded / (1 - TAX_RATE)
  monthsUntilDeadline: number;          // mesi residui (>=1)
}

export const HISTORY_START_YEAR = 2026;
export const HISTORY_START_MONTH = 0; // Gennaio

// ============ Phase 28: Unified Ledger ============
export type BankAccountType = 'personal' | 'business';
export interface BankAccount {
  id: string;
  name: string;
  type: BankAccountType;
  sort_order: number;
  created_at: string;
}

export type MovementType = 'credit' | 'debit';
export type MovementClassification = 'personal' | 'business';
export type MovementSource = 'manual' | 'import' | 'migrated' | 'transaction';

export type MovementRecurrenceType = 'none' | 'weekly' | 'fixed_day';
export const movementRecurrenceLabel: Record<MovementRecurrenceType, string> = {
  none: 'Una tantum',
  weekly: 'Ogni X settimane',
  fixed_day: 'Giorno fisso del mese',
};

export interface FinancialMovement {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: MovementType;
  classification: MovementClassification;
  category_id?: string;
  client_id?: string;
  is_recurring: boolean;
  is_reviewed: boolean;
  source: MovementSource;
  external_ref?: string;
  notes?: string;
  recurrence_type: MovementRecurrenceType;
  recurrence_value?: number;
  service_sold?: string;
  actual_price?: number;
  created_at: string;
}

export type CategoryScope = 'personal' | 'business' | 'both';
export type CategoryKind = 'expense' | 'income' | 'both';
export interface UnifiedCategory {
  id: string;
  name: string;
  scope: CategoryScope;
  kind: CategoryKind;
}

export const movementClassificationLabel: Record<MovementClassification, string> = {
  personal: 'Personale',
  business: 'Aziendale',
};
export const movementTypeLabel: Record<MovementType, string> = {
  credit: 'Entrata',
  debit: 'Uscita',
};

export const leadSourceLabel: Record<LeadSource, string> = {
  'Gym-provided': 'Contatto Palestra',
  'Gym Floor': 'Approccio Sala',
  'Referral': 'Passaparola',
  'Social Media': 'Social Media',
  'Other': 'Altro',
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
  'Gym Floor': 'source-floor',
  'Referral': 'source-referral',
  'Social Media': 'source-social',
  'Other': 'source-pack',
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
