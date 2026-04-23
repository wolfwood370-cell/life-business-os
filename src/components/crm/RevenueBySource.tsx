import { useCrm } from '@/store/crmStore';
import { LEAD_SOURCES, formatEuro, leadSourceLabel, sourceColorMap } from '@/types/crm';
import { PrivacyMask } from './PrivacyMask';

export const RevenueBySource = () => {
  const { clients } = useCrm();

  const totals = LEAD_SOURCES.map(src => {
    const value = clients
      .filter(c => c.pipeline_stage === 'Closed Won' && c.lead_source === src)
      .reduce((s, c) => s + (c.monthly_value || 0), 0);
    return { source: src, value };
  });

  const max = Math.max(1, ...totals.map(t => t.value));
  const grandTotal = totals.reduce((s, t) => s + t.value, 0);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valore per Fonte</p>
          <p className="text-[11px] text-muted-foreground">Ricavi mensili da clienti attivi</p>
        </div>
        <p className="text-sm font-bold text-foreground"><PrivacyMask>{formatEuro(grandTotal)}</PrivacyMask></p>
      </div>

      {grandTotal === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Nessun ricavo attivo. Chiudi il primo cliente per popolare il grafico.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {totals.map(({ source, value }) => {
            const pct = (value / max) * 100;
            const color = sourceColorMap[source];
            return (
              <div key={source}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{leadSourceLabel[source]}</span>
                  <span className="font-semibold text-muted-foreground"><PrivacyMask>{formatEuro(value)}</PrivacyMask></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-smooth"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: `hsl(var(--${color}))`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
