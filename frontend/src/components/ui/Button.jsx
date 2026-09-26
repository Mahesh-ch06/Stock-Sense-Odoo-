import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-50 text-zinc-900 shadow-sm hover:bg-zinc-200/90 font-semibold',
        destructive:
          'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 shadow-sm',
        outline:
          'border border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50 shadow-xs',
        secondary:
          'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80 shadow-xs border border-zinc-700/50',
        ghost:
          'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
        link: 'text-zinc-200 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3.5 py-1.5',
        sm: 'h-7 rounded-md px-2.5 text-xs',
        lg: 'h-9 rounded-md px-4 text-sm',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
