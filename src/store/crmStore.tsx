import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Client, TAX_RATE, RoiMetric, LeadSource, PipelineStage,
  ChurnRisk, Gender, Transaction, PaymentType, PaymentMethod,
  Service, MonthlyBreakdown, HISTORY_START_YEAR, HISTORY_START_MONTH,
  LifeGoal, DynamicTarget,
  BankAccount, FinancialMovement, UnifiedCategory, MovementClassification,
  MovementType, MovementSource, BankAccountType, CategoryScope, CategoryKind,
  MovementRecurrenceType,
} from '@/types/crm';
import { CrmContext, CrmContextValue } from './crmContext';

type ClientRow = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  lead_source: string;
  pipeline_stage: string;
  root_motivator: string;
  objection_stated: string;
  objection_real: string;
  monthly_value: number | null;
  next_renewal_date: string | null;
  last_contacted_at: string | null;
  pt_pack_sessions_used: number | null;
  lead_score: number | null;
  churn_risk: string | null;
  notes: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  gym_signup_date: string | null;
  gym_expiry_date: string | null;
  gdpr_consent: boolean | null;
  service_sold: string | null;
  actual_price: number | string | null;
  training_start_date: string | null;
  training_end_date: string | null;
  created_at: string;
  stage_updated_at: string;
};

type RoiRow = {
  id: string;
  client_id: string;
  date: string;
  metric: string;
  value: string;
  note: string | null;
};

const mapClient = (row: ClientRow, metrics: RoiRow[]): Client => ({
  id: row.id,
  name: row.name,
  first_name: row.first_name ?? undefined,
  last_name: row.last_name ?? undefined,
  lead_source: row.lead_source as LeadSource,
  pipeline_stage: row.pipeline_stage as PipelineStage,
  root_motivator: row.root_motivator,
  objection_stated: row.objection_stated,
  objection_real: row.objection_real,
  created_at: row.created_at,
  stage_updated_at: row.stage_updated_at,
  monthly_value: row.monthly_value ?? undefined,
  next_renewal_date: row.next_renewal_date ?? undefined,
  last_contacted_at: row.last_contacted_at ?? undefined,
  pt_pack_sessions_used: row.pt_pack_sessions_used ?? undefined,
  lead_score: row.lead_score ?? undefined,
  churn_risk: (row.churn_risk as ChurnRisk) ?? undefined,
  notes: row.notes ?? undefined,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  birth_date: row.birth_date ?? undefined,
  gender: (row.gender as Gender) ?? undefined,
  gym_signup_date: row.gym_signup_date ?? undefined,
  gym_expiry_date: row.gym_expiry_date ?? undefined,
  gdpr_consent: row.gdpr_consent ?? false,
  service_sold: (row.service_sold as Client['service_sold']) ?? undefined,
  actual_price: row.actual_price !== null && row.actual_price !== undefined ? Number(row.actual_price) : undefined,
  training_start_date: row.training_start_date ?? undefined,
  training_end_date: row.training_end_date ?? undefined,
  roi_metrics: metrics
    .filter(m => m.client_id === row.id)
    .map(m => ({
      id: m.id,
      date: m.date,
      metric: m.metric,
      value: m.value,
      note: m.note ?? undefined,
    })),
});

const fetchAll = async (): Promise<Client[]> => {
  const [{ data: clientRows, error: cErr }, { data: roiRows, error: rErr }] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('roi_metrics').select('*').order('date', { ascending: false }),
  ]);
  if (cErr) throw cErr;
  if (rErr) throw rErr;
  return (clientRows as ClientRow[]).map(c => mapClient(c, (roiRows ?? []) as RoiRow[]));
};

type TransactionRow = {
  id: string;
  client_id: string;
  amount: number | string;
  payment_type: string;
  payment_method?: string | null;
  installments_count: number;
  payment_date: string;
  created_at: string;
  recurring_active?: boolean | null;
  recurring_stopped_at?: string | null;
  status?: string | null;
  due_date?: string | null;
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('transactions')
    .select('*')
    .order('due_date', { ascending: false });
  if (error) throw error;
  return (data as TransactionRow[]).map(r => ({
    id: r.id,
    client_id: r.client_id,
    amount: Number(r.amount),
    payment_type: r.payment_type as PaymentType,
    payment_method: ((r.payment_method as PaymentMethod) ?? 'Stripe'),
    installments_count: r.installments_count,
    payment_date: r.payment_date,
    created_at: r.created_at,
    recurring_active: r.recurring_active ?? false,
    recurring_stopped_at: r.recurring_stopped_at ?? undefined,
    status: ((r.status as 'Saldato' | 'In Attesa') ?? 'Saldato'),
    due_date: r.due_date ?? r.payment_date,
  }));
};

export const CrmProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [monthlyTarget, setMonthlyTarget] = useState(1500);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['crm', 'clients'],
    queryFn: fetchAll,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['crm', 'transactions'],
    queryFn: fetchTransactions,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['crm', 'services'],
    queryFn: async (): Promise<Service[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((r) => ({
        id: r.id,
        category: r.category,
        name: r.name,
        price: Number(r.price),
        sort_order: r.sort_order,
        duration_months: Number(r.duration_months ?? 1),
      }));
    },
  });


  const { data: lifeGoals = [] } = useQuery({
    queryKey: ['crm', 'life_goals'],
    queryFn: async (): Promise<LifeGoal[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('life_goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        total_target_amount: Number(r.total_target_amount),
        current_savings: Number(r.current_savings ?? 0),
        deadline: r.deadline,
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
      }));
    },
  });


  // ============ Phase 28: Unified Ledger queries ============
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['crm', 'bank_accounts'],
    queryFn: async (): Promise<BankAccount[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bank_accounts').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({
        id: r.id, name: r.name, type: r.type as BankAccountType,
        sort_order: r.sort_order, created_at: r.created_at,
      }));
    },
  });

  const { data: unifiedCategories = [] } = useQuery({
    queryKey: ['crm', 'categories'],
    queryFn: async (): Promise<UnifiedCategory[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({
        id: r.id, name: r.name, scope: r.scope as CategoryScope, kind: r.kind as CategoryKind,
      }));
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['crm', 'movements'],
    queryFn: async (): Promise<FinancialMovement[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('financial_movements').select('*').order('date', { ascending: false }).limit(20000);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({
        id: r.id,
        account_id: r.account_id,
        date: r.date,
        description: r.description ?? '',
        amount: Number(r.amount),
        type: r.type as MovementType,
        classification: r.classification as MovementClassification,
        category_id: r.category_id ?? undefined,
        client_id: r.client_id ?? undefined,
        is_recurring: Boolean(r.is_recurring),
        is_reviewed: Boolean(r.is_reviewed),
        source: (r.source ?? 'manual') as MovementSource,
        external_ref: r.external_ref ?? undefined,
        notes: r.notes ?? undefined,
        recurrence_type: (r.recurrence_type ?? 'none') as MovementRecurrenceType,
        recurrence_value: r.recurrence_value ?? undefined,
        service_sold: r.service_sold ?? undefined,
        actual_price: r.actual_price !== null && r.actual_price !== undefined ? Number(r.actual_price) : undefined,
        created_at: r.created_at,
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('crm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roi_metrics' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'life_goals' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'life_goals'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_movements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'movements'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'bank_accounts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'categories'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });

  const addMutation = useMutation({
    mutationFn: async (c: Omit<Client, 'id' | 'created_at' | 'stage_updated_at'>) => {
      const { error } = await supabase.from('clients').insert({
        name: c.name,
        first_name: c.first_name ?? null,
        last_name: c.last_name ?? null,
        lead_source: c.lead_source,
        pipeline_stage: c.pipeline_stage,
        root_motivator: c.root_motivator ?? '',
        objection_stated: c.objection_stated ?? '',
        objection_real: c.objection_real ?? '',
        monthly_value: c.monthly_value ?? null,
        next_renewal_date: c.next_renewal_date ?? null,
        last_contacted_at: c.last_contacted_at ?? null,
        pt_pack_sessions_used: c.pt_pack_sessions_used ?? null,
        lead_score: c.lead_score ?? null,
        churn_risk: c.churn_risk ?? null,
        notes: c.notes ?? null,
        phone: c.phone ?? null,
        email: c.email ?? null,
        gdpr_consent: c.gdpr_consent ?? false,
        // Contract fields (Phase 37: ensure they persist on insert)
        service_sold: c.service_sold ?? null,
        actual_price: c.actual_price ?? null,
        training_start_date: c.training_start_date ?? null,
        training_end_date: c.training_end_date ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove dependent rows first (no FK cascade configured)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('transactions').delete().eq('client_id', id);
      await supabase.from('roi_metrics').delete().eq('client_id', id);
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Client> }) => {
      // Handle roi_metrics separately if present
      const {
        roi_metrics,
        service_sold,
        actual_price,
        training_start_date,
        training_end_date,
        ...rest
      } = patch;
      const dbPatch: Record<string, unknown> = { ...rest };
      if ('service_sold' in patch) dbPatch.service_sold = service_sold ?? null;
      if ('actual_price' in patch) dbPatch.actual_price = actual_price ?? null;
      if ('training_start_date' in patch) dbPatch.training_start_date = training_start_date ?? null;
      if ('training_end_date' in patch) dbPatch.training_end_date = training_end_date ?? null;
      // Normalize undefined → null for nullable columns
      Object.keys(dbPatch).forEach(k => {
        if (dbPatch[k] === undefined) dbPatch[k] = null;
      });
      if (Object.keys(dbPatch).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('clients').update(dbPatch as any).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      const { error } = await supabase
        .from('clients')
        .update({ pipeline_stage: stage, stage_updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addRoiMutation = useMutation({
    mutationFn: async ({ clientId, metric }: { clientId: string; metric: Omit<RoiMetric, 'id' | 'date'> }) => {
      const { error } = await supabase.from('roi_metrics').insert({
        client_id: clientId,
        metric: metric.metric,
        value: metric.value,
        note: metric.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeRoiMutation = useMutation({
    mutationFn: async ({ metricId }: { clientId: string; metricId: string }) => {
      const { error } = await supabase.from('roi_metrics').delete().eq('id', metricId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (
      t: Omit<Transaction, 'id' | 'created_at' | 'payment_date' | 'status' | 'due_date'> & {
        payment_date?: string;
      }
    ) => {
      const startIso = t.payment_date ?? new Date().toISOString();
      const start = new Date(startIso);
      const totalAmount = t.amount;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // Strict Contract Inheritance: read service from client profile
      const { data: clientRow } = await sb
        .from('clients')
        .select('service_sold')
        .eq('id', t.client_id)
        .maybeSingle();
      const inheritedService: string | null = clientRow?.service_sold ?? null;
      const baseLabel = inheritedService || 'Servizio';

      let insertedIds: string[] = [];

      if (t.payment_type === 'A Rate' && t.installments_count > 1) {
        const n = t.installments_count;
        const cents = Math.round(totalAmount * 100);
        const baseCents = Math.floor(cents / n);
        const remainderCents = cents - baseCents * n;
        const rows = Array.from({ length: n }).map((_, i) => {
          const due = new Date(start);
          due.setDate(due.getDate() + 28 * i);
          const isFirst = i === 0;
          const amountCents = baseCents + (i < remainderCents ? 1 : 0);
          return {
            client_id: t.client_id,
            amount: amountCents / 100,
            payment_type: 'A Rate',
            payment_method: t.payment_method ?? 'Stripe',
            installments_count: n,
            payment_date: isFirst ? startIso : due.toISOString(),
            due_date: due.toISOString(),
            status: isFirst ? 'Saldato' : 'In Attesa',
            recurring_active: false,
          };
        });
        const { data, error } = await sb.from('transactions').insert(rows).select('id');
        if (error) throw error;
        insertedIds = (data ?? []).map((r: { id: string }) => r.id);
      } else {
        const { data, error } = await sb.from('transactions').insert({
          client_id: t.client_id,
          amount: totalAmount,
          payment_type: t.payment_type,
          payment_method: t.payment_method ?? 'Stripe',
          installments_count: 1,
          payment_date: startIso,
          due_date: startIso,
          status: 'Saldato',
          recurring_active: t.payment_type === 'Ricorrente',
        }).select('id');
        if (error) throw error;
        insertedIds = (data ?? []).map((r: { id: string }) => r.id);
      }

      // Override the auto-generated financial_movements (created by DB trigger)
      // to enforce strict contract inheritance: service_sold + professional description.
      if (insertedIds.length > 0) {
        const refs = insertedIds.map(id => `tx:${id}`);
        const desc = `Rata - ${baseLabel}`;
        await sb
          .from('financial_movements')
          .update({
            description: desc,
            service_sold: inheritedService,
          })
          .eq('source', 'transaction')
          .in('external_ref', refs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'movements'] });
    },
  });

  const stopRecurringMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('transactions')
        .update({ recurring_active: false, recurring_stopped_at: new Date().toISOString() })
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('transactions')
        .update({ status: 'Saldato', payment_date: new Date().toISOString() })
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const dbPatch: Record<string, unknown> = {};
      if (updates.amount !== undefined) dbPatch.amount = updates.amount;
      if (updates.due_date !== undefined) dbPatch.due_date = updates.due_date;
      if (updates.payment_date !== undefined) dbPatch.payment_date = updates.payment_date;
      if (updates.status !== undefined) dbPatch.status = updates.status;
      if (updates.payment_method !== undefined) dbPatch.payment_method = updates.payment_method;
      if (Object.keys(dbPatch).length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('transactions')
        .update(dbPatch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('transactions')
        .delete()
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
  });

  // ---------- Life Goals CRUD ----------
  const invalidateGoals = () => queryClient.invalidateQueries({ queryKey: ['crm', 'life_goals'] });
  const addGoalMutation = useMutation({
    mutationFn: async (g: Omit<LifeGoal, 'id' | 'created_at'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      // Invariante: un solo obiettivo attivo. Se questo è attivo, disattiva gli altri.
      if (g.is_active) {
        await sb.from('life_goals').update({ is_active: false }).eq('is_active', true);
      }
      const { error } = await sb.from('life_goals').insert({
        title: g.title,
        total_target_amount: g.total_target_amount,
        current_savings: g.current_savings,
        deadline: g.deadline,
        is_active: g.is_active,
      });
      if (error) throw error;
    },
    onSuccess: invalidateGoals,
  });
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LifeGoal> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      // Invariante: un solo obiettivo attivo. Se stiamo attivando questo, disattiva gli altri.
      if (patch.is_active === true) {
        await sb.from('life_goals').update({ is_active: false }).neq('id', id).eq('is_active', true);
      }
      const { error } = await sb.from('life_goals').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateGoals,
  });
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('life_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateGoals,
  });


  // ============ Phase 28: Movements + Categories CRUD ============
  const invalidateMovements = () => queryClient.invalidateQueries({ queryKey: ['crm', 'movements'] });

  const addMovementMutation = useMutation({
    mutationFn: async (m: Omit<FinancialMovement, 'id' | 'created_at'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('financial_movements').insert({
        account_id: m.account_id,
        date: m.date,
        description: m.description,
        amount: m.amount,
        type: m.type,
        classification: m.classification,
        category_id: m.category_id ?? null,
        client_id: m.client_id ?? null,
        is_recurring: m.is_recurring,
        is_reviewed: m.is_reviewed,
        source: m.source ?? 'manual',
        external_ref: m.external_ref ?? null,
        notes: m.notes ?? null,
        recurrence_type: m.recurrence_type ?? 'none',
        recurrence_value: m.recurrence_value ?? null,
        // Phase 37 fix: persist contract context onto the ledger entry
        service_sold: m.service_sold ?? null,
        actual_price: m.actual_price ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidateMovements,
  });

  const updateMovementMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FinancialMovement> }) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.account_id !== undefined) dbPatch.account_id = patch.account_id;
      if (patch.date !== undefined) dbPatch.date = patch.date;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.amount !== undefined) dbPatch.amount = patch.amount;
      if (patch.type !== undefined) dbPatch.type = patch.type;
      if (patch.classification !== undefined) dbPatch.classification = patch.classification;
      if (patch.category_id !== undefined) dbPatch.category_id = patch.category_id ?? null;
      if (patch.client_id !== undefined) dbPatch.client_id = patch.client_id ?? null;
      if (patch.is_recurring !== undefined) dbPatch.is_recurring = patch.is_recurring;
      if (patch.is_reviewed !== undefined) dbPatch.is_reviewed = patch.is_reviewed;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;
      if (patch.recurrence_type !== undefined) dbPatch.recurrence_type = patch.recurrence_type;
      if (patch.recurrence_value !== undefined) dbPatch.recurrence_value = patch.recurrence_value ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('financial_movements').update(dbPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateMovements,
  });

  const deleteMovementMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('financial_movements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateMovements,
  });

  const importMovementsMutation = useMutation({
    mutationFn: async (rows: Array<Omit<FinancialMovement, 'id' | 'created_at' | 'source'>>): Promise<number> => {
      if (rows.length === 0) return 0;
      const payload = rows.map(m => ({
        account_id: m.account_id,
        date: m.date,
        description: m.description,
        amount: m.amount,
        type: m.type,
        classification: m.classification,
        category_id: m.category_id ?? null,
        client_id: m.client_id ?? null,
        is_recurring: m.is_recurring ?? false,
        is_reviewed: false,
        source: 'import' as MovementSource,
        external_ref: m.external_ref ?? null,
        notes: m.notes ?? null,
        recurrence_type: m.recurrence_type ?? 'none',
        recurrence_value: m.recurrence_value ?? null,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error, data } = await (supabase as any).from('financial_movements').insert(payload).select('id');
      if (error) throw error;
      return (data?.length ?? rows.length) as number;
    },
    onSuccess: invalidateMovements,
  });

  const addUnifiedCategoryMutation = useMutation({
    mutationFn: async ({ name, scope, kind }: { name: string; scope: CategoryScope; kind: CategoryKind }): Promise<UnifiedCategory | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('categories').insert({ name: trimmed, scope, kind }).select().single();
      if (error) {
        if ((error as { code?: string }).code === '23505') return null;
        throw error;
      }
      return data ? { id: data.id, name: data.name, scope: data.scope, kind: data.kind } : null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'categories'] }),
  });

  const updateUnifiedCategoryMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UnifiedCategory> }) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name.trim();
      if (patch.scope !== undefined) dbPatch.scope = patch.scope;
      if (patch.kind !== undefined) dbPatch.kind = patch.kind;
      if (Object.keys(dbPatch).length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('categories').update(dbPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'categories'] }),
  });

  const deleteUnifiedCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      // unset references first to avoid orphan FK / constraint issues
      await sb.from('financial_movements').update({ category_id: null }).eq('category_id', id);
      const { error } = await sb.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'movements'] });
    },
  });

  const current_monthly_revenue = useMemo(
    () => clients.filter(c => c.pipeline_stage === 'Closed Won').reduce((s, c) => s + (c.monthly_value || 0), 0),
    [clients]
  );

  // ---------- Dynamic Target (Adaptive Buffer) ----------
  // ============ Phase 28: Calcoli sul Ledger Unificato ============
  // Helper: filtra movements per anno/mese
  const movementsInMonth = useCallback((y: number, m: number): FinancialMovement[] => {
    const monthStart = new Date(y, m, 1).getTime();
    const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
    return movements.filter(mv => {
      const t = new Date(mv.date).getTime();
      return t >= monthStart && t <= monthEnd;
    });
  }, [movements]);

  // ---------- Dynamic Target (Adaptive Buffer) — basato sul Ledger ----------
  const dynamicTarget = useMemo<DynamicTarget>(() => {
    const now = new Date();

    // Baseline: media mensile dei movimenti ricorrenti negli ultimi 3 mesi completi.
    // Divide per il numero EFFETTIVO di mesi con dati (1-3) per evitare sottostime
    // quando lo storico è ancora corto.
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const recurringWindow = movements.filter(mv => {
      if (!mv.is_recurring || mv.type !== 'debit') return false;
      const d = new Date(mv.date);
      return d >= threeMonthsAgo && d < startOfCurrentMonth;
    });
    const monthsWithRecurring = new Set(
      recurringWindow.map(mv => {
        const d = new Date(mv.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    ).size;
    const recurringDivisor = Math.max(1, monthsWithRecurring);
    const totalRecurringExpenses = recurringWindow
      .filter(mv => mv.classification === 'personal')
      .reduce((s, mv) => s + mv.amount, 0) / recurringDivisor;
    const totalRecurringBusinessExpenses = recurringWindow
      .filter(mv => mv.classification === 'business')
      .reduce((s, mv) => s + mv.amount, 0) / recurringDivisor;
    const fixedBaseline = totalRecurringExpenses + totalRecurringBusinessExpenses;

    // Adaptive Buffer: media mensile spese non-ricorrenti negli ultimi 90gg.
    // Divide per il numero effettivo di mesi coperti da dati (1-3).
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
    const occasional = movements.filter(mv => {
      if (mv.type !== 'debit' || mv.is_recurring) return false;
      const d = new Date(mv.date);
      return d >= ninetyDaysAgo && d <= now;
    });
    const occasionalSum = occasional.reduce((s, mv) => s + mv.amount, 0);
    const monthsWithOccasional = new Set(
      occasional.map(mv => {
        const d = new Date(mv.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    ).size;
    const adaptiveBuffer = occasionalSum / Math.max(1, monthsWithOccasional);

    const activeGoal = lifeGoals.find(g => g.is_active);
    let monthlyGoalSaving = 0;
    let monthsUntilDeadline = 0;
    if (activeGoal) {
      const deadline = new Date(activeGoal.deadline);
      const diffMs = deadline.getTime() - now.getTime();
      monthsUntilDeadline = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
      const remaining = Math.max(0, activeGoal.total_target_amount - activeGoal.current_savings);
      monthlyGoalSaving = remaining / monthsUntilDeadline;
    }

    const totalNetNeeded = fixedBaseline + adaptiveBuffer + monthlyGoalSaving;
    const dynamicGrossTarget = totalNetNeeded / (1 - TAX_RATE);

    return {
      totalRecurringExpenses,
      totalRecurringBusinessExpenses,
      fixedBaseline,
      adaptiveBuffer,
      monthlyGoalSaving,
      totalNetNeeded,
      dynamicGrossTarget,
      monthsUntilDeadline,
    };
  }, [movements, lifeGoals]);

  const effectiveMonthlyTarget = dynamicTarget.dynamicGrossTarget > 0
    ? dynamicTarget.dynamicGrossTarget
    : monthlyTarget;

  // ---------- Financial Summary — basato sul Ledger ----------
  const financialSummary = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNum = month + 1;

    const ytdStart = new Date(
      Math.max(year, HISTORY_START_YEAR),
      year > HISTORY_START_YEAR ? 0 : HISTORY_START_MONTH,
      1
    );

    let gross_monthly = 0;
    let gross_ytd = 0;
    for (const mv of movements) {
      if (mv.type !== 'credit' || mv.classification !== 'business') continue;
      const d = new Date(mv.date);
      if (d < ytdStart) continue;
      if (d.getFullYear() !== year) continue;
      gross_ytd += mv.amount;
      if (d.getMonth() === month) gross_monthly += mv.amount;
    }

    const net_monthly = gross_monthly - (gross_monthly * TAX_RATE);
    const net_ytd = gross_ytd - (gross_ytd * TAX_RATE);

    return {
      gross_monthly,
      net_monthly,
      gross_ytd,
      net_ytd,
      monthly_target: effectiveMonthlyTarget,
      current_month_number: monthNum,
    };
  }, [movements, effectiveMonthlyTarget]);

  // ---------- Monthly Breakdown — basato sul Ledger ----------
  const monthlyBreakdown = useMemo<MonthlyBreakdown[]>(() => {
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    const months: MonthlyBreakdown[] = [];
    let y = HISTORY_START_YEAR;
    let m = HISTORY_START_MONTH;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const list = movementsInMonth(y, m);
      // Phase 28 waterfall:
      // Gross Revenue = Credit + Business
      // Business Expenses = Debit + Business
      // Personal Expenses = Debit + Personal
      // Personal Incomes = Credit + Personal
      const gross = list.filter(mv => mv.type === 'credit' && mv.classification === 'business').reduce((s, mv) => s + mv.amount, 0);
      const biz_expenses = list.filter(mv => mv.type === 'debit' && mv.classification === 'business').reduce((s, mv) => s + mv.amount, 0);
      const pers_expenses = list.filter(mv => mv.type === 'debit' && mv.classification === 'personal').reduce((s, mv) => s + mv.amount, 0);
      const pers_incomes = list.filter(mv => mv.type === 'credit' && mv.classification === 'personal').reduce((s, mv) => s + mv.amount, 0);
      const taxes = gross * TAX_RATE;
      const net_business = gross - taxes - biz_expenses;
      const free_cash_flow = net_business + pers_incomes - pers_expenses;
      const label = new Date(y, m, 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
      months.push({
        year: y, month: m, label,
        gross, taxes,
        business_expenses: biz_expenses,
        net_business,
        personal_expenses: pers_expenses,
        personal_incomes: pers_incomes,
        free_cash_flow,
        net: free_cash_flow,
      });
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
    return months;
  }, [movementsInMonth]);

  const value: CrmContextValue = {
    clients,
    isLoading,
    financials: {
      current_monthly_revenue,
      monthly_target: effectiveMonthlyTarget,
    },
    financialSummary,
    monthlyBreakdown,
    services,
    transactions,
    lifeGoals,
    dynamicTarget,
    addClient: async (c) => { await addMutation.mutateAsync(c); },
    updateClient: async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); },
    deleteClient: async (id) => { await deleteMutation.mutateAsync(id); },
    moveClient: async (id, stage) => { await moveMutation.mutateAsync({ id, stage }); },
    addRoiMetric: async (clientId, metric) => { await addRoiMutation.mutateAsync({ clientId, metric }); },
    removeRoiMetric: async (clientId, metricId) => { await removeRoiMutation.mutateAsync({ clientId, metricId }); },
    addTransaction: async (t) => { await addTransactionMutation.mutateAsync(t); },
    stopRecurringPayment: async (transactionId) => { await stopRecurringMutation.mutateAsync(transactionId); },
    markTransactionPaid: async (transactionId) => { await markPaidMutation.mutateAsync(transactionId); },
    updateTransaction: async (transactionId, updates) => { await updateTransactionMutation.mutateAsync({ id: transactionId, updates }); },
    deleteTransaction: async (transactionId) => { await deleteTransactionMutation.mutateAsync(transactionId); },
    addLifeGoal: async (g) => { await addGoalMutation.mutateAsync(g); },
    updateLifeGoal: async (id, patch) => { await updateGoalMutation.mutateAsync({ id, patch }); },
    deleteLifeGoal: async (id) => { await deleteGoalMutation.mutateAsync(id); },
    setMonthlyTarget,
    getRemainingDays: (clientId: string) => {
      const c = clients.find(cl => cl.id === clientId);
      if (!c?.training_end_date) return null;
      const end = new Date(c.training_end_date).getTime();
      const ms = end - Date.now();
      return Math.ceil(ms / (1000 * 60 * 60 * 24));
    },

    // ============ Phase 28: Unified Ledger ============
    bankAccounts,
    movements,
    unifiedCategories,
    addMovement: async (m) => { await addMovementMutation.mutateAsync(m); },
    updateMovement: async (id, patch) => { await updateMovementMutation.mutateAsync({ id, patch }); },
    deleteMovement: async (id) => { await deleteMovementMutation.mutateAsync(id); },
    setMovementClassification: async (id, classification) => {
      await updateMovementMutation.mutateAsync({ id, patch: { classification } });
    },
    toggleMovementReviewed: async (id, reviewed) => {
      await updateMovementMutation.mutateAsync({ id, patch: { is_reviewed: reviewed } });
    },
    importMovements: async (rows) => await importMovementsMutation.mutateAsync(rows),
    addUnifiedCategory: async (name, scope, kind) => await addUnifiedCategoryMutation.mutateAsync({ name, scope, kind }),
    updateUnifiedCategory: async (id, patch) => { await updateUnifiedCategoryMutation.mutateAsync({ id, patch }); },
    deleteUnifiedCategory: async (id) => { await deleteUnifiedCategoryMutation.mutateAsync(id); },
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
};
