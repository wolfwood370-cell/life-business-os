import { useCrm, daysSince } from '@/store/crmStore';
import { AlertTriangle, Clock, Flame, Trophy, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface Task {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  priority: Priority;
  clientId: string;
}

const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const priorityStyles: Record<Priority, { wrap: string; chip: string; icon: string; label: string }> = {
  critical: {
    wrap: 'border-destructive/40 bg-destructive/5 hover:border-destructive',
    chip: 'bg-destructive text-destructive-foreground',
    icon: 'bg-destructive/15 text-destructive',
    label: 'Critica',
  },
  high: {
    wrap: 'border-warning/40 bg-warning/5 hover:border-warning',
    chip: 'bg-warning text-warning-foreground',
    icon: 'bg-warning/15 text-warning',
    label: 'Alta',
  },
  medium: {
    wrap: 'border-border bg-card hover:border-primary/40',
    chip: 'bg-primary/10 text-primary',
    icon: 'bg-primary/10 text-primary',
    label: 'Media',
  },
  low: {
    wrap: 'border-border bg-card hover:border-foreground/20',
    chip: 'bg-muted text-muted-foreground',
    icon: 'bg-muted text-muted-foreground',
    label: 'Bassa',
  },
};

export const TaskQueue = () => {
  const { clients } = useCrm();
  const navigate = useNavigate();

  const tasks: Task[] = [];

  clients.forEach(c => {
    const stageDays = daysSince(c.stage_updated_at);
    const leadAge = daysSince(c.created_at);
    const sinceContact = c.last_contacted_at ? daysSince(c.last_contacted_at) : null;

    // Churn Prevention — Cliente Attivo con churn_risk Alto
    if (c.pipeline_stage === 'Closed Won' && c.churn_risk === 'Alto') {
      tasks.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 'critical',
        title: `Rischio Abbandono Alto: Contattare Subito`,
        subtitle: c.name,
        clientId: c.id,
      });
    }

    // PT Pack Conversion — fonte PT Pack 99€ con leadAge >= 14g (escluse chiusure)
    if (
      c.lead_source === 'PT Pack 99€' &&
      c.pipeline_stage !== 'Closed Won' &&
      c.pipeline_stage !== 'Closed Lost' &&
      leadAge >= 14
    ) {
      tasks.push({
        icon: <Flame className="h-4 w-4" />,
        priority: 'high',
        title: `Pitch di Vendita Finale - Fine PT Pack`,
        subtitle: `${c.name} · ${leadAge}g dall'acquisizione`,
        clientId: c.id,
      });
    }

    // 14-Day Nurture — In Trattativa, last_contacted_at = 1, 3 o 7 giorni
    if (c.pipeline_stage === 'Nurturing' && sinceContact !== null && [1, 3, 7].includes(sinceContact)) {
      tasks.push({
        icon: <Zap className="h-4 w-4" />,
        priority: 'medium',
        title: `Invia Follow-up Strategico`,
        subtitle: `${c.name} · ${sinceContact}g dall'ultimo contatto`,
        clientId: c.id,
      });
    }

    // ROI & Retention — Cliente Attivo, stageDays = 45 o 80
    if (c.pipeline_stage === 'Closed Won' && (stageDays === 45 || stageDays === 80)) {
      tasks.push({
        icon: <Trophy className="h-4 w-4" />,
        priority: 'medium',
        title: `Fissare Review Risultati (Dimostrazione ROI)`,
        subtitle: `${c.name} · Milestone ${stageDays} giorni`,
        clientId: c.id,
      });
    }

    // Pitch Presented in attesa di chiusura
    if (c.pipeline_stage === 'Pitch Presented' && stageDays >= 2) {
      tasks.push({
        icon: <Target className="h-4 w-4" />,
        priority: stageDays >= 5 ? 'high' : 'medium',
        title: `Chiudere la Proposta`,
        subtitle: `${c.name} · proposta presentata ${stageDays}g fa`,
        clientId: c.id,
      });
    }

    // Nuovo lead da qualificare
    if (c.pipeline_stage === 'Lead Acquired' && stageDays >= 1) {
      tasks.push({
        icon: <Clock className="h-4 w-4" />,
        priority: 'low',
        title: `Qualificare il nuovo contatto`,
        subtitle: `${c.name} · in attesa da ${stageDays}g`,
        clientId: c.id,
      });
    }
  });

  const sorted = tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Nessuna azione richiesta. Pipeline sotto controllo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((t, i) => {
        const s = priorityStyles[t.priority];
        return (
          <button
            key={i}
            onClick={() => navigate(`/clients/${t.clientId}`)}
            className={`w-full text-left rounded-2xl border p-4 transition-smooth active:scale-[0.99] shadow-card ${s.wrap}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.icon}`}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{t.title}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subtitle}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.chip}`}>
                {s.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
