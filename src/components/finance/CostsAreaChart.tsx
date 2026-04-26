import { useMemo } from 'react';
import { AreaChart, type CustomTooltipProps } from '@tremor/react';
import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingDown } from 'lucide-react';

const MONTHS_BACK = 6;

interface ChartPoint {
  month: string;
  'Costi Effettivi': number;
  'Costi Necessari': number;
}

const CustomTooltip = ({ payload, active, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as ChartPoint;
  const actual = point['Costi Effettivi'] ?? 0;
  const necessary = point['Costi Necessari'] ?? 0;
  const savings = Math.max(0, actual - necessary);
  const savingsPct = actual > 0 ? (savings / actual) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-lg min-w-[200px]">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">{label}</p>
      <div className="space-y-1.5 text-sm tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Effettivi</span>
          </span>
          <PrivacyMask>
            <span className="font-semibold text-foreground">{formatEuro(actual)}</span>
          </PrivacyMask>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-muted-foreground">Necessari</span>
          </span>
          <PrivacyMask>
            <span className="font-semibold text-foreground">{formatEuro(necessary)}</span>
          </PrivacyMask>
        </div>
        <div className="pt-2 mt-1 border-t border-border flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Risparmio potenziale</span>
          <span className="font-bold text-emerald-500">{savingsPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export const CostsAreaChart = () => {
  const { movements } = useCrm();
  const isMobile = useIsMobile();

  const { data, totals } = useMemo(() => {
    const now = new Date();
    const points: ChartPoint[] = [];
    let totActual = 0;
    let totNecessary = 0;

    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = ref.getFullYear();
      const m = ref.getMonth();
      const monthMovements = movements.filter(mv => {
        if (mv.type !== 'debit') return false;
        const d = new Date(mv.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
      const actual = monthMovements.reduce((s, mv) => s + mv.amount, 0);
      const necessary = monthMovements
        .filter(mv => mv.is_recurring)
        .reduce((s, mv) => s + mv.amount, 0);

      const label = ref.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      points.push({
        month: label,
        'Costi Effettivi': Math.round(actual),
        'Costi Necessari': Math.round(necessary),
      });
      totActual += actual;
      totNecessary += necessary;
    }

    return {
      data: points,
      totals: {
        actual: totActual,
        necessary: totNecessary,
        savingsPct: totActual > 0 ? ((totActual - totNecessary) / totActual) * 100 : 0,
      },
    };
  }, [movements]);

  const hasData = data.some(d => d['Costi Effettivi'] > 0);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Andamento Costi · Ultimi {MONTHS_BACK} Mesi
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Confronto tra spese totali e spese ricorrenti necessarie. La differenza rappresenta il risparmio potenziale.
      </p>

      {/* Summary horizontal grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Costi Effettivi</p>
          <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
            <PrivacyMask>{formatEuro(totals.actual)}</PrivacyMask>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Costi Necessari</p>
          <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
            <PrivacyMask>{formatEuro(totals.necessary)}</PrivacyMask>
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Risparmio Potenziale</p>
          <p className="mt-1 text-lg font-bold text-emerald-500 tabular-nums">
            {totals.savingsPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {hasData ? (
        <AreaChart
          className="h-72 mt-2"
          data={data}
          index="month"
          categories={['Costi Effettivi', 'Costi Necessari']}
          colors={['blue', 'cyan']}
          valueFormatter={(v: number) => formatEuro(v)}
          showYAxis={!isMobile}
          startEndOnly={isMobile}
          showLegend
          showGridLines
          curveType="monotone"
          customTooltip={CustomTooltip}
          yAxisWidth={64}
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20">
          <p className="text-sm text-muted-foreground">Nessun dato di spesa disponibile per gli ultimi {MONTHS_BACK} mesi.</p>
        </div>
      )}
    </section>
  );
};
