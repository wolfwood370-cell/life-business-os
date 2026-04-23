import { useMemo, useState, ReactNode } from 'react';
import { Client, FIXED_MONTHLY_COST } from '@/types/crm';
import { CrmContext, CrmContextValue } from './crmContext';

// Re-export for back-compat with existing imports
export { useCrm, daysSince } from './useCrm';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const initialClients: Client[] = [];

export const CrmProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [monthlyTarget, setMonthlyTarget] = useState(1500);

  const current_monthly_revenue = useMemo(
    () => clients.filter(c => c.pipeline_stage === 'Closed Won').reduce((s, c) => s + (c.monthly_value || 0), 0),
    [clients]
  );

  const addClient: CrmContextValue['addClient'] = (c) => {
    const now = new Date().toISOString();
    setClients(prev => [
      { ...c, id: crypto.randomUUID(), created_at: now, stage_updated_at: now },
      ...prev,
    ]);
  };

  const updateClient: CrmContextValue['updateClient'] = (id, patch) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const moveClient: CrmContextValue['moveClient'] = (id, stage) => {
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, pipeline_stage: stage, stage_updated_at: new Date().toISOString() } : c
    ));
  };

  const value: CrmContextValue = {
    clients,
    financials: {
      fixed_monthly_cost: FIXED_MONTHLY_COST,
      current_monthly_revenue,
      monthly_target: monthlyTarget,
    },
    addClient, updateClient, moveClient, setMonthlyTarget,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
};
