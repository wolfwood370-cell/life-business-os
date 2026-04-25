import { useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import {
  LEAD_SOURCES, LeadSource, Transaction,
  formatEuro, leadSourceLabel, sourceColorMap,
} from '@/types/crm';
import { PrivacyMask } from './PrivacyMask';
import { TransactionsSheet } from './TransactionsSheet';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { usePrivacyMode } from '@/store/usePrivacyMode';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Timeframe = 'year' | 'all';

interface SourceRow {
  source: LeadSource;
  label: string;
  value: number;
  color: string;
  txs: Transaction[];
}

export const RevenueBySource = () => {
  const { clients, transactions } = useCrm();
  const { privacyMode } = usePrivacyMode();
  const [drill, setDrill] = useState<LeadSource | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('year');

  const currentYear = new Date().getFullYear();

  const rows = useMemo<SourceRow[]>(() => {
    const clientSource = new Map<string, LeadSource>();
    clients.forEach(c => clientSource.set(c.id, c.lead_source));

    const acc: Record<LeadSource, { value: number; txs: Transaction[] }> = {
      'Gym-provided': { value: 0, txs: [] },
      'PT Pack 99€': { value: 0, txs: [] },
      'Gym Floor': { value: 0, txs: [] },
      'Referral': { value: 0, txs: [] },
      'Social Media': { value: 0, txs: [] },
    };

    for (const t of transactions) {
      if (t.status !== 'Saldato') continue;
      if (timeframe === 'year') {
        const d = new Date(t.payment_date);
        if (isNaN(d.getTime()) || d.getFullYear() !== currentYear) continue;
      }
      const src = clientSource.get(t.client_id);
      if (!src) continue;
      acc[src].value += t.amount;
      acc[src].txs.push(t);
    }

    return LEAD_SOURCES.map(src => ({
      source: src,
      label: leadSourceLabel[src],
      value: acc[src].value,
      color: `hsl(var(--${sourceColorMap[src]}))`,
      txs: acc[src].txs,
    }));
  }, [clients, transactions, timeframe, currentYear]);

  const grandTotal = rows.reduce((s, r) => s + r.value, 0);
  const drillRow = drill ? rows.find(r => r.source === drill) : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valore per Fonte</p>
          <p className="text-[11px] text-muted-foreground">Incassi reali per canale di acquisizione</p>
        </div>
        <p className="text-sm font-bold text-foreground">
          <PrivacyMask>{formatEuro(grandTotal)}</PrivacyMask>
        </p>
      </div>

      {grandTotal === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Nessun incasso registrato. Registra il primo pagamento per popolare il grafico.
          </p>
        </div>
      ) : (
        <>
          {/* Recharts BarChart */}
          <div className="mt-4 h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                barCategoryGap={8}
              >
                <XAxis
                  type="number"
                  hide
                  domain={[0, 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={110}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.5 }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [
                    privacyMode ? '••••' : formatEuro(value),
                    'Incassi',
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 6, 6]}
                  cursor="pointer"
                  onClick={(data) => {
                    const row = data as unknown as SourceRow;
                    if (row?.value > 0) setDrill(row.source);
                  }}
                >
                  {rows.map((r) => (
                    <Cell key={r.source} fill={r.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with values */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {rows.map(r => (
              <button
                key={r.source}
                type="button"
                disabled={r.value === 0}
                onClick={() => setDrill(r.source)}
                className="flex items-center justify-between text-xs rounded-md px-1.5 py-1 transition-smooth enabled:hover:bg-secondary disabled:opacity-50 disabled:cursor-default"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-foreground truncate">{r.label}</span>
                </span>
                <span className="font-semibold text-muted-foreground tabular-nums">
                  <PrivacyMask>{formatEuro(r.value)}</PrivacyMask>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <TransactionsSheet
        open={drill !== null}
        onOpenChange={(v) => { if (!v) setDrill(null); }}
        title={drillRow ? `Incassi · ${drillRow.label}` : 'Incassi'}
        description={drillRow ? `${drillRow.txs.length} transazion${drillRow.txs.length === 1 ? 'e' : 'i'} da questa fonte` : ''}
        transactions={drillRow?.txs ?? []}
      />
    </div>
  );
};
