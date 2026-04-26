import { useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import { formatEuro, TAX_RATE, LifeGoal } from '@/types/crm';
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
import { Plus, Trash2, Pencil, Target, TrendingUp, Sparkles, Upload } from 'lucide-react';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { toast } from 'sonner';
import { BankAccountCards } from '@/components/finance/BankAccountCards';
import { LedgerTable } from '@/components/finance/LedgerTable';
import { MovementImportDialog } from '@/components/finance/MovementImportDialog';

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

const FinancialOS = () => {
  const {
    lifeGoals, dynamicTarget,
    addLifeGoal, updateLifeGoal, deleteLifeGoal,
  } = useCrm();

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormState>(emptyGoal());

  const activeGoal = useMemo(() => lifeGoals.find(g => g.is_active), [lifeGoals]);
  const goalProgress = activeGoal
    ? Math.min(100, (activeGoal.current_savings / Math.max(1, activeGoal.total_target_amount)) * 100)
    : 0;

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
  const handleDeleteGoal = async (id: string) => {
    try { await deleteLifeGoal(id); toast.success('Obiettivo eliminato'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };

  // ============ Ledger state ============
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 md:px-0 pt-6 pb-24 md:pb-8 space-y-6 animate-fade-in">

      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Life · Finance OS</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro Finanziario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ledger unificato dei movimenti bancari · target dinamico calcolato sul tuo storico reale.
        </p>
      </header>

      {/* ============ Obiettivi di Vita ============ */}
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

      {/* ============ Dynamic Target Card ============ */}
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

      {/* ============ Ledger Toolbar ============ */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
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

      {/* ============ Math breakdown ============ */}
      <section className="rounded-3xl border border-dashed border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Come si calcola il target</h2>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
          <p>Spese personali ricorrenti (media 3 mesi): <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringExpenses)}</PrivacyMask></p>
          <p>+ Spese aziendali ricorrenti (media 3 mesi): <PrivacyMask>{formatEuro(dynamicTarget.totalRecurringBusinessExpenses)}</PrivacyMask></p>
          <p>+ Buffer adattivo (spese una tantum 90gg / 3): <PrivacyMask>{formatEuro(dynamicTarget.adaptiveBuffer)}</PrivacyMask></p>
          <p>+ Quota mensile per {activeGoal ? `"${activeGoal.title}"` : 'obiettivo attivo'}: <PrivacyMask>{formatEuro(dynamicTarget.monthlyGoalSaving)}</PrivacyMask></p>
          <p>= Netto necessario: <PrivacyMask>{formatEuro(dynamicTarget.totalNetNeeded)}</PrivacyMask></p>
          <p>÷ (1 − {Math.round(TAX_RATE * 100)}% tasse)</p>
          <p className="text-foreground font-bold pt-2 border-t border-border">
            = Lordo da fatturare: <PrivacyMask>{formatEuro(dynamicTarget.dynamicGrossTarget)}</PrivacyMask>
          </p>
        </div>
      </section>

      {/* ============ Waterfall legend ============ */}
      <section className="rounded-3xl border border-dashed border-border bg-secondary/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Waterfall: dal Lordo al Cash Flow Libero</h2>
        </div>
        <ol className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(160 84% 39%)' }} />
            <span><b className="text-foreground">Lordo</b> — entrate aziendali (Credit + Business).</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">−</span>
            <span><b className="text-foreground">Tasse ({Math.round(TAX_RATE * 100)}%)</b></span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(215 28% 45%)' }} />
            <span><b className="text-foreground">− Spese Aziendali</b> (Debit + Business)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(158 64% 52%)' }} />
            <span><b className="text-foreground">Utile Aziendale</b> — il vero profitto del business.</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">−</span>
            <span><b className="text-foreground">Spese Personali</b> (Debit + Personal)</span>
          </li>
          <li className="flex items-center gap-2 pl-3">
            <span className="text-muted-foreground">+</span>
            <span><b className="text-foreground">Ricavi Personali</b> (Credit + Personal)</span>
          </li>
          <li className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(221 83% 53%)' }} />
            <span><b className="text-foreground">Cash Flow Libero</b> — i soldi davvero in tasca.</span>
          </li>
        </ol>
      </section>

      {/* ============ Goal Dialog ============ */}
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

      <MovementImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default FinancialOS;
