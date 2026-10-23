/**
 * Progreso por pasos dibujado como el arco del sol: un punto por paso sobre
 * una curva; los pasos alcanzados se encienden en mostaza. Debajo va la
 * etiqueta que manda quien lo usa (por ejemplo «Pregunta 2 de 5»), que es
 * también el nombre accesible de la barra de progreso. Se muestra tal cual
 * llega, sin cambiar sus mayúsculas: el texto ya viene traducido
 * (CLAUDE.md §14.7).
 *
 * No conoce el dominio ni el número de pasos: los recibe por props.
 */
import { cn } from '@/utils/cn';

interface ProgressArcProps {
  /** Paso actual, desde 1. */
  current: number;
  /** Total de pasos. */
  total: number;
  /** Texto visible y accesible del progreso, ya traducido. */
  label: string;
  className?: string;
}

const WIDTH = 360;
const BASE = 56;
const PEAK = -22;

/** Punto de la curva cuadrática del arco para `t` entre 0 y 1. */
function pointAt(t: number) {
  const x = 10 + (WIDTH - 20) * t;
  const y = (1 - t) * (1 - t) * BASE + 2 * (1 - t) * t * PEAK + t * t * BASE;
  return { x, y };
}

export function ProgressArc({ current, total, label, className }: ProgressArcProps) {
  const steps = Array.from({ length: total }, (_, index) => index);
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={label}
      className={cn('flex flex-col items-center', className)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} 62`}
        aria-hidden="true"
        className="h-auto w-64 overflow-visible sm:w-80"
      >
        <path
          d={`M10 ${BASE} Q${WIDTH / 2} ${PEAK} ${WIDTH - 10} ${BASE}`}
          fill="none"
          strokeWidth={2}
          strokeDasharray="2 7"
          strokeLinecap="round"
          className="stroke-text-on-inverse/20"
        />
        {steps.map((index) => {
          const { x, y } = pointAt(total === 1 ? 0.5 : index / (total - 1));
          const reached = index < current;
          const isCurrent = index === current - 1;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={isCurrent ? 6 : reached ? 5 : 4}
              className={cn(
                'transition-[fill] duration-[var(--duration-smooth)]',
                reached ? 'fill-brand-accent' : 'fill-text-on-inverse/30',
                isCurrent && 'drop-shadow-[0_0_8px_var(--brand-accent)]',
              )}
            />
          );
        })}
      </svg>
      <span
        aria-hidden="true"
        className="font-brand text-small text-brand-accent-light mt-1 font-bold tracking-[0.24em]"
      >
        {label}
      </span>
    </div>
  );
}
