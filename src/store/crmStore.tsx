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

const initialClients: Client[] = [
  {
    id: '1', name: 'Marco Rossi', lead_source: 'Gym Floor', pipeline_stage: 'Trial Active',
    root_motivator: 'Vuole sentirsi sicuro per il matrimonio a giugno',
    objection_stated: 'Troppo caro', objection_real: 'Teme di non riuscire a essere costante',
    created_at: daysAgo(12), stage_updated_at: daysAgo(3), monthly_value: 180, phone: '+39 333 123 4567',
  },
  {
    id: '2', name: 'Giulia Bianchi', lead_source: 'PT Pack 99€', pipeline_stage: 'Pitch Presented',
    root_motivator: 'Recuperare energia dopo la seconda gravidanza',
    objection_stated: 'Devo parlarne con mio marito', objection_real: 'Senso di colpa nello spendere per sé',
    created_at: daysAgo(20), stage_updated_at: daysAgo(2), monthly_value: 220,
  },
  {
    id: '3', name: 'Luca Ferrari', lead_source: 'Referral', pipeline_stage: 'Closed Won',
    root_motivator: 'Mal di schiena cronico che ostacola il lavoro da sviluppatore',
    objection_stated: '', objection_real: '',
    created_at: daysAgo(45), stage_updated_at: daysAgo(15), monthly_value: 240,
  },
  {
    id: '4', name: 'Sofia Russo', lead_source: 'Social Media', pipeline_stage: 'Nurturing',
    root_motivator: 'Vuole gareggiare nella sua prima gara di bikini fitness',
    objection_stated: 'Non ho tempo', objection_real: 'Intimorita dal livello richiesto',
    created_at: daysAgo(8), stage_updated_at: daysAgo(3),
  },
  {
    id: '5', name: 'Alessandro Conti', lead_source: 'Gym-provided', pipeline_stage: 'Lead Acquired',
    root_motivator: 'Il medico gli ha detto di perdere 15kg',
    objection_stated: '', objection_real: '',
    created_at: daysAgo(1), stage_updated_at: daysAgo(1),
  },
  {
    id: '6', name: 'Francesca Greco', lead_source: 'PT Pack 99€', pipeline_stage: 'Closed Won',
    root_motivator: 'Costruire forza dopo il divorzio, riappropriarsi del corpo',
    objection_stated: '', objection_real: '',
    created_at: daysAgo(45), stage_updated_at: daysAgo(30), monthly_value: 200,
  },
  {
    id: '7', name: 'Davide Marino', lead_source: 'Gym Floor', pipeline_stage: 'Closed Lost',
    root_motivator: 'Mettere massa per l\'estate',
    objection_stated: 'Troppo caro', objection_real: 'Non si fidava del valore — voleva consigli gratis',
    created_at: daysAgo(25), stage_updated_at: daysAgo(10),
  },
  {
    id: '8', name: 'Elena Romano', lead_source: 'Referral', pipeline_stage: 'Trial Active',
    root_motivator: 'Gestire lo stress della startup, dormire meglio',
    objection_stated: 'Voglio prima vedere risultati', objection_real: 'Bruciata da un trainer precedente',
    created_at: daysAgo(7), stage_updated_at: daysAgo(7),
  },
];

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
