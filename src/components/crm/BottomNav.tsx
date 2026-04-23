import { NavLink, useLocation } from 'react-router-dom';
import { Home, KanbanSquare, Users, Plus, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyToggle } from '@/components/crm/PrivacyToggle';

interface Props {
  onFabClick: () => void;
}

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/finance', label: 'Finance', icon: Target },
  { to: '/clients', label: 'Clienti', icon: Users },
];

export const BottomNav = ({ onFabClick }: Props) => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom pointer-events-none">
      <div className="relative mx-auto max-w-md px-4 pb-3 pt-2 pointer-events-auto">
        {/* Floating privacy toggle above the bar */}
        <div className="absolute right-4 -top-2 z-10">
          <PrivacyToggle variant="mobile" />
        </div>
        <div className="relative flex items-center justify-around rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-2 py-2 shadow-card">
          {items.slice(0, 2).map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink key={to} to={to} className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-smooth',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </NavLink>
            );
          })}

          {/* FAB spacer */}
          <div className="w-16 flex items-center justify-center">
            <button
              onClick={onFabClick}
              aria-label="Aggiungi lead"
              className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl gradient-primary shadow-fab transition-smooth active:scale-95 animate-pulse-glow"
            >
              <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={3} />
            </button>
          </div>

          {items.slice(2).map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink key={to} to={to} className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-smooth',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
