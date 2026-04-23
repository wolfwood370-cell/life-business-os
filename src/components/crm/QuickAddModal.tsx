import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCrm } from '@/store/crmStore';
import { LEAD_SOURCES, PIPELINE_STAGES, LeadSource, PipelineStage, leadSourceLabel, pipelineStageLabel } from '@/types/crm';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';

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

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Il nome è obbligatorio');
      return;
    }
    addClient({
      name: name.trim(),
      lead_source: source,
      pipeline_stage: stage,
      root_motivator: '',
      objection_stated: '',
      objection_real: '',
    });
    toast.success(`${name} aggiunto alla pipeline`);
    setName('');
    setSource('Gym Floor');
    setStage('Lead Acquired');
    onOpenChange(false);
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

          <Button onClick={handleSave} className="w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow">
            Salva Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
