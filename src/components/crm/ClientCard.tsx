import {
  Client,
  CONTRACT_DURATION_OPTIONS,
  ContractDurationMonths,
  CUSTOM_PRICE_SERVICES,
  PIPELINE_STAGES,
  pipelineStageLabel,
  stageColorMap,
  PipelineStage,
  SERVICE_GROUPS,
  ServiceType,
  SHORT_DURATION_SERVICES,
  NO_DURATION_SERVICES,
} from '@/types/crm';
import { SourceBadge } from './SourceBadge';
import { LeadScoreBadge } from './ScoreBadges';
import { daysSince, useCrm } from '@/store/useCrm';
import { CalendarClock, Clock, Euro, Loader2, MoveRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useState } from 'react';
import { computeContractEndDate, parseCurrencyInput } from '@/lib/contracts';
import { todayIso } from '@/lib/date';

const daysUntil = (iso?: string): number | null => {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export const ClientCard = ({ client, compact = false }: { client: Client; compact?: boolean }) => {
  const navigate = useNavigate();
  const { moveClient, updateClient } = useCrm();
  const [updating, setUpdating] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeService, setCloseService] = useState<ServiceType | undefined>(client.service_sold);
  const [closePrice, setClosePrice] = useState(client.actual_price ? String(client.actual_price) : '');
  const [closeStart, setCloseStart] = useState(client.training_start_date?.slice(0, 10) ?? todayIso());
  const [closeDuration, setCloseDuration] = useState<ContractDurationMonths>(3);
  const days = daysSince(client.stage_updated_at);
  const color = stageColorMap[client.pipeline_stage];

  const trainingDaysLeft = daysUntil(client.training_end_date);
  const isTrainingExpiringSoon =
    typeof trainingDaysLeft === 'number' && trainingDaysLeft >= 0 && trainingDaysLeft <= 15;

  const handleStageChange = async (stage: string) => {
    if (stage === client.pipeline_stage) return;
    if (stage === 'Closed Won') {
      setCloseService(client.service_sold);
      setClosePrice(client.actual_price ? String(client.actual_price) : '');
      setCloseStart(client.training_start_date?.slice(0, 10) ?? todayIso());
      setCloseDialogOpen(true);
      return;
    }
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

  const handleConfirmClosedWon = async () => {
    if (!closeService) {
      toast.error('Seleziona il servizio venduto');
      return;
    }
    const effectiveStart = closeStart || todayIso();
    const priceNum = parseCurrencyInput(closePrice);
    const computedEnd = computeContractEndDate(effectiveStart, closeService, closeDuration);
    // For NO_DURATION services computedEnd is undefined → send null to clear any stale value in DB.
    const effectiveEnd = (computedEnd ?? null) as unknown as string | undefined;
    setUpdating(true);
    try {
      await updateClient(client.id, {
        pipeline_stage: 'Closed Won',
        stage_updated_at: new Date().toISOString(),
        churn_risk: client.churn_risk ?? 'Basso',
        service_sold: closeService,
        actual_price: priceNum,
        training_start_date: effectiveStart,
        training_end_date: effectiveEnd,
      });
      toast.success('Cliente attivato con contratto salvato');
      setCloseDialogOpen(false);
    } catch {
      toast.error('Impossibile attivare il contratto');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
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
          <div className="flex items-center gap-1.5 shrink-0">
            {isTrainingExpiringSoon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning animate-pulse"
                    aria-label="Percorso in scadenza"
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  Percorso in scadenza tra {trainingDaysLeft}{trainingDaysLeft === 1 ? ' giorno' : ' giorni'}. Prepara il rinnovo.
                </TooltipContent>
              </Tooltip>
            )}
            {typeof client.lead_score === 'number' && (
              <LeadScoreBadge score={client.lead_score} size="sm" />
            )}
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
    <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attiva Contratto</DialogTitle>
          <DialogDescription>
            Imposta servizio, valore e periodo prima di spostare il lead in Cliente Attivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Servizio Venduto
            </Label>
            <Select
              value={closeService}
              onValueChange={(v) => {
                const next = v as ServiceType;
                setCloseService(next);
                if (CUSTOM_PRICE_SERVICES.includes(next)) setClosePrice('');
              }}
            >
              <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-sm font-semibold">
                <SelectValue placeholder="Seleziona servizio…" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_GROUPS.map(group => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{group.label}</SelectLabel>
                    {group.items.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Euro className="h-3 w-3" /> Valore Contratto (€)
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                placeholder="es. 1250"
                className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" /> Inizio Percorso
              </Label>
              <Input
                type="date"
                value={closeStart}
                onChange={(e) => setCloseStart(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-0 text-sm font-semibold"
              />
            </div>
          </div>

          {closeService && NO_DURATION_SERVICES.includes(closeService) ? (
            <div className="h-12 rounded-xl bg-muted/40 border border-border flex items-center px-3 text-sm font-semibold text-muted-foreground">
              Durata: nessuna
            </div>
          ) : closeService && SHORT_DURATION_SERVICES.includes(closeService) ? (
            <div className="h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center px-3 text-sm font-semibold text-foreground">
              Durata: 28 giorni (auto)
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" /> Durata Percorso (1m = 28gg)
              </Label>
              <Select value={String(closeDuration)} onValueChange={(v) => setCloseDuration(Number(v) as ContractDurationMonths)}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_DURATION_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleConfirmClosedWon} disabled={updating} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
            {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            Salva Contratto e Attiva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
