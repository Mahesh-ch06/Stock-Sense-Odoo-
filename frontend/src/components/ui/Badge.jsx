import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400',
  {
    variants: {
      variant: {
        default:
          'border border-zinc-700 bg-zinc-800/80 text-zinc-200',
        secondary:
          'border border-zinc-800 bg-zinc-900 text-zinc-400',
        destructive:
          'border border-rose-500/20 bg-rose-500/10 text-rose-400',
        success:
          'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        warning:
          'border border-amber-500/20 bg-amber-500/10 text-amber-400',
        outline: 'border border-zinc-800 text-zinc-300',
        info: 'border border-sky-500/20 bg-sky-500/10 text-sky-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
