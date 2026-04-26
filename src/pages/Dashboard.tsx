import { BentoCard, BentoGrid } from '@/components/ui/bento-grid';
import { BreakEvenGauge } from '@/components/crm/BreakEvenGauge';
import { RevenueBySource } from '@/components/crm/RevenueBySource';
import { FinancialWidget } from '@/components/crm/FinancialWidget';
import { MonthlyHistory } from '@/components/crm/MonthlyHistory';
import { SalesFunnel } from '@/components/crm/SalesFunnel';
import { TaskQueue } from '@/components/crm/TaskQueue';
import { useCrm } from '@/store/useCrm';
import { FinancialCardSkeleton, TaskQueueSkeleton } from '@/components/crm/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, BrainCircuit, TrendingUp, ListTodo } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const sparkData = [
  { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 22 },
  { v: 30 }, { v: 28 }, { v: 36 }, { v: 33 }, { v: 42 },
  { v: 40 }, { v: 48 },
];

const FinanceBackground = () => (
  <div className="absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_top,white_30%,transparent_85%)]">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={sparkData} margin={{ top: 60, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="bentoFinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.55} />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          fill="url(#bentoFinGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const AiBackground = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-400/15 pointer-events-none" />
);

const PipelineBackground = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
  </div>
);

const TasksBackground = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute right-6 top-6 flex flex-col gap-2 opacity-40">
      {[80, 64, 48, 56].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-border bg-card" />
          <div className="h-2 rounded bg-muted" style={{ width: `${w}px` }} />
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { clients, isLoading } = useCrm();
  const activeCount = clients.filter(c => !['Closed Won', 'Closed Lost'].includes(c.pipeline_stage)).length;
  const wonCount = clients.filter(c => c.pipeline_stage === 'Closed Won').length;
  const churnAlto = clients.filter(c => c.pipeline_stage === 'Closed Won' && c.churn_risk === 'Alto').length;

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{today}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro di Comando</h1>
      </header>

      {/* Hub di Navigazione — Bento Grid */}
      <BentoGrid className="bento-stagger">
        <BentoCard
          name="Financial Overview"
          description="Monitora il cash-flow in tempo reale, analizza le spese e tieni d'occhio gli obiettivi di risparmio."
          Icon={PieChart}
          href="/finance"
          cta="Apri Finance"
          className="md:col-span-2"
          background={<FinanceBackground />}
        />
        <BentoCard
          name="AI Strategy & Coaching"
          description="Genera briefing strategici e follow-up personalizzati con il tuo assistente AI."
          Icon={BrainCircuit}
          href="/coach"
          cta="Consulta AI"
          className="md:col-span-1 bg-gradient-to-br from-blue-900/20 to-cyan-900/20"
          background={<AiBackground />}
        />
        <BentoCard
          name="Sales Pipeline"
          description="Gestisci le trattative attive, sposta i lead tra gli stage e chiudi più velocemente."
          Icon={TrendingUp}
          href="/pipeline"
          cta="Vai alla Pipeline"
          className="md:col-span-1"
          background={<PipelineBackground />}
        />
        <BentoCard
          name="Task Queue & Clients"
          description="Le tue azioni operative di oggi e i follow-up immediati con i clienti."
          Icon={ListTodo}
          href="/clients"
          cta="Apri Tasks"
          className="md:col-span-2"
          background={<TasksBackground />}
        />
      </BentoGrid>

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
