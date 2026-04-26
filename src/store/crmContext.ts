import { createContext } from 'react';
import {
  Client, FinancialSummary, MonthlyBreakdown, PipelineStage, RoiMetric,
  Service, Transaction, LifeGoal, DynamicTarget,
  BankAccount, FinancialMovement, UnifiedCategory, MovementClassification,
} from '@/types/crm';

export interface CrmContextValue {
  clients: Client[];
  isLoading: boolean;
  financials: {
    current_monthly_revenue: number;
    monthly_target: number;
  };
  financialSummary: FinancialSummary;
  monthlyBreakdown: MonthlyBreakdown[];
  services: Service[];
  transactions: Transaction[];
  lifeGoals: LifeGoal[];
  dynamicTarget: DynamicTarget;
  addClient: (c: Omit<Client, 'id' | 'created_at' | 'stage_updated_at'>) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  moveClient: (id: string, stage: PipelineStage) => Promise<void>;
  addRoiMetric: (clientId: string, metric: Omit<RoiMetric, 'id' | 'date'>) => Promise<void>;
  removeRoiMetric: (clientId: string, metricId: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at' | 'payment_date' | 'status' | 'due_date'> & { payment_date?: string; total_amount?: number }) => Promise<void>;
  stopRecurringPayment: (transactionId: string) => Promise<void>;
  markTransactionPaid: (transactionId: string) => Promise<void>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addLifeGoal: (g: Omit<LifeGoal, 'id' | 'created_at'>) => Promise<void>;
  updateLifeGoal: (id: string, patch: Partial<LifeGoal>) => Promise<void>;
  deleteLifeGoal: (id: string) => Promise<void>;
  setMonthlyTarget: (n: number) => void;

  // ============ Phase 28: Unified Ledger ============
  bankAccounts: BankAccount[];
  movements: FinancialMovement[];
  unifiedCategories: UnifiedCategory[];
  addMovement: (m: Omit<FinancialMovement, 'id' | 'created_at'>) => Promise<void>;
  updateMovement: (id: string, patch: Partial<FinancialMovement>) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  setMovementClassification: (id: string, classification: MovementClassification) => Promise<void>;
  toggleMovementReviewed: (id: string, reviewed: boolean) => Promise<void>;
  importMovements: (movements: Array<Omit<FinancialMovement, 'id' | 'created_at' | 'source'>>) => Promise<number>;
  addUnifiedCategory: (name: string, scope: 'personal' | 'business' | 'both', kind: 'expense' | 'income' | 'both') => Promise<UnifiedCategory | null>;
  updateUnifiedCategory: (id: string, patch: Partial<UnifiedCategory>) => Promise<void>;
  deleteUnifiedCategory: (id: string) => Promise<void>;
}

export const CrmContext = createContext<CrmContextValue | null>(null);
