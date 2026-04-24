import { BreakEvenGauge } from '@/components/crm/BreakEvenGauge';
import { RevenueBySource } from '@/components/crm/RevenueBySource';
import { FinancialWidget } from '@/components/crm/FinancialWidget';
import { MonthlyHistory } from '@/components/crm/MonthlyHistory';
import { SalesFunnel } from '@/components/crm/SalesFunnel';
import { TaskQueue } from '@/components/crm/TaskQueue';
import { useCrm } from '@/store/useCrm';
import { FinancialCardSkeleton, TaskQueueSkeleton } from '@/components/crm/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { clients, isLoading } = useCrm();
  const activeCount = clients.filter(c => !['Closed Won', 'Closed Lost'].includes(c.pipeline_stage)).length;
  const wonCount = clients.filter(c => c.pipeline_stage === 'Closed Won').length;
  const churnAlto = clients.filter(c => c.pipeline_stage === 'Closed Won' && c.churn_risk === 'Alto').length;

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{today}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro di Comando</h1>
      </header>

      {isLoading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FinancialCardSkeleton />
            <FinancialCardSkeleton />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coda di Oggi</h2>
            <TaskQueueSkeleton />
          </section>
        </>
      ) : (
        <>
          <FinancialWidget />

          <div className="grid gap-4 md:grid-cols-2">
            <BreakEvenGauge />
            <RevenueBySource />
          </div>

          <MonthlyHistory />

          <SalesFunnel />

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lead Attivi</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">in pipeline</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clienti Attivi</p>
              <p className="mt-1 text-2xl font-bold text-primary">{wonCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">paganti</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Churn Alto</p>
              <p className={`mt-1 text-2xl font-bold ${churnAlto > 0 ? 'text-destructive' : 'text-foreground'}`}>{churnAlto}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">da contattare</p>
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coda di Oggi</h2>
            <TaskQueue />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
