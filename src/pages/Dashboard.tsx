import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp, Users, Wallet, ListChecks } from 'lucide-react';
import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { BreakEvenGauge } from '@/components/crm/BreakEvenGauge';
import { RevenueBySource } from '@/components/crm/RevenueBySource';
import { FinancialWidget } from '@/components/crm/FinancialWidget';
import { MonthlyHistory } from '@/components/crm/MonthlyHistory';
import { SalesFunnel } from '@/components/crm/SalesFunnel';
import { TaskQueue } from '@/components/crm/TaskQueue';
import { FinancialCardSkeleton, TaskQueueSkeleton } from '@/components/crm/skeletons';

// ---------------- KPI helpers ----------------

interface KpiTrendProps {
  /** Percent variation, e.g. +12.4 or -5. Pass null when there's no comparable baseline. */
  delta: number | null;
  inverted?: boolean; // if true, negative is good (e.g. expenses)
}

const KpiTrend = ({ delta, inverted = false }: KpiTrendProps) => {
  if (delta === null || !Number.isFinite(delta)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Minus className="h-2.5 w-2.5" /> N/A
      </span>
    );
  }
  const isPositive = delta >= 0;
  const isGood = inverted ? !isPositive : isPositive;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const tone = isGood
    ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
    : 'bg-rose-500/15 text-rose-500 dark:text-rose-400';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      <Icon className="h-2.5 w-2.5" />
      {`${isPositive ? '+' : ''}${delta.toFixed(1)}%`}
    </span>
  );
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  delta: number | null;
  tone?: 'primary' | 'accent' | 'warning';
  invertedDelta?: boolean;
}

const TONE: Record<NonNullable<KpiCardProps['tone']>, { iconBg: string; halo: string }> = {
  primary: {
    iconBg: 'from-primary to-primary-glow',
    halo: 'bg-primary/25',
  },
  accent: {
    iconBg: 'from-accent to-primary-glow',
    halo: 'bg-accent/25',
  },
  warning: {
    iconBg: 'from-amber-500 to-orange-500',
    halo: 'bg-amber-500/25',
  },
};

const KpiCard = ({ label, value, hint, icon, delta, tone = 'primary', invertedDelta }: KpiCardProps) => {
  const t = TONE[tone];
  return (
    <BentoCard highlight padded>
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full ${t.halo} blur-3xl`} aria-hidden />
      <div className="relative flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.iconBg} text-white shadow-glow`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
            <KpiTrend delta={delta} inverted={invertedDelta} />
          </div>
          <p className="mt-1 text-2xl md:text-3xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</p>}
        </div>
      </div>
    </BentoCard>
  );
};

// ---------------- Bento section header ----------------

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="min-w-0">
      <h2 className="text-sm font-bold text-foreground leading-tight truncate">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
    </div>
  </div>
);

// ---------------- Page ----------------

const Dashboard = () => {
  const { clients, movements, financials, isLoading } = useCrm();

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  // Pipeline KPIs
  const activeCount = useMemo(
    () => clients.filter(c => !['Closed Won', 'Closed Lost'].includes(c.pipeline_stage)).length,
    [clients],
  );
  const prevActiveCount = useMemo(() => {
    // Use stage_updated_at as a rough proxy: count of leads that entered the pipeline > 30d ago.
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return clients.filter(c => {
      if (['Closed Won', 'Closed Lost'].includes(c.pipeline_stage)) return false;
      const t = new Date(c.stage_updated_at ?? c.created_at ?? Date.now()).getTime();
      return t < cutoff;
    }).length;
  }, [clients]);
  const leadsDelta = prevActiveCount > 0
    ? ((activeCount - prevActiveCount) / prevActiveCount) * 100
    : null;

  // Monthly recurring revenue (Closed Won) — delta vs target
  const monthlyRevenue = financials?.current_monthly_revenue ?? 0;
  const monthlyTarget = financials?.monthly_target ?? 0;
  const revenueDelta = monthlyTarget > 0
    ? ((monthlyRevenue - monthlyTarget) / monthlyTarget) * 100
    : null;

  // Free Cash Flow last 30d vs previous 30d (business net + personal net from movements)
  const { freeCashFlow, fcfDelta } = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last30Start = now - 30 * day;
    const prev30Start = now - 60 * day;

    const sumNet = (fromTs: number, toTs: number) => {
      let net = 0;
      for (const m of movements) {
        const t = new Date(m.date).getTime();
        if (t < fromTs || t >= toTs) continue;
        const amt = Number(m.amount) || 0;
        net += m.type === 'credit' ? amt : -amt;
      }
      return net;
    };

    const last = sumNet(last30Start, now);
    const prev = sumNet(prev30Start, last30Start);
    const delta = prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : null;
    return { freeCashFlow: last, fcfDelta: delta };
  }, [movements]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-0 pt-6 pb-6 space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{today}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro di Comando</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Snapshot premium — vendite, finanze e azioni di oggi in un colpo d'occhio.
        </p>
      </header>

      {isLoading ? (
        <>
          {/* KPI skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          {/* Bento skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <FinancialCardSkeleton />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coda di Oggi</h2>
            <TaskQueueSkeleton />
          </section>
        </>
      ) : (
        <>
          {/* ============== Top Row · KPI Cards ============== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <KpiCard
              label="Fatturato Mensile"
              value={<PrivacyMask>{formatEuro(monthlyRevenue)}</PrivacyMask>}
              hint={monthlyTarget > 0 ? `Target ${formatEuro(monthlyTarget)}` : 'Imposta un target mensile'}
              icon={<TrendingUp className="h-4 w-4" />}
              delta={revenueDelta}
              tone="primary"
            />
            <KpiCard
              label="Lead Attivi"
              value={String(activeCount)}
              hint="In pipeline (esclusi Won/Lost)"
              icon={<Users className="h-4 w-4" />}
              delta={leadsDelta}
              tone="accent"
            />
            <KpiCard
              label="Free Cash Flow"
              value={<PrivacyMask>{formatEuro(freeCashFlow)}</PrivacyMask>}
              hint="Netto ultimi 30 giorni"
              icon={<Wallet className="h-4 w-4" />}
              delta={fcfDelta}
              tone={freeCashFlow >= 0 ? 'primary' : 'warning'}
            />
          </div>

          {/* ============== Main Bento Grid ============== */}
          <BentoGrid columns={3}>
            {/* Card 1 — Financial overview (large) */}
            <BentoCard highlight padded={false} className="md:col-span-2">
              <div className="p-4 md:p-5 space-y-4">
                <SectionHeader
                  icon={<TrendingUp className="h-4 w-4" />}
                  title="Panoramica Finanziaria"
                  subtitle="Lordo, netto e ripartizione per fonte"
                />
                <FinancialWidget />
                <RevenueBySource />
              </div>
            </BentoCard>

            {/* Card 2 — Sales Funnel (compact) */}
            <BentoCard className="md:col-span-1">
              <SectionHeader
                icon={<Users className="h-4 w-4" />}
                title="Funnel di Vendita"
                subtitle="Distribuzione pipeline"
              />
              <SalesFunnel />
            </BentoCard>

            {/* Card 3 — Break-even (compact) */}
            <BentoCard className="md:col-span-1">
              <SectionHeader
                icon={<Wallet className="h-4 w-4" />}
                title="Break-Even"
                subtitle="Soglia di pareggio mensile"
              />
              <BreakEvenGauge />
            </BentoCard>

            {/* Card 4 — Monthly history (large) */}
            <BentoCard highlight padded={false} className="md:col-span-2">
              <div className="p-4 md:p-5 space-y-3">
                <SectionHeader
                  icon={<TrendingUp className="h-4 w-4" />}
                  title="Storico Mensile"
                  subtitle="Andamento entrate/uscite"
                />
                <MonthlyHistory />
              </div>
            </BentoCard>
          </BentoGrid>

          {/* ============== Action Queue ============== */}
          <BentoCard highlight padded={false}>
            <div className="p-4 md:p-5 space-y-3">
              <SectionHeader
                icon={<ListChecks className="h-4 w-4" />}
                title="Coda di Oggi"
                subtitle="Le azioni che muovono il fatturato"
              />
              <TaskQueue />
            </div>
          </BentoCard>
        </>
      )}
    </div>
  );
};

export default Dashboard;
