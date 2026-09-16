import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground shadow',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
  outline: 'text-foreground',
  success: 'border-transparent bg-emerald-100 text-emerald-900',
  warning: 'border-transparent bg-amber-100 text-amber-900',
};

export function Badge({
  variant = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Consistent colouring for the status-like strings every tool ends up with. */
export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
    case 'approved':
    case 'low':
      return 'success';
    case 'pending':
    case 'suspended':
    case 'medium':
      return 'warning';
    case 'rejected':
    case 'closed':
    case 'high':
      return 'destructive';
    default:
      return 'secondary';
  }
}
