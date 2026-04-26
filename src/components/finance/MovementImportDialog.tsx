import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Upload, FileText, Check, X } from 'lucide-react';
import { useCrm } from '@/store/useCrm';
import { formatEuro } from '@/types/crm';
import { parseCsv, ParsedRow, BankFormat } from '@/lib/csvParser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const MovementImportDialog = ({ open, onOpenChange }: Props) => {
  const { bankAccounts, importMovements } = useCrm();
  const [accountId, setAccountId] = useState<string>('');
  const [format, setFormat] = useState<BankFormat>('generic');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsed([]);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const fullReset = () => {
    reset();
    setAccountId('');
    setFormat('generic');
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      const rows = parseCsv(text, format);
      if (rows.length === 0) {
        toast.error('Nessun movimento valido trovato nel file.');
        return;
      }
      setParsed(rows);
      setFileName(file.name);
      toast.success(`${rows.length} movimenti riconosciuti.`);
    } catch (err) {
      toast.error('Errore nel parsing del file CSV.');
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (!accountId) {
      toast.error('Seleziona un conto.');
      return;
    }
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const account = bankAccounts.find(a => a.id === accountId);
      const defaultClassification = account?.type === 'business' ? 'business' : 'personal';
      const n = await importMovements(parsed.map(r => ({
        account_id: accountId,
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type,
        classification: defaultClassification,
        is_recurring: false,
        is_reviewed: false,
        external_ref: r.external_ref,
      })));
      toast.success(`Importati ${n} movimenti su ${account?.name}.`);
      fullReset();
      onOpenChange(false);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        toast.error('Alcuni movimenti risultano già importati su questo conto. Import annullato.');
      } else {
        toast.error('Errore durante l\'import.');
      }
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) fullReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importa Movimenti Bancari</DialogTitle>
          <DialogDescription>
            Carica un file CSV esportato dalla tua banca. I movimenti saranno aggiunti come "non revisionati".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Conto di destinazione</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Seleziona conto" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as BankFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">CSV Generico (auto-rileva colonne)</SelectItem>
                  <SelectItem value="banca-sella" disabled>Banca Sella (presto)</SelectItem>
                  <SelectItem value="hype" disabled>Hype (presto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-mono">{fileName}</span>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Seleziona file CSV
              </Button>
            )}
          </div>

          {parsed.length > 0 && (
            <div className="flex-1 overflow-auto border rounded">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Descrizione</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono py-1.5">
                        {new Date(r.date).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 max-w-xs truncate">{r.description}</TableCell>
                      <TableCell className="py-1.5">
                        <span className={cn(
                          'text-[10px] uppercase tracking-wider font-medium',
                          r.type === 'credit' ? 'text-emerald-600' : 'text-rose-600',
                        )}>
                          {r.type === 'credit' ? 'Entrata' : 'Uscita'}
                        </span>
                      </TableCell>
                      <TableCell className={cn(
                        'text-xs font-mono tabular-nums text-right py-1.5',
                        r.type === 'credit' ? 'text-emerald-600' : 'text-rose-600',
                      )}>
                        {r.type === 'credit' ? '+' : '−'}{formatEuro(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsed.length > 50 && (
                <div className="text-xs text-muted-foreground text-center py-2 border-t">
                  …e altri {parsed.length - 50} movimenti
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button
            onClick={handleImport}
            disabled={!accountId || parsed.length === 0 || importing}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Importa {parsed.length > 0 ? `${parsed.length} movimenti` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
