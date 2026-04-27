import { BreakEvenGauge } from '@/components/crm/BreakEvenGauge';
import { RevenueBySource } from '@/components/crm/RevenueBySource';
import { FinancialWidget } from '@/components/crm/FinancialWidget';
import { MonthlyHistory } from '@/components/crm/MonthlyHistory';
import { SalesFunnel } from '@/components/crm/SalesFunnel';
import { TaskQueue } from '@/components/crm/TaskQueue';
import { useCrm } from '@/store/useCrm';
import { FinancialCardSkeleton, TaskQueueSkeleton } from '@/components/crm/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------------
// Local helper components — keep dashboard modular without new files.
// ----------------------------------------------------------------------------

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * BentoCard — premium glassmorphic container used across the dashboard grid.
 * Pure Tailwind, dark-mode aware via semantic tokens.
 */
const BentoCard = ({ children, className }: BentoCardProps) => (
  <div
    className={cn(
      'group relative rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm',
      'transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
      className,
    )}
  >
    {children}
  </div>
);

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' };
  accent?: 'default' | 'primary' | 'destructive';
}

/**
 * KpiCard — top-row metric card with trend badge and subtle gradient depth.
 */
const KpiCard = ({ label, value, sublabel, icon, trend, accent = 'default' }: KpiCardProps) => {
  const valueColor =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <BentoCard className="overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 dark:to-muted/10">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                trend.direction === 'up'
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : 'text-rose-500 bg-rose-500/10',
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn('mt-1 text-3xl font-bold tracking-tight tabular-nums', valueColor)}>
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </div>
    </BentoCard>
  );
};

/**
 * LivePulse — small "live" status indicator with a pinging dot.
 */
const LivePulse = () => (
  <span className="inline-flex items-center gap-2">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live</span>
  </span>
);

// ----------------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------------

const Dashboard = () => {
  const { clients, isLoading } = useCrm();
  const activeCount = clients.filter(c => !['Closed Won', 'Closed Lost'].includes(c.pipeline_stage)).length;
  const wonCount = clients.filter(c => c.pipeline_stage === 'Closed Won').length;
  const churnAlto = clients.filter(c => c.pipeline_stage === 'Closed Won' && c.churn_risk === 'Alto').length;

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{today}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Centro di Comando
        </h1>
      </header>

      {isLoading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FinancialCardSkeleton />
            <FinancialCardSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Coda di Oggi
            </h2>
            <TaskQueueSkeleton />
          </section>
        </>
      ) : (
        <>
          {/* ---- Bento Grid ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hero finanziario — full width, dominates the grid */}
            <div className="md:col-span-2 lg:col-span-4">
              <FinancialWidget />
            </div>

            {/* KPI quick-stats */}
            <KpiCard
              label="Lead Attivi"
              value={activeCount}
              sublabel="in pipeline"
              icon={<Users className="h-4 w-4" />}
              trend={activeCount > 0 ? { value: 'attivi', direction: 'up' } : undefined}
            />
            <KpiCard
              label="Clienti Attivi"
              value={wonCount}
              sublabel="paganti"
              icon={<UserCheck className="h-4 w-4" />}
              accent="primary"
              trend={wonCount > 0 ? { value: 'won', direction: 'up' } : undefined}
            />
            <KpiCard
              label="Churn Alto"
              value={churnAlto}
              sublabel="da contattare"
              icon={<AlertTriangle className="h-4 w-4" />}
              accent={churnAlto > 0 ? 'destructive' : 'default'}
              trend={
                churnAlto > 0
                  ? { value: 'rischio', direction: 'down' }
                  : { value: 'stabile', direction: 'up' }
              }
            />
            <KpiCard
              label="Pipeline"
              value={clients.length}
              sublabel="totale contatti"
              icon={<TrendingUp className="h-4 w-4" />}
            />

            {/* Charts: spanning 2 cols for asymmetric harmony */}
            <BentoCard className="md:col-span-2 p-5">
              <BreakEvenGauge />
            </BentoCard>
            <BentoCard className="md:col-span-2 p-5">
              <RevenueBySource />
            </BentoCard>

            {/* Wide rows */}
            <div className="md:col-span-2 lg:col-span-4">
              <BentoCard className="p-5">
                <MonthlyHistory />
              </BentoCard>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <BentoCard className="p-5">
                <SalesFunnel />
              </BentoCard>
            </div>
          </div>

          {/* ---- Live Task Queue ---- */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Coda di Oggi
              </h2>
              <LivePulse />
            </div>
            <TaskQueue />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
