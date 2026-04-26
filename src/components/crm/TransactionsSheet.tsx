import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCrm } from '@/store/useCrm';
import { Transaction, formatEuro } from '@/types/crm';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ChevronRight, Sparkles, CalendarClock } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  transactions: Transaction[];
  /** When the sheet is filtered to a single client, show service + training context. */
  clientId?: string;
}

const formatDateShort = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const TransactionsSheet = ({ open, onOpenChange, title, description, transactions, clientId }: Props) => {
  const { clients, getRemainingDays } = useCrm();
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );

  // Resolve focus client: explicit prop first, otherwise infer when all transactions belong to one client.
  const focusClientId = clientId ?? (
    transactions.length > 0 && transactions.every(t => t.client_id === transactions[0].client_id)
      ? transactions[0].client_id
      : undefined
  );
  const focusClient = focusClientId ? clients.find(c => c.id === focusClientId) : undefined;
  const remaining = focusClient ? getRemainingDays(focusClient.id) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {focusClient && (
          focusClient.service_sold ? (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" />
                  Contratto Attivo: {focusClient.service_sold}
                </span>
                {typeof focusClient.actual_price === 'number' && (
                  <span className="text-[11px] font-semibold text-foreground">{formatEuro(focusClient.actual_price)}</span>
                )}
              </div>
              {(focusClient.training_start_date || focusClient.training_end_date) && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>
                    Periodo: <span className="font-semibold text-foreground">{formatDateShort(focusClient.training_start_date)}</span>
                    {' – '}
                    <span className="font-semibold text-foreground">{formatDateShort(focusClient.training_end_date)}</span>
                  </span>
                  {typeof remaining === 'number' && (
                    <span
                      className={`ml-auto inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        remaining < 0 ? 'bg-destructive/15 text-destructive'
                        : remaining <= 30 ? 'bg-warning/15 text-warning'
                        : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {remaining < 0 ? `Scaduto ${Math.abs(remaining)}g fa` : `${remaining}g residui`}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-[12px] text-foreground leading-snug">
              Nessun servizio assegnato. Modifica il profilo del cliente per attivare il contratto.
            </div>
          )
        )}

        <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Totale</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{formatEuro(total)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{sorted.length} transazion{sorted.length === 1 ? 'e' : 'i'}</p>
        </div>

        <div className="mt-4 space-y-2">
          {sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-xs text-muted-foreground">Nessuna transazione in questa categoria.</p>
            </div>
          ) : (
            sorted.map(t => {
              const client = clients.find(c => c.id === t.client_id);
              const isPaid = t.status === 'Saldato';
              const date = new Date(isPaid ? t.payment_date : t.due_date);
              return (
                <Link
                  key={t.id}
                  to={`/clients/${t.client_id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-smooth"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isPaid ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'}`}>
                    {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{client?.name ?? 'Cliente rimosso'}</p>
                      <p className="font-bold text-sm text-foreground shrink-0">{formatEuro(t.amount)}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="mx-1.5">·</span>
                      {t.payment_type}
                      <span className="mx-1.5">·</span>
                      {t.payment_method}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
