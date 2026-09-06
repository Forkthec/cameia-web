/**
 * Tarjeta excluyente (radio semántico, no checkbox): dentro de un grupo solo
 * una puede estar seleccionada, como el modo de entrevista o el método de
 * armar el perfil. El agrupamiento (`role="radiogroup"`) es responsabilidad
 * de quien la usa, no de esta pieza individual.
 */
import { cloneElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';

export type CardSelectableState = 'default' | 'selected' | 'disabled';

interface CardSelectableProps {
  state?: CardSelectableState;
  onClick?: () => void;
  icon?: ReactElement<{ size?: number }>;
  title: string;
  description?: string;
  className?: string;
}

export function CardSelectable({
  state = 'default',
  onClick,
  icon,
  title,
  description,
  className,
}: CardSelectableProps) {
  const isSelected = state === 'selected';
  const isDisabled = state === 'disabled';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'gap-space-2 p-space-4 flex flex-col items-start rounded-lg border text-left transition-colors',
        'focus-visible:shadow-focus-ring focus-visible:outline-none',
        isDisabled
          ? 'border-border-subtle bg-bg-disabled text-text-disabled cursor-not-allowed'
          : isSelected
            ? 'border-brand-base bg-brand-tint text-text-primary'
            : 'border-border-strong bg-bg-surface text-text-primary hover:bg-bg-surface-sunken',
        className,
      )}
    >
      {icon ? cloneElement(icon, { size: 24 }) : null}
      <span className="text-body font-semibold">{title}</span>
      {description ? <span className="text-small text-text-muted">{description}</span> : null}
    </button>
  );
}
