/**
 * `context` no cambia el color hoy (Figma no define una variante visual por
 * contexto): se tipa igual porque identifica qué mide la barra para quien
 * lea el marcado o instrumente analítica, y para no tener que romper la API
 * el día que sí haya una variante visual por contexto.
 */
import { cn } from '@/utils/cn';

export type ProgressBarContext = 'requirements' | 'profile-completeness' | 'session-turns';

interface ProgressBarProps {
  context: ProgressBarContext;
  value: number;
  max?: number;
  /** Nombre accesible de la barra (p. ej. "Turnos de la sesión"). Sin texto por defecto. */
  label: string;
  className?: string;
}

export function ProgressBar({ context, value, max = 100, label, className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      data-context={context}
      className={cn('bg-brand-tint h-2 w-full overflow-hidden rounded-full', className)}
    >
      <div
        className="bg-brand-base h-full rounded-full transition-[width]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
