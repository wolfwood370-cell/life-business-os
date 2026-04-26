import { createContext } from 'react';
import {
  Client, FinancialSummary, MonthlyBreakdown, PipelineStage, RoiMetric,
  Service, Transaction, PersonalExpense, LifeGoal, DynamicTarget, ExpenseCategory,
  PersonalIncome, BusinessExpense, BusinessExpenseCategory, IncomeCategory,
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
  businessExpenses: BusinessExpense[];
  addBusinessExpense: (e: Omit<BusinessExpense, 'id' | 'created_at'>) => Promise<void>;
  updateBusinessExpense: (id: string, patch: Partial<BusinessExpense>) => Promise<void>;
  deleteBusinessExpense: (id: string) => Promise<void>;
  endBusinessExpense: (id: string) => Promise<void>;
  businessExpenseCategories: BusinessExpenseCategory[];
  addBusinessExpenseCategory: (name: string) => Promise<BusinessExpenseCategory | null>;
  updateBusinessExpenseCategory: (id: string, name: string) => Promise<void>;
  deleteBusinessExpenseCategory: (id: string) => Promise<void>;
  incomeCategories: IncomeCategory[];
  addIncomeCategory: (name: string) => Promise<IncomeCategory | null>;
  updateIncomeCategory: (id: string, name: string) => Promise<void>;
  deleteIncomeCategory: (id: string) => Promise<void>;
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
}

export const CrmContext = createContext<CrmContextValue | null>(null);
