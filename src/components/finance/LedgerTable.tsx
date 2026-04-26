import { useMemo, useState } from 'react';
import { useCrm } from '@/store/useCrm';
import {
  formatEuro, FinancialMovement, MovementClassification,
} from '@/types/crm';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { PrivacyMask } from '@/components/crm/PrivacyMask';
import { cn } from '@/lib/utils';

interface Props {
  year: number;
  month: number;
}

export const LedgerTable = ({ year, month }: Props) => {
  const {
    bankAccounts, movements, unifiedCategories,
    setMovementClassification, toggleMovementReviewed, updateMovement, deleteMovement,
  } = useCrm();

  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(false);

  const filtered = useMemo<FinancialMovement[]>(() => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    const term = search.trim().toLowerCase();
    return movements
      .filter(mv => {
        const t = new Date(mv.date).getTime();
        if (t < monthStart || t > monthEnd) return false;
        if (accountFilter !== 'all' && mv.account_id !== accountFilter) return false;
        if (typeFilter !== 'all' && mv.type !== typeFilter) return false;
        if (showOnlyUnreviewed && mv.is_reviewed) return false;
        if (term && !mv.description.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, year, month, accountFilter, typeFilter, search, showOnlyUnreviewed]);

  const accountName = (id: string) => bankAccounts.find(a => a.id === id)?.name ?? '—';
  const categoryName = (id?: string) => id ? (unifiedCategories.find(c => c.id === id)?.name ?? '—') : '—';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca descrizione…"
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i conti</SelectItem>
            {bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="credit">Entrate</SelectItem>
            <SelectItem value="debit">Uscite</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant={showOnlyUnreviewed ? 'default' : 'outline'}
          onClick={() => setShowOnlyUnreviewed(v => !v)}
          className="h-9 text-xs"
        >
          Da revisionare
        </Button>

        <div className="text-xs text-muted-foreground font-mono ml-auto">
          {filtered.length} movimenti
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur z-10">
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-wider w-[90px]">Data</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Descrizione</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-[110px]">Conto</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-[140px]">Categoria</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-[110px]">Classifica</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-[110px] text-right">Importo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-[60px] text-center">Rev.</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                    Nessun movimento per i filtri selezionati.
                  </TableCell>
                </TableRow>
              ) : filtered.map(mv => (
                <TableRow key={mv.id} className={cn(
                  'text-xs',
                  !mv.is_reviewed && 'bg-amber-50/40 dark:bg-amber-950/10',
                )}>
                  <TableCell className="font-mono text-[11px] py-2 whitespace-nowrap">
                    {new Date(mv.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="line-clamp-1">{mv.description}</span>
                    {mv.is_recurring && (
                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">Ric.</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-[10px] text-muted-foreground font-medium">{accountName(mv.account_id)}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <Select
                      value={mv.category_id ?? 'none'}
                      onValueChange={v => updateMovement(mv.id, { category_id: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger className="h-7 text-[11px] border-none bg-transparent hover:bg-muted px-2">
                        <SelectValue placeholder="—">
                          <span className="text-[11px]">{categoryName(mv.category_id)}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {unifiedCategories
                          .filter(c =>
                            c.scope === 'both' ||
                            c.scope === mv.classification ||
                            c.id === mv.category_id // mantieni visibile la categoria già assegnata
                          )
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={mv.classification === 'business'}
                        onCheckedChange={(v) => setMovementClassification(
                          mv.id,
                          (v ? 'business' : 'personal') as MovementClassification,
                        )}
                        className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span[data-state=checked]]:translate-x-3"
                      />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                        {mv.classification === 'business' ? 'Az.' : 'Pers.'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <PrivacyMask>
                      <span className={cn(
                        'font-mono tabular-nums font-medium inline-flex items-center gap-0.5',
                        mv.type === 'credit' ? 'text-emerald-600' : 'text-rose-600',
                      )}>
                        {mv.type === 'credit' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                        {formatEuro(mv.amount)}
                      </span>
                    </PrivacyMask>
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <button
                      onClick={() => toggleMovementReviewed(mv.id, !mv.is_reviewed)}
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded border transition-colors',
                        mv.is_reviewed
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/40 hover:border-primary',
                      )}
                      title={mv.is_reviewed ? 'Revisionato' : 'Da revisionare'}
                    >
                      {mv.is_reviewed && <Check className="h-3 w-3" />}
                    </button>
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('Eliminare questo movimento?')) deleteMovement(mv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
