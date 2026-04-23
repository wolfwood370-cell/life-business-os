import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Client } from '@/types/crm';
import { toast } from 'sonner';

interface DayMessage {
  title: string;
  message: string;
}
interface Sequence {
  day_1: DayMessage;
  day_3: DayMessage;
  day_7: DayMessage;
}

interface Props {
  client: Client;
}

const ELIGIBLE_STAGES = ['Nurturing', 'Closed Lost'];

const dayConfig: Array<{ key: keyof Sequence; label: string; badge: string }> = [
  { key: 'day_1', label: 'Giorno 1', badge: 'Aggancio' },
  { key: 'day_3', label: 'Giorno 3', badge: 'Obiezione' },
  { key: 'day_7', label: 'Giorno 7', badge: 'Chiusura Soft' },
];

export const AiFollowupGenerator = ({ client }: Props) => {
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const eligible = ELIGIBLE_STAGES.includes(client.pipeline_stage);
  const hasConsent = !!client.gdpr_consent;

  const handleGenerate = async () => {
    if (!eligible || !hasConsent) return;
    setLoading(true);
    setSequence(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sales-copy', {
        body: {
          name: client.name,
          lead_source: client.lead_source,
          root_motivator: client.root_motivator,
          objection_stated: client.objection_stated,
          objection_real: client.objection_real,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.sequence) throw new Error('Risposta AI vuota');
      setSequence(data.sequence as Sequence);
      toast.success('Sequenza follow-up generata');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generazione AI fallita';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('Copiato negli appunti');
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      toast.error('Impossibile copiare');
    }
  };

  return (
    <section className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-4 space-y-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-glow">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground">AI Sales Assistant</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Sequenza WhatsApp personalizzata su Motivazione e Obiezione Reale.
          </p>
        </div>
      </div>

      {!eligible ? (
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border p-3">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Disponibile solo per clienti in <strong>In Trattativa</strong> o <strong>Perso / Recupero</strong>.
          </p>
        </div>
      ) : !hasConsent ? (
        <div className="flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/30 p-3" title="Spunta 'Consenso Privacy & Marketing' nei dati anagrafici per sbloccare l'AI.">
          <Lock className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-foreground">
            <strong>Consenso GDPR mancante.</strong> Acquisisci il consenso Privacy & Marketing prima di generare follow-up.
          </p>
        </div>
      ) : (
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-12 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-glow"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generazione in corso…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Genera Follow-up AI</>
          )}
        </Button>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </div>
      )}

      {sequence && !loading && (
        <div className="space-y-3">
          {dayConfig.map(({ key, label, badge }) => {
            const m = sequence[key];
            if (!m) return null;
            const isCopied = copiedKey === key;
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                      {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{badge}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(key, m.message)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    {isCopied ? <><Check className="h-3.5 w-3.5" /> Copiato</> : <><Copy className="h-3.5 w-3.5" /> Copia</>}
                  </button>
                </div>
                {m.title && <p className="text-xs font-semibold text-foreground mb-1">{m.title}</p>}
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{m.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
