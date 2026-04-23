import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCrm } from '@/store/useCrm';
import { LEAD_SOURCES, PIPELINE_STAGES, LeadSource, PipelineStage, leadSourceLabel, pipelineStageLabel } from '@/types/crm';
import { baseLeadScore } from '@/lib/leadScore';
import { toast } from 'sonner';
import { CalendarDays, ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const todayLabel = () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export const QuickAddModal = ({ open, onOpenChange }: Props) => {
  const { addClient } = useCrm();
  const [name, setName] = useState('');
  const [source, setSource] = useState<LeadSource>('Gym Floor');
  const [stage, setStage] = useState<PipelineStage>('Lead Acquired');
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Il nome è obbligatorio');
      return;
    }
    try {
      await addClient({
        name: name.trim(),
        lead_source: source,
        pipeline_stage: stage,
        root_motivator: '',
        objection_stated: '',
        objection_real: '',
        last_contacted_at: new Date().toISOString(),
        lead_score: baseLeadScore(source),
        churn_risk: 'Basso',
        gdpr_consent: gdprConsent,
      });
      toast.success(`${name} aggiunto alla pipeline`);
      setName('');
      setSource('Gym Floor');
      setStage('Lead Acquired');
      setGdprConsent(false);
      onOpenChange(false);
    } catch (e) {
      toast.error('Errore nel salvataggio');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Aggiungi Lead</DialogTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Oggi · {todayLabel()}</span>
          </div>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Marco Rossi"
              autoFocus
              className="h-12 rounded-xl bg-secondary border-0 text-base"
            />
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
