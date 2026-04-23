import { ChurnRisk } from '@/types/crm';

const styles: Record<ChurnRisk, string> = {
  Basso: 'bg-primary/15 text-primary',
  Medio: 'bg-warning/15 text-warning',
  Alto: 'bg-destructive/15 text-destructive',
};

export const ChurnBadge = ({ risk }: { risk: ChurnRisk }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[risk]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    Churn {risk}
  </span>
);

export const LeadScoreBadge = ({ score }: { score: number }) => {
  const tone =
    score >= 70 ? 'bg-primary/15 text-primary border-primary/30'
    : score >= 40 ? 'bg-warning/15 text-warning border-warning/30'
    : 'bg-destructive/15 text-destructive border-destructive/30';
  const label =
    score >= 70 ? 'Caldo' : score >= 40 ? 'Tiepido' : 'Freddo';
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 ${tone}`}>
      <span className="text-sm font-bold leading-none">{score}<span className="text-[10px] font-medium opacity-70">/100</span></span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};
