/**
 * Tarjeta seleccionable (Figma `card-selectable`): una opción de un grupo de
 * selección excluyente (`role="radio"`), usada por el asistente de entrevista
 * y por el selector de método del perfil.
 *
 * **Presentación «Amanecer» (CM-208).** Solo cambia el diseño, no la API:
 * - El ícono va en un recuadro (`brand-tint`) que pasa a mostaza
 *   (`brand-accent`) al elegir la tarjeta.
 * - Un indicador circular a la derecha confirma la selección con un check.
 * - Al pasar el cursor sube 1px con `elevation-1`; con
 *   `prefers-reduced-motion` la regla global deja la transición en ~0.
 * - `badge` (opcional) muestra una etiqueta corta con el átomo `Pill`, p. ej.
 *   «Próximamente» en una opción deshabilitada.
 * - Altura mínima de 72px: supera el área táctil de 44×44 (CLAUDE.md §10).
 */
import { cloneElement, type ReactElement } from 'react';
import { Pill } from '@/design-system/atoms/Pill';
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

export type CardSelectableState = 'default' | 'selected' | 'disabled';

interface CardSelectableProps {
  state?: CardSelectableState;
  /** Bloquea el control (atributo nativo y clics) sin cambiar su apariencia; no hace falta con state="disabled", que ya lo implica. */
  disabled?: boolean;
  onClick?: () => void;
  icon?: ReactElement<{ size?: number }>;
  title: string;
  description?: string;
  /** Etiqueta corta junto al título (p. ej. «Próximamente»). Ya traducida. */
  badge?: string;
  className?: string;
}

export function CardSelectable({
  state = 'default',
  disabled = false,
  onClick,
  icon,
  title,
  description,
  badge,
  className,
}: CardSelectableProps) {
  const isSelected = state === 'selected';
  const isDisabled = state === 'disabled';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={isDisabled || disabled}
      onClick={onClick}
      className={cn(
        'group/card gap-space-4 p-space-4 relative flex min-h-[4.5rem] w-full items-start rounded-lg border-[1.5px] text-left',
        'transition-[background-color,border-color,translate,box-shadow] duration-[var(--duration-smooth)] ease-[var(--token-ease-out)]',
        'focus-visible:shadow-focus-ring focus-visible:outline-none',
        isDisabled
          ? 'border-border-subtle bg-bg-disabled text-text-disabled cursor-not-allowed border-dashed'
          : isSelected
            ? 'border-brand-base bg-brand-tint text-text-primary shadow-[inset_0_0_0_1px_var(--brand-base)]'
            : 'border-border-strong bg-bg-surface text-text-primary hover:border-brand-muted enabled:hover:shadow-elevation-1 cursor-pointer enabled:hover:-translate-y-px',
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-md transition-colors duration-[var(--duration-smooth)]',
            isDisabled
              ? 'bg-bg-surface-sunken text-text-disabled'
              : isSelected
                ? 'bg-brand-accent text-action-on-primary'
                : 'bg-brand-tint text-brand-base',
          )}
        >
          {cloneElement(icon, { size: 22 })}
        </span>
      ) : null}

      <span className="gap-space-1 pr-space-6 flex min-w-0 flex-1 flex-col">
        <span className="gap-space-2 flex flex-wrap items-center">
          <span className="text-body font-bold">{title}</span>
          {badge ? <Pill>{badge}</Pill> : null}
        </span>
        {description ? (
          <span className={cn('text-small', isDisabled ? 'text-text-disabled' : 'text-text-muted')}>
            {description}
          </span>
        ) : null}
      </span>

      {isDisabled ? null : (
        <span
          aria-hidden="true"
          className={cn(
            'right-space-3 top-space-3 absolute grid size-6 place-items-center rounded-full border-2 transition-colors',
            isSelected
              ? 'border-brand-base bg-brand-base text-text-on-inverse'
              : 'border-border-strong bg-bg-surface text-transparent',
          )}
        >
          <Icon name="check" size={14} />
        </span>
      )}
    </button>
  );
}
