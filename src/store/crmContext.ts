import { createContext } from 'react';
import {
  Client, FinancialSummary, MonthlyBreakdown, PipelineStage, RoiMetric,
  Service, Transaction, PersonalExpense, LifeGoal, DynamicTarget, ExpenseCategory,
  PersonalIncome, BusinessExpense,
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
  personalExpenses: PersonalExpense[];
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
  addPersonalExpense: (e: Omit<PersonalExpense, 'id' | 'created_at'>) => Promise<void>;
  updatePersonalExpense: (id: string, patch: Partial<PersonalExpense>) => Promise<void>;
  deletePersonalExpense: (id: string) => Promise<void>;
  endPersonalExpense: (id: string) => Promise<void>;
  addLifeGoal: (g: Omit<LifeGoal, 'id' | 'created_at'>) => Promise<void>;
  updateLifeGoal: (id: string, patch: Partial<LifeGoal>) => Promise<void>;
  deleteLifeGoal: (id: string) => Promise<void>;
  expenseCategories: ExpenseCategory[];
  addExpenseCategory: (name: string) => Promise<ExpenseCategory | null>;
  updateExpenseCategory: (id: string, name: string) => Promise<void>;
  deleteExpenseCategory: (id: string) => Promise<void>;
  personalIncomes: PersonalIncome[];
  addPersonalIncome: (i: Omit<PersonalIncome, 'id' | 'created_at'>) => Promise<void>;
  updatePersonalIncome: (id: string, patch: Partial<PersonalIncome>) => Promise<void>;
  deletePersonalIncome: (id: string) => Promise<void>;
  setMonthlyTarget: (n: number) => void;
}

export const CrmContext = createContext<CrmContextValue | null>(null);
