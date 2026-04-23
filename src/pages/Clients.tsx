import { useState, useMemo } from 'react';
import { useCrm } from '@/store/useCrm';
import { ClientCard } from '@/components/crm/ClientCard';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown } from 'lucide-react';
import { PIPELINE_STAGES, PipelineStage, pipelineStageLabel } from '@/types/crm';
import { cn } from '@/lib/utils';
import { ClientCardSkeleton } from '@/components/crm/skeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKey =
  | 'name_asc'
  | 'name_desc'
  | 'lastname_asc'
  | 'lastname_desc'
  | 'age_asc'      // giovane > vecchio (nascita più recente prima)
  | 'age_desc'     // vecchio > giovane
  | 'signup_asc'   // vecchi > recenti (iscrizione più vecchia prima)
  | 'signup_desc'  // recenti > vecchi
  | 'expiry_asc'   // scadenza più vicina prima
  | 'expiry_desc'; // scadenza più lontana prima

const SORT_LABELS: Record<SortKey, string> = {
  name_asc: 'Nome (A → Z)',
  name_desc: 'Nome (Z → A)',
  lastname_asc: 'Cognome (A → Z)',
  lastname_desc: 'Cognome (Z → A)',
  age_asc: 'Età (giovane → vecchio)',
  age_desc: 'Età (vecchio → giovane)',
  signup_asc: 'Iscrizione (vecchi → recenti)',
  signup_desc: 'Iscrizione (recenti → vecchi)',
  expiry_asc: 'Scadenza (prima → dopo)',
  expiry_desc: 'Scadenza (dopo → prima)',
};

const ts = (d?: string) => (d ? new Date(d).getTime() : NaN);

const VALID_SORTS = new Set<SortKey>([
  'name_asc', 'name_desc', 'lastname_asc', 'lastname_desc',
  'age_asc', 'age_desc', 'signup_asc', 'signup_desc', 'expiry_asc', 'expiry_desc',
]);

const Clients = () => {
  const { clients, isLoading } = useCrm();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const filterRaw = searchParams.get('filter') ?? 'All';
  const filter: PipelineStage | 'All' =
    filterRaw === 'All' || (PIPELINE_STAGES as readonly string[]).includes(filterRaw)
      ? (filterRaw as PipelineStage | 'All')
      : 'All';
  const sortRaw = (searchParams.get('sort') ?? 'name_asc') as SortKey;
  const sort: SortKey = VALID_SORTS.has(sortRaw) ? sortRaw : 'name_asc';

  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '' || (k === 'sort' && v === 'name_asc') || (k === 'filter' && v === 'All')) {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      });
      return next;
    }, { replace: true });
  };

  const setQ = (v: string) => updateParams({ q: v });
  const setFilter = (v: PipelineStage | 'All') => updateParams({ filter: v });
  const setSort = (v: SortKey) => updateParams({ sort: v });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = clients
      .filter(c => filter === 'All' || c.pipeline_stage === filter)
      .filter(c => {
        if (!needle) return true;
        const hay = [
          c.name,
          c.first_name ?? '',
          c.last_name ?? '',
          c.email ?? '',
          c.phone ?? '',
        ].join(' ').toLowerCase();
        return hay.includes(needle);
      });

    const sorted = [...list].sort((a, b) => {
      const lastOf = (n: string) => {
        const parts = n.trim().split(/\s+/);
        return parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
      };
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, 'it', { sensitivity: 'base' });
        case 'lastname_asc':
          return (a.last_name || lastOf(a.name)).localeCompare(b.last_name || lastOf(b.name), 'it', { sensitivity: 'base' });
        case 'lastname_desc':
          return (b.last_name || lastOf(b.name)).localeCompare(a.last_name || lastOf(a.name), 'it', { sensitivity: 'base' });
        case 'age_asc': {
          // giovane = nato più di recente = data di nascita maggiore
          const av = ts(a.birth_date);
          const bv = ts(b.birth_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return bv - av;
        }
        case 'age_desc': {
          const av = ts(a.birth_date);
          const bv = ts(b.birth_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return av - bv;
        }
        case 'signup_asc': {
          const av = ts(a.gym_signup_date);
          const bv = ts(b.gym_signup_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return av - bv;
        }
        case 'signup_desc': {
          const av = ts(a.gym_signup_date);
          const bv = ts(b.gym_signup_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return bv - av;
        }
        case 'expiry_asc': {
          const av = ts(a.gym_expiry_date);
          const bv = ts(b.gym_expiry_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return av - bv;
        }
        case 'expiry_desc': {
          const av = ts(a.gym_expiry_date);
          const bv = ts(b.gym_expiry_date);
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return bv - av;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [clients, q, filter, sort]);

  return (
    <div className="px-4 md:px-0 pt-6 pb-4 space-y-4 animate-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{clients.length} totali</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Clienti</h1>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome…"
            className="h-12 pl-10 rounded-xl bg-secondary border-0 text-base"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-12 w-auto min-w-[56px] sm:min-w-[220px] rounded-xl bg-secondary border-0 px-3 sm:px-4 gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="hidden sm:inline truncate text-sm font-semibold">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent align="end">
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          Array.from({ length: 6 }).map((_, i) => <ClientCardSkeleton key={i} />)
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
