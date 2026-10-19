/** Indicador horizontal tipo flujo para el asistente por pasos (interview-setup). */
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

function Diamond({ status }: { status: StepStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 h-3 w-3 shrink-0 rotate-45',
        status === 'complete'
          ? 'bg-brand-accent'
          : status === 'current'
            ? 'border-brand-accent border-2 bg-transparent'
            : 'border-border-strong border bg-transparent',
      )}
    />
  );
}

export function Stepper({ steps, label, className }: StepperProps) {
  return (
    <div className={className}>
      <ol aria-label={label} className="gap-space-1 flex items-center">
        {steps.map((step, index) => (
          <li key={step.label} className="contents">
            {index > 0 ? <Diamond status={step.status} /> : null}
            <div className="gap-space-1 flex flex-1 flex-col items-center">
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
                className={cn(
                  'h-2 w-full rounded-full',
                  step.status === 'complete'
                    ? 'bg-brand-accent'
                    : step.status === 'current'
                      ? 'bg-brand-accent/40'
                      : 'bg-border-subtle',
                )}
              />
              <span
                className={cn(
                  'text-center text-xs leading-tight',
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
