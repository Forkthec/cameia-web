/**
 * `context` no cambia el color hoy (Figma no define una variante visual por
 * contexto): se tipa igual porque identifica qué mide la barra para quien
 * lea el marcado o instrumente analítica, y para no tener que romper la API
 * el día que sí haya una variante visual por contexto.
 */
import { cn } from '@/utils/cn';

export type ProgressBarContext =
  'requirements' | 'profile-completeness' | 'session-turns' | 'report-metric';

interface ProgressBarProps {
  context: ProgressBarContext;
  value: number;
  /** Inicio de la escala; por defecto 0 (una nota de 1 a 5 empieza en 1). */
  min?: number;
  max?: number;
  /** `default` en índigo; `accent` en mostaza, el color del sol de la marca (reporte, CM-379). */
  tone?: 'default' | 'accent';
  /** Lectura del valor con su unidad (p. ej. «3,5 de 5»); sin ella se lee solo el número. */
  valueText?: string;
  /** Nombre accesible de la barra (p. ej. "Turnos de la sesión"). Sin texto por defecto. */
  label: string;
  className?: string;
}

export function ProgressBar({
  context,
  value,
  min = 0,
  max = 100,
  valueText,
  tone = 'default',
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, min), max);
  const percentage = max === min ? 0 : ((clamped - min) / (max - min)) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      aria-label={label}
      data-context={context}
      className={cn(
        tone === 'accent' ? 'bg-brand-accent/15' : 'bg-brand-tint',
        'h-2 w-full overflow-hidden rounded-full',
        className,
      )}
    >
      <div
        className={cn(
          tone === 'accent' ? 'bg-brand-accent' : 'bg-brand-base',
          'h-full rounded-full transition-[width]',
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
