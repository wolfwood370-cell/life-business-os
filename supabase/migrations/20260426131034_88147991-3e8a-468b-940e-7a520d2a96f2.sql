-- Phase 29: Drop legacy tables now superseded by financial_movements
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.business_expenses CASCADE;
DROP TABLE IF EXISTS public.personal_incomes CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.business_expense_categories CASCADE;
DROP TABLE IF EXISTS public.income_categories CASCADE;