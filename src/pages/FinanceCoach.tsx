import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import { TAX_RATE } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit, TrendingUp, TrendingDown, Target as TargetIcon,
  Users, Wallet, AlertTriangle, Sparkles, Activity, BarChart3, Clock3, Loader2,
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

    // Training expirations — count active clients whose training_end_date falls in the next 30/60 days
    const today = new Date();
    const day30 = new Date(today.getTime() + 30 * 86_400_000);
    const day60 = new Date(today.getTime() + 60 * 86_400_000);
    const wonClients = clients.filter(c => c.pipeline_stage === 'Closed Won');
    const expiringIn30 = wonClients.filter(c => {
      if (!c.training_end_date) return false;
      const d = new Date(c.training_end_date);
      return d >= today && d <= day30;
    });
    const expiringIn60 = wonClients.filter(c => {
      if (!c.training_end_date) return false;
      const d = new Date(c.training_end_date);
      return d >= today && d <= day60;
    });
    const expiringClients = expiringIn60.map(c => ({
      name: c.name,
      service: c.service_sold ?? null,
      end: c.training_end_date ?? null,
      daysLeft: c.training_end_date
        ? Math.ceil((new Date(c.training_end_date).getTime() - today.getTime()) / 86_400_000)
        : null,
    })).sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

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
      expiringIn30Count: expiringIn30.length,
      expiringIn60Count: expiringIn60.length,
      expiringClients,
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

  // Manual overrides — empty string => use historical snapshot value.
  // Stored as strings to support free-typing, parsed safely below.
  const [avgTicketOverride, setAvgTicketOverride] = useState<string>('');
  const [winRateOverride, setWinRateOverride] = useState<string>(''); // percent (0-100)

  const sim = useMemo(() => {
    const monthsLeft = Math.max(0.5, daysToDeadline / 30);
    const remaining = activeGoal
      ? Math.max(0, Number(activeGoal.total_target_amount) - Number(activeGoal.current_savings))
      : 0;
    const goalSavingPerMonth = remaining / monthsLeft;
    const requiredMonthlyNet = goalSavingPerMonth + snapshot.lifestyleBurnRate;
    const requiredMonthlyGross = requiredMonthlyNet / (1 - TAX_RATE);

    // Effective ticket: manual override if a positive number is typed, else historical avgTicket.
    const parsedTicket = parseFloat(avgTicketOverride);
    const effectiveTicket = Number.isFinite(parsedTicket) && parsedTicket > 0
      ? parsedTicket
      : snapshot.avgTicket;

    // Effective win rate: manual override (0-100 → 0-1) if valid, else historical winRate.
    const parsedWinPct = parseFloat(winRateOverride);
    const effectiveWinRate = Number.isFinite(parsedWinPct) && parsedWinPct > 0 && parsedWinPct <= 100
      ? parsedWinPct / 100
      : snapshot.winRate;

    const requiredClientsPerMonth = effectiveTicket > 0
      ? requiredMonthlyGross / effectiveTicket
      : 0;
    const requiredLeadsPerMonth = effectiveWinRate > 0 && requiredClientsPerMonth > 0
      ? requiredClientsPerMonth / effectiveWinRate
      : 0;

    const historicMonthlyPitched = snapshot.pitchedCount / 3;
    const impliedWinRate = historicMonthlyPitched > 0
      ? requiredClientsPerMonth / historicMonthlyPitched
      : 1;
    const isUnrealistic = impliedWinRate > 0.8;
    return {
      monthsLeft, goalSavingPerMonth, requiredMonthlyNet, requiredMonthlyGross,
      requiredClientsPerMonth, requiredLeadsPerMonth, impliedWinRate, isUnrealistic,
      effectiveTicket, effectiveWinRate,
      ticketIsManual: effectiveTicket !== snapshot.avgTicket,
      winRateIsManual: effectiveWinRate !== snapshot.winRate,
    };
  }, [daysToDeadline, activeGoal, snapshot, avgTicketOverride, winRateOverride]);

  // ============ AI Briefing (persistente) ============
  const [briefing, setBriefing] = useState<string>('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  // Carica l'ultimo briefing salvato al mount
  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('finance_coach_config')
        .select('id, latest_briefing, last_briefing_date')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        setConfigId(data.id);
        if (data.latest_briefing) setBriefing(data.latest_briefing);
        setBriefingDate(data.last_briefing_date ?? null);
      }
    };
    load();
  }, []);

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
            expiringIn30: snapshot.expiringIn30Count,
            expiringIn60: snapshot.expiringIn60Count,
            expiringClients: snapshot.expiringClients,
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
      const payload = (data ?? {}) as { error?: string; briefing?: string };
      if (payload.error) throw new Error(payload.error);
      const newBriefing = payload.briefing ?? '';
      setBriefing(newBriefing);

      // Persisti l'ultimo briefing
      const nowIso = new Date().toISOString();
      if (configId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('finance_coach_config')
          .update({ latest_briefing: newBriefing, last_briefing_date: nowIso })
          .eq('id', configId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: ins } = await (supabase as any)
          .from('finance_coach_config')
          .insert({ latest_briefing: newBriefing, last_briefing_date: nowIso })
          .select('id')
          .single();
        if (ins?.id) setConfigId(ins.id);
      }
      setBriefingDate(nowIso);

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

          {/* Manual overrides — fall back to historical snapshot when empty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ticket-override" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket medio (€)
              </label>
              <Input
                id="ticket-override"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                placeholder={snapshot.avgTicket > 0 ? `Storico: ${Math.round(snapshot.avgTicket)}` : 'Es. 1200'}
                value={avgTicketOverride}
                onChange={(e) => setAvgTicketOverride(e.target.value)}
                className="h-10 rounded-lg bg-secondary/40 border-border text-sm tabular-nums"
              />
              <p className="text-[10px] text-muted-foreground">
                {sim.ticketIsManual ? 'Override manuale attivo' : 'Sto usando il valore storico (90 giorni)'}
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="winrate-override" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Win rate atteso (%)
              </label>
              <Input
                id="winrate-override"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="1"
                placeholder={snapshot.winRate > 0 ? `Storico: ${(snapshot.winRate * 100).toFixed(0)}` : 'Es. 30'}
                value={winRateOverride}
                onChange={(e) => setWinRateOverride(e.target.value)}
                className="h-10 rounded-lg bg-secondary/40 border-border text-sm tabular-nums"
              />
              <p className="text-[10px] text-muted-foreground">
                {sim.winRateIsManual ? 'Override manuale attivo' : 'Sto usando il valore storico (90 giorni)'}
              </p>
            </div>
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
              value={sim.effectiveTicket > 0 ? sim.requiredClientsPerMonth.toFixed(1) : 'N/A'}
              hint={
                sim.effectiveTicket > 0
                  ? `Su ticket medio ${formatEuro(sim.effectiveTicket)}${sim.ticketIsManual ? ' (manuale)' : ''}`
                  : 'Inserisci un ticket medio per calcolare'
              }
              danger={sim.isUnrealistic}
            />
            <SimMetric
              label="Nuovi Lead Necessari/mese"
              value={sim.requiredLeadsPerMonth > 0 ? sim.requiredLeadsPerMonth.toFixed(1) : 'N/A'}
              hint={
                sim.effectiveWinRate > 0
                  ? `Win rate ${formatPct(sim.effectiveWinRate)}${sim.winRateIsManual ? ' (manuale)' : ''}`
                  : 'Inserisci un win rate per calcolare'
              }
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

      {/* AI Briefing — Tech-Premium Bento */}
      <section className="bento-stagger grid grid-cols-1 md:grid-cols-6 gap-3 auto-rows-min">
        {/* Header / Action — full width with shimmer button */}
        <div className="md:col-span-6 ai-beam-border p-[1px]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-accent/5 p-4 md:p-5">
            <div className="ai-glow-halo" aria-hidden />
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" aria-hidden />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary-glow text-white shadow-glow">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
                    AI · Orizzonte Strategico
                  </p>
                  <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">Briefing Strategico AI</h2>
                  <p className="text-[11px] text-muted-foreground">CFO autonomo — diagnosi, vendita, spese</p>
                </div>
              </div>
              <Button
                onClick={generateBriefing}
                disabled={briefingLoading}
                className="shimmer-button h-12 px-5 rounded-xl text-sm font-semibold border-0 hover:text-white disabled:opacity-60"
              >
                {briefingLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizzo…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> {briefing ? 'Rigenera Briefing' : 'Genera Briefing Strategico'}</>
                )}
              </Button>
            </div>
            {briefingDate && !briefingLoading && (
              <div className="relative mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                Ultimo briefing del {new Date(briefingDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })} alle {new Date(briefingDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Briefing body — structured Card */}
        <div className="md:col-span-6 ai-beam-border p-[1px]">
          <Card className="relative overflow-hidden rounded-2xl border-0 bg-card min-h-[200px]">
            <div className="ai-glow-halo" aria-hidden />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary-glow/15 blur-3xl" aria-hidden />

            {!briefingLoading && briefing && (
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-accent" />
                  Briefing del CFO AI
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Diagnosi strategica basata sui tuoi dati degli ultimi 90 giorni
                </CardDescription>
              </CardHeader>
            )}

            <CardContent className="relative pt-4">
              {briefingLoading && (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-11/12 rounded-full" />
                  <Skeleton className="h-4 w-10/12 rounded-full" />
                  <div className="h-2" />
                  <Skeleton className="h-4 w-40 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-9/12 rounded-full" />
                  <p className="text-[11px] text-center text-muted-foreground italic pt-2">
                    Il modello Pro sta analizzando i pattern… può richiedere qualche secondo.
                  </p>
                </div>
              )}

              {!briefingLoading && briefing && (
                <article className="max-w-none text-sm text-foreground leading-relaxed space-y-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <div className="space-y-2 pt-2 first:pt-0">
                          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
                            {children}
                          </h3>
                          <Separator className="bg-border/60" />
                        </div>
                      ),
                      h2: ({ children }) => (
                        <div className="space-y-2 pt-3 first:pt-0">
                          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
                            {children}
                          </h3>
                          <Separator className="bg-border/60" />
                        </div>
                      ),
                      h3: ({ children }) => (
                        <h4 className="text-[13px] font-bold text-foreground tracking-tight pt-2 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                          {children}
                        </h4>
                      ),
                      h4: ({ children }) => (
                        <h5 className="text-xs font-semibold text-foreground/90 tracking-tight pt-1">
                          {children}
                        </h5>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-foreground/90 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1.5 pl-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="space-y-1.5 list-decimal pl-5 marker:text-accent marker:font-bold">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="flex gap-2 text-sm text-foreground/90 leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-accent to-primary-glow" aria-hidden />
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-foreground">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-foreground/80">{children}</em>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-accent/60 bg-accent/5 rounded-r-lg pl-3 pr-2 py-2 text-sm text-foreground/90 italic">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <Separator className="my-4 bg-border/60" />,
                      code: ({ children }) => (
                        <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[12px] font-mono text-foreground">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {briefing}
                  </ReactMarkdown>
                </article>
              )}

              {!briefingLoading && !briefing && (
                <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Premi <b>Genera Briefing Strategico</b> per ricevere la tua analisi personalizzata.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

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
