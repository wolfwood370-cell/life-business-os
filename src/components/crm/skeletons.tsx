import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton premium per ClientCard (lista clienti / pipeline). */
export const ClientCardSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
    <div className="flex items-center gap-3">
      <Skeleton className={compact ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl'} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3 rounded-full" />
        <Skeleton className="h-2.5 w-1/3 rounded-full" />
      </div>
      <Skeleton className="h-7 w-10 rounded-full" />
    </div>
    {!compact && (
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    )}
  </div>
);

/** Skeleton per i widget finanziari della dashboard. */
export const FinancialCardSkeleton = () => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-4">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-2.5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="mx-auto h-28 w-28 rounded-full" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-3 w-24 rounded-full" />
    </div>
  </div>
);

/** Skeleton per la coda di attività. */
export const TaskQueueSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2 rounded-full" />
          <Skeleton className="h-2.5 w-3/4 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    ))}
  </div>
);

/** Skeleton premium per la pagina dettaglio cliente. */
export const ClientDetailSkeleton = () => (
  <div className="pb-4 animate-fade-in">
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-0 py-3 flex items-center gap-2">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-4 w-40 rounded-full" />
    </header>
    <div className="px-4 md:px-0 pt-5 space-y-5">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-10 w-12 rounded-xl" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** Skeleton per generazioni AI / risposte edge function. */
export const AiResponseSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-7 w-7 rounded-lg" />
      <Skeleton className="h-3 w-32 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-11/12 rounded-full" />
      <Skeleton className="h-3 w-4/5 rounded-full" />
      <Skeleton className="h-3 w-2/3 rounded-full" />
    </div>
  </div>
);
