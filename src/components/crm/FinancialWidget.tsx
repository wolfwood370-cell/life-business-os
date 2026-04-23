import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { ArrowDown, ArrowUp, CalendarRange, TrendingUp, Wallet } from 'lucide-react';
import { PrivacyMask } from './PrivacyMask';

interface MetricCardProps {
  label: string;
  sublabel: string;
  value: number;
  variant: 'gross' | 'net';
  icon: React.ReactNode;
}

const MetricCard = ({ label, sublabel, value, variant, icon }: MetricCardProps) => {
  const isNet = variant === 'net';
  const isPositive = value >= 0;

  // Colori condizionali per il netto: rosso se negativo, verde se positivo
  let valueColor = 'text-foreground';
  let badgeBg = 'bg-secondary';
  let badgeText = 'text-muted-foreground';
  if (isNet) {
    if (isPositive) {
      valueColor = 'text-primary';
      badgeBg = 'bg-primary/12';
      badgeText = 'text-primary';
    } else {
      valueColor = 'text-destructive';
      badgeBg = 'bg-destructive/12';
      badgeText = 'text-destructive';
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-card ${
        isNet
          ? isPositive
            ? 'border-primary/30 bg-primary/5'
            : 'border-destructive/30 bg-destructive/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${badgeBg} ${badgeText}`}>
          {icon}
        </div>
        {isNet && (
          <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg} ${badgeText}`}>
            {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {isPositive ? 'Profitto' : 'Sotto'}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${valueColor}`}>
          <PrivacyMask>{formatEuro(value)}</PrivacyMask>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
};

export const FinancialWidget = () => {
  const { financialSummary } = useCrm();
  const {
    gross_monthly,
    net_monthly,
    gross_ytd,
    net_ytd,
    fixed_monthly_cost,
    current_month_number,
  } = financialSummary;

  const aboveBreakEven = net_monthly >= 0;

  return (
    <div className="space-y-4">
      {/* Hero ricavi mese */}
      <div className="relative overflow-hidden rounded-3xl gradient-card border border-border p-5 shadow-card">
        <div className="absolute inset-0 gradient-emerald-glow pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fatturato Lordo del Mese</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
            <PrivacyMask>{formatEuro(gross_monthly)}</PrivacyMask>
          </p>
          <p className={`mt-1 text-sm font-medium ${aboveBreakEven ? 'text-primary' : 'text-destructive'}`}>
            {aboveBreakEven
              ? <>+<PrivacyMask>{formatEuro(net_monthly)}</PrivacyMask> netti dopo tasse e affitto</>
              : <>Mancano <PrivacyMask>{formatEuro(Math.abs(net_monthly))}</PrivacyMask> per coprire tasse + {formatEuro(fixed_monthly_cost)}</>}
          </p>
        </div>
      </div>

      {/* Griglia 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Lordo Mese"
          sublabel="Incassi mese corrente"
          value={gross_monthly}
          variant="gross"
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Netto Mese"
          sublabel={`Dopo 24,9% + ${formatEuro(fixed_monthly_cost)}`}
          value={net_monthly}
          variant="net"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Lordo dal 1° Gen"
          sublabel="Anno in corso (YTD)"
          value={gross_ytd}
          variant="gross"
          icon={<CalendarRange className="h-4 w-4" />}
        />
        <MetricCard
          label="Netto dal 1° Gen"
          sublabel={`Dopo 24,9% + ${formatEuro(fixed_monthly_cost * current_month_number)} affitti`}
          value={net_ytd}
          variant="net"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};
