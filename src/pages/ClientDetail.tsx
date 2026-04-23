import { useParams, useNavigate } from 'react-router-dom';
import { useCrm, daysSince } from '@/store/crmStore';
import {
  ChevronLeft, Heart, Shield, Eye, Phone, Euro, CalendarClock,
  Sparkles, Activity, Plus, Trash2, MessageSquare, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { SourceBadge } from '@/components/crm/SourceBadge';
import { ChurnBadge, LeadScoreBadge } from '@/components/crm/ScoreBadges';
import { AiFollowupGenerator } from '@/components/crm/AiFollowupGenerator';
import { RoiChart } from '@/components/crm/RoiChart';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PIPELINE_STAGES, PipelineStage, stageColorMap, pipelineStageLabel,
  CHURN_RISKS, ChurnRisk, RoiMetric,
  LEAD_SOURCES, LeadSource, leadSourceLabel,
  GENDERS, Gender, genderLabel,
} from '@/types/crm';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient, moveClient, addRoiMetric, removeRoiMetric, isLoading } = useCrm();
  const client = clients.find(c => c.id === id);

  const [motivator, setMotivator] = useState('');
  const [stated, setStated] = useState('');
  const [real, setReal] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [renewal, setRenewal] = useState('');
  const [lastContact, setLastContact] = useState('');
  const [score, setScore] = useState<number>(50);
  const [churn, setChurn] = useState<ChurnRisk>('Basso');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [gymSignup, setGymSignup] = useState('');
  const [gymExpiry, setGymExpiry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // ROI metric form
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricNote, setMetricNote] = useState('');

  useEffect(() => {
    if (client) {
      setMotivator(client.root_motivator);
      setStated(client.objection_stated);
      setReal(client.objection_real);
      setMonthlyValue(client.monthly_value ? String(client.monthly_value) : '');
      setRenewal(client.next_renewal_date ? client.next_renewal_date.slice(0, 10) : '');
      setLastContact(client.last_contacted_at ? client.last_contacted_at.slice(0, 10) : '');
      setScore(client.lead_score ?? 50);
      setChurn(client.churn_risk ?? 'Basso');
      setBirthDate(client.birth_date ? client.birth_date.slice(0, 10) : '');
      setGender(client.gender ?? '');
      setGymSignup(client.gym_signup_date ? client.gym_signup_date.slice(0, 10) : '');
      setGymExpiry(client.gym_expiry_date ? client.gym_expiry_date.slice(0, 10) : '');
      setPhone(client.phone ?? '');
      setEmail(client.email ?? '');
    }
  }, [client]);

  if (isLoading) {
    return <div className="px-4 pt-6"><p className="text-muted-foreground">Caricamento…</p></div>;
  }

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
      last_contacted_at: lastContact ? new Date(lastContact).toISOString() : undefined,
      lead_score: score,
      churn_risk: churn,
      birth_date: birthDate || undefined,
      gender: (gender || undefined) as Gender | undefined,
      gym_signup_date: gymSignup || undefined,
      gym_expiry_date: gymExpiry || undefined,
    });
    toast.success('Profilo aggiornato');
  };

  const handleSourceChange = (s: LeadSource) => {
    updateClient(client!.id, { lead_source: s });
    toast.success(`Fonte aggiornata: ${leadSourceLabel[s]}`);
  };

  const handleStageChange = (s: PipelineStage) => {
    moveClient(client.id, s);
    toast.success(`Spostato in "${pipelineStageLabel[s]}"`);
  };

  const handleAddRoi = async () => {
    if (!metricName.trim() || !metricValue.trim()) {
      toast.error('Inserisci metrica e valore');
      return;
    }
    await addRoiMetric(client.id, {
      metric: metricName.trim(),
      value: metricValue.trim(),
      note: metricNote.trim() || undefined,
    });
    setMetricName('');
    setMetricValue('');
    setMetricNote('');
    toast.success('Metrica ROI aggiunta');
  };

  const handleRemoveRoi = async (metricId: string) => {
    await removeRoiMetric(client.id, metricId);
  };

  const stageColor = stageColorMap[client.pipeline_stage];
  const isActiveClient = client.pipeline_stage === 'Closed Won';

  return (
    <div className="pb-4 animate-fade-in">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-0 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary active:scale-95 transition-smooth">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold truncate flex-1 text-foreground">{client.name}</h1>
      </header>

      <div className="px-4 md:px-0 pt-5 space-y-5">
        {/* Profile header con score + churn */}
        <div className="rounded-3xl gradient-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary text-xl font-bold text-primary-foreground">
              {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate text-foreground">{client.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <SourceBadge source={client.lead_source} />
                {client.churn_risk && <ChurnBadge risk={client.churn_risk} />}
              </div>
            </div>
            {typeof client.lead_score === 'number' && (
              <LeadScoreBadge score={client.lead_score} />
            )}
          </div>

          {client.phone && (
            <a href={`tel:${client.phone}`} className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
              <Phone className="h-4 w-4" /> {client.phone}
            </a>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">In Fase</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.stage_updated_at)}g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">Età Lead</p>
              <p className="mt-1 font-bold text-foreground">{daysSince(client.created_at)}g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-muted-foreground uppercase tracking-wider">Ultimo Contatto</p>
              <p className="mt-1 font-bold text-foreground">
                {client.last_contacted_at ? `${daysSince(client.last_contacted_at)}g fa` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stage + Source selectors */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fase pipeline</label>
            <Select value={client.pipeline_stage} onValueChange={(v) => handleStageChange(v as PipelineStage)}>
              <SelectTrigger className="mt-2 h-14 rounded-xl border border-border bg-card text-base font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(--${stageColor}))` }} />
                  <SelectValue>{pipelineStageLabel[client.pipeline_stage]}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{pipelineStageLabel[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fonte contatto</label>
            <Select value={client.lead_source} onValueChange={(v) => handleSourceChange(v as LeadSource)}>
              <SelectTrigger className="mt-2 h-14 rounded-xl border border-border bg-card text-base font-semibold">
                <SelectValue>{leadSourceLabel[client.lead_source]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{leadSourceLabel[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="strategia" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl bg-secondary p-1">
            <TabsTrigger value="strategia" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Strategia
            </TabsTrigger>
            <TabsTrigger value="commerciale" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Commerciale
            </TabsTrigger>
            <TabsTrigger value="roi" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              ROI
            </TabsTrigger>
          </TabsList>

          {/* TAB 1 — Strategia / Psicografica */}
          <TabsContent value="strategia" className="space-y-4 mt-4">
            {/* Motivazione Profonda */}
            <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Motivazione Profonda</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">I 5 Perché</p>
                </div>
              </div>
              <Textarea
                value={motivator}
                onChange={(e) => setMotivator(e.target.value)}
                placeholder="Cosa lo muove davvero? Scava fino al 5° perché…"
                className="min-h-[90px] rounded-xl bg-card border-border text-sm"
              />
            </section>

            {/* Win/Loss */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Analisi Win / Loss</h3>

              <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning text-warning-foreground">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-warning">Obiezione Dichiarata</label>
                </div>
                <Textarea
                  value={stated}
                  onChange={(e) => setStated(e.target.value)}
                  placeholder="La scusa di superficie…"
                  className="min-h-[60px] rounded-xl bg-card border-border text-sm"
                />
              </div>

              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-destructive">Obiezione Reale</label>
                </div>
                <Textarea
                  value={real}
                  onChange={(e) => setReal(e.target.value)}
                  placeholder="La vera causa radice isolata…"
                  className="min-h-[60px] rounded-xl bg-card border-border text-sm"
                />
              </div>
            </section>

            {/* AI Scoring & Churn */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-5 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Lead Score & Rischio</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lead Score (probabilità di conversione)
                  </label>
                  <LeadScoreBadge score={score} />
                </div>
                <Slider
                  value={[score]}
                  onValueChange={(v) => setScore(v[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Rischio di Abbandono
                </label>
                <Select value={churn} onValueChange={(v) => setChurn(v as ChurnRisk)}>
                  <SelectTrigger className="h-12 rounded-xl border border-border bg-card text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHURN_RISKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* AI Sales Assistant */}
            <AiFollowupGenerator client={client} />
          </TabsContent>

          {/* TAB 2 — Commerciale */}
          <TabsContent value="commerciale" className="space-y-4 mt-4">
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Dati Commerciali</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Euro className="h-3.5 w-3.5" /> Valore Mensile
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
                    <CalendarClock className="h-3.5 w-3.5" /> Prossimo Rinnovo
                  </label>
                  <Input
                    type="date"
                    value={renewal}
                    onChange={(e) => setRenewal(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Ultimo Contatto
                  </label>
                  <Input
                    type="date"
                    value={lastContact}
                    onChange={(e) => setLastContact(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Usato dal motore di automazione per i follow-up a 1, 3, 7 giorni.
                  </p>
                </div>
              </div>
            </section>

            {/* Anagrafica & Iscrizione palestra */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <h3 className="font-bold text-sm text-foreground">Anagrafica & Iscrizione</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data di nascita</label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sesso</label>
                  <Select value={gender || undefined} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold">
                      <SelectValue placeholder="Seleziona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{genderLabel[g]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Iscrizione palestra</label>
                  <Input
                    type="date"
                    value={gymSignup}
                    onChange={(e) => setGymSignup(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scadenza abbonamento</label>
                  <Input
                    type="date"
                    value={gymExpiry}
                    onChange={(e) => setGymExpiry(e.target.value)}
                    className="h-12 rounded-xl bg-secondary border-0 text-base"
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* TAB 3 — ROI */}
          <TabsContent value="roi" className="space-y-4 mt-4">
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-card">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Risultati Quantificabili</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Prove concrete del valore. Mostrale al cliente prima del rinnovo.
                  </p>
                </div>
              </div>

              {/* Grafico progressi */}
              {(client.roi_metrics?.length ?? 0) > 0 && (
                <RoiChart metrics={client.roi_metrics!} />
              )}

              {/* Lista metriche */}
              <div className="space-y-2">
                {(client.roi_metrics?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nessuna metrica registrata. Aggiungi il primo risultato qui sotto.
                    </p>
                  </div>
                ) : (
                  client.roi_metrics!.map(m => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground truncate">{m.metric}</p>
                          <p className="font-bold text-sm text-primary shrink-0">{m.value}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(m.date).toLocaleDateString('it-IT')}
                          {m.note ? ` · ${m.note}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveRoi(m.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth"
                        aria-label="Rimuovi metrica"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form aggiunta */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nuova metrica</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    placeholder="Metrica (es. Squat 1RM)"
                    className="h-11 rounded-xl bg-card border-border text-sm"
                  />
                  <Input
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Valore (es. +10kg)"
                    className="h-11 rounded-xl bg-card border-border text-sm"
                  />
                </div>
                <Input
                  value={metricNote}
                  onChange={(e) => setMetricNote(e.target.value)}
                  placeholder="Nota (opzionale)"
                  className="h-11 rounded-xl bg-card border-border text-sm"
                />
                <Button
                  onClick={handleAddRoi}
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Aggiungi Risultato
                </Button>
              </div>

              {!isActiveClient && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Il modulo ROI ha massimo impatto quando il lead è già "Cliente Attivo".
                </p>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSave}
          className="w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow"
        >
          Salva Modifiche
        </Button>
      </div>
    </div>
  );
};

export default ClientDetail;
