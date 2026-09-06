/**
 * Etiqueta puramente informativa. Nunca es clicable: se tipa sobre
 * `HTMLAttributes<HTMLSpanElement>` (no `ButtonHTMLAttributes`) y se excluye
 * `onClick` explícitamente, así que pasarlo es un error de compilación, no
 * solo una convención documentada.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PillProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'onClick'> {
  className?: string;
  children: ReactNode;
}

export function Pill({ className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        'gap-space-1 border-border-subtle bg-bg-surface-sunken px-space-3 py-space-1 text-small text-text-primary inline-flex items-center rounded-full border',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
