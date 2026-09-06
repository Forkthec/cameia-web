/**
 * `<hr>` es semánticamente horizontal; para vertical no hay elemento nativo
 * equivalente, así que se usa `role="separator"` + `aria-orientation` sobre
 * un `<div>`, tal como recomienda la especificación ARIA para separadores
 * no representados por `<hr>`.
 */
import { cn } from '@/utils/cn';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('bg-border-subtle w-px self-stretch', className)}
      />
    );
  }

  return <hr className={cn('border-border-subtle border-t', className)} />;
}
