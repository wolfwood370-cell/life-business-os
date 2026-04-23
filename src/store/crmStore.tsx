import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Client, FIXED_MONTHLY_COST, TAX_RATE, RoiMetric, LeadSource, PipelineStage,
  ChurnRisk, Gender, Transaction, PaymentType,
} from '@/types/crm';
import { CrmContext, CrmContextValue } from './crmContext';

// Re-export for back-compat with existing imports
export { useCrm, daysSince } from './useCrm';

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
  installments_count: number;
  payment_date: string;
  created_at: string;
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('transactions')
    .select('*')
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return (data as TransactionRow[]).map(r => ({
    id: r.id,
    client_id: r.client_id,
    amount: Number(r.amount),
    payment_type: r.payment_type as PaymentType,
    installments_count: r.installments_count,
    payment_date: r.payment_date,
    created_at: r.created_at,
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

  // Realtime subscription
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
    mutationFn: async (t: Omit<Transaction, 'id' | 'created_at' | 'payment_date'> & { payment_date?: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('transactions').insert({
        client_id: t.client_id,
        amount: t.amount,
        payment_type: t.payment_type,
        installments_count: t.installments_count,
        payment_date: t.payment_date ?? new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm', 'transactions'] }),
  });

  const current_monthly_revenue = useMemo(
    () => clients.filter(c => c.pipeline_stage === 'Closed Won').reduce((s, c) => s + (c.monthly_value || 0), 0),
    [clients]
  );

  const financialSummary = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNum = month + 1;

    let gross_monthly = 0;
    let gross_ytd = 0;
    for (const t of transactions) {
      const d = new Date(t.payment_date);
      if (d.getFullYear() !== year) continue;
      gross_ytd += t.amount;
      if (d.getMonth() === month) gross_monthly += t.amount;
    }

    const net_monthly = gross_monthly - (gross_monthly * TAX_RATE) - FIXED_MONTHLY_COST;
    const net_ytd = gross_ytd - (gross_ytd * TAX_RATE) - (FIXED_MONTHLY_COST * monthNum);

    return {
      gross_monthly,
      net_monthly,
      gross_ytd,
      net_ytd,
      fixed_monthly_cost: FIXED_MONTHLY_COST,
      monthly_target: monthlyTarget,
      current_month_number: monthNum,
    };
  }, [transactions, monthlyTarget]);

  const value: CrmContextValue = {
    clients,
    isLoading,
    financials: {
      fixed_monthly_cost: FIXED_MONTHLY_COST,
      current_monthly_revenue,
      monthly_target: monthlyTarget,
    },
    financialSummary,
    transactions,
    addClient: async (c) => { await addMutation.mutateAsync(c); },
    updateClient: async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); },
    moveClient: async (id, stage) => { await moveMutation.mutateAsync({ id, stage }); },
    addRoiMetric: async (clientId, metric) => { await addRoiMutation.mutateAsync({ clientId, metric }); },
    removeRoiMetric: async (clientId, metricId) => { await removeRoiMutation.mutateAsync({ clientId, metricId }); },
    addTransaction: async (t) => { await addTransactionMutation.mutateAsync(t); },
    setMonthlyTarget,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
};
