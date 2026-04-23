import { Client } from '@/types/crm';
import { SourceBadge } from './SourceBadge';
import { daysSince } from '@/store/crmStore';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClientCard = ({ client, compact = false }: { client: Client; compact?: boolean }) => {
  const navigate = useNavigate();
  const days = daysSince(client.stage_updated_at);
  return (
    <button
      onClick={() => navigate(`/clients/${client.id}`)}
      className="w-full text-left rounded-2xl border border-border bg-card p-3.5 transition-smooth active:scale-[0.98] hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-foreground">
            {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{client.name}</p>
            {!compact && client.root_motivator && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{client.root_motivator}</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <SourceBadge source={client.lead_source} />
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          {days}g in fase
        </span>
      </div>
    </button>
  );
};
