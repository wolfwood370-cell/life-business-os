import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Save, Loader2, Sparkles, MessageSquareQuote, Gift, Package } from 'lucide-react';
import { toast } from 'sonner';

interface SalesCoachConfig {
  id: string;
  sales_script: string;
  free_session_process: string;
  pt_pack_process: string;
}

const SalesStrategy = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SalesCoachConfig | null>(null);
  const [script, setScript] = useState('');
  const [freeSession, setFreeSession] = useState('');
  const [ptPack, setPtPack] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('sales_coach_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error('Impossibile caricare la strategia');
      } else if (data) {
        setConfig({
          id: data.id,
          sales_script: data.sales_script ?? '',
          free_session_process: data.free_session_process ?? '',
          pt_pack_process: data.pt_pack_process ?? '',
        });
        setScript(data.sales_script ?? '');
        setFreeSession(data.free_session_process ?? '');
        setPtPack(data.pt_pack_process ?? '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('sales_coach_config')
        .update({
          sales_script: script,
          free_session_process: freeSession,
          pt_pack_process: ptPack,
        })
        .eq('id', config.id);
      if (error) throw error;
      toast.success('Strategia salvata');
      setConfig({ ...config, sales_script: script, free_session_process: freeSession, pt_pack_process: ptPack });
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!config &&
    (script !== config.sales_script ||
      freeSession !== config.free_session_process ||
      ptPack !== config.pt_pack_process);

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Knowledge Base</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Sales Strategy</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Il cervello operativo del tuo Sales Coach AI: script, processi e procedure che usi ogni giorno.
        </p>
      </header>

      {/* Contextual info card */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Questo è il "cervello" del Sales Coach AI</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Ogni volta che generi un Report Settimanale, l'AI legge queste informazioni e confronta le
              obiezioni reali dei clienti persi con il tuo script e i tuoi processi. Più dettagli scrivi qui,
              più precisi e personalizzati saranno i consigli strategici.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Script di Vendita */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquareQuote className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Script di Vendita</h3>
                <p className="text-[11px] text-muted-foreground">
                  Come presenti il servizio quando approcci in sala o in consulenza.
                </p>
              </div>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Es. Apertura → domanda sui risultati cercati → bridge al dolore → offerta → gestione obiezioni…"
              className="min-h-[160px] rounded-xl bg-secondary/40 border-border text-sm"
            />
          </section>

          {/* Sessioni Gratuite */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Gestione Sessioni Gratuite</h3>
                <p className="text-[11px] text-muted-foreground">
                  Come strutturi la prova gratuita e la trasformi in pitch.
                </p>
              </div>
            </div>
            <Textarea
              value={freeSession}
              onChange={(e) => setFreeSession(e.target.value)}
              placeholder="Es. Intro 2 min, analisi postura, test di forza, esercizio chiave, chiusura con proposta concreta…"
              className="min-h-[140px] rounded-xl bg-secondary/40 border-border text-sm"
            />
          </section>

          {/* PT Pack */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Gestione PT Pack</h3>
                <p className="text-[11px] text-muted-foreground">
                  Come gestisci i pacchetti PT a 99€ e il passaggio al percorso premium.
                </p>
              </div>
            </div>
            <Textarea
              value={ptPack}
              onChange={(e) => setPtPack(e.target.value)}
              placeholder="Es. 4 sessioni, diario motivazionale, checkpoint a metà pacchetto, upsell al percorso mensile…"
              className="min-h-[140px] rounded-xl bg-secondary/40 border-border text-sm"
            />
          </section>

          <div className="sticky bottom-4 md:static">
            <Button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="w-full h-14 rounded-xl text-base font-semibold gradient-primary text-primary-foreground shadow-glow"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> {dirty ? 'Salva modifiche' : 'Tutto salvato'}</>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Questi contenuti vengono letti dall'AI ad ogni "Genera Report Settimanale".
          </p>
        </>
      )}
    </div>
  );
};

export default SalesStrategy;
