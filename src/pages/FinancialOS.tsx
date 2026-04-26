import { useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import {
  formatEuro, TAX_RATE, PersonalExpense, LifeGoal, PersonalIncome, BusinessExpense,
  STANDARD_EXPENSE_CATEGORIES, STANDARD_INCOME_CATEGORIES, STANDARD_BUSINESS_EXPENSE_CATEGORIES,
  RecurrenceType, recurrenceTypeLabel,
} from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Trash2, Pencil, Target, Wallet, TrendingUp, Sparkles, Ban, Settings2, Check, X, ArrowDownToLine, Briefcase, ChevronDown, BookOpen, Upload } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { toast } from 'sonner';
import { todayIso, dateInputToIso } from '@/lib/date';
import { BankAccountCards } from '@/components/finance/BankAccountCards';
import { LedgerTable } from '@/components/finance/LedgerTable';
import { MovementImportDialog } from '@/components/finance/MovementImportDialog';

const NEW_CATEGORY_SENTINEL = '__new__';

interface ExpenseFormState {
  id?: string;
  name: string;
  amount: string;
  recurrence_type: RecurrenceType;
  recurrence_value: string;
  category: string;
  start_date: string;
}

const emptyExpense = (): ExpenseFormState => ({
  name: '', amount: '', recurrence_type: 'fixed_day', recurrence_value: '1',
  category: 'Altro', start_date: todayIso(),
});

interface GoalFormState {
  id?: string;
  title: string;
  total_target_amount: string;
  current_savings: string;
  deadline: string;
  is_active: boolean;
}

const emptyGoal = (): GoalFormState => ({
  title: '', total_target_amount: '', current_savings: '0',
  deadline: '', is_active: true,
});

interface IncomeFormState {
  id?: string;
  name: string;
  amount: string;
  date: string;
  category: string;
  recurrence_type: RecurrenceType;
  recurrence_value: string;
}

const emptyIncome = (): IncomeFormState => ({
  name: '', amount: '', date: todayIso(), category: 'Altro',
  recurrence_type: 'none', recurrence_value: '',
});

interface BizExpenseFormState {
  id?: string;
  name: string;
  amount: string;
  recurrence_type: RecurrenceType;
  recurrence_value: string;
  category: string;
  start_date: string;
}
const emptyBizExpense = (): BizExpenseFormState => ({
  name: '', amount: '', recurrence_type: 'fixed_day', recurrence_value: '1',
  category: 'Software', start_date: todayIso(),
});

const FinancialOS = () => {
  const {
    personalExpenses, lifeGoals, dynamicTarget,
    addPersonalExpense, updatePersonalExpense, deletePersonalExpense, endPersonalExpense,
    addLifeGoal, updateLifeGoal, deleteLifeGoal,
    expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
    personalIncomes, addPersonalIncome, updatePersonalIncome, deletePersonalIncome,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense, endBusinessExpense,
    businessExpenseCategories, addBusinessExpenseCategory, updateBusinessExpenseCategory, deleteBusinessExpenseCategory,
    incomeCategories: incomeCategoriesCustom, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory,
  } = useCrm();

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpense());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormState>(emptyGoal());
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'personal' | 'business' | 'income'>('personal');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState<IncomeFormState>(emptyIncome());
  const [newIncomeCategoryName, setNewIncomeCategoryName] = useState('');
  const [bizOpen, setBizOpen] = useState(false);
  const [bizForm, setBizForm] = useState<BizExpenseFormState>(emptyBizExpense());
  const [newBizCategoryName, setNewBizCategoryName] = useState('');
  const [openBizCats, setOpenBizCats] = useState<Record<string, boolean>>({});
  const [openPersCats, setOpenPersCats] = useState<Record<string, boolean>>({});
  const [openIncomeCats, setOpenIncomeCats] = useState<Record<string, boolean>>({});

  const groupBy = <T extends { category: string }>(items: T[]): Array<[string, T[]]> => {
    const map = new Map<string, T[]>();
    for (const it of items) {
      const k = it.category || 'Altro';
      const arr = map.get(k) ?? [];
      arr.push(it);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'it'));
  };
  const groupedBiz = useMemo(() => groupBy(businessExpenses), [businessExpenses]);
  const groupedPers = useMemo(() => groupBy(personalExpenses), [personalExpenses]);
  const groupedIncomes = useMemo(() => groupBy(personalIncomes), [personalIncomes]);
  const sumAmount = <T extends { amount: number }>(items: T[]) => items.reduce((s, x) => s + (x.amount || 0), 0);

  // Unione categorie standard + custom (deduplicate case-insensitive)
  const allCategoryNames = useMemo(() => {
    const set = new Map<string, string>();
    STANDARD_EXPENSE_CATEGORIES.forEach(c => set.set(c.toLowerCase(), c));
    expenseCategories.forEach(c => {
      if (!set.has(c.name.toLowerCase())) set.set(c.name.toLowerCase(), c.name);
    });
    return Array.from(set.values());
  }, [expenseCategories]);

  const allBizCategoryNames = useMemo(() => {
    const set = new Map<string, string>();
    STANDARD_BUSINESS_EXPENSE_CATEGORIES.forEach(c => set.set(c.toLowerCase(), c));
    businessExpenseCategories.forEach(c => {
      if (!set.has(c.name.toLowerCase())) set.set(c.name.toLowerCase(), c.name);
    });
    return Array.from(set.values());
  }, [businessExpenseCategories]);

  const allIncomeCategoryNames = useMemo(() => {
    const set = new Map<string, string>();
    STANDARD_INCOME_CATEGORIES.forEach(c => set.set(c.toLowerCase(), c));
    incomeCategoriesCustom.forEach(c => {
      if (!set.has(c.name.toLowerCase())) set.set(c.name.toLowerCase(), c.name);
    });
    return Array.from(set.values());
  }, [incomeCategoriesCustom]);

  const activeGoal = useMemo(() => lifeGoals.find(g => g.is_active), [lifeGoals]);
  const goalProgress = activeGoal
    ? Math.min(100, (activeGoal.current_savings / Math.max(1, activeGoal.total_target_amount)) * 100)
    : 0;

  const openNewExpense = () => { setExpenseForm(emptyExpense()); setNewCategoryName(''); setExpenseOpen(true); };
  const openEditExpense = (e: PersonalExpense) => {
    setExpenseForm({
      id: e.id, name: e.name, amount: String(e.amount),
      recurrence_type: e.recurrence_type ?? (e.is_recurring ? 'fixed_day' : 'none'),
      recurrence_value: e.recurrence_value != null ? String(e.recurrence_value) : '1',
      category: e.category,
      start_date: e.start_date ? e.start_date.slice(0, 10) : todayIso(),
    });
    setNewCategoryName('');
    setExpenseOpen(true);
  };
  const parseRecValue = (rt: RecurrenceType, rv: string): number | undefined => {
    if (rt === 'none') return undefined;
    const n = parseInt(rv, 10);
    if (!Number.isFinite(n)) return undefined;
    if (rt === 'fixed_day') return Math.min(31, Math.max(1, n));
    return Math.max(1, n);
  };
  const submitExpense = async () => {
    const amount = Number(expenseForm.amount.replace(',', '.'));
    if (!expenseForm.name.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error('Inserisci nome e importo validi'); return;
    }
    if (!expenseForm.start_date) { toast.error('Seleziona la data della spesa'); return; }
    const recValue = parseRecValue(expenseForm.recurrence_type, expenseForm.recurrence_value);
    if (expenseForm.recurrence_type !== 'none' && recValue === undefined) {
      toast.error('Inserisci un valore valido per la ricorrenza'); return;
    }
    let finalCategory = expenseForm.category;
    if (expenseForm.category === NEW_CATEGORY_SENTINEL) {
      const trimmed = newCategoryName.trim();
      if (!trimmed) { toast.error('Inserisci il nome della nuova categoria'); return; }
      finalCategory = trimmed;
      const exists = allCategoryNames.some(n => n.toLowerCase() === trimmed.toLowerCase());
      if (!exists) { try { await addExpenseCategory(trimmed); } catch { /* silent */ } }
    }
    const startIso = dateInputToIso(expenseForm.start_date) ?? new Date().toISOString();
    const isRec = expenseForm.recurrence_type !== 'none';
    try {
      if (expenseForm.id) {
        await updatePersonalExpense(expenseForm.id, {
          name: expenseForm.name.trim(), amount,
          is_recurring: isRec,
          recurrence_type: expenseForm.recurrence_type,
          recurrence_value: recValue,
          category: finalCategory, start_date: startIso,
        });
        toast.success('Spesa aggiornata');
      } else {
        await addPersonalExpense({
          name: expenseForm.name.trim(), amount,
          is_recurring: isRec,
          recurrence_type: expenseForm.recurrence_type,
          recurrence_value: recValue,
          category: finalCategory, start_date: startIso,
        });
        toast.success('Spesa aggiunta');
      }
      setExpenseOpen(false);
    } catch {
      toast.error('Errore durante il salvataggio');
    }
  };

  const openNewGoal = () => { setGoalForm(emptyGoal()); setGoalOpen(true); };
  const openEditGoal = (g: LifeGoal) => {
    setGoalForm({
      id: g.id, title: g.title,
      total_target_amount: String(g.total_target_amount),
      current_savings: String(g.current_savings),
      deadline: g.deadline,
      is_active: g.is_active,
    });
    setGoalOpen(true);
  };
  const submitGoal = async () => {
    const target = Number(goalForm.total_target_amount.replace(',', '.'));
    const savings = Number(goalForm.current_savings.replace(',', '.'));
    const safeSavings = Number.isFinite(savings) && savings >= 0 ? savings : 0;
    if (!goalForm.title.trim() || !goalForm.deadline || !Number.isFinite(target) || target <= 0) {
      toast.error('Compila titolo, importo e scadenza');
      return;
    }
    if (safeSavings > target) {
      toast.error('I risparmi attuali non possono superare l\'importo totale');
      return;
    }
    const deadlineDate = new Date(goalForm.deadline);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      toast.error('La scadenza deve essere nel futuro');
      return;
    }
    // Auto-attiva se è il primo obiettivo o se nessuno è attivo (escludendo questo in edit)
    const otherActive = lifeGoals.some(g => g.is_active && g.id !== goalForm.id);
    const finalActive = goalForm.is_active || !otherActive;
    try {
      if (goalForm.id) {
        await updateLifeGoal(goalForm.id, {
          title: goalForm.title.trim(),
          total_target_amount: target,
          current_savings: safeSavings,
          deadline: goalForm.deadline,
          is_active: finalActive,
        });
        toast.success('Obiettivo aggiornato');
      } else {
        await addLifeGoal({
          title: goalForm.title.trim(),
          total_target_amount: target,
          current_savings: safeSavings,
          deadline: goalForm.deadline,
          is_active: finalActive,
        });
        toast.success('Obiettivo creato');
      }
      setGoalOpen(false);
    } catch {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try { await deletePersonalExpense(id); toast.success('Spesa eliminata'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };
  const handleEndExpense = async (id: string) => {
    try { await endPersonalExpense(id); toast.success('Spesa ricorrente terminata'); }
    catch { toast.error('Errore nell\'interruzione'); }
  };
  const handleDeleteGoal = async (id: string) => {
    try { await deleteLifeGoal(id); toast.success('Obiettivo eliminato'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };

  // ---------- Personal Incomes ----------
  const monthlyIncomesTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(); const m = now.getMonth();
    return personalIncomes
      .filter(i => { const d = new Date(i.date); return d.getFullYear() === y && d.getMonth() === m; })
      .reduce((s, i) => s + i.amount, 0);
  }, [personalIncomes]);

  const openNewIncome = () => { setIncomeForm(emptyIncome()); setNewIncomeCategoryName(''); setIncomeOpen(true); };
  const openEditIncome = (i: PersonalIncome) => {
    setIncomeForm({
      id: i.id, name: i.name, amount: String(i.amount),
      date: i.date ? i.date.slice(0, 10) : todayIso(),
      category: i.category || 'Altro',
      recurrence_type: i.recurrence_type ?? 'none',
      recurrence_value: i.recurrence_value != null ? String(i.recurrence_value) : '',
    });
    setNewIncomeCategoryName('');
    setIncomeOpen(true);
  };
  const submitIncome = async () => {
    const amount = Number(incomeForm.amount.replace(',', '.'));
    if (!incomeForm.name.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Inserisci nome e importo validi'); return;
    }
    if (!incomeForm.date) { toast.error('Seleziona la data'); return; }
    const recValue = parseRecValue(incomeForm.recurrence_type, incomeForm.recurrence_value);
    if (incomeForm.recurrence_type !== 'none' && recValue === undefined) {
      toast.error('Inserisci un valore valido per la ricorrenza'); return;
    }
    let finalCategory = incomeForm.category;
    if (incomeForm.category === NEW_CATEGORY_SENTINEL) {
      const trimmed = newIncomeCategoryName.trim();
      if (!trimmed) { toast.error('Inserisci il nome della nuova categoria'); return; }
      finalCategory = trimmed;
      const exists = allIncomeCategoryNames.some(n => n.toLowerCase() === trimmed.toLowerCase());
      if (!exists) { try { await addIncomeCategory(trimmed); } catch { /* silent */ } }
    }
    const dateIso = dateInputToIso(incomeForm.date) ?? new Date().toISOString();
    const payload = {
      name: incomeForm.name.trim(), amount, date: dateIso, category: finalCategory,
      recurrence_type: incomeForm.recurrence_type, recurrence_value: recValue,
    };
    try {
      if (incomeForm.id) {
        await updatePersonalIncome(incomeForm.id, payload);
        toast.success('Ricavo aggiornato');
      } else {
        await addPersonalIncome(payload);
        toast.success('Ricavo aggiunto');
      }
      setIncomeOpen(false);
    } catch { toast.error('Errore durante il salvataggio'); }
  };
  const handleDeleteIncome = async (id: string) => {
    try { await deletePersonalIncome(id); toast.success('Ricavo eliminato'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };

  // ---------- Business Expenses ----------
  const openNewBiz = () => { setBizForm(emptyBizExpense()); setNewBizCategoryName(''); setBizOpen(true); };
  const openEditBiz = (e: BusinessExpense) => {
    setBizForm({
      id: e.id, name: e.name, amount: String(e.amount),
      recurrence_type: e.recurrence_type ?? (e.is_recurring ? 'fixed_day' : 'none'),
      recurrence_value: e.recurrence_value != null ? String(e.recurrence_value) : '1',
      category: e.category,
      start_date: e.start_date ? e.start_date.slice(0, 10) : todayIso(),
    });
    setNewBizCategoryName('');
    setBizOpen(true);
  };
  const submitBiz = async () => {
    const amount = Number(bizForm.amount.replace(',', '.'));
    if (!bizForm.name.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error('Inserisci nome e importo validi'); return;
    }
    if (!bizForm.start_date) { toast.error('Seleziona la data'); return; }
    const recValue = parseRecValue(bizForm.recurrence_type, bizForm.recurrence_value);
    if (bizForm.recurrence_type !== 'none' && recValue === undefined) {
      toast.error('Inserisci un valore valido per la ricorrenza'); return;
    }
    let finalCategory = bizForm.category;
    if (bizForm.category === NEW_CATEGORY_SENTINEL) {
      const trimmed = newBizCategoryName.trim();
      if (!trimmed) { toast.error('Inserisci il nome della nuova categoria'); return; }
      finalCategory = trimmed;
      const exists = allBizCategoryNames.some(n => n.toLowerCase() === trimmed.toLowerCase());
      if (!exists) { try { await addBusinessExpenseCategory(trimmed); } catch { /* silent */ } }
    }
    const startIso = dateInputToIso(bizForm.start_date) ?? new Date().toISOString();
    const isRec = bizForm.recurrence_type !== 'none';
    const payload = {
      name: bizForm.name.trim(), amount,
      is_recurring: isRec,
      recurrence_type: bizForm.recurrence_type,
      recurrence_value: recValue,
      category: finalCategory, start_date: startIso,
    };
    try {
      if (bizForm.id) {
        await updateBusinessExpense(bizForm.id, payload);
        toast.success('Spesa aziendale aggiornata');
      } else {
        await addBusinessExpense(payload);
        toast.success('Spesa aziendale aggiunta');
      }
      setBizOpen(false);
    } catch { toast.error('Errore durante il salvataggio'); }
  };
  const handleDeleteBiz = async (id: string) => {
    try { await deleteBusinessExpense(id); toast.success('Spesa eliminata'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };
  const handleEndBiz = async (id: string) => {
    try { await endBusinessExpense(id); toast.success('Spesa ricorrente terminata'); }
    catch { toast.error('Errore nell\'interruzione'); }
  };

  // ============ Phase 28: Ledger state ============
  const now = new Date();
  const [ledgerYear, setLedgerYear] = useState(now.getFullYear());
  const [ledgerMonth, setLedgerMonth] = useState(now.getMonth());
  const [importOpen, setImportOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    let y = 2026, m = 0;
    const ny = now.getFullYear(), nm = now.getMonth();
    while (y < ny || (y === ny && m <= nm)) {
      opts.push({
        value: `${y}-${m}`,
        label: new Date(y, m, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
      });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return opts.reverse();
  }, [now]);

  return (
    <div className="px-4 md:px-0 pt-6 pb-24 md:pb-8 space-y-6 animate-fade-in">

      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Life · Finance OS</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro Finanziario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestisci movimenti bancari, categorizza spese e monitora il tuo target dinamico.
        </p>
      </header>

      <Tabs defaultValue="ledger" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ledger" className="gap-2">
            <BookOpen className="h-3.5 w-3.5" /> Ledger
          </TabsTrigger>
          <TabsTrigger value="classic" className="gap-2">
            <Target className="h-3.5 w-3.5" /> Vista Classica
          </TabsTrigger>
        </TabsList>

        {/* ============ LEDGER TAB ============ */}
        <TabsContent value="ledger" className="space-y-5 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={`${ledgerYear}-${ledgerMonth}`}
              onValueChange={(v) => {
                const [y, m] = v.split('-').map(Number);
                setLedgerYear(y); setLedgerMonth(m);
              }}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(o => (
                  <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setImportOpen(true)} className="gap-2 h-9 ml-auto">
              <Upload className="h-3.5 w-3.5" /> Importa CSV
            </Button>
          </div>

          <BankAccountCards year={ledgerYear} month={ledgerMonth} />
          <LedgerTable year={ledgerYear} month={ledgerMonth} />
        </TabsContent>

        {/* ============ CLASSIC TAB ============ */}
        <TabsContent value="classic" className="space-y-6 mt-2">

      {/* Visual Target Card */}
      <div className="relative overflow-hidden rounded-3xl gradient-card border border-primary/30 p-6 shadow-card">
        <div className="absolute inset-0 gradient-emerald-glow pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Fatturato Lordo Mensile da Generare</p>
          </div>
          <p className="mt-2 text-5xl font-bold tracking-tight text-foreground">
            <PrivacyMask>{formatEuro(dynamicTarget.dynamicGrossTarget)}</PrivacyMask>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Per ottenere <PrivacyMask>{formatEuro(dynamicTarget.totalNetNeeded)}</PrivacyMask> netti dopo {Math.round(TAX_RATE * 100)}% di tasse.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-card/60 border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spese Personali</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringExpenses)}</PrivacyMask>
              </p>
            </div>
            <div className="rounded-xl bg-card/60 border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spese Aziendali</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringBusinessExpenses)}</PrivacyMask>
              </p>
            </div>
            <div className="rounded-xl bg-card/60 border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risparmio Obiettivo</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                <PrivacyMask>{formatEuro(dynamicTarget.monthlyGoalSaving)}</PrivacyMask>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Life Goal */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Obiettivo di Vita</h2>
          </div>
          <Button size="sm" variant="outline" onClick={openNewGoal} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" />
            Nuovo
          </Button>
        </div>

        {activeGoal ? (
          <div className="mt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-foreground">{activeGoal.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scadenza: {new Date(activeGoal.deadline).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}
                  {dynamicTarget.monthsUntilDeadline} mesi rimanenti
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditGoal(activeGoal)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteGoal(activeGoal.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-bold text-foreground">
                  <PrivacyMask>{formatEuro(activeGoal.current_savings)}</PrivacyMask> / <PrivacyMask>{formatEuro(activeGoal.total_target_amount)}</PrivacyMask>
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full gradient-primary transition-smooth"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <p className="text-xs text-primary font-semibold">
                Devi risparmiare <PrivacyMask>{formatEuro(dynamicTarget.monthlyGoalSaving)}</PrivacyMask>/mese
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Nessun obiettivo attivo. Crea il tuo primo obiettivo di risparmio per attivare il calcolo dinamico del Lordo Suggerito.</p>
        )}

        {/* Inactive goals */}
        {lifeGoals.filter(g => !g.is_active).length > 0 && (
          <div className="mt-5 pt-4 border-t border-border space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Altri obiettivi</p>
            {lifeGoals.filter(g => !g.is_active).map(g => (
              <div key={g.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Scadenza: {new Date(g.deadline).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await updateLifeGoal(g.id, { is_active: true });
                          toast.success('Obiettivo attivato');
                        } catch { toast.error('Errore durante l\'attivazione'); }
                      }}
                    >
                      Attiva
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditGoal(g)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteGoal(g.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span><PrivacyMask>{formatEuro(g.current_savings)}</PrivacyMask> / <PrivacyMask>{formatEuro(g.total_target_amount)}</PrivacyMask></span>
                  <span>{Math.min(100, Math.round((g.current_savings / Math.max(1, g.total_target_amount)) * 100))}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Business Expenses */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" style={{ color: 'hsl(215 28% 45%)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Spese Aziendali</h2>
          </div>
          <Button size="sm" variant="outline" onClick={openNewBiz} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" />
            Aggiungi
          </Button>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground">Totale ricorrenti / mese</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(215 28% 35%)' }}>
            <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringBusinessExpenses)}</PrivacyMask>
          </p>
        </div>

        {businessExpenses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aggiungi i costi del business (affitto studio, marketing, software, attrezzatura...) per separare il vero utile aziendale dal tuo cash flow personale.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {groupedBiz.map(([cat, items]) => {
              const isOpen = openBizCats[cat] ?? false;
              const catTotal = sumAmount(items.filter(x => !x.end_date));
              return (
                <Collapsible key={cat} open={isOpen} onOpenChange={(o) => setOpenBizCats(s => ({ ...s, [cat]: o }))}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-semibold text-foreground truncate">{cat}</span>
                      <span className="text-[11px] text-muted-foreground">({items.length})</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      <PrivacyMask>{formatEuro(catTotal)}</PrivacyMask>
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-2 divide-y divide-border border-l border-border pl-3">
                      {items.map(e => {
                        const ended = !!e.end_date;
                        const startLabel = e.start_date ? new Date(e.start_date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : '—';
                        const endLabel = e.end_date ? new Date(e.end_date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : null;
                        return (
                          <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {e.name}
                                {ended && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">· terminata</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {e.is_recurring ? `Ricorrente da ${startLabel}${endLabel ? ` a ${endLabel}` : ''}` : `Una tantum · ${startLabel}`}
                              </p>
                            </div>
                            <p className={`text-sm font-bold tabular-nums ${e.is_recurring && !ended ? 'text-foreground' : 'text-muted-foreground'}`}>
                              <PrivacyMask>{formatEuro(e.amount)}</PrivacyMask>
                            </p>
                            <div className="flex gap-1">
                              {e.is_recurring && !ended && (
                                <Button size="icon" variant="ghost" onClick={() => handleEndBiz(e.id)} title="Termina spesa ricorrente">
                                  <Ban className="h-4 w-4 text-warning" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => openEditBiz(e)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteBiz(e.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </section>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Spese Personali</h2>
          </div>
          <Button size="sm" variant="outline" onClick={openNewExpense} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" />
            Aggiungi
          </Button>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground">Totale ricorrenti / mese</p>
          <p className="text-2xl font-bold text-foreground">
            <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringExpenses)}</PrivacyMask>
          </p>
        </div>

        {personalExpenses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aggiungi le tue spese fisse (Netflix, affitto, abbonamenti...) per calcolare il target reale.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {groupedPers.map(([cat, items]) => {
              const isOpen = openPersCats[cat] ?? false;
              const catTotal = sumAmount(items.filter(x => !x.end_date));
              return (
                <Collapsible key={cat} open={isOpen} onOpenChange={(o) => setOpenPersCats(s => ({ ...s, [cat]: o }))}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-semibold text-foreground truncate">{cat}</span>
                      <span className="text-[11px] text-muted-foreground">({items.length})</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      <PrivacyMask>{formatEuro(catTotal)}</PrivacyMask>
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-2 divide-y divide-border border-l border-border pl-3">
                      {items.map(e => {
                        const ended = !!e.end_date;
                        const startLabel = e.start_date ? new Date(e.start_date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : '—';
                        const endLabel = e.end_date ? new Date(e.end_date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : null;
                        return (
                          <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {e.name}
                                {ended && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">· terminata</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {e.is_recurring ? `Ricorrente da ${startLabel}${endLabel ? ` a ${endLabel}` : ''}` : `Una tantum · ${startLabel}`}
                              </p>
                            </div>
                            <p className={`text-sm font-bold tabular-nums ${e.is_recurring && !ended ? 'text-foreground' : 'text-muted-foreground'}`}>
                              <PrivacyMask>{formatEuro(e.amount)}</PrivacyMask>
                            </p>
                            <div className="flex gap-1">
                              {e.is_recurring && !ended && (
                                <Button size="icon" variant="ghost" onClick={() => handleEndExpense(e.id)} title="Termina spesa ricorrente">
                                  <Ban className="h-4 w-4 text-warning" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => openEditExpense(e)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteExpense(e.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </section>

      {/* Personal Incomes */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ricavi Personali</h2>
          </div>
          <Button size="sm" variant="outline" onClick={openNewIncome} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" />
            Aggiungi
          </Button>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground">Totale del mese corrente</p>
          <p className="text-2xl font-bold text-foreground">
            <PrivacyMask>{formatEuro(monthlyIncomesTotal)}</PrivacyMask>
          </p>
        </div>

        {personalIncomes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aggiungi entrate non legate al business (es. regali, consulti extra, rimborsi). Verranno sommate al Cash Flow nei mesi storici.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {groupedIncomes.map(([cat, items]) => {
              const isOpen = openIncomeCats[cat] ?? false;
              const catTotal = sumAmount(items);
              return (
                <Collapsible key={cat} open={isOpen} onOpenChange={(o) => setOpenIncomeCats(s => ({ ...s, [cat]: o }))}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-semibold text-foreground truncate">{cat}</span>
                      <span className="text-[11px] text-muted-foreground">({items.length})</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      +<PrivacyMask>{formatEuro(catTotal)}</PrivacyMask>
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 ml-2 divide-y divide-border border-l border-border pl-3">
                      {items.map(i => {
                        const dateLabel = new Date(i.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
                        return (
                          <li key={i.id} className="py-2 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{i.name}</p>
                              <p className="text-[11px] text-muted-foreground">{dateLabel}</p>
                            </div>
                            <p className="text-sm font-bold tabular-nums text-foreground">
                              +<PrivacyMask>{formatEuro(i.amount)}</PrivacyMask>
                            </p>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditIncome(i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteIncome(i.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </section>

      {/* Math breakdown — Target dinamico */}
      <section className="rounded-3xl border border-dashed border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Come si calcola il target</h2>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
          <p>Spese personali ricorrenti: <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringExpenses)}</PrivacyMask></p>
          <p>+ Spese aziendali ricorrenti: <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringBusinessExpenses)}</PrivacyMask></p>
          <p>+ Quota mensile per {activeGoal ? `"${activeGoal.title}"` : 'obiettivo attivo'}: <PrivacyMask>{formatEuro(dynamicTarget.monthlyGoalSaving)}</PrivacyMask></p>
          <p>= Netto necessario: <PrivacyMask>{formatEuro(dynamicTarget.totalNetNeeded)}</PrivacyMask></p>
          <p>÷ (1 − {Math.round(TAX_RATE * 100)}% tasse)</p>
          <p className="text-foreground font-bold pt-2 border-t border-border">
            = Lordo da fatturare: <PrivacyMask>{formatEuro(dynamicTarget.dynamicGrossTarget)}</PrivacyMask>
          </p>
        </div>
      </section>

      {/* Waterfall legend */}
      <section className="rounded-3xl border border-dashed border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Waterfall: dal Lordo al Cash Flow Libero</h2>
        </div>
        <ol className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(160 84% 39%)' }} />
            <span><b className="text-foreground">Lordo</b> — incassi business (Saldato).</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">−</span>
            <span><b className="text-foreground">Tasse ({Math.round(TAX_RATE * 100)}%)</b></span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(215 28% 45%)' }} />
            <span><b className="text-foreground">− Spese Aziendali</b> (affitto studio, marketing, software…)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(158 64% 52%)' }} />
            <span><b className="text-foreground">Utile Aziendale</b> — il vero profitto del business.</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">−</span>
            <span><b className="text-foreground">Spese Personali</b> (ricorrenti + una tantum del mese)</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">+</span>
            <span><b className="text-foreground">Ricavi Personali</b> (regali, extra, rimborsi)</span>
          </li>
          <li className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(221 83% 53%)' }} />
            <span><b className="text-foreground">Cash Flow Libero</b> — i soldi davvero in tasca.</span>
          </li>
        </ol>
      </section>


      {/* Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{expenseForm.id ? 'Modifica spesa' : 'Nuova spesa personale'}</DialogTitle>
            <DialogDescription>Inserisci nome, importo e categoria. Attiva la ricorrenza per le spese mensili.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="exp-name">Nome</Label>
              <Input
                id="exp-name"
                placeholder="es. Netflix, Affitto casa"
                value={expenseForm.name}
                onChange={e => setExpenseForm(s => ({ ...s, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp-amount">Importo (€)</Label>
                <Input
                  id="exp-amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(s => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exp-cat">Categoria</Label>
                  <button
                    type="button"
                    onClick={() => { setManageTab('personal'); setManageCategoriesOpen(true); }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Settings2 className="h-3 w-3" /> Gestisci
                  </button>
                </div>
                <Select
                  value={expenseForm.category}
                  onValueChange={v => setExpenseForm(s => ({ ...s, category: v }))}
                >
                  <SelectTrigger id="exp-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategoryNames.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY_SENTINEL}>+ Altro...</SelectItem>
                  </SelectContent>
                </Select>
                {expenseForm.category === NEW_CATEGORY_SENTINEL && (
                  <Input
                    className="mt-2"
                    placeholder="Nome nuova categoria"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-3">
              <div>
                <Label>Ricorrenza</Label>
                <Select
                  value={expenseForm.recurrence_type}
                  onValueChange={(v: RecurrenceType) => setExpenseForm(s => ({ ...s, recurrence_type: v, recurrence_value: v === 'fixed_day' ? '1' : v === 'interval_days' ? '30' : '' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Una tantum</SelectItem>
                    <SelectItem value="fixed_day">Giorno fisso del mese</SelectItem>
                    <SelectItem value="interval_days">Ogni N giorni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {expenseForm.recurrence_type === 'fixed_day' && (
                <div>
                  <Label htmlFor="exp-rec-day">Giorno del mese (1-31)</Label>
                  <Input id="exp-rec-day" type="number" min={1} max={31}
                    value={expenseForm.recurrence_value}
                    onChange={e => setExpenseForm(s => ({ ...s, recurrence_value: e.target.value }))}
                  />
                </div>
              )}
              {expenseForm.recurrence_type === 'interval_days' && (
                <div>
                  <Label htmlFor="exp-rec-int">Intervallo in giorni</Label>
                  <Input id="exp-rec-int" type="number" min={1}
                    value={expenseForm.recurrence_value}
                    onChange={e => setExpenseForm(s => ({ ...s, recurrence_value: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="exp-start">
                {expenseForm.recurrence_type !== 'none' ? 'Data di inizio' : 'Data della spesa'}
              </Label>
              <Input
                id="exp-start"
                type="date"
                value={expenseForm.start_date}
                onChange={e => setExpenseForm(s => ({ ...s, start_date: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {expenseForm.recurrence_type !== 'none'
                  ? 'Da questa data la spesa rientra nel calcolo dei mesi storici.'
                  : 'La spesa verrà conteggiata solo nel mese selezionato.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExpenseOpen(false)}>Annulla</Button>
            <Button onClick={submitExpense} className="gradient-primary text-primary-foreground">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{goalForm.id ? 'Modifica obiettivo' : 'Nuovo obiettivo di vita'}</DialogTitle>
            <DialogDescription>Definisci il traguardo e la scadenza per calcolare il risparmio mensile necessario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="goal-title">Titolo</Label>
              <Input
                id="goal-title"
                placeholder="es. Acquisto casa, Viaggio, Fondo emergenza"
                value={goalForm.title}
                onChange={e => setGoalForm(s => ({ ...s, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="goal-target">Importo totale (€)</Label>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  placeholder="20000"
                  value={goalForm.total_target_amount}
                  onChange={e => setGoalForm(s => ({ ...s, total_target_amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-savings">Già risparmiati (€)</Label>
                <Input
                  id="goal-savings"
                  inputMode="decimal"
                  placeholder="0"
                  value={goalForm.current_savings}
                  onChange={e => setGoalForm(s => ({ ...s, current_savings: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="goal-deadline">Scadenza</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={goalForm.deadline}
                onChange={e => setGoalForm(s => ({ ...s, deadline: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-semibold">Obiettivo attivo</p>
                <p className="text-xs text-muted-foreground">Solo uno alla volta entra nel target</p>
              </div>
              <Switch
                checked={goalForm.is_active}
                onCheckedChange={v => setGoalForm(s => ({ ...s, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>Annulla</Button>
            <Button onClick={submitGoal} className="gradient-primary text-primary-foreground">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestisci Categorie</DialogTitle>
            <DialogDescription>
              Aggiungi, rinomina o elimina le categorie personalizzate. Le categorie standard non sono modificabili.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={manageTab} onValueChange={(v) => { setManageTab(v as 'personal' | 'business' | 'income'); setEditingCategoryId(null); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Spese Personali</TabsTrigger>
              <TabsTrigger value="business">Spese Aziendali</TabsTrigger>
              <TabsTrigger value="income">Entrate Extra</TabsTrigger>
            </TabsList>

            {([
              {
                key: 'personal' as const,
                standard: STANDARD_EXPENSE_CATEGORIES as readonly string[],
                custom: expenseCategories,
                update: updateExpenseCategory,
                remove: deleteExpenseCategory,
              },
              {
                key: 'business' as const,
                standard: STANDARD_BUSINESS_EXPENSE_CATEGORIES as readonly string[],
                custom: businessExpenseCategories,
                update: updateBusinessExpenseCategory,
                remove: deleteBusinessExpenseCategory,
              },
              {
                key: 'income' as const,
                standard: STANDARD_INCOME_CATEGORIES as readonly string[],
                custom: incomeCategoriesCustom,
                update: updateIncomeCategory,
                remove: deleteIncomeCategory,
              },
            ]).map(tab => (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4 mt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Standard</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tab.standard.map(c => (
                      <span key={c} className="text-xs rounded-full bg-secondary text-secondary-foreground px-2.5 py-1">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Personalizzate</p>
                  {tab.custom.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nessuna categoria personalizzata. Verranno create automaticamente quando aggiungi un elemento con "+ Altro...".
                    </p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {tab.custom.map(c => {
                        const isEditing = editingCategoryId === c.id;
                        return (
                          <li key={c.id} className="flex items-center gap-2 p-2.5">
                            {isEditing ? (
                              <>
                                <Input
                                  value={editingCategoryName}
                                  onChange={e => setEditingCategoryName(e.target.value)}
                                  className="h-9"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={async () => {
                                    const trimmed = editingCategoryName.trim();
                                    if (!trimmed) { toast.error('Nome non valido'); return; }
                                    try {
                                      await tab.update(c.id, trimmed);
                                      toast.success('Categoria rinominata');
                                      setEditingCategoryId(null);
                                    } catch { toast.error('Errore durante la modifica'); }
                                  }}
                                >
                                  <Check className="h-4 w-4 text-primary" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingCategoryId(null)}>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm font-medium text-foreground truncate">{c.name}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => { setEditingCategoryId(c.id); setEditingCategoryName(c.name); }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                      await tab.remove(c.id);
                                      toast.success('Categoria eliminata');
                                    } catch { toast.error('Errore durante l\'eliminazione'); }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setManageCategoriesOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Income Dialog */}
      <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{incomeForm.id ? 'Modifica ricavo' : 'Nuovo ricavo personale'}</DialogTitle>
            <DialogDescription>Registra entrate non aziendali (regali, consulti extra) per il calcolo del Cash Flow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="inc-name">Nome</Label>
              <Input
                id="inc-name"
                placeholder="es. Regalo compleanno, Consulto extra"
                value={incomeForm.name}
                onChange={e => setIncomeForm(s => ({ ...s, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="inc-amount">Importo (€)</Label>
                <Input
                  id="inc-amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={incomeForm.amount}
                  onChange={e => setIncomeForm(s => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inc-cat">Categoria</Label>
                  <button
                    type="button"
                    onClick={() => { setManageTab('income'); setManageCategoriesOpen(true); }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Settings2 className="h-3 w-3" /> Gestisci
                  </button>
                </div>
                <Select
                  value={incomeForm.category}
                  onValueChange={v => setIncomeForm(s => ({ ...s, category: v }))}
                >
                  <SelectTrigger id="inc-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allIncomeCategoryNames.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY_SENTINEL}>+ Altro...</SelectItem>
                  </SelectContent>
                </Select>
                {incomeForm.category === NEW_CATEGORY_SENTINEL && (
                  <Input
                    className="mt-2"
                    placeholder="Nome nuova categoria"
                    value={newIncomeCategoryName}
                    onChange={e => setNewIncomeCategoryName(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="inc-date">Data</Label>
              <Input
                id="inc-date"
                type="date"
                value={incomeForm.date}
                onChange={e => setIncomeForm(s => ({ ...s, date: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Il ricavo verrà sommato al Cash Flow del mese selezionato.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIncomeOpen(false)}>Annulla</Button>
            <Button onClick={submitIncome} className="gradient-primary text-primary-foreground">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Expense Dialog */}
      <Dialog open={bizOpen} onOpenChange={setBizOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{bizForm.id ? 'Modifica spesa aziendale' : 'Nuova spesa aziendale'}</DialogTitle>
            <DialogDescription>Costi della tua attività (affitto studio, software, marketing). Sottratti dal lordo prima dell'utile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="biz-name">Nome</Label>
              <Input
                id="biz-name"
                placeholder="es. Affitto studio, Meta Ads"
                value={bizForm.name}
                onChange={e => setBizForm(s => ({ ...s, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="biz-amount">Importo (€)</Label>
                <Input
                  id="biz-amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={bizForm.amount}
                  onChange={e => setBizForm(s => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="biz-cat">Categoria</Label>
                  <button
                    type="button"
                    onClick={() => { setManageTab('business'); setManageCategoriesOpen(true); }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Settings2 className="h-3 w-3" /> Gestisci
                  </button>
                </div>
                <Select
                  value={bizForm.category}
                  onValueChange={v => setBizForm(s => ({ ...s, category: v }))}
                >
                  <SelectTrigger id="biz-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allBizCategoryNames.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY_SENTINEL}>+ Altro...</SelectItem>
                  </SelectContent>
                </Select>
                {bizForm.category === NEW_CATEGORY_SENTINEL && (
                  <Input
                    className="mt-2"
                    placeholder="Nome nuova categoria"
                    value={newBizCategoryName}
                    onChange={e => setNewBizCategoryName(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-3">
              <div>
                <Label>Ricorrenza</Label>
                <Select
                  value={bizForm.recurrence_type}
                  onValueChange={(v: RecurrenceType) => setBizForm(s => ({ ...s, recurrence_type: v, recurrence_value: v === 'fixed_day' ? '1' : v === 'interval_days' ? '30' : '' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Una tantum</SelectItem>
                    <SelectItem value="fixed_day">Giorno fisso del mese</SelectItem>
                    <SelectItem value="interval_days">Ogni N giorni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bizForm.recurrence_type === 'fixed_day' && (
                <div>
                  <Label htmlFor="biz-rec-day">Giorno del mese (1-31)</Label>
                  <Input id="biz-rec-day" type="number" min={1} max={31}
                    value={bizForm.recurrence_value}
                    onChange={e => setBizForm(s => ({ ...s, recurrence_value: e.target.value }))}
                  />
                </div>
              )}
              {bizForm.recurrence_type === 'interval_days' && (
                <div>
                  <Label htmlFor="biz-rec-int">Intervallo in giorni</Label>
                  <Input id="biz-rec-int" type="number" min={1}
                    value={bizForm.recurrence_value}
                    onChange={e => setBizForm(s => ({ ...s, recurrence_value: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="biz-start">{bizForm.recurrence_type !== 'none' ? 'Data di inizio' : 'Data della spesa'}</Label>
              <Input
                id="biz-start"
                type="date"
                value={bizForm.start_date}
                onChange={e => setBizForm(s => ({ ...s, start_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBizOpen(false)}>Annulla</Button>
            <Button onClick={submitBiz} className="gradient-primary text-primary-foreground">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>

      <MovementImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default FinancialOS;
