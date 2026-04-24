import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Client, TAX_RATE, RoiMetric, LeadSource, PipelineStage,
  ChurnRisk, Gender, Transaction, PaymentType, PaymentMethod,
  Service, MonthlyBreakdown, HISTORY_START_YEAR, HISTORY_START_MONTH,
  PersonalExpense, LifeGoal, DynamicTarget, ExpenseCategory, PersonalIncome,
  BusinessExpense, BusinessExpenseCategory, IncomeCategory, RecurrenceType,
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

  const { data: personalExpenses = [] } = useQuery({
    queryKey: ['crm', 'personal_expenses'],
    queryFn: async (): Promise<PersonalExpense[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('personal_expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((r) => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        is_recurring: Boolean(r.is_recurring),
        recurrence_type: ((r.recurrence_type as RecurrenceType) ?? (r.is_recurring ? 'fixed_day' : 'none')),
        recurrence_value: r.recurrence_value ?? undefined,
        category: r.category,
        created_at: r.created_at,
        start_date: r.start_date ?? r.created_at,
        end_date: r.end_date ?? undefined,
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

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['crm', 'expense_categories'],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({ id: r.id, name: r.name, created_at: r.created_at }));
    },
  });

  const { data: businessExpenseCategories = [] } = useQuery({
    queryKey: ['crm', 'business_expense_categories'],
    queryFn: async (): Promise<BusinessExpenseCategory[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('business_expense_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({ id: r.id, name: r.name, created_at: r.created_at }));
    },
  });

  const { data: incomeCategories = [] } = useQuery({
    queryKey: ['crm', 'income_categories'],
    queryFn: async (): Promise<IncomeCategory[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('income_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({ id: r.id, name: r.name, created_at: r.created_at }));
    },
  });

  const { data: personalIncomes = [] } = useQuery({
    queryKey: ['crm', 'personal_incomes'],
    queryFn: async (): Promise<PersonalIncome[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('personal_incomes')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(r => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        date: r.date,
        category: r.category ?? 'Altro',
        created_at: r.created_at,
        recurrence_type: ((r.recurrence_type as RecurrenceType) ?? 'none'),
        recurrence_value: r.recurrence_value ?? undefined,
        end_date: r.end_date ?? undefined,
      }));
    },
  });

  const { data: businessExpenses = [] } = useQuery({
    queryKey: ['crm', 'business_expenses'],
    queryFn: async (): Promise<BusinessExpense[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('business_expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((r) => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        is_recurring: Boolean(r.is_recurring),
        recurrence_type: ((r.recurrence_type as RecurrenceType) ?? (r.is_recurring ? 'fixed_day' : 'none')),
        recurrence_value: r.recurrence_value ?? undefined,
        category: r.category,
        created_at: r.created_at,
        start_date: r.start_date ?? r.created_at,
        end_date: r.end_date ?? undefined,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_expenses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'personal_expenses'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'life_goals' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'life_goals'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'expense_categories'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_incomes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'personal_incomes'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_expenses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'business_expenses'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_expense_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'business_expense_categories'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'income_categories'] });
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
        gdpr_consent: c.gdpr_consent ?? false,
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
      const { roi_metrics, ...rest } = patch;
      const dbPatch: Record<string, unknown> = { ...rest };
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

      if (t.payment_type === 'A Rate' && t.installments_count > 1) {
        const n = t.installments_count;
        const cents = Math.round(totalAmount * 100);
        const baseCents = Math.floor(cents / n);
        const remainderCents = cents - baseCents * n;
        const rows = Array.from({ length: n }).map((_, i) => {
          const due = new Date(start);
          due.setDate(due.getDate() + 28 * i);
          const isFirst = i === 0;
          // Distribuiamo il resto sulle prime "remainderCents" rate per evitare perdite di centesimi
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
        const { error } = await sb.from('transactions').insert(rows);
        if (error) throw error;
      } else {
        const { error } = await sb.from('transactions').insert({
          client_id: t.client_id,
          amount: totalAmount,
          payment_type: t.payment_type,
          payment_method: t.payment_method ?? 'Stripe',
          installments_count: 1,
          payment_date: startIso,
          due_date: startIso,
          status: 'Saldato',
          recurring_active: t.payment_type === 'Ricorrente',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
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

  // ---------- Personal Expenses CRUD ----------
  const invalidateExpenses = () => queryClient.invalidateQueries({ queryKey: ['crm', 'personal_expenses'] });
  const addExpenseMutation = useMutation({
    mutationFn: async (e: Omit<PersonalExpense, 'id' | 'created_at'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('personal_expenses').insert({
        name: e.name,
        amount: e.amount,
        is_recurring: e.recurrence_type !== 'none',
        recurrence_type: e.recurrence_type,
        recurrence_value: e.recurrence_value ?? null,
        category: e.category,
        start_date: e.start_date,
        end_date: e.end_date ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidateExpenses,
  });
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PersonalExpense> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const { data: existing, error: fetchErr } = await sb
        .from('personal_expenses').select('*').eq('id', id).single();
      if (fetchErr) throw fetchErr;

      const wasRecurring = (existing?.recurrence_type ?? (existing?.is_recurring ? 'fixed_day' : 'none')) !== 'none';
      const newRecurrenceType = patch.recurrence_type ?? existing?.recurrence_type ?? (existing?.is_recurring ? 'fixed_day' : 'none');
      const newRecurrenceValue = patch.recurrence_value !== undefined ? patch.recurrence_value : existing?.recurrence_value;
      const amountChanged = patch.amount !== undefined && Number(patch.amount) !== Number(existing?.amount);
      const recurrenceChanged =
        (patch.recurrence_type !== undefined && patch.recurrence_type !== existing?.recurrence_type) ||
        (patch.recurrence_value !== undefined && patch.recurrence_value !== existing?.recurrence_value);

      // SCD Type 2: snapshot storico se cambia importo o pattern di una ricorrente
      if (wasRecurring && (amountChanged || recurrenceChanged)) {
        const todayIso = new Date().toISOString();
        const { error: closeErr } = await sb
          .from('personal_expenses').update({ end_date: todayIso }).eq('id', id);
        if (closeErr) throw closeErr;
        const { error: insertErr } = await sb.from('personal_expenses').insert({
          name: patch.name ?? existing.name,
          amount: patch.amount ?? existing.amount,
          is_recurring: newRecurrenceType !== 'none',
          recurrence_type: newRecurrenceType,
          recurrence_value: newRecurrenceValue ?? null,
          category: patch.category ?? existing.category,
          start_date: todayIso,
          end_date: null,
        });
        if (insertErr) throw insertErr;
        return;
      }

      const dbPatch: Record<string, unknown> = { ...patch };
      if (patch.recurrence_type !== undefined) dbPatch.is_recurring = patch.recurrence_type !== 'none';
      const { error } = await sb.from('personal_expenses').update(dbPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateExpenses,
  });
  const endExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('personal_expenses')
        .update({ end_date: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateExpenses,
  });
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('personal_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateExpenses,
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

  // ---------- Expense Categories CRUD ----------
  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: ['crm', 'expense_categories'] });
  const addCategoryMutation = useMutation({
    mutationFn: async (name: string): Promise<ExpenseCategory | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('expense_categories')
        .insert({ name: trimmed })
        .select()
        .single();
      if (error) {
        // Unique violation → ignora silenziosamente
        if ((error as { code?: string }).code === '23505') return null;
        throw error;
      }
      return data ? { id: data.id, name: data.name, created_at: data.created_at } : null;
    },
    onSuccess: invalidateCategories,
  });
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('expense_categories').update({ name: name.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateCategories,
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateCategories,
  });

  // ---------- Personal Incomes CRUD ----------
  const invalidateIncomes = () => queryClient.invalidateQueries({ queryKey: ['crm', 'personal_incomes'] });
  const addIncomeMutation = useMutation({
    mutationFn: async (i: Omit<PersonalIncome, 'id' | 'created_at'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('personal_incomes').insert({
        name: i.name,
        amount: i.amount,
        date: i.date,
        category: i.category,
      });
      if (error) throw error;
    },
    onSuccess: invalidateIncomes,
  });
  const updateIncomeMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PersonalIncome> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('personal_incomes').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateIncomes,
  });
  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('personal_incomes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateIncomes,
  });

  // ---------- Business Expenses CRUD (Copy-on-Write SCD Type 2) ----------
  const invalidateBizExpenses = () => queryClient.invalidateQueries({ queryKey: ['crm', 'business_expenses'] });
  const addBusinessExpenseMutation = useMutation({
    mutationFn: async (e: Omit<BusinessExpense, 'id' | 'created_at'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('business_expenses').insert({
        name: e.name,
        amount: e.amount,
        is_recurring: e.is_recurring,
        category: e.category,
        start_date: e.start_date,
        end_date: e.end_date ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidateBizExpenses,
  });
  const updateBusinessExpenseMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BusinessExpense> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: existing, error: fetchErr } = await sb
        .from('business_expenses').select('*').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const isRecurring = Boolean(existing?.is_recurring);
      const amountChanged =
        patch.amount !== undefined && Number(patch.amount) !== Number(existing?.amount);
      if (isRecurring && amountChanged) {
        const todayIso = new Date().toISOString();
        const { error: closeErr } = await sb
          .from('business_expenses').update({ end_date: todayIso }).eq('id', id);
        if (closeErr) throw closeErr;
        const { error: insertErr } = await sb.from('business_expenses').insert({
          name: patch.name ?? existing.name,
          amount: patch.amount,
          is_recurring: true,
          category: patch.category ?? existing.category,
          start_date: todayIso,
          end_date: null,
        });
        if (insertErr) throw insertErr;
        return;
      }
      const { error } = await sb.from('business_expenses').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateBizExpenses,
  });
  const endBusinessExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('business_expenses').update({ end_date: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateBizExpenses,
  });
  const deleteBusinessExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('business_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateBizExpenses,
  });

  // ---------- Business Expense Categories CRUD ----------
  const invalidateBizCategories = () => queryClient.invalidateQueries({ queryKey: ['crm', 'business_expense_categories'] });
  const addBizCategoryMutation = useMutation({
    mutationFn: async (name: string): Promise<BusinessExpenseCategory | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('business_expense_categories').insert({ name: trimmed }).select().single();
      if (error) {
        if ((error as { code?: string }).code === '23505') return null;
        throw error;
      }
      return data ? { id: data.id, name: data.name, created_at: data.created_at } : null;
    },
    onSuccess: invalidateBizCategories,
  });
  const updateBizCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('business_expense_categories').update({ name: name.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateBizCategories,
  });
  const deleteBizCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('business_expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateBizCategories,
  });

  // ---------- Income Categories CRUD ----------
  const invalidateIncomeCategories = () => queryClient.invalidateQueries({ queryKey: ['crm', 'income_categories'] });
  const addIncomeCategoryMutation = useMutation({
    mutationFn: async (name: string): Promise<IncomeCategory | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('income_categories').insert({ name: trimmed }).select().single();
      if (error) {
        if ((error as { code?: string }).code === '23505') return null;
        throw error;
      }
      return data ? { id: data.id, name: data.name, created_at: data.created_at } : null;
    },
    onSuccess: invalidateIncomeCategories,
  });
  const updateIncomeCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('income_categories').update({ name: name.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateIncomeCategories,
  });
  const deleteIncomeCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('income_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateIncomeCategories,
  });

  const current_monthly_revenue = useMemo(
    () => clients.filter(c => c.pipeline_stage === 'Closed Won').reduce((s, c) => s + (c.monthly_value || 0), 0),
    [clients]
  );

  // ---------- Dynamic Target ----------
  const dynamicTarget = useMemo<DynamicTarget>(() => {
    const now = new Date();
    const isActiveRecurringNow = (e: { is_recurring: boolean; start_date: string; end_date?: string; }) => {
      if (!e.is_recurring) return false;
      const start = new Date(e.start_date);
      if (start > now) return false;
      if (e.end_date && new Date(e.end_date) < now) return false;
      return true;
    };

    const totalRecurringExpenses = personalExpenses
      .filter(isActiveRecurringNow)
      .reduce((s, e) => s + e.amount, 0);

    const totalRecurringBusinessExpenses = businessExpenses
      .filter(isActiveRecurringNow)
      .reduce((s, e) => s + e.amount, 0);

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

    // Net necessario copre: spese personali ricorrenti + spese business ricorrenti + risparmio obiettivo
    const totalNetNeeded = totalRecurringExpenses + totalRecurringBusinessExpenses + monthlyGoalSaving;
    const dynamicGrossTarget = totalNetNeeded / (1 - TAX_RATE);

    return {
      totalRecurringExpenses,
      totalRecurringBusinessExpenses,
      monthlyGoalSaving,
      totalNetNeeded,
      dynamicGrossTarget,
      monthsUntilDeadline,
    };
  }, [personalExpenses, businessExpenses, lifeGoals]);

  // Il target mensile della Dashboard segue il target dinamico se >0, altrimenti fallback manuale
  const effectiveMonthlyTarget = dynamicTarget.dynamicGrossTarget > 0
    ? dynamicTarget.dynamicGrossTarget
    : monthlyTarget;

  const financialSummary = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNum = month + 1;

    // YTD: incassi dal 1° gennaio dell'anno corrente,
    // ma mai prima dello start storico (Gennaio 2026)
    const ytdStart = new Date(
      Math.max(year, HISTORY_START_YEAR),
      year > HISTORY_START_YEAR ? 0 : HISTORY_START_MONTH,
      1
    );

    let gross_monthly = 0;
    let gross_ytd = 0;
    for (const t of transactions) {
      if (t.status !== 'Saldato') continue;
      const d = new Date(t.payment_date);
      if (d < ytdStart) continue;
      if (d.getFullYear() !== year) continue;
      gross_ytd += t.amount;
      if (d.getMonth() === month) gross_monthly += t.amount;
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
  }, [transactions, effectiveMonthlyTarget]);

  // Storico mensile a partire da Gennaio 2026 fino al mese corrente.
  // Il NETTO sottrae per ogni mese: tasse, spese una tantum nel mese,
  // spese ricorrenti attive in quel mese.
  const monthlyBreakdown = useMemo<MonthlyBreakdown[]>(() => {
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    // Aggrega lordo per chiave "YYYY-M"
    const grossMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.status !== 'Saldato') continue;
      const d = new Date(t.payment_date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y < HISTORY_START_YEAR) continue;
      if (y === HISTORY_START_YEAR && m < HISTORY_START_MONTH) continue;
      const key = `${y}-${m}`;
      grossMap.set(key, (grossMap.get(key) ?? 0) + t.amount);
    }

    const sumMonthExpenses = (
      list: { is_recurring: boolean; start_date: string; end_date?: string; amount: number }[],
      y: number, m: number
    ): number => {
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
      let total = 0;
      for (const e of list) {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : null;
        if (e.is_recurring) {
          if (start <= monthEnd && (!end || end >= monthStart)) total += e.amount;
        } else {
          if (start >= monthStart && start <= monthEnd) total += e.amount;
        }
      }
      return total;
    };

    const monthIncomes = (y: number, m: number): number => {
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
      let total = 0;
      for (const i of personalIncomes) {
        const d = new Date(i.date);
        if (d >= monthStart && d <= monthEnd) total += i.amount;
      }
      return total;
    };

    const months: MonthlyBreakdown[] = [];
    let y = HISTORY_START_YEAR;
    let m = HISTORY_START_MONTH;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const gross = grossMap.get(`${y}-${m}`) ?? 0;
      const taxes = gross * TAX_RATE;
      const biz_expenses = sumMonthExpenses(businessExpenses, y, m);
      const net_business = gross - taxes - biz_expenses;
      const expenses = sumMonthExpenses(personalExpenses, y, m);
      const incomes = monthIncomes(y, m);
      const free_cash_flow = net_business + incomes - expenses;
      const label = new Date(y, m, 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
      months.push({
        year: y, month: m, label,
        gross, taxes,
        business_expenses: biz_expenses,
        net_business,
        personal_expenses: expenses,
        personal_incomes: incomes,
        free_cash_flow,
        net: free_cash_flow, // backward-compat
      });
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
    return months;
  }, [transactions, personalExpenses, personalIncomes, businessExpenses]);

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
    personalExpenses,
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
    addPersonalExpense: async (e) => { await addExpenseMutation.mutateAsync(e); },
    updatePersonalExpense: async (id, patch) => { await updateExpenseMutation.mutateAsync({ id, patch }); },
    deletePersonalExpense: async (id) => { await deleteExpenseMutation.mutateAsync(id); },
    endPersonalExpense: async (id) => { await endExpenseMutation.mutateAsync(id); },
    addLifeGoal: async (g) => { await addGoalMutation.mutateAsync(g); },
    updateLifeGoal: async (id, patch) => { await updateGoalMutation.mutateAsync({ id, patch }); },
    deleteLifeGoal: async (id) => { await deleteGoalMutation.mutateAsync(id); },
    expenseCategories,
    addExpenseCategory: async (name) => await addCategoryMutation.mutateAsync(name),
    updateExpenseCategory: async (id, name) => { await updateCategoryMutation.mutateAsync({ id, name }); },
    deleteExpenseCategory: async (id) => { await deleteCategoryMutation.mutateAsync(id); },
    personalIncomes,
    addPersonalIncome: async (i) => { await addIncomeMutation.mutateAsync(i); },
    updatePersonalIncome: async (id, patch) => { await updateIncomeMutation.mutateAsync({ id, patch }); },
    deletePersonalIncome: async (id) => { await deleteIncomeMutation.mutateAsync(id); },
    businessExpenses,
    addBusinessExpense: async (e) => { await addBusinessExpenseMutation.mutateAsync(e); },
    updateBusinessExpense: async (id, patch) => { await updateBusinessExpenseMutation.mutateAsync({ id, patch }); },
    deleteBusinessExpense: async (id) => { await deleteBusinessExpenseMutation.mutateAsync(id); },
    endBusinessExpense: async (id) => { await endBusinessExpenseMutation.mutateAsync(id); },
    businessExpenseCategories,
    addBusinessExpenseCategory: async (name) => await addBizCategoryMutation.mutateAsync(name),
    updateBusinessExpenseCategory: async (id, name) => { await updateBizCategoryMutation.mutateAsync({ id, name }); },
    deleteBusinessExpenseCategory: async (id) => { await deleteBizCategoryMutation.mutateAsync(id); },
    incomeCategories,
    addIncomeCategory: async (name) => await addIncomeCategoryMutation.mutateAsync(name),
    updateIncomeCategory: async (id, name) => { await updateIncomeCategoryMutation.mutateAsync({ id, name }); },
    deleteIncomeCategory: async (id) => { await deleteIncomeCategoryMutation.mutateAsync(id); },
    setMonthlyTarget,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
};
