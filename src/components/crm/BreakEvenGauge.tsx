import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { Target, TrendingUp } from 'lucide-react';
import { PrivacyMask } from './PrivacyMask';

export const BreakEvenGauge = () => {
  const { financials, financialSummary } = useCrm();
  const { monthly_target } = financials;
  // Fonte di verità: ricavi lordi del mese dalle transazioni Saldate
  const current_monthly_revenue = financialSummary.gross_monthly;

  const safeTarget = Math.max(monthly_target, 1);
  const reachedTarget = current_monthly_revenue >= safeTarget;
  const surplus = Math.max(0, current_monthly_revenue - safeTarget);
  const remainingToTarget = Math.max(0, safeTarget - current_monthly_revenue);

  const radius = 80;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const halfCircle = circumference / 2;

  const targetPct = Math.min(1, current_monthly_revenue / safeTarget);
  const targetSweep = halfCircle * targetPct;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avanzamento Mensile</p>
          <p className="text-[11px] text-muted-foreground">Target dinamico <PrivacyMask>{formatEuro(monthly_target)}</PrivacyMask></p>
        </div>
        <div
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            reachedTarget ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'
          }`}
        >
          {reachedTarget ? 'Target Raggiunto' : 'In Avanzamento'}
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
          {/* Segmento 0 → target */}
          <path
            d={`M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 ${100 + radius} 100`}
            fill="none"
            stroke={reachedTarget ? 'hsl(var(--primary))' : 'hsl(var(--warning))'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${targetSweep} ${halfCircle}`}
            className="transition-smooth"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            <PrivacyMask>{formatEuro(current_monthly_revenue)}</PrivacyMask>
          </p>
          <p
            className={`text-xs font-semibold ${
              reachedTarget ? 'text-primary' : 'text-warning'
            }`}
          >
            {reachedTarget
              ? <>+<PrivacyMask>{formatEuro(surplus)}</PrivacyMask> oltre il target</>
              : <><PrivacyMask>{formatEuro(remainingToTarget)}</PrivacyMask> al target</>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          Obiettivo <PrivacyMask>{formatEuro(monthly_target)}</PrivacyMask>
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {Math.round(targetPct * 100)}%
        </span>
      </div>
    </div>
  );
};
