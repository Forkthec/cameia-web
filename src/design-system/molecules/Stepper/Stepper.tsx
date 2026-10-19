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
      <ol aria-label={label} className="flex items-start">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={cn('flex flex-col items-center', index < steps.length - 1 ? 'flex-1' : '')}
          >
            <div className="flex w-full items-center">
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
                className={cn(
                  'text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold',
                  step.status === 'complete'
                    ? 'bg-brand-accent text-brand-deepest'
                    : step.status === 'current'
                      ? 'border-brand-accent text-brand-accent border-2'
                      : 'border-border-strong text-text-muted border',
                )}
              >
                {step.status === 'complete' ? <Icon name="check-circle" size={16} /> : index + 1}
              </span>
              {index < steps.length - 1 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-space-2 h-px flex-1',
                    step.status === 'complete' ? 'bg-brand-accent' : 'bg-border-subtle',
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                'mt-space-1 w-full text-center text-xs',
                step.status === 'upcoming' ? 'text-text-muted' : 'text-text-primary font-medium',
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
