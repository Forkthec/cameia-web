/**
 * Indicador de progreso del asistente por pasos (interview-setup).
 *
 * **«El camino del amanecer» (CM-208, dirección visual «Amanecer»).** Un nodo
 * por paso sobre un riel que se llena a medida que se avanza:
 * - `complete`: nodo índigo (`brand-base`) con check.
 * - `current`: el «sol» de la marca (`bg-brand-sun`) con halo, un poco más
 *   grande; lleva `aria-current="step"`.
 * - `upcoming`: nodo vacío con el número.
 *
 * Por debajo de `md` los nombres de los pasos quedan solo para lectores de
 * pantalla (`sr-only`): en el teléfono no caben cinco etiquetas, y el título
 * del paso actual ya lo muestra la página. La API (`steps`, `label`) no
 * cambia respecto a la versión anterior.
 */
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface Step {
  label: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  /** Nombre accesible de la lista de pasos (p. ej. "Progreso del asistente"). */
  label?: string;
  className?: string;
}

export function Stepper({ steps, label, className }: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === 'current'),
  );
  const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;
  // El riel va de centro a centro del primer y último nodo: cada columna mide
  // 100/n %, así que el riel empieza y termina a media columna.
  const inset = steps.length > 0 ? `${50 / steps.length}%` : '0%';

  return (
    <div className={cn('relative', className)}>
      {/* Fuera del <ol>: una lista solo puede contener <li>. */}
      <span
        aria-hidden="true"
        className="bg-border-subtle absolute top-[1.125rem] h-1 rounded-full md:top-[1.375rem]"
        style={{ left: inset, right: inset }}
      >
        <span
          className="from-brand-accent-light to-brand-accent absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-[var(--duration-cinematic)] ease-[var(--token-ease-expo)]"
          style={{ width: `${progress}%` }}
        />
      </span>
      <ol
        aria-label={label}
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.status === 'current' ? 'step' : undefined}
            className="gap-space-2 relative flex flex-col items-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-10 place-items-center rounded-full border-2 transition-[background-color,border-color,color,scale,box-shadow] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)] md:size-12',
                'font-brand text-small font-bold',
                step.status === 'complete' &&
                  'border-brand-base bg-brand-base text-text-on-inverse',
                step.status === 'current' &&
                  'border-brand-accent bg-brand-sun text-action-on-primary scale-110 shadow-[0_0_0_6px_color-mix(in_srgb,var(--brand-accent)_18%,transparent),0_0_28px_4px_color-mix(in_srgb,var(--brand-accent)_35%,transparent)]',
                step.status === 'upcoming' && 'border-border-strong bg-bg-surface text-text-muted',
              )}
            >
              {step.status === 'complete' ? <Icon name="check" size={18} /> : index + 1}
            </span>
            <span
              className={cn(
                'text-small sr-only max-w-[10rem] text-center leading-tight md:not-sr-only',
                step.status === 'current'
                  ? 'text-brand-deep font-bold'
                  : step.status === 'complete'
                    ? 'text-text-primary font-semibold'
                    : 'text-text-muted',
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
