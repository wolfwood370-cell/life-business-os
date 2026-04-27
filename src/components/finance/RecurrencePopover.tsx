import { forwardRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCw } from 'lucide-react';
import type { MovementRecurrenceType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface Props {
  type: MovementRecurrenceType;
  value?: number;
  onChange: (type: MovementRecurrenceType, value?: number) => void;
  size?: 'sm' | 'md';
}

const labelFor = (t: MovementRecurrenceType, v?: number) => {
  if (t === 'weekly') return `Ogni ${v ?? 1} sett.`;
  if (t === 'fixed_day') return `Giorno ${v ?? 1} mese`;
  return 'Una tantum';
};

export const RecurrencePopover = forwardRef<HTMLButtonElement, Props>(({ type, value, onChange, size = 'sm' }, ref) => {
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<MovementRecurrenceType>(type);
  const [draftValue, setDraftValue] = useState<number>(value ?? (type === 'fixed_day' ? 1 : 1));

  const apply = () => {
    if (draftType === 'none') onChange('none', undefined);
    else if (draftType === 'weekly') onChange('weekly', Math.max(1, Math.floor(draftValue || 1)));
    else if (draftType === 'fixed_day') {
      const d = Math.min(31, Math.max(1, Math.floor(draftValue || 1)));
      onChange('fixed_day', d);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        setDraftType(type);
        setDraftValue(value ?? (type === 'fixed_day' ? 1 : 1));
      }
    }}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
            type === 'none'
              ? 'border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
              : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
            size === 'md' && 'text-xs px-2 py-1',
          )}
          title="Imposta ricorrenza"
        >
          <RotateCw className={cn(size === 'md' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5')} />
          {labelFor(type, value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3 space-y-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Frequenza</Label>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => setDraftType('none')}
              className={cn(
                'text-xs rounded-md px-2 py-1.5 text-left border transition-colors',
                draftType === 'none' ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted',
              )}
            >
              Una tantum
            </button>
            <button
              type="button"
              onClick={() => setDraftType('weekly')}
              className={cn(
                'text-xs rounded-md px-2 py-1.5 text-left border transition-colors',
                draftType === 'weekly' ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted',
              )}
            >
              Ogni X settimane
            </button>
            <button
              type="button"
              onClick={() => setDraftType('fixed_day')}
              className={cn(
                'text-xs rounded-md px-2 py-1.5 text-left border transition-colors',
                draftType === 'fixed_day' ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted',
              )}
            >
              Ogni giorno X del mese
            </button>
          </div>
        </div>
        {draftType !== 'none' && (
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {draftType === 'weekly' ? 'Settimane (X)' : 'Giorno del mese (1-31)'}
            </Label>
            <Input
              type="number"
              min={1}
              max={draftType === 'fixed_day' ? 31 : undefined}
              value={draftValue}
              onChange={e => setDraftValue(Number(e.target.value))}
              className="h-8 text-sm mt-0.5"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button size="sm" onClick={apply}>Applica</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
RecurrencePopover.displayName = 'RecurrencePopover';
