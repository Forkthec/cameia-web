/** Indicador horizontal para el asistente de 3 pasos (interview-setup). */
import { cn } from '@/utils/cn';
import { Divider } from '../../atoms/Divider';
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
    <ol aria-label={label} className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <li key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="gap-space-1 flex flex-col items-center">
            <span
              aria-current={step.status === 'current' ? 'step' : undefined}
              className={cn(
                'text-small flex h-8 w-8 items-center justify-center rounded-full font-semibold',
                step.status === 'complete'
                  ? 'bg-brand-base text-text-on-inverse'
                  : step.status === 'current'
                    ? 'border-brand-base text-brand-base border-2'
                    : 'border-border-strong text-text-muted border',
              )}
            >
              {step.status === 'complete' ? <Icon name="check-circle" size={16} /> : index + 1}
            </span>
            <span
              className={cn(
                'text-small',
                step.status === 'upcoming' ? 'text-text-muted' : 'text-text-primary',
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 ? <Divider className="mx-space-2 flex-1" /> : null}
        </li>
      ))}
    </ol>
  );
}
