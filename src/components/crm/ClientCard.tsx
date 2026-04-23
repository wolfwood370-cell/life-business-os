import { Client, PIPELINE_STAGES, pipelineStageLabel, stageColorMap, PipelineStage } from '@/types/crm';
import { SourceBadge } from './SourceBadge';
import { LeadScoreBadge } from './ScoreBadges';
import { daysSince, useCrm } from '@/store/useCrm';
import { Clock, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';

export const ClientCard = ({ client, compact = false }: { client: Client; compact?: boolean }) => {
  const navigate = useNavigate();
  const { moveClient } = useCrm();
  const [updating, setUpdating] = useState(false);
  const days = daysSince(client.stage_updated_at);
  const color = stageColorMap[client.pipeline_stage];

  const handleStageChange = async (stage: string) => {
    if (stage === client.pipeline_stage) return;
    setUpdating(true);
    try {
      await moveClient(client.id, stage as PipelineStage);
      toast.success(`Spostato in "${pipelineStageLabel[stage as PipelineStage]}"`);
    } catch {
      toast.error('Impossibile aggiornare la fase');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border border-border bg-card p-3.5 transition-smooth hover:border-primary/40 ${
        updating ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <button
        onClick={() => navigate(`/clients/${client.id}`)}
        className="w-full text-left active:scale-[0.99] transition-smooth"
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
          {typeof client.lead_score === 'number' && (
            <LeadScoreBadge score={client.lead_score} size="sm" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <SourceBadge source={client.lead_source} />
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {days}g in fase
          </span>
        </div>
      </button>

      <div
        className="mt-3 pt-3 border-t border-border/60"
        onClick={(e) => e.stopPropagation()}
      >
        <Select value={client.pipeline_stage} onValueChange={handleStageChange} disabled={updating}>
          <SelectTrigger
            className="h-8 text-xs rounded-lg border-border bg-secondary/40 hover:bg-secondary transition-smooth"
            aria-label="Cambia fase pipeline"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MoveRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `hsl(var(--${color}))` }}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map(stage => (
              <SelectItem key={stage} value={stage} className="text-xs">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `hsl(var(--${stageColorMap[stage]}))` }}
                  />
                  {pipelineStageLabel[stage]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
