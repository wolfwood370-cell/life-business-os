import { useCrm, daysSince } from '@/store/crmStore';
import { Bell, Clock, Flame, UserCheck, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: 'warning' | 'primary' | 'destructive' | 'muted';
  priority: number;
  clientId?: string;
}

const toneClass = {
  warning: 'bg-warning/10 text-warning',
  primary: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export const TaskQueue = () => {
  const { clients } = useCrm();
  const navigate = useNavigate();

  const tasks: Task[] = [];

  clients.forEach(c => {
    const stageDays = daysSince(c.stage_updated_at);
    const leadAge = daysSince(c.created_at);

    // Follow-up sequence: Nurturing / Trial Active — task scatta a >=1, >=3, >=7 giorni
    if (c.pipeline_stage === 'Nurturing' || c.pipeline_stage === 'Trial Active') {
      if (stageDays >= 1) {
        const urgent = stageDays >= 7;
        const warn = stageDays >= 3;
        tasks.push({
          icon: urgent ? <Flame className="h-4 w-4" /> : <Zap className="h-4 w-4" />,
          tone: urgent ? 'destructive' : warn ? 'warning' : 'primary',
          priority: urgent ? 0 : warn ? 1 : 2,
          title: `Follow-up strategico — ${c.name}`,
          subtitle: `${stageDays}g in "${c.pipeline_stage === 'Nurturing' ? 'In Trattativa' : 'Prova/Trial Attivo'}"`,
          clientId: c.id,
        });
      }
    }

    // Pitch presented urgent follow-up
    if (c.pipeline_stage === 'Pitch Presented' && stageDays >= 2) {
      tasks.push({
        icon: <Flame className="h-4 w-4" />, tone: 'destructive', priority: 0,
        title: `Chiudere la proposta — ${c.name}`,
        subtitle: `Proposta presentata ${stageDays}g fa`, clientId: c.id,
      });
    }

    // Milestone reviews per Cliente Attivo: Day 45 e Day 80 (finestra di 5g per non perderli)
    if (c.pipeline_stage === 'Closed Won') {
      const milestone = leadAge >= 80 && leadAge <= 84 ? 80 : leadAge >= 45 && leadAge <= 49 ? 45 : null;
      if (milestone) {
        tasks.push({
          icon: <Trophy className="h-4 w-4" />, tone: 'primary', priority: 1,
          title: `Review Risultati — ${c.name}`,
          subtitle: `Milestone ${milestone} giorni`, clientId: c.id,
        });
      }
    }

    // PT Pack expiry: 3 sessioni o 14 giorni dall'acquisizione (solo se non chiuso)
    if (
      c.lead_source === 'PT Pack 99€' &&
      c.pipeline_stage !== 'Closed Won' &&
      c.pipeline_stage !== 'Closed Lost'
    ) {
      const sessions = c.pt_pack_sessions_used || 0;
      if (sessions >= 3 || leadAge >= 14) {
        tasks.push({
          icon: <UserCheck className="h-4 w-4" />, tone: 'warning', priority: 1,
          title: `Pitch Finale — ${c.name}`,
          subtitle: sessions >= 3 ? `${sessions} sessioni completate` : `${leadAge}g dal pacchetto`,
          clientId: c.id,
        });
      }
    }

    // Nuovo lead in attesa di qualifica
    if (c.pipeline_stage === 'Lead Acquired' && stageDays >= 1) {
      tasks.push({
        icon: <Clock className="h-4 w-4" />, tone: 'muted', priority: 3,
        title: `Qualificare — ${c.name}`,
        subtitle: 'Nuovo contatto in attesa', clientId: c.id,
      });
    }
  });

  const sorted = tasks.sort((a, b) => a.priority - b.priority);

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Tutto sotto controllo. Vai ad allenarti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((t, i) => (
        <button
          key={i}
          onClick={() => t.clientId && navigate(`/clients/${t.clientId}`)}
          className="w-full text-left rounded-2xl border border-border bg-card p-4 transition-smooth active:scale-[0.98] hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass[t.tone]}`}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
