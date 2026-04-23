import { useCrm } from '@/store/crmStore';
import { TrendingUp, Target, Building2 } from 'lucide-react';
import { formatEuro } from '@/types/crm';

export const FinancialWidget = () => {
  const { financials } = useCrm();
  const { current_monthly_revenue, fixed_monthly_cost, monthly_target } = financials;

  const breakEvenPct = Math.min(100, (current_monthly_revenue / fixed_monthly_cost) * 100);
  const targetPct = Math.min(100, (current_monthly_revenue / monthly_target) * 100);
  const profit = current_monthly_revenue - fixed_monthly_cost;
  const aboveBreakEven = profit >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl gradient-card border border-border p-5 shadow-card">
      <div className="absolute inset-0 gradient-emerald-glow pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fatturato del mese</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {formatEuro(current_monthly_revenue)}
            </p>
            <p className={`mt-1 text-sm font-medium ${aboveBreakEven ? 'text-primary' : 'text-warning'}`}>
              {aboveBreakEven ? `+${formatEuro(profit)} di profitto` : `${formatEuro(Math.abs(profit))} al pareggio`}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Target className="h-3 w-3" />
              <span>Obiettivo {formatEuro(monthly_target)}</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Building2 className="h-3 w-3" />
              <span>Affitto {formatEuro(fixed_monthly_cost)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Break-even ({formatEuro(fixed_monthly_cost)})</span>
              <span>{Math.round(breakEvenPct)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-smooth ${aboveBreakEven ? 'gradient-primary' : 'bg-warning'}`}
                style={{ width: `${breakEvenPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Obiettivo Mensile</span>
              <span>{Math.round(targetPct)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary/50 transition-smooth" style={{ width: `${targetPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
