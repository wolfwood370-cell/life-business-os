import { createContext } from 'react';
import { Client, FinancialSummary, PipelineStage, RoiMetric, Transaction } from '@/types/crm';

export interface CrmContextValue {
  clients: Client[];
  isLoading: boolean;
  // Legacy summary kept for components ancora dipendenti (BreakEvenGauge)
  financials: {
    fixed_monthly_cost: number;
    current_monthly_revenue: number;
    monthly_target: number;
  };
  // Nuovo summary basato sulle transazioni reali
  financialSummary: FinancialSummary;
  transactions: Transaction[];
  addClient: (c: Omit<Client, 'id' | 'created_at' | 'stage_updated_at'>) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  moveClient: (id: string, stage: PipelineStage) => Promise<void>;
  addRoiMetric: (clientId: string, metric: Omit<RoiMetric, 'id' | 'date'>) => Promise<void>;
  removeRoiMetric: (clientId: string, metricId: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'payment_date' | 'status' | 'due_date'> & { payment_date?: string; total_amount?: number }) => Promise<void>;
  stopRecurringPayment: (transactionId: string) => Promise<void>;
  markTransactionPaid: (transactionId: string) => Promise<void>;
  setMonthlyTarget: (n: number) => void;
}

export const CrmContext = createContext<CrmContextValue | null>(null);
