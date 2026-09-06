/**
 * A diferencia de {@link ../Pill}, Chip sí es interactivo: se puede
 * seleccionar y, opcionalmente, quitar. Selección y remoción son dos
 * controles independientes (un botón no puede anidar otro botón en HTML
 * válido), así que el wrapper es un `<span>` no interactivo que contiene dos
 * `<button>` hermanos.
 */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

interface ChipBaseProps {
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children: string;
}

type ChipProps = ChipBaseProps &
  (
    | { onRemove?: undefined; removeLabel?: never }
    // Sin texto por defecto: el nombre accesible del botón de quitar lo da
    // quien lo consume (p. ej. "Quitar React" en vez de un "Quitar" genérico).
    | { onRemove: () => void; removeLabel: string }
  );

export function Chip({
  selected = false,
  onClick,
  onRemove,
  removeLabel,
  className,
  children,
}: ChipProps) {
  return (
    <span
      className={cn(
        'gap-space-1 py-space-1 pl-space-3 inline-flex items-center rounded-full border',
        onRemove ? 'pr-space-1' : 'pr-space-3',
        selected
          ? 'border-brand-base bg-brand-tint text-brand-base'
          : 'border-border-strong bg-bg-surface text-text-primary',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="text-small focus-visible:shadow-focus-ring rounded-full focus-visible:outline-none"
      >
        {children}
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className={cn(
            'relative flex h-4 w-4 items-center justify-center rounded-full',
            'focus-visible:shadow-focus-ring focus-visible:outline-none',
            // El chip debe verse compacto, pero el área táctil sigue siendo
            // 44x44: se logra con un pseudo-elemento absoluto que no afecta
            // el layout (en vez de agrandar el botón visible).
            "after:absolute after:top-1/2 after:left-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
          )}
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </span>
  );
}
