import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, KanbanSquare, Users, Plus, Target, Menu as MenuIcon, LogOut, Dumbbell, BarChart3, Brain, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyToggle } from '@/components/crm/PrivacyToggle';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  onFabClick: () => void;
}

const primaryItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
];

const secondaryItems = [
  { to: '/finance', label: 'Finance', icon: Target },
];

const allItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/clients', label: 'Clienti', icon: Users },
  { to: '/finance', label: 'Finance OS', icon: Target },
  { to: '/strategy', label: 'Strategia di Vendita', icon: Brain },
  { to: '/coach', label: 'Sales Coach', icon: BarChart3 },
];

export const BottomNav = ({ onFabClick }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Disconnesso');
    setSheetOpen(false);
    navigate('/auth');
  };

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const renderNavLink = (to: string, label: string, Icon: typeof Home) => {
    const active = isActive(to);
    return (
      <NavLink
        key={to}
        to={to}
        className={cn(
          'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-smooth',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">{label}</span>
      </NavLink>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom pointer-events-none">
      <div className="relative mx-auto max-w-md px-4 pb-3 pt-2 pointer-events-auto">
        <div className="relative flex items-center justify-around rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-2 py-2 shadow-card">
          {primaryItems.map(({ to, label, icon }) => renderNavLink(to, label, icon))}

          {/* FAB */}
          <div className="w-16 flex items-center justify-center">
            <button
              onClick={onFabClick}
              aria-label="Aggiungi lead"
              className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl gradient-primary shadow-fab transition-smooth active:scale-95 animate-pulse-glow"
            >
              <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={3} />
            </button>
          </div>

          {secondaryItems.map(({ to, label, icon }) => renderNavLink(to, label, icon))}

          {/* Menu trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Apri menu"
                className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-smooth text-muted-foreground"
              >
                <MenuIcon className="h-5 w-5" strokeWidth={2} />
                <span className="text-[10px] font-semibold">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] flex flex-col p-0">
              <SheetHeader className="px-5 py-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                    <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-sm font-bold leading-tight">Life & Business OS</SheetTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Centro di Comando</p>
                  </div>
                </div>
                <SheetDescription className="sr-only">Navigazione principale dell'app.</SheetDescription>
              </SheetHeader>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {allItems.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-smooth',
                        active
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3 space-y-2 border-t border-border">
                <PrivacyToggle variant="desktop" />
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full h-11 rounded-xl text-muted-foreground hover:text-foreground justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Esci
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
