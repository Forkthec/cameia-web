/**
 * Lista vertical de secciones para el formulario de perfil — a diferencia de
 * Stepper (horizontal, 3 pasos de un asistente), aquí cada ítem es una
 * sección con nombre propio, sin conector visual entre ellas.
 */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';
import type { StepStatus } from '../Stepper';

export interface StepListItem {
  label: string;
  status: StepStatus;
}

interface StepListProps {
  items: StepListItem[];
  /** Nombre accesible de la lista (p. ej. "Secciones del perfil"). */
  label?: string;
  className?: string;
}

export function StepList({ items, label, className }: StepListProps) {
  return (
    <ol aria-label={label} className={cn('gap-space-1 flex flex-col', className)}>
      {items.map((item, index) => (
        <li key={item.label} className="gap-space-2 py-space-2 flex items-center">
          <span
            aria-current={item.status === 'current' ? 'step' : undefined}
            className={cn(
              'text-label flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-semibold',
              item.status === 'complete'
                ? 'bg-brand-base text-text-on-inverse'
                : item.status === 'current'
                  ? 'border-brand-base text-brand-base border-2'
                  : 'border-border-strong text-text-muted border',
            )}
          >
            {item.status === 'complete' ? <Icon name="check-circle" size={14} /> : index + 1}
          </span>
          <span
            className={cn(
              'text-body',
              item.status === 'upcoming' ? 'text-text-muted' : 'text-text-primary',
            )}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
