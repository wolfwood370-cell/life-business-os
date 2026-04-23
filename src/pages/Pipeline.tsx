import { useCrm } from '@/store/useCrm';
import { PIPELINE_STAGES, stageColorMap, pipelineStageLabel, PipelineStage } from '@/types/crm';
import { ClientCard } from '@/components/crm/ClientCard';
import { ClientCardSkeleton } from '@/components/crm/skeletons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';

const StageColumn = ({ stage, clients }: { stage: PipelineStage; clients: ReturnType<typeof useCrm>['clients'] }) => {
  const stageClients = clients.filter(c => c.pipeline_stage === stage);
  if (stageClients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-xs text-muted-foreground">Nessun cliente in questa fase</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {stageClients.map(c => <ClientCard key={c.id} client={c} compact />)}
    </div>
  );
};

const Pipeline = () => {
  const { clients, isLoading } = useCrm();
  const [activeStage, setActiveStage] = useState<PipelineStage>('Lead Acquired');

  return (
    <div className="pt-6 pb-4 animate-fade-in">
      <header className="px-4 md:px-0 mb-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sales Board</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Pipeline Vendita</h1>
      </header>

      {isLoading ? (
        <>
          {/* Mobile skeleton */}
          <div className="lg:hidden px-4 space-y-2">
            <ClientCardSkeleton compact />
            <ClientCardSkeleton compact />
            <ClientCardSkeleton compact />
          </div>
          {/* Desktop skeleton */}
          <div className="hidden lg:grid lg:grid-cols-6 gap-3 px-0 pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card/50 p-3 space-y-2">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="h-3 w-24 rounded-full skeleton-shimmer" />
                  <div className="h-5 w-7 rounded-full skeleton-shimmer" />
                </div>
                <ClientCardSkeleton compact />
                <ClientCardSkeleton compact />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* MOBILE / TABLET: Tabs view (no horizontal body scroll) */}
          <div className="lg:hidden">
            <Tabs value={activeStage} onValueChange={(v) => setActiveStage(v as PipelineStage)}>
              <div className="px-4">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <TabsList className="h-auto bg-secondary/60 p-1 inline-flex w-max gap-1">
                    {PIPELINE_STAGES.map(stage => {
                      const count = clients.filter(c => c.pipeline_stage === stage).length;
                      const color = stageColorMap[stage];
                      return (
                        <TabsTrigger
                          key={stage}
                          value={stage}
                          className="text-xs px-3 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                        >
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: `hsl(var(--${color}))` }}
                          />
                          {pipelineStageLabel[stage]}
                          <span className="ml-2 text-[10px] font-bold text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                            {count}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>

              {PIPELINE_STAGES.map(stage => (
                <TabsContent key={stage} value={stage} className="mt-4 px-4 pb-4">
                  <StageColumn stage={stage} clients={clients} />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* DESKTOP: Premium Kanban — fixed-width columns, horizontal scroll within board */}
          <div className="hidden lg:flex lg:flex-row gap-6 overflow-x-auto overflow-y-hidden pb-6 h-[calc(100vh-140px)] kanban-scroll">
            {PIPELINE_STAGES.map(stage => {
              const stageClients = clients.filter(c => c.pipeline_stage === stage);
              const totalValue = stageClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
              const color = stageColorMap[stage];
              return (
                <div
                  key={stage}
                  className="flex flex-col shrink-0 min-w-[320px] max-w-[320px] rounded-2xl border border-border/70 bg-secondary/40 min-h-0"
                >
                  <div className="shrink-0 p-4 pb-3 flex items-center justify-between border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: `hsl(var(--${color}))` }}
                      />
                      <h3 className="text-sm font-semibold truncate tracking-tight">
                        {pipelineStageLabel[stage]}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {totalValue > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          €{totalValue.toLocaleString('it-IT')}
                        </span>
                      )}
                      <span className="text-xs font-bold text-foreground/80 bg-background rounded-full px-2 py-0.5 min-w-[24px] text-center">
                        {stageClients.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                    {stageClients.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
                        <p className="text-xs text-muted-foreground">Vuoto</p>
                      </div>
                    ) : (
                      stageClients.map(c => <ClientCard key={c.id} client={c} compact />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Pipeline;
