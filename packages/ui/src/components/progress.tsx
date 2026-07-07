import * as React from 'react';
import { cn } from '../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  color?: string;
}

export function Progress({ value, color, className, ...props }: ProgressProps) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-track', className)} {...props}>
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? 'var(--primary)' }}
      />
    </div>
  );
}
