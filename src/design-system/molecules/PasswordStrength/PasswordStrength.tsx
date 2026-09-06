/**
 * Las 4 barras son puramente decorativas (`aria-hidden`): la información
 * real para lectores de pantalla la da `label` a través de HelperText, una
 * sola vez — no se duplica también como aria-label del medidor.
 */
import { cn } from '@/utils/cn';
import { HelperText } from '../../atoms/HelperText';

export type PasswordStrengthLevel = 1 | 2 | 3 | 4;

const LEVEL_COLOR: Record<PasswordStrengthLevel, string> = {
  1: 'bg-danger-base',
  2: 'bg-warning-base',
  3: 'bg-info-base',
  4: 'bg-success-base',
};

interface PasswordStrengthProps {
  level: PasswordStrengthLevel;
  /** Descripción del nivel (p. ej. "Fuerte"). Sin texto por defecto. */
  label: string;
  className?: string;
}

export function PasswordStrength({ level, label, className }: PasswordStrengthProps) {
  return (
    <div className={cn('gap-space-1 flex flex-col', className)}>
      <div aria-hidden="true" className="gap-space-1 flex">
        {([1, 2, 3, 4] as const).map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-full',
              segment <= level ? LEVEL_COLOR[level] : 'bg-bg-surface-sunken',
            )}
          />
        ))}
      </div>
      <HelperText>{label}</HelperText>
    </div>
  );
}
