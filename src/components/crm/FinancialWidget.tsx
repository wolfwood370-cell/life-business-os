import { useCrm } from '@/store/crmStore';
import { formatEuro } from '@/types/crm';
import { Building2, Target, TrendingUp } from 'lucide-react';
import { PrivacyMask } from './PrivacyMask';

interface GaugeProps {
  value: number;
  target: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  colorVar: string; // e.g. '--primary'
}

const Gauge = ({ value, target, label, sublabel, icon, colorVar }: GaugeProps) => {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const reached = value >= target;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `hsl(var(${colorVar}) / 0.12)`, color: `hsl(var(${colorVar}))` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={`hsl(var(${colorVar}))`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-smooth"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight">{Math.round(pct)}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">completato</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-foreground"><PrivacyMask>{formatEuro(value)}</PrivacyMask></span>
        <span className="text-muted-foreground">su <PrivacyMask>{formatEuro(target)}</PrivacyMask></span>
      </div>
      <p className={`mt-1 text-xs font-medium ${reached ? 'text-primary' : 'text-muted-foreground'}`}>
        {reached
          ? <>Obiettivo superato di <PrivacyMask>{formatEuro(value - target)}</PrivacyMask></>
          : <>Mancano <PrivacyMask>{formatEuro(target - value)}</PrivacyMask></>}
      </p>
    </div>
  );
};

export const FinancialWidget = () => {
  const { financials } = useCrm();
  const { current_monthly_revenue, fixed_monthly_cost, monthly_target } = financials;
  const profit = current_monthly_revenue - fixed_monthly_cost;
  const aboveBreakEven = profit >= 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl gradient-card border border-border p-5 shadow-card">
        <div className="absolute inset-0 gradient-emerald-glow pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ricavi Totali del Mese</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
              <PrivacyMask>{formatEuro(current_monthly_revenue)}</PrivacyMask>
            </p>
            <p className={`mt-1 text-sm font-medium ${aboveBreakEven ? 'text-primary' : 'text-warning'}`}>
              {aboveBreakEven
                ? <>+<PrivacyMask>{formatEuro(profit)}</PrivacyMask> di profitto netto</>
                : <><PrivacyMask>{formatEuro(Math.abs(profit))}</PrivacyMask> al pareggio</>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Gauge
          value={current_monthly_revenue}
          target={fixed_monthly_cost}
          label="Pareggio Affitto"
          sublabel={`Soglia ${formatEuro(fixed_monthly_cost)}`}
          icon={<Building2 className="h-4 w-4" />}
          colorVar="--warning"
        />
        <Gauge
          value={current_monthly_revenue}
          target={monthly_target}
          label="Obiettivo Mensile"
          sublabel={`Target ${formatEuro(monthly_target)}`}
          icon={<Target className="h-4 w-4" />}
          colorVar="--primary"
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span>
          {aboveBreakEven
            ? 'Stai operando in profitto. Ogni nuovo cliente è guadagno netto.'
            : 'Sei sotto la soglia di pareggio: chiudi il prossimo lead per coprire i costi fissi.'}
        </span>
      </div>
    </div>
  );
};
