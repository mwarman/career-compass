import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/css';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20',
        secondary: 'border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20',
        outline: 'border-border text-foreground',
        warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.ComponentProps<'div'>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
