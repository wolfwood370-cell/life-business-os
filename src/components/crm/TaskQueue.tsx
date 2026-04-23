import { useCrm, daysSince } from '@/store/useCrm';
import { AlertTriangle, Clock, Flame, Trophy, Zap, Target, Receipt, AlarmClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatEuro } from '@/types/crm';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
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
  const { clients, transactions } = useCrm();
  const navigate = useNavigate();

  const tasks: Task[] = [];

  // Radar pagamenti: rate "In Attesa" in scadenza o scadute
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  transactions.forEach(t => {
    if (t.status !== 'In Attesa') return;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    const client = clients.find(c => c.id === t.client_id);
    if (!client) return;

    if (diffDays < 0) {
      tasks.push({
        id: `tx-overdue-${t.id}`,
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 'critical',
        title: `RATA SCADUTA: ${client.name} è in ritardo col pagamento`,
        subtitle: `${Math.abs(diffDays)}g di ritardo · ${formatEuro(t.amount)}`,
        clientId: client.id,
      });
    } else if (diffDays <= 3) {
      tasks.push({
        id: `tx-imminent-${t.id}`,
        icon: <AlarmClock className="h-4 w-4" />,
        priority: 'high',
        title: `Incasso imminente: tra ${diffDays}g scade la rata di ${client.name}`,
        subtitle: `Rata da ${formatEuro(t.amount)}`,
        clientId: client.id,
      });
    } else if (diffDays === 7) {
      tasks.push({
        id: `tx-7d-${t.id}`,
        icon: <Receipt className="h-4 w-4" />,
        priority: 'medium',
        title: `Tra 7 giorni scade la rata di ${client.name}`,
        subtitle: `Rata da ${formatEuro(t.amount)}`,
        clientId: client.id,
      });
    }
  });

  clients.forEach(c => {
    const stageDays = daysSince(c.stage_updated_at);
    const leadAge = daysSince(c.created_at);
    const sinceContact = c.last_contacted_at ? daysSince(c.last_contacted_at) : null;

    // Churn Prevention — Cliente Attivo con churn_risk Alto
    if (c.pipeline_stage === 'Closed Won' && c.churn_risk === 'Alto') {
      tasks.push({
        id: `churn-${c.id}`,
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
        id: `ptpack-${c.id}`,
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
        id: `nurture-${c.id}-${sinceContact}`,
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
        id: `roi-${c.id}-${stageDays}`,
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
        id: `pitch-${c.id}`,
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
        id: `qualify-${c.id}`,
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
      {sorted.map((t) => {
        const s = priorityStyles[t.priority];
        return (
          <button
            key={t.id}
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
