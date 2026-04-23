import { Eye, EyeOff } from 'lucide-react';
import { usePrivacyMode } from '@/store/usePrivacyMode';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  variant?: 'desktop' | 'mobile';
}

export const PrivacyToggle = ({ variant = 'desktop' }: Props) => {
  const { privacyMode, togglePrivacyMode } = usePrivacyMode();

  const handleClick = () => {
    togglePrivacyMode();
    toast.success(
      privacyMode ? 'Modalità Privacy disattivata' : 'Modalità Privacy attiva — dati sensibili nascosti'
    );
  };

  const Icon = privacyMode ? EyeOff : Eye;
  const label = privacyMode ? 'Privacy ON' : 'Privacy';

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleClick}
        aria-pressed={privacyMode}
        aria-label="Modalità Privacy"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-smooth active:scale-95',
          privacyMode && 'border-primary/50 bg-primary/10 text-primary'
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={privacyMode}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-smooth border',
        privacyMode
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          'h-4 w-7 rounded-full transition-smooth relative',
          privacyMode ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-card transition-smooth',
            privacyMode ? 'left-[14px]' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
};
