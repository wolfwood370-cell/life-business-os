import { useParams, useNavigate } from 'react-router-dom';
import { useCrm, daysSince } from '@/store/crmStore';
import { ChevronLeft, Heart, Shield, Eye, Phone, Euro, CalendarClock } from 'lucide-react';
import { SourceBadge } from '@/components/crm/SourceBadge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PIPELINE_STAGES, PipelineStage, stageColorMap, pipelineStageLabel } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient, moveClient } = useCrm();
  const client = clients.find(c => c.id === id);

  const [motivator, setMotivator] = useState('');
  const [stated, setStated] = useState('');
  const [real, setReal] = useState('');
  const [monthlyValue, setMonthlyValue] = useState<string>('');
  const [renewal, setRenewal] = useState<string>('');

  useEffect(() => {
    if (client) {
      setMotivator(client.root_motivator);
      setStated(client.objection_stated);
      setReal(client.objection_real);
      setMonthlyValue(client.monthly_value ? String(client.monthly_value) : '');
      setRenewal(client.next_renewal_date ? client.next_renewal_date.slice(0, 10) : '');
    }
  }, [client]);

  if (!client) {
    return (
      <div className="px-4 pt-6">
        <p className="text-muted-foreground">Cliente non trovato.</p>
        <Button onClick={() => navigate('/clients')} className="mt-4">Torna ai clienti</Button>
      </div>
    );
  }

  const handleSave = () => {
    updateClient(client.id, {
      root_motivator: motivator,
      objection_stated: stated,
      objection_real: real,
      monthly_value: monthlyValue ? Number(monthlyValue) : undefined,
      next_renewal_date: renewal ? new Date(renewal).toISOString() : undefined,
    });
    toast.success('Profilo aggiornato');
  };

  const handleStageChange = (s: PipelineStage) => {
    moveClient(client.id, s);
    toast.success(`Spostato in "${pipelineStageLabel[s]}"`);
  };

  const stageColor = stageColorMap[client.pipeline_stage];

  return (
    <div className="pb-4 animate-fade-in">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-0 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary active:scale-95 transition-smooth">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold truncate flex-1">{client.name}</h1>
      </header>

      <div className="px-4 md:px-0 pt-5 space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {/* Profile header */}
        <div className="rounded-3xl gradient-card border border-border p-5 shadow-card md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary text-xl font-bold text-primary-foreground">
              {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate">{client.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <SourceBadge source={client.lead_source} />
              </div>
            </div>
          </div>

          {client.phone && (
            <a href={`tel:${client.phone}`} className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
              <Phone className="h-4 w-4" /> {client.phone}
            </a>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">In fase</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.stage_updated_at)}g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">Età contatto</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.created_at)}g</p>
            </div>
          </div>
        </div>

        {/* Stage */}
        <section className="md:col-span-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fase pipeline</label>
          <Select value={client.pipeline_stage} onValueChange={(v) => handleStageChange(v as PipelineStage)}>
            <SelectTrigger className="mt-2 h-14 rounded-xl border-0 bg-card text-base font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(--${stageColor}))` }} />
                <SelectValue>{pipelineStageLabel[client.pipeline_stage]}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{pipelineStageLabel[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </section>

        {/* Commercial info */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-4 md:col-span-2">
          <h3 className="font-semibold text-sm">Dati commerciali</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5" /> Valore Mensile (€)
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value)}
                placeholder="es. 200"
                className="h-12 rounded-xl bg-secondary border-0 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Data Prossimo Rinnovo
              </label>
              <Input
                type="date"
                value={renewal}
                onChange={(e) => setRenewal(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-0 text-base"
              />
            </div>
          </div>
        </section>

        {/* Root motivator */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm">Motivatore profondo</h3>
          </div>
          <p className="text-xs text-muted-foreground">Il "perché" emotivo dietro l'obiettivo.</p>
          <Textarea
            value={motivator}
            onChange={(e) => setMotivator(e.target.value)}
            placeholder="Cosa lo muove davvero?"
            className="min-h-[80px] rounded-xl bg-secondary border-0 text-sm"
          />
        </section>

        {/* Win/Loss analysis */}
        <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Analisi Win / Loss</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Obiezione dichiarata</label>
            </div>
            <Textarea
              value={stated}
              onChange={(e) => setStated(e.target.value)}
              placeholder="La scusa di superficie…"
              className="min-h-[60px] rounded-xl bg-secondary border-0 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Obiezione reale</label>
            </div>
            <Textarea
              value={real}
              onChange={(e) => setReal(e.target.value)}
              placeholder="La causa radice isolata…"
              className="min-h-[60px] rounded-xl bg-secondary border-0 text-sm"
            />
          </div>
        </section>

        <Button
          onClick={handleSave}
          className="md:col-span-2 w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow"
        >
          Salva modifiche
        </Button>
      </div>
    </div>
  );
};

export default ClientDetail;
