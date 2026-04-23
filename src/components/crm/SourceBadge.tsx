import { LeadSource, sourceColorMap, leadSourceLabel } from '@/types/crm';
import { cn } from '@/lib/utils';

export const SourceBadge = ({ source, className }: { source: LeadSource; className?: string }) => {
  const color = sourceColorMap[source];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        className
      )}
      style={{
        backgroundColor: `hsl(var(--${color}) / 0.14)`,
        color: `hsl(var(--${color}))`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(var(--${color}))` }} />
      {leadSourceLabel[source]}
    </span>
  );
};
