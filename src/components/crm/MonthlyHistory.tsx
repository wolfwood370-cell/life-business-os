import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { PrivacyMask } from './PrivacyMask';
import { CalendarRange } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';

const COLOR_GROSS = 'hsl(160 84% 39%)';        // emerald-600
const COLOR_NET_BUSINESS = 'hsl(158 64% 52%)'; // emerald-400
const COLOR_BIZ_EXPENSES = 'hsl(215 28% 45%)'; // slate-600
const COLOR_EXPENSES = 'hsl(347 77% 50%)';     // rose-600
const COLOR_INCOMES = 'hsl(43 96% 56%)';       // amber-400
const COLOR_FCF = 'hsl(221 83% 53%)';          // blue-600

export const MonthlyHistory = () => {
  const { monthlyBreakdown } = useCrm();
  const rows = [...monthlyBreakdown].reverse();
  const chartData = monthlyBreakdown.map(m => ({
    label: m.label,
    Lordo: Math.round(m.gross),
    'Spese Aziend.': Math.round(m.business_expenses),
    'Utile Aziendale': Math.round(m.net_business),
    Spese: Math.round(m.personal_expenses),
    Ricavi: Math.round(m.personal_incomes),
    'Cash Flow': Math.round(m.free_cash_flow),
  }));

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Storico Mensile · Waterfall</p>
            <p className="text-[11px] text-muted-foreground">Lordo → Utile aziendale → Cash Flow libero</p>
          </div>
        </div>
      </div>

      {monthlyBreakdown.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs text-muted-foreground">Nessun mese disponibile.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatEuro(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Lordo" fill={COLOR_GROSS} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Spese Aziend." fill={COLOR_BIZ_EXPENSES} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Utile Aziendale" fill={COLOR_NET_BUSINESS} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Spese" fill={COLOR_EXPENSES} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Ricavi" fill={COLOR_INCOMES} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Cash Flow" fill={COLOR_FCF} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabella dettaglio */}
          <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {rows.map(m => {
              const positive = m.free_cash_flow >= 0;
              return (
                <div key={`${m.year}-${m.month}`} className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{m.label}</p>
                    <p className={`text-xs font-bold ${positive ? 'text-primary' : 'text-destructive'}`}>
                      Cash Flow: <PrivacyMask>{formatEuro(m.free_cash_flow)}</PrivacyMask>
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lordo</span>
                      <span className="font-semibold text-foreground tabular-nums"><PrivacyMask>{formatEuro(m.gross)}</PrivacyMask></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasse</span>
                      <span className="font-semibold tabular-nums" style={{ color: COLOR_EXPENSES }}>−<PrivacyMask>{formatEuro(m.taxes)}</PrivacyMask></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utile aziend.</span>
                      <span className="font-semibold tabular-nums" style={{ color: COLOR_NET_BUSINESS }}><PrivacyMask>{formatEuro(m.net_business)}</PrivacyMask></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spese pers.</span>
                      <span className="font-semibold tabular-nums" style={{ color: COLOR_EXPENSES }}>−<PrivacyMask>{formatEuro(m.personal_expenses)}</PrivacyMask></span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Ricavi pers.</span>
                      <span className="font-semibold tabular-nums" style={{ color: COLOR_INCOMES }}>+<PrivacyMask>{formatEuro(m.personal_incomes)}</PrivacyMask></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
