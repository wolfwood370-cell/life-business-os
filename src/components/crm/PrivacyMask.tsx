import { ReactNode, forwardRef } from 'react';
import { usePrivacyMode } from '@/store/usePrivacyMode';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  /** When true, applies blur even on hover. Default: blur is removed on hover for trainer to peek. */
  alwaysBlur?: boolean;
  /** Optional label to swap in instead of the masked content. */
  fallback?: ReactNode;
}

/**
 * Wraps sensitive content. When Privacy Mode is active the content is blurred
 * and slightly desaturated so the trainer can hand the phone to a client
 * without revealing psychographic notes or financial figures.
 */
export const PrivacyMask = forwardRef<HTMLSpanElement, Props>(
  ({ children, className, alwaysBlur = false, fallback }, ref) => {
    const { privacyMode } = usePrivacyMode();
    if (!privacyMode) return <>{children}</>;

    if (fallback !== undefined) {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-flex items-center rounded-md bg-muted/70 text-muted-foreground px-2 py-0.5 text-xs font-medium select-none',
            className
          )}
          aria-label="Dato nascosto in modalità privacy"
        >
          {fallback}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'relative inline-block align-baseline transition-[filter] duration-300 select-none',
          'blur-md saturate-50',
          !alwaysBlur && 'hover:blur-none hover:saturate-100',
          className
        )}
        aria-label="Dato nascosto in modalità privacy"
        title="Modalità Privacy attiva"
      >
        {children}
      </span>
    );
  }
);
PrivacyMask.displayName = 'PrivacyMask';

