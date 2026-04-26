import { forwardRef, useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import { TAX_RATE } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit, TrendingUp, TrendingDown, Target as TargetIcon,
  Users, Wallet, AlertTriangle, Sparkles, Activity, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatEuro = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const WINDOW_DAYS = 90;

export default function FinanceCoach() {
  const { movements, unifiedCategories, lifeGoals, clients, isLoading } = useCrm();
  const activeGoal = useMemo(() => lifeGoals.find(g => g.is_active), [lifeGoals]);

  // ============ Historical Snapshot (90 giorni) ============
  const snapshot = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
    const recent = movements.filter(m => new Date(m.date) >= cutoff);
    const monthsInWindow = WINDOW_DAYS / 30;

    const businessCredits = recent.filter(m => m.type === 'credit' && m.classification === 'business');
    const businessDebits = recent.filter(m => m.type === 'debit' && m.classification === 'business');
    const personalCredits = recent.filter(m => m.type === 'credit' && m.classification === 'personal');
    const personalDebits = recent.filter(m => m.type === 'debit' && m.classification === 'personal');

    const sum = (arr: typeof recent) => arr.reduce((a, b) => a + Number(b.amount), 0);
    const grossRevenue = sum(businessCredits);
    const businessExpenses = sum(businessDebits);
    const personalIncomes = sum(personalCredits);
    const personalExpenses = sum(personalDebits);

    const avgMonthlyGross = grossRevenue / monthsInWindow;
    const lifestyleBurnRate = personalExpenses / monthsInWindow;
    const netBusiness = grossRevenue * (1 - TAX_RATE) - businessExpenses;
    const freeCashFlow = netBusiness + personalIncomes - personalExpenses;

    // CRM metrics last 90d
    const recentClients = clients.filter(c => new Date(c.stage_updated_at) >= cutoff);
    const pitched = recentClients.filter(c =>
      ['Pitch Presented', 'Closed Won', 'Closed Lost'].includes(c.pipeline_stage)
    );
    const closedWon = recentClients.filter(c => c.pipeline_stage === 'Closed Won');
    const winRate = pitched.length > 0 ? closedWon.length / pitched.length : 0;
    const avgTicket = closedWon.length > 0
      ? closedWon.reduce((a, c) => a + (c.monthly_value ?? 0), 0) / closedWon.length
      : 0;

    const activeClients = clients.filter(c =>
      ['Trial Active', 'Closed Won', 'Pitch Presented'].includes(c.pipeline_stage)
    );
    const pipelineVolume = clients
      .filter(c => !['Closed Lost', 'Closed Won'].includes(c.pipeline_stage))
      .reduce((a, c) => a + (c.monthly_value ?? 0), 0);

    // Top categories
    const catMap = new Map(unifiedCategories.map(c => [c.id, c.name]));
    const aggregate = (arr: typeof recent) => {
      const m = new Map<string, number>();
      arr.forEach(mv => {
        const name = mv.category_id ? catMap.get(mv.category_id) ?? 'Senza categoria' : 'Senza categoria';
        m.set(name, (m.get(name) ?? 0) + Number(mv.amount));
      });
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));
    };

    // Service mix (what's actually selling)
    const serviceMixMap = new Map<string, { count: number; revenue: number }>();
    businessCredits.forEach(mv => {
      const key = mv.service_sold?.trim();
      if (!key) return;
      const cur = serviceMixMap.get(key) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(mv.amount);
      serviceMixMap.set(key, cur);
    });
    const serviceMix = [...serviceMixMap.entries()]
      .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      avgMonthlyGross, lifestyleBurnRate, winRate, avgTicket,
      grossRevenue, businessExpenses, personalIncomes, personalExpenses,
      netBusiness, freeCashFlow, pitchedCount: pitched.length,
      closedWonCount: closedWon.length, activeClients: activeClients.length,
      pipelineVolume,
      topPersonalCategories: aggregate(personalDebits),
      topBusinessCategories: aggregate(businessDebits),
      serviceMix,
    };
  }, [movements, clients, unifiedCategories]);

  // ============ Adaptive Simulator ============
  // Real days left to deadline (read-only, derived from goal)
  const realDaysLeft = useMemo(() => {
    if (!activeGoal) return 180;
    const ms = new Date(activeGoal.deadline).getTime() - Date.now();
    return Math.max(30, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [activeGoal]);

  // Simulated days — initialised ONCE from real days; user controls it freely.
  // We reset only when the active goal id changes (different goal = different baseline).
  const [simulatedDays, setSimulatedDays] = useState<number>(() => realDaysLeft);
  const [lastGoalId, setLastGoalId] = useState<string | undefined>(activeGoal?.id);
  if (activeGoal?.id !== lastGoalId) {
    setLastGoalId(activeGoal?.id);
    setSimulatedDays(realDaysLeft);
  }
  const daysToDeadline = simulatedDays;
  const setDaysToDeadline = setSimulatedDays;

  const sim = useMemo(() => {
    const monthsLeft = Math.max(0.5, daysToDeadline / 30);
    const remaining = activeGoal
      ? Math.max(0, Number(activeGoal.total_target_amount) - Number(activeGoal.current_savings))
      : 0;
    const goalSavingPerMonth = remaining / monthsLeft;
    const requiredMonthlyNet = goalSavingPerMonth + snapshot.lifestyleBurnRate;
    const requiredMonthlyGross = requiredMonthlyNet / (1 - TAX_RATE);
    const requiredClientsPerMonth = snapshot.avgTicket > 0
      ? requiredMonthlyGross / snapshot.avgTicket
      : 0;
    const requiredLeadsPerMonth = snapshot.winRate > 0
      ? requiredClientsPerMonth / snapshot.winRate
      : 0;
    // unrealistic if would require closing too high % of pitches
    // approximate "implied win rate needed" if user could only pitch as many as historic
    const historicMonthlyPitched = snapshot.pitchedCount / 3; // 3 months
    const impliedWinRate = historicMonthlyPitched > 0
      ? requiredClientsPerMonth / historicMonthlyPitched
      : 1;
    const isUnrealistic = impliedWinRate > 0.8;
    return {
      monthsLeft, goalSavingPerMonth, requiredMonthlyNet, requiredMonthlyGross,
      requiredClientsPerMonth, requiredLeadsPerMonth, impliedWinRate, isUnrealistic,
    };
  }, [daysToDeadline, activeGoal, snapshot]);

  // ============ AI Briefing ============
  const [briefing, setBriefing] = useState<string>('');
  const [briefingLoading, setBriefingLoading] = useState(false);

  const generateBriefing = async () => {
    setBriefingLoading(true);
    setBriefing('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-global-cfo', {
        body: {
          windowDays: WINDOW_DAYS,
          ledger: {
            grossRevenue: snapshot.grossRevenue,
            businessExpenses: snapshot.businessExpenses,
            personalExpenses: snapshot.personalExpenses,
            personalIncomes: snapshot.personalIncomes,
            netBusiness: snapshot.netBusiness,
            freeCashFlow: snapshot.freeCashFlow,
            topPersonalCategories: snapshot.topPersonalCategories,
            topBusinessCategories: snapshot.topBusinessCategories,
            serviceMix: snapshot.serviceMix,
          },
          goal: activeGoal ? {
            title: activeGoal.title,
            target: Number(activeGoal.total_target_amount),
            current: Number(activeGoal.current_savings),
            deadline: activeGoal.deadline,
            monthsLeft: Math.round(sim.monthsLeft),
          } : null,
          crm: {
            winRate: snapshot.winRate,
            pitchedCount: snapshot.pitchedCount,
            closedWon: snapshot.closedWonCount,
            avgTicket: snapshot.avgTicket,
            pipelineVolume: snapshot.pipelineVolume,
            activeClients: snapshot.activeClients,
          },
          derived: {
            requiredMonthlyNet: sim.requiredMonthlyNet,
            requiredMonthlyGross: sim.requiredMonthlyGross,
            requiredClientsPerMonth: sim.requiredClientsPerMonth,
            requiredLeadsPerMonth: sim.requiredLeadsPerMonth,
          },
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setBriefing((data as any)?.briefing ?? '');
      toast.success('Briefing generato');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore generazione briefing');
    } finally {
      setBriefingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <BrainCircuit className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orizzonte Strategico</h1>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
            Intelligenza Finanziaria Adattiva — ultimi {WINDOW_DAYS} giorni
          </p>
        </div>
      </div>

      {/* Financial DNA */}
      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Financial DNA
          </CardTitle>
          <CardDescription className="text-xs">Snapshot storico — base di calcolo del simulatore</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DnaMetric icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            label="Lordo medio mensile" value={<PrivacyMask>{formatEuro(snapshot.avgMonthlyGross)}</PrivacyMask>} />
          <DnaMetric icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
            label="Lifestyle Burn Rate" value={<PrivacyMask>{formatEuro(snapshot.lifestyleBurnRate)}</PrivacyMask>} />
          <DnaMetric icon={<TargetIcon className="h-4 w-4 text-primary" />}
            label="Win Rate" value={formatPct(snapshot.winRate)}
            sub={`${snapshot.closedWonCount}/${snapshot.pitchedCount} pitch`} />
          <DnaMetric icon={<Wallet className="h-4 w-4 text-amber-500" />}
            label="Ticket medio" value={<PrivacyMask>{formatEuro(snapshot.avgTicket)}</PrivacyMask>} />
        </CardContent>
      </Card>

      {/* Simulator */}
      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Simulatore di Strategia
          </CardTitle>
          <CardDescription className="text-xs">
            {activeGoal
              ? <>Obiettivo attivo: <b className="text-foreground">{activeGoal.title}</b> — Target {formatEuro(Number(activeGoal.total_target_amount))} (di cui salvati {formatEuro(Number(activeGoal.current_savings))})</>
              : 'Nessun obiettivo attivo. Imposta un Life Goal nel Finance Hub per attivare il simulatore.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Giorni alla scadenza
              </label>
              <span className="text-sm font-mono font-bold tabular-nums">
                {daysToDeadline} giorni · {sim.monthsLeft.toFixed(1)} mesi
              </span>
            </div>
            <Slider
              min={30}
              max={1095}
              step={15}
              value={[daysToDeadline]}
              onValueChange={(v) => setDaysToDeadline(v[0])}
              disabled={!activeGoal}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>1 mese</span><span>1 anno</span><span>3 anni</span>
            </div>
            {activeGoal && simulatedDays !== realDaysLeft && (
              <button
                type="button"
                onClick={() => setSimulatedDays(realDaysLeft)}
                className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-primary hover:underline"
              >
                Reset a scadenza reale ({realDaysLeft} giorni)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SimMetric
              label="Nuovo Target Netto/Mese"
              value={<PrivacyMask>{formatEuro(sim.requiredMonthlyNet)}</PrivacyMask>}
              hint={`Risparmio ${formatEuro(sim.goalSavingPerMonth)} + Lifestyle ${formatEuro(snapshot.lifestyleBurnRate)}`}
            />
            <SimMetric
              label="Lordo Necessario/Mese"
              value={<PrivacyMask>{formatEuro(sim.requiredMonthlyGross)}</PrivacyMask>}
              hint={`Tasse incluse (${formatPct(TAX_RATE)})`}
            />
            <SimMetric
              label="Clienti da chiudere/mese"
              value={sim.requiredClientsPerMonth.toFixed(1)}
              hint={snapshot.avgTicket > 0 ? `Su ticket medio ${formatEuro(snapshot.avgTicket)}` : 'Nessun ticket medio storico'}
              danger={sim.isUnrealistic}
            />
            <SimMetric
              label="Nuovi Lead Necessari/mese"
              value={sim.requiredLeadsPerMonth > 0 ? sim.requiredLeadsPerMonth.toFixed(1) : '—'}
              hint={snapshot.winRate > 0 ? `Win rate attuale ${formatPct(snapshot.winRate)}` : 'Nessuno storico di chiusure'}
              danger={sim.isUnrealistic}
            />
          </div>

          {sim.isUnrealistic && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm">
              <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-rose-600 dark:text-rose-400">Obiettivo irrealistico al ritmo attuale</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per chiudere {sim.requiredClientsPerMonth.toFixed(1)} clienti/mese serviresti un win rate implicito del {formatPct(sim.impliedWinRate)} sul tuo volume di pitch attuale. Considera: (a) tagliare le spese personali, (b) aumentare i prezzi, (c) estendere la deadline.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Briefing */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Briefing Strategico AI
              </CardTitle>
              <CardDescription className="text-xs">CFO autonomo — diagnosi, vendita, spese</CardDescription>
            </div>
            <Button
              onClick={generateBriefing}
              disabled={briefingLoading}
              className="gradient-primary text-primary-foreground font-semibold shadow-glow"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {briefingLoading ? 'Analizzo...' : 'Genera Briefing Strategico'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {briefingLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          )}
          {!briefingLoading && briefing && (
            <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h3:text-primary prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-wider">
              <ReactMarkdown>{briefing}</ReactMarkdown>
            </article>
          )}
          {!briefingLoading && !briefing && (
            <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
              <BrainCircuit className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Premi <b>Genera Briefing</b> per ricevere la tua analisi strategica personalizzata</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContextCard icon={<Users className="h-4 w-4" />} title="Pipeline volume"
          value={<PrivacyMask>{formatEuro(snapshot.pipelineVolume)}</PrivacyMask>}
          sub={`${snapshot.activeClients} clienti attivi`} />
        <ContextCard icon={<Wallet className="h-4 w-4" />} title="Free Cash Flow (90d)"
          value={<PrivacyMask>{formatEuro(snapshot.freeCashFlow)}</PrivacyMask>}
          sub="Netto business + personale" />
        <ContextCard icon={<TrendingDown className="h-4 w-4" />} title="Spese personali (90d)"
          value={<PrivacyMask>{formatEuro(snapshot.personalExpenses)}</PrivacyMask>}
          sub={`Top: ${snapshot.topPersonalCategories[0]?.name ?? '—'}`} />
      </div>
    </div>
  );
}

const DnaMetric = forwardRef<
  HTMLDivElement,
  { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }
>(({ icon, label, value, sub }, ref) => (
  <div ref={ref} className="space-y-1">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
      {icon}{label}
    </div>
    <div className="text-xl md:text-2xl font-bold tabular-nums">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
));
DnaMetric.displayName = 'DnaMetric';

const SimMetric = forwardRef<
  HTMLDivElement,
  { label: string; value: React.ReactNode; hint?: string; danger?: boolean }
>(({ label, value, hint, danger }, ref) => (
  <div
    ref={ref}
    className={cn(
      'p-4 rounded-xl border bg-background/40',
      danger ? 'border-rose-500/40 bg-rose-500/5' : 'border-border/60'
    )}
  >
    <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
    <div className={cn(
      'text-2xl md:text-3xl font-bold tabular-nums mt-1',
      danger ? 'text-rose-500' : 'text-foreground'
    )}>{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
  </div>
));
SimMetric.displayName = 'SimMetric';

const ContextCard = forwardRef<
  HTMLDivElement,
  { icon: React.ReactNode; title: string; value: React.ReactNode; sub?: string }
>(({ icon, title, value, sub }, ref) => (
  <Card ref={ref} className="border-border/60 bg-card/60 backdrop-blur">
    <CardContent className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        {icon}{title}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </CardContent>
  </Card>
));
ContextCard.displayName = 'ContextCard';
