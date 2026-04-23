import { useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import { usePrivacyMode } from '@/store/usePrivacyMode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Sparkles, Loader2, TrendingDown, Trophy, Lightbulb, Target, AlertCircle, Rocket, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatEuro } from '@/types/crm';
import { ClientsSheet } from '@/components/crm/ClientsSheet';

interface FrictionPoint { titolo: string; descrizione: string }
interface WinLossReport {
  friction_points?: FrictionPoint[];
  perche_perdiamo: string[];
  azioni_correttive: string[];
  sintesi: string;
  entrepreneurial_nudge?: string;
}

const SalesCoach = () => {
  const { clients, isLoading, financials, lifeGoals } = useCrm();
  const { privacyMode } = usePrivacyMode();
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<WinLossReport | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState<number>(0);
  const [drill, setDrill] = useState<null | 'won' | 'lost'>(null);

  const { won, lost, wonClients, lostClients, conversionRate, lostRevenue } = useMemo(() => {
    const wonList = clients.filter(c => c.pipeline_stage === 'Closed Won');
    const lostList = clients.filter(c => c.pipeline_stage === 'Closed Lost');
    const total = wonList.length + lostList.length;
    const conv = total > 0 ? Math.round((wonList.length / total) * 100) : 0;
    const lostRev = lostList.reduce((s, c) => s + (c.monthly_value || 0), 0);
    return {
      won: wonList.length,
      lost: lostList.length,
      wonClients: wonList,
      lostClients: lostList,
      conversionRate: conv,
      lostRevenue: lostRev,
    };
  }, [clients]);

  const handleGenerate = async () => {
    if (lostClients.length === 0) {
      toast.error('Nessuna trattativa persa da analizzare');
      return;
    }
    if (privacyMode) {
      toast.warning('Modalità Privacy attiva: i nomi dei clienti non saranno inviati all\'AI.');
    }
    setGenerating(true);
    setReport(null);
    try {
      const activeGoal = lifeGoals?.find(g => g.is_active);
      const avgDeal = wonClients.length > 0
        ? Math.round(wonClients.reduce((s, c) => s + (c.monthly_value || 0), 0) / wonClients.length)
        : 0;

      const { data, error } = await supabase.functions.invoke('analyze-win-loss', {
        body: {
          lost_clients: lostClients.map(c => ({
            // mascheriamo il nome se Modalità Privacy attiva
            name: privacyMode ? `Cliente #${c.id.slice(0, 4)}` : c.name,
            lead_source: c.lead_source,
            objection_stated: c.objection_stated,
            objection_real: c.objection_real,
            root_motivator: c.root_motivator,
          })),
          goal_context: {
            title: activeGoal?.title,
            monthly_target: financials?.monthly_target,
            current_monthly_revenue: financials?.current_monthly_revenue,
            avg_deal_value: avgDeal,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('Report AI vuoto');
      setReport(data.report as WinLossReport);
      setAnalyzedCount(data.analyzed ?? lostClients.length);
      toast.success('Coach Insight pronto');
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      let msg = 'Servizio AI momentaneamente non disponibile';
      if (/429|limite|rate/i.test(raw)) msg = 'Limite di richieste raggiunto. Riprova tra qualche istante.';
      else if (/402|crediti|payment/i.test(raw)) msg = 'Crediti AI esauriti. Aggiungi fondi al workspace.';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analytics</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Sales Coach AI</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Analizza le tue trattative per capire perché vinci e perché perdi.
        </p>
      </header>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<Trophy className="h-4 w-4" />} label="Totale Chiusi Vinti" value={String(won)} tone="primary" onClick={() => setDrill('won')} />
          <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Totale Persi" value={String(lost)} tone="destructive" onClick={() => setDrill('lost')} />
          <KpiCard icon={<Target className="h-4 w-4" />} label="Tasso Conversione" value={`${conversionRate}%`} tone="warning" />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Ricavo Perso/mese" value={formatEuro(lostRevenue)} tone="muted" />
        </div>
      )}

      {/* AI Vulnerability Report */}
      <section className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-4 md:p-5 space-y-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm md:text-base text-foreground">Report Vulnerabilità AI</h2>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
              Analisi delle obiezioni reali su {lostClients.length} trattative perse.
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || lostClients.length === 0}
          className="w-full h-12 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-glow"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisi in corso…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Genera Report Settimanale AI</>
          )}
        </Button>

        {lostClients.length === 0 && !generating && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border p-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Servono trattative in <strong>Perso / Recupero</strong> con un'obiezione reale registrata.
            </p>
          </div>
        )}

        {generating && (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            {/* Sintesi skeleton */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <Skeleton className="h-2.5 w-24 rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-4/5 rounded-full" />
            </div>
            {/* Perché perdiamo skeleton */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1 rounded-full" />
                </div>
              ))}
            </div>
            {/* Azioni correttive skeleton */}
            <div className="rounded-xl border border-primary/30 bg-card p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-48 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1 rounded-full" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-center text-muted-foreground italic">
              Il modello Pro sta analizzando i pattern… può richiedere qualche secondo.
            </p>
          </div>
        )}

        {report && !generating && (
          <div className="space-y-3">
            {/* Sintesi */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Sintesi · {analyzedCount} casi</p>
              <p className="text-sm text-foreground">{report.sintesi}</p>
            </div>

            {/* Friction Points (top 2) */}
            {report.friction_points && report.friction_points.length > 0 && (
              <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">Top 2 Punti di Attrito</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.friction_points.slice(0, 2).map((fp, i) => (
                    <div key={i} className="rounded-lg bg-card border border-border p-2.5">
                      <p className="text-xs font-bold text-foreground">{fp.titolo}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{fp.descrizione}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Perché perdiamo */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Perché stiamo perdendo</p>
              </div>
              <ul className="space-y-2">
                {report.perche_perdiamo.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Azioni correttive */}
            <div className="rounded-xl border border-primary/30 bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Azioni per la prossima settimana</p>
              </div>
              <ul className="space-y-2">
                {report.azioni_correttive.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <ClientsSheet
        open={drill === 'won'}
        onOpenChange={(v) => { if (!v) setDrill(null); }}
        title="Clienti Chiusi Vinti"
        description={`${wonClients.length} client${wonClients.length === 1 ? 'e attivo' : 'i attivi'}`}
        clients={wonClients}
      />
      <ClientsSheet
        open={drill === 'lost'}
        onOpenChange={(v) => { if (!v) setDrill(null); }}
        title="Trattative Perse"
        description="Obiezione reale e motivazione profonda inline per analisi rapida."
        clients={lostClients}
        showLossContext
      />
    </div>
  );
};

const KpiCard = ({ icon, label, value, tone, onClick }: { icon: React.ReactNode; label: string; value: string; tone: 'primary' | 'destructive' | 'warning' | 'muted'; onClick?: () => void }) => {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-muted text-muted-foreground',
  }[tone];
  const base = 'rounded-2xl border border-border bg-card p-4 shadow-card text-left';
  const interactive = onClick ? ' hover:border-primary/40 transition-smooth active:scale-[0.99] w-full' : '';
  const Inner = (
    <>
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        {icon}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-xl md:text-2xl font-bold text-foreground">{value}</p>
    </>
  );
  if (onClick) {
    return <button type="button" onClick={onClick} className={base + interactive}>{Inner}</button>;
  }
  return <div className={base}>{Inner}</div>;
};

export default SalesCoach;
