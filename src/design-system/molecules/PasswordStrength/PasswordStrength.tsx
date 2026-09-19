/**
 * Medidor de fuerza de contraseña (Figma, nodo `33:251`, componente
 * `password-strength`): 4 segmentos de 4px, `radius/full`, `gap space-1`,
 * ancho completo. `empty` no rellena ningún segmento y no muestra etiqueta;
 * los otros 4 niveles rellenan 1 a 4 segmentos con su propio color y
 * muestran `label` en ese mismo color (`text/password-strength-label`,
 * 12px/600). Las 4 barras son puramente decorativas (`aria-hidden`): la
 * información real para lectores de pantalla la da `label` a través de
 * `HelperText`, una sola vez.
 *
 * `strong` usa `--success-text` (`--green-700`), no `--success-base`
 * (`--green-500`, ya usado por `good`) — Figma distingue los dos verdes.
 * `--success-text` ya existía en `semantic.css` (pensado para texto sobre
 * fondo `success-tint`) sin ningún consumidor todavía — se reutiliza en vez
 * de agregar un token nuevo que apuntaría al mismo primitivo `--green-700`.
 */
import { cn } from '@/utils/cn';
import { HelperText } from '../../atoms/HelperText';

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const FILLED_SEGMENTS: Record<PasswordStrengthLevel, number> = {
  empty: 0,
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

const SEGMENT_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: 'bg-bg-surface-sunken',
  weak: 'bg-danger-base',
  fair: 'bg-warning-base',
  good: 'bg-success-base',
  strong: 'bg-success-text',
};

const LABEL_COLOR: Record<PasswordStrengthLevel, string> = {
  empty: '',
  weak: 'text-danger-base',
  fair: 'text-warning-base',
  good: 'text-success-base',
  strong: 'text-success-text',
};

interface PasswordStrengthProps {
  level: PasswordStrengthLevel;
  /** Débil/Aceptable/Buena/Fuerte ya traducido. Obligatoria salvo en `level="empty"`, que no muestra etiqueta (Figma). */
  label?: string;
  className?: string;
}

export function PasswordStrength({ level, label, className }: PasswordStrengthProps) {
  const filled = FILLED_SEGMENTS[level];

  return (
    <div className={cn('gap-space-1 flex w-full flex-col', className)}>
      <div aria-hidden="true" className="gap-space-1 flex h-1 w-full">
        {([1, 2, 3, 4] as const).map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-full',
              segment <= filled ? SEGMENT_COLOR[level] : SEGMENT_COLOR.empty,
            )}
          />
        ))}
      </div>
      {level !== 'empty' && label ? (
        <HelperText className={cn('text-small font-semibold', LABEL_COLOR[level])}>
          {label}
        </HelperText>
      ) : null}
    </div>
  );
}
