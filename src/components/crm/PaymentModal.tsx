import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, Euro, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useCrm } from '@/store/useCrm';
import { PaymentType, formatEuro } from '@/types/crm';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  clientName: string;
}

export const PaymentModal = ({ open, onOpenChange, clientId, clientName }: PaymentModalProps) => {
  const { addTransaction } = useCrm();
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Unica Soluzione');
  const [installments, setInstallments] = useState(2);
  const [paymentDate, setPaymentDate] = useState<string>(todayIso());
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount('');
    setPaymentType('Unica Soluzione');
    setInstallments(2);
    setPaymentDate(todayIso());
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!amount || isNaN(value) || value <= 0) {
      toast.error('Inserisci un importo valido');
      return;
    }
    setSubmitting(true);
    try {
      await addTransaction({
        client_id: clientId,
        amount: value,
        payment_type: paymentType,
        installments_count: paymentType === 'A Rate' ? installments : 1,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : undefined,
      });
      const perInstallment = paymentType === 'A Rate' ? value / installments : value;
      toast.success(
        paymentType === 'A Rate'
          ? `Registrato: ${installments} rate da ${formatEuro(perInstallment)}`
          : `Pagamento di ${formatEuro(value)} registrato`
      );
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error('Errore nel salvataggio del pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const totalToCharge = Number(amount) || 0;
  const perInstallmentPreview = paymentType === 'A Rate' && installments > 0
    ? totalToCharge / installments
    : totalToCharge;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base">Registra Pagamento</DialogTitle>
              <p className="text-xs text-muted-foreground">{clientName}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Importo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5" /> Importo Totale
            </label>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="h-14 rounded-xl bg-secondary border-0 text-2xl font-bold pr-10"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">€</span>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo di Pagamento</label>
            <ToggleGroup
              type="single"
              value={paymentType}
              onValueChange={(v) => v && setPaymentType(v as PaymentType)}
              className="w-full grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem
                value="Unica Soluzione"
                className="h-14 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary text-xs font-semibold"
              >
                <div className="text-center">
                  <div>Unica Soluzione</div>
                  <div className="text-[10px] opacity-80 font-normal">28 gg</div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="A Rate"
                className="h-14 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary text-xs font-semibold"
              >
                <div className="text-center">
                  <div>A Rate</div>
                  <div className="text-[10px] opacity-80 font-normal">Ogni 28 gg</div>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Rate */}
          {paymentType === 'A Rate' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numero Rate</label>
              <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0 text-base font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} rate</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Riepilogo */}
          {totalToCharge > 0 && (
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Totale</span>
                <span className="font-bold text-foreground">{formatEuro(totalToCharge)}</span>
              </div>
              {paymentType === 'A Rate' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Per rata × {installments}</span>
                  <span className="font-semibold text-primary">{formatEuro(perInstallmentPreview)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-xl"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !amount}
            className="rounded-xl gradient-primary text-primary-foreground font-semibold"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Registra Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
