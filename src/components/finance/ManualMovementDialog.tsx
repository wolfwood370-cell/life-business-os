import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrm } from '@/store/useCrm';
import type { MovementType, MovementClassification, MovementRecurrenceType } from '@/types/crm';
import { toast } from 'sonner';
import { RecurrencePopover } from './RecurrencePopover';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: Date;
}

export const ManualMovementDialog = ({ open, onOpenChange, defaultDate }: Props) => {
  const { bankAccounts, unifiedCategories, addMovement } = useCrm();

  const todayIso = (defaultDate ?? new Date()).toISOString().slice(0, 10);

  const [accountId, setAccountId] = useState<string>('');
  const [type, setType] = useState<MovementType>('debit');
  const [classification, setClassification] = useState<MovementClassification>('personal');
  const [date, setDate] = useState<string>(todayIso);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [recurrenceType, setRecurrenceType] = useState<MovementRecurrenceType>('none');
  const [recurrenceValue, setRecurrenceValue] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAccountId(''); setType('debit'); setClassification('personal');
    setDate(todayIso); setAmount(''); setDescription('');
    setCategoryId('none'); setRecurrenceType('none'); setRecurrenceValue(undefined);
  };

  const handleSubmit = async () => {
    const amt = Number(String(amount).replace(',', '.'));
    if (!accountId) { toast.error('Seleziona un conto'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Importo non valido'); return; }
    if (!description.trim()) { toast.error('Inserisci una descrizione'); return; }
    setSaving(true);
    try {
      await addMovement({
        account_id: accountId,
        date: new Date(date).toISOString(),
        description: description.trim(),
        amount: amt,
        type,
        classification,
        category_id: categoryId === 'none' ? undefined : categoryId,
        is_recurring: recurrenceType !== 'none',
        is_reviewed: true,
        source: 'manual',
        recurrence_type: recurrenceType,
        recurrence_value: recurrenceValue,
      });
      toast.success('Movimento aggiunto');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Errore durante il salvataggio');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi Movimento Manualmente</DialogTitle>
          <DialogDescription>Registra una nuova entrata o uscita nei Movimenti.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Conto</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Seleziona conto" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as MovementType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Entrata</SelectItem>
                  <SelectItem value="debit">Uscita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Importo (€)</Label>
              <Input inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrizione</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="es. Affitto studio gennaio" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Classificazione</Label>
              <Select value={classification} onValueChange={v => setClassification(v as MovementClassification)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personale</SelectItem>
                  <SelectItem value="business">Aziendale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {unifiedCategories
                    .filter(c => c.scope === 'both' || c.scope === classification)
                    .map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs block mb-1">Ricorrenza</Label>
            <RecurrencePopover
              type={recurrenceType}
              value={recurrenceValue}
              onChange={(t, v) => { setRecurrenceType(t); setRecurrenceValue(v); }}
              size="md"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? 'Salvo...' : 'Salva movimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
