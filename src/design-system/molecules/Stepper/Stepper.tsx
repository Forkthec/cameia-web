/** Indicador horizontal para el asistente por pasos (interview-setup). */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

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
  return (
    <div className={className}>
      <ol aria-label={label} className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex flex-1 items-center justify-center">
            {index > 0 ? (
              <div
                aria-hidden="true"
                className={cn(
                  'absolute top-4 right-1/2 -z-10 h-px w-full',
                  steps[index - 1].status === 'complete' ? 'bg-brand-accent' : 'bg-border-subtle',
                )}
              />
            ) : null}
            <div className="flex flex-col items-center">
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
                className={cn(
                  'bg-bg-canvas text-small relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold',
                  step.status === 'complete'
                    ? 'bg-brand-accent text-brand-deepest'
                    : step.status === 'current'
                      ? 'border-brand-accent text-brand-accent border-2'
                      : 'border-border-strong text-text-muted border',
                )}
              >
                {step.status === 'complete' ? <Icon name="check-circle" size={16} /> : index + 1}
              </span>
              <span
                className={cn(
                  'mt-space-1 max-w-20 text-center text-xs leading-tight',
                  step.status === 'upcoming' ? 'text-text-muted' : 'text-text-primary font-medium',
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
