import { forwardRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useCrm } from '@/store/useCrm';
import type { CategoryScope, CategoryKind, UnifiedCategory } from '@/types/crm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const scopeLabel: Record<CategoryScope, string> = {
  personal: 'Personale',
  business: 'Aziendale',
  both: 'Entrambi',
};
const kindLabel: Record<CategoryKind, string> = {
  expense: 'Spesa',
  income: 'Entrata',
  both: 'Entrambi',
};

export const CategoryManagerDialog = forwardRef<HTMLDivElement, Props>(({ open, onOpenChange }, _ref) => {
  const { unifiedCategories, addUnifiedCategory, updateUnifiedCategory, deleteUnifiedCategory } = useCrm();

  const [name, setName] = useState('');
  const [scope, setScope] = useState<CategoryScope>('both');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<UnifiedCategory>>({});

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      const res = await addUnifiedCategory(name, scope, kind);
      if (!res) toast.error('Categoria già esistente');
      else { toast.success('Categoria aggiunta'); setName(''); }
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateUnifiedCategory(id, editDraft);
      toast.success('Categoria aggiornata');
      setEditingId(null);
      setEditDraft({});
    } catch { toast.error('Errore durante l\'aggiornamento'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa categoria? I movimenti associati resteranno senza categoria.')) return;
    try { await deleteUnifiedCategory(id); toast.success('Categoria eliminata'); }
    catch { toast.error('Errore durante l\'eliminazione'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestisci Categorie</DialogTitle>
          <DialogDescription>
            Crea, modifica o elimina le categorie dei Movimenti.
          </DialogDescription>
        </DialogHeader>

        {/* Add new */}
        <div className="grid grid-cols-12 gap-2 items-end border-b pb-4">
          <div className="col-span-5">
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="es. Marketing" />
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Ambito</Label>
            <Select value={scope} onValueChange={v => setScope(v as CategoryScope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(scopeLabel) as CategoryScope[]).map(s => (
                  <SelectItem key={s} value={s}>{scopeLabel[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Label className="text-xs">Tipo</Label>
            <Select value={kind} onValueChange={v => setKind(v as CategoryKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(kindLabel) as CategoryKind[]).map(k => (
                  <SelectItem key={k} value={k}>{kindLabel[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Button size="icon" onClick={handleAdd} disabled={!name.trim()} className="w-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto space-y-1.5 pt-2">
          {unifiedCategories.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">Nessuna categoria. Aggiungi la prima sopra.</p>
          )}
          {unifiedCategories.map(c => {
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className={cn(
                'grid grid-cols-12 gap-2 items-center p-2 rounded-lg border',
                isEditing ? 'bg-muted/40 border-primary/40' : 'bg-card hover:bg-muted/20 border-border',
              )}>
                {isEditing ? (
                  <>
                    <Input
                      className="col-span-5 h-8 text-sm"
                      value={editDraft.name ?? c.name}
                      onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                    />
                    <Select
                      value={(editDraft.scope ?? c.scope)}
                      onValueChange={v => setEditDraft(d => ({ ...d, scope: v as CategoryScope }))}
                    >
                      <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(scopeLabel) as CategoryScope[]).map(s => (
                          <SelectItem key={s} value={s}>{scopeLabel[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={(editDraft.kind ?? c.kind)}
                      onValueChange={v => setEditDraft(d => ({ ...d, kind: v as CategoryKind }))}
                    >
                      <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(kindLabel) as CategoryKind[]).map(k => (
                          <SelectItem key={k} value={k}>{kindLabel[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="col-span-1 flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(c.id)}>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(null); setEditDraft({}); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-5 text-sm font-medium truncate">{c.name}</div>
                    <div className="col-span-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {scopeLabel[c.scope]}
                    </div>
                    <div className="col-span-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {kindLabel[c.kind]}
                    </div>
                    <div className="col-span-1 flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(c.id); setEditDraft({ name: c.name, scope: c.scope, kind: c.kind }); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
});
CategoryManagerDialog.displayName = 'CategoryManagerDialog';
