import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCrm } from '@/store/useCrm';
import {
  CONTRACT_DURATION_OPTIONS,
  ContractDurationMonths,
  CUSTOM_PRICE_SERVICES,
  LEAD_SOURCES,
  LeadSource,
  PipelineStage,
  PIPELINE_STAGES,
  ServiceType,
  SERVICE_GROUPS,
  SHORT_DURATION_SERVICES,
  leadSourceLabel,
  pipelineStageLabel,
} from '@/types/crm';
import { baseLeadScore } from '@/lib/leadScore';
import { toast } from 'sonner';
import { CalendarClock, CalendarDays, Euro, ShieldCheck, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeContractEndDate, parseCurrencyInput } from '@/lib/contracts';
import { todayIso } from '@/lib/date';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const todayLabel = () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export const QuickAddModal = ({ open, onOpenChange }: Props) => {
  const { addClient } = useCrm();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [source, setSource] = useState<LeadSource>('Gym Floor');
  const [stage, setStage] = useState<PipelineStage>('Lead Acquired');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [serviceSold, setServiceSold] = useState<ServiceType | undefined>(undefined);
  const [actualPrice, setActualPrice] = useState('');
  const [trainingStart, setTrainingStart] = useState(todayIso());
  const [contractDuration, setContractDuration] = useState<ContractDurationMonths>(3);

  const handleSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn && !ln) {
      toast.error('Nome o Cognome obbligatorio');
      return;
    }
    const fullName = [fn, ln].filter(Boolean).join(' ');
    const priceNum = parseCurrencyInput(actualPrice);
    const effectiveStart = stage === 'Closed Won' && serviceSold ? (trainingStart || todayIso()) : undefined;
    const effectiveEnd = effectiveStart
      ? computeContractEndDate(effectiveStart, serviceSold, contractDuration)
      : undefined;
    try {
      await addClient({
        name: fullName,
        first_name: fn || undefined,
        last_name: ln || undefined,
        lead_source: source,
        pipeline_stage: stage,
        root_motivator: '',
        objection_stated: '',
        objection_real: '',
        last_contacted_at: new Date().toISOString(),
        lead_score: baseLeadScore(source),
        churn_risk: 'Basso',
        gdpr_consent: gdprConsent,
        service_sold: stage === 'Closed Won' ? serviceSold : undefined,
        actual_price: stage === 'Closed Won' ? priceNum : undefined,
        training_start_date: effectiveStart,
        training_end_date: effectiveEnd,
      });
      toast.success(`${fullName} aggiunto alla pipeline`);
      setFirstName('');
      setLastName('');
      setSource('Gym Floor');
      setStage('Lead Acquired');
      setGdprConsent(false);
      setServiceSold(undefined);
      setActualPrice('');
      setTrainingStart(todayIso());
      setContractDuration(3);
      onOpenChange(false);
    } catch {
      toast.error('Errore nel salvataggio');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Aggiungi Lead</DialogTitle>
          <DialogDescription className="sr-only">Inserisci nome, fonte e stage del nuovo lead.</DialogDescription>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Oggi · {todayLabel()}</span>
          </div>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="es. Marco"
                autoFocus
                className="h-12 rounded-xl bg-secondary border-0 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground">Cognome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="es. Rossi"
                className="h-12 rounded-xl bg-secondary border-0 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fonte contatto</Label>
            <ToggleGroup
              type="single"
              value={source}
              onValueChange={(v) => v && setSource(v as LeadSource)}
              className="grid grid-cols-2 gap-2"
            >
              {LEAD_SOURCES.map(s => (
                <ToggleGroupItem
                  key={s}
                  value={s}
                  className="h-11 rounded-xl bg-secondary border-0 text-xs font-semibold data-[state=on]:gradient-primary data-[state=on]:text-primary-foreground"
                >
                  {leadSourceLabel[s]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fase pipeline</Label>
            <ToggleGroup
              type="single"
              value={stage}
              onValueChange={(v) => v && setStage(v as PipelineStage)}
              className="grid grid-cols-2 gap-2"
            >
              {PIPELINE_STAGES.map(s => (
                <ToggleGroupItem
                  key={s}
                  value={s}
                  className="h-11 rounded-xl bg-secondary border-0 text-xs font-semibold data-[state=on]:gradient-primary data-[state=on]:text-primary-foreground"
                >
                  {pipelineStageLabel[s]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 cursor-pointer hover:bg-secondary/60 transition-smooth">
            <Checkbox
              checked={gdprConsent}
              onCheckedChange={(v) => setGdprConsent(v === true)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Consenso Privacy & Marketing Acquisito</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Necessario per attivare l'AI Sales Assistant e l'invio di follow-up.
              </p>
            </div>
          </label>

          <Button onClick={handleSave} className="w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow">
            Salva Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
