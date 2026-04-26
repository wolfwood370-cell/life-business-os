import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, KanbanSquare, Users, Plus, Dumbbell, BarChart3, LogOut, Target, Brain, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PrivacyToggle } from '@/components/crm/PrivacyToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  onFabClick: () => void;
}

const items = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/clients', label: 'Clienti', icon: Users },
  { to: '/finance', label: 'Finance OS', icon: Target },
  { to: '/strategy', label: 'Sales Strategy', icon: Brain },
  { to: '/coach', label: 'Sales Coach', icon: BarChart3 },
];

export const SideNav = ({ onFabClick }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Disconnesso');
    navigate('/auth');
  };
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-border bg-card/40 sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Life & Business OS</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Centro di Comando</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 space-y-2">
        <PrivacyToggle variant="desktop" />
        <Button
          onClick={onFabClick}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
          Aggiungi Lead
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Esci
        </Button>
      </div>
    </aside>
  );
};
