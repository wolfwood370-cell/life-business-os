import { useState, useMemo } from 'react';
import { useCrm } from '@/store/crmStore';
import { ClientCard } from '@/components/crm/ClientCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { PIPELINE_STAGES, PipelineStage, pipelineStageLabel } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const Clients = () => {
  const { clients, isLoading } = useCrm();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<PipelineStage | 'All'>('All');

  const filtered = useMemo(() => {
    return clients
      .filter(c => filter === 'All' || c.pipeline_stage === filter)
      .filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  }, [clients, q, filter]);

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-4 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{clients.length} totali</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Clienti</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome…"
          className="h-12 pl-10 rounded-xl bg-secondary border-0 text-base"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {(['All', ...PIPELINE_STAGES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-smooth',
              filter === s ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-secondary text-muted-foreground'
            )}
          >
            {s === 'All' ? 'Tutti' : pipelineStageLabel[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="md:col-span-full rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Nessun cliente trovato</p>
          </div>
        ) : (
          filtered.map(c => <ClientCard key={c.id} client={c} />)
        )}
      </div>
    </div>
  );
};

export default Clients;
