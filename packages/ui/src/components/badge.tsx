import * as React from 'react';
import { cn } from '../lib/utils';

/** Neutral pill used for counts and status chips. */
export const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-border bg-card-2',
      'px-2 py-0.5 text-[11.5px] font-medium text-fg-2 font-mono',
      className,
    )}
    {...props}
  />
));
Badge.displayName = 'Badge';
