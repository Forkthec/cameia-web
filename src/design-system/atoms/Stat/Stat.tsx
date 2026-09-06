/**
 * `tabular-nums` es obligatorio: sin eso, dígitos de distinto ancho ("1" vs
 * "8") desalinean números que cambian en el tiempo (p. ej. un contador),
 * porque cada dígito ocupa un espacio distinto en vez de una columna fija.
 */
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface StatProps {
  value: string | number;
  /** Descripción del valor (p. ej. "Entrevistas completadas"). Sin texto por defecto. */
  label: ReactNode;
  className?: string;
}

export function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn('gap-space-1 flex flex-col', className)}>
      <span className="text-h2 text-text-primary tabular-nums">{value}</span>
      <span className="text-small text-text-muted">{label}</span>
    </div>
  );
}
