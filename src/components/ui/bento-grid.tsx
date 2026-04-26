import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * BentoGrid — reusable asymmetric grid container.
 *
 * Built on top of the existing design system (no framer-motion, no extra deps).
 * Animations come from the shared `bento-stagger` utility in index.css.
 *
 * Usage:
 *   <BentoGrid columns={4}>
 *     <BentoCard className="md:col-span-2">{children}</BentoCard>
 *   </BentoGrid>
 */

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns at md+ breakpoint. Defaults to 3. */
  columns?: 3 | 4 | 6;
}

const COLS: Record<NonNullable<BentoGridProps['columns']>, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  6: 'md:grid-cols-6',
};

export const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, columns = 3, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bento-stagger grid grid-cols-1 gap-3 md:gap-4 auto-rows-min',
        COLS[columns],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
BentoGrid.displayName = 'BentoGrid';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Premium look: animated conic border + glow halo. Defaults to false. */
  highlight?: boolean;
  /** Inner padding. Defaults to true. */
  padded?: boolean;
}

/**
 * BentoCard — single tile with glassmorphism, glow hover and optional premium beam border.
 * The wrapper applies `col-span` classes when passed via className.
 */
export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, highlight = false, padded = true, children, ...props }, ref) => {
    if (highlight) {
      return (
        <div ref={ref} className={cn('ai-beam-border p-[1px] group', className)} {...props}>
          <div
            className={cn(
              'relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-accent/5',
              'transition-smooth group-hover:to-accent/10',
              padded && 'p-4 md:p-5',
            )}
          >
            <div className="ai-glow-halo" aria-hidden />
            <div className="relative h-full">{children}</div>
          </div>
        </div>
      );
    }
    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card',
          'transition-smooth hover:border-primary/40 hover:shadow-glow',
          padded && 'p-4 md:p-5',
          className,
        )}
        {...props}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/0 blur-3xl transition-smooth group-hover:bg-primary/15" aria-hidden />
        <div className="relative h-full">{children}</div>
      </div>
    );
  },
);
BentoCard.displayName = 'BentoCard';
