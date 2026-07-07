import * as React from 'react';
import { cn } from '../lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-border bg-input px-3 py-2.5 text-[13px] leading-relaxed text-fg-2',
      'placeholder:text-muted transition-[border-color,box-shadow] resize-vertical',
      'focus:border-primary focus:ring-[3px] focus:ring-primary-soft focus:outline-none',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
