'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

/** The pill toggle used across the design (Board/List, Live/Loading/Empty). */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-border bg-card-2 p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer',
              size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-7 px-3 text-[12.5px]',
              active
                ? 'bg-bg-2 text-fg shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                : 'text-muted hover:text-fg-2',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
