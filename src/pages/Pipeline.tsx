import { useCrm } from '@/store/crmStore';
import { PIPELINE_STAGES, stageColorMap, pipelineStageLabel } from '@/types/crm';
import { ClientCard } from '@/components/crm/ClientCard';
import { ClientCardSkeleton } from '@/components/crm/skeletons';

const Pipeline = () => {
  const { clients, isLoading } = useCrm();

  return (
    <div className="pt-6 pb-4 animate-fade-in">
      <header className="px-4 md:px-0 mb-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sales Board</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Pipeline Vendita</h1>
      </header>

      {isLoading ? (
        <div className="flex md:grid md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto md:overflow-visible scrollbar-hide px-4 md:px-0 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[78vw] max-w-[300px] md:w-auto md:max-w-none shrink-0 rounded-2xl border border-border bg-card/50 p-3 space-y-2">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="h-3 w-24 rounded-full skeleton-shimmer" />
                <div className="h-5 w-7 rounded-full skeleton-shimmer" />
              </div>
              <ClientCardSkeleton compact />
              <ClientCardSkeleton compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex md:grid md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto md:overflow-visible scrollbar-hide px-4 md:px-0 pb-4 snap-x snap-mandatory md:snap-none">
          {PIPELINE_STAGES.map(stage => {
            const stageClients = clients.filter(c => c.pipeline_stage === stage);
            const color = stageColorMap[stage];
            return (
              <div key={stage} className="w-[78vw] max-w-[300px] md:w-auto md:max-w-none shrink-0 snap-start">
                <div className="rounded-2xl border border-border bg-card/50 p-3 h-full">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `hsl(var(--${color}))` }} />
                      <h3 className="text-sm font-semibold truncate">{pipelineStageLabel[stage]}</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                      {stageClients.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageClients.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-6 text-center">
                        <p className="text-xs text-muted-foreground">Vuoto</p>
                      </div>
                    ) : (
                      stageClients.map(c => <ClientCard key={c.id} client={c} compact />)
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pipeline;
