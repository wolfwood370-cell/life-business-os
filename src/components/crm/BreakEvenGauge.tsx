import { useCrm } from '@/store/crmStore';
import { formatEuro } from '@/types/crm';
import { Building2, TrendingUp } from 'lucide-react';

export const BreakEvenGauge = () => {
  const { financials } = useCrm();
  const { current_monthly_revenue, fixed_monthly_cost, monthly_target } = financials;

  const reachedBreakEven = current_monthly_revenue >= fixed_monthly_cost;
  const surplus = Math.max(0, current_monthly_revenue - fixed_monthly_cost);

  // Visualizziamo due segmenti sull'anello: 0..366 e 366..target
  const radius = 80;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;

  const breakEvenPct = Math.min(1, current_monthly_revenue / fixed_monthly_cost);
  const breakEvenSweep = circumference * 0.5 * breakEvenPct; // metà superiore = base

  const surplusTarget = Math.max(monthly_target - fixed_monthly_cost, 1);
  const surplusPct = Math.min(1, surplus / surplusTarget);
  const surplusSweep = circumference * 0.5 * surplusPct;

  // tracciato semi-cerchio: useremo strokeDasharray con 50%
  const halfCircle = circumference / 2;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Break-Even Mensile</p>
          <p className="text-[11px] text-muted-foreground">Affitto fisso {formatEuro(fixed_monthly_cost)}</p>
        </div>
        <div
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            reachedBreakEven ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'
          }`}
        >
          {reachedBreakEven ? 'In Profitto' : 'Sotto Soglia'}
        </div>
      </div>

      <div className="relative mt-4 mx-auto w-full max-w-[260px]">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Track semicircolare */}
          <path
            d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Segmento 0 → break-even (warning) */}
          <path
            d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
            fill="none"
            stroke="hsl(var(--warning))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${breakEvenSweep} ${halfCircle}`}
            className="transition-smooth"
          />
          {/* Segmento break-even → target (primary, surplus) */}
          {reachedBreakEven && (
            <path
              d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${halfCircle * 0.5 + surplusSweep} ${halfCircle}`}
              className="transition-smooth"
            />
          )}
          {/* Tacca break-even */}
          <line
            x1="100" y1="20" x2="100" y2="34"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatEuro(current_monthly_revenue)}
          </p>
          <p
            className={`text-xs font-semibold ${
              reachedBreakEven ? 'text-primary' : 'text-warning'
            }`}
          >
            {reachedBreakEven
              ? `+${formatEuro(surplus)} di profitto`
              : `${formatEuro(fixed_monthly_cost - current_monthly_revenue)} al pareggio`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          Pareggio {formatEuro(fixed_monthly_cost)}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Obiettivo {formatEuro(monthly_target)}
        </span>
      </div>
    </div>
  );
};
