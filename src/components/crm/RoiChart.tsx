import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { RoiMetric } from '@/types/crm';
import { TrendingUp, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  metrics: RoiMetric[];
  clientName?: string;
}

// Group metrics by metric name; plot numeric portion of value over time
const extractNumber = (raw: string): number | null => {
  const m = raw.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

const palette = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export const RoiChart = ({ metrics, clientName }: Props) => {
  const { data, series } = useMemo(() => {
    const byDate: Record<string, Record<string, number | string>> = {};
    const seriesSet = new Set<string>();
    metrics
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(m => {
        const num = extractNumber(m.value);
        if (num === null) return;
        const dateKey = new Date(m.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
        byDate[dateKey][m.metric] = num;
        seriesSet.add(m.metric);
      });
    return { data: Object.values(byDate), series: Array.from(seriesSet) };
  }, [metrics]);

  if (data.length === 0 || series.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          Nessun dato numerico da visualizzare. Inserisci valori come "+10", "85", "22%" per vedere il grafico.
        </p>
      </div>
    );
  }

  const handleExport = async () => {
    const lines: string[] = [];
    lines.push(`💪 Report progressi${clientName ? ` — ${clientName}` : ''}`);
    lines.push('');
    // Latest value per metric
    const latest: Record<string, { value: string; date: string }> = {};
    metrics
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(m => { latest[m.metric] = { value: m.value, date: m.date }; });
    Object.entries(latest).forEach(([k, v]) => {
      const d = new Date(v.date).toLocaleDateString('it-IT');
      lines.push(`• ${k}: ${v.value}  (${d})`);
    });
    lines.push('');
    lines.push('Continua così, i risultati parlano da soli! 🚀');
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Report copiato — incollalo su WhatsApp');
    } catch {
      toast.error('Impossibile copiare il report');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Progressi nel tempo
        </p>
        <Button
          onClick={handleExport}
          size="sm"
          variant="outline"
          className="h-8 rounded-lg text-[11px] font-semibold gap-1.5"
        >
          <Share2 className="h-3.5 w-3.5" /> Esporta per WhatsApp
        </Button>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={palette[i % palette.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
