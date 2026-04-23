import { createContext } from 'react';
import { Client, Financials, PipelineStage, RoiMetric } from '@/types/crm';

export interface CrmContextValue {
  clients: Client[];
  isLoading: boolean;
  financials: Financials;
  addClient: (c: Omit<Client, 'id' | 'created_at' | 'stage_updated_at'>) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  moveClient: (id: string, stage: PipelineStage) => Promise<void>;
  addRoiMetric: (clientId: string, metric: Omit<RoiMetric, 'id' | 'date'>) => Promise<void>;
  removeRoiMetric: (clientId: string, metricId: string) => Promise<void>;
  setMonthlyTarget: (n: number) => void;
}

export const CrmContext = createContext<CrmContextValue | null>(null);
