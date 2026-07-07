import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[filter,background,border-color,box-shadow] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:brightness-110 hover:shadow-[0_2px_12px_var(--primary-soft)]',
        secondary: 'bg-card-2 text-fg-2 border border-border hover:bg-card-2/70',
        outline: 'border border-border bg-input text-fg hover:bg-card-2',
        ghost: 'text-fg-2 hover:bg-card-2',
        subtle: 'bg-card-2 text-fg hover:bg-border/40',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-3.5',
        lg: 'h-10 px-4',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
