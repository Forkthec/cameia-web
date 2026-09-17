/**
 * Botón del design system (CLAUDE.md §5: props nombradas como las variantes
 * de Figma — `variant`, `size`).
 *
 * Dos reglas de la especificación exigen tratamiento especial, no solo CSS:
 * - `loading` conserva el ancho del botón y cambia la etiqueta a gerundio en
 *   vez de reemplazar el texto por un spinner. Se logra apilando la etiqueta
 *   normal y la de carga en la misma celda de grid (`col-start-1 row-start-1`)
 *   y alternando `invisible` (que reserva espacio) en vez de `hidden`.
 * - `variant="icon"` no tiene texto visible, pero igual necesita nombre
 *   accesible: en vez de exigir `aria-label` por separado, `children` se usa
 *   siempre como el nombre accesible y se oculta visualmente con `sr-only`
 *   cuando el ícono está presente solo.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-space-2 rounded-full font-body font-semibold',
    'transition-colors',
    // Cursor de mano en todo botón habilitado: Tailwind (desde 4.x, igual que
    // 3.4+) no lo pone por defecto — el `cursor: default` nativo del
    // navegador se queda si no se agrega esta utilidad. `disabled:` de abajo
    // gana en un botón deshabilitado por especificidad (clase + pseudoclase).
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:shadow-focus-ring',
    // Regla dura: nunca opacidad global para disabled. El color se define por
    // estado (variant + disabled), no atenuando todo el botón.
    'disabled:cursor-not-allowed disabled:bg-bg-disabled disabled:text-text-disabled',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-action-primary text-action-on-primary hover:bg-action-primary-hover active:bg-action-primary-press',
        secondary:
          'border border-border-strong bg-bg-surface text-text-primary hover:bg-bg-surface-sunken',
        tertiary: 'bg-transparent text-brand-base hover:bg-brand-tint',
        destructive:
          'bg-danger-base text-text-on-inverse hover:bg-danger-hover active:bg-danger-hover',
        icon: 'bg-transparent text-text-primary hover:bg-bg-surface-sunken',
      },
      size: {
        lg: 'h-[52px] px-space-6 text-body',
        md: 'h-touch-target px-space-5 text-body',
        sm: 'h-[34px] px-space-4 text-small',
      },
    },
    compoundVariants: [
      // El botón "icon" es cuadrado: mismo ancho que el alto, sin padding
      // horizontal (el glifo se centra con justify-center).
      { variant: 'icon', size: 'lg', class: 'w-[52px] px-0' },
      { variant: 'icon', size: 'md', class: 'w-touch-target px-0' },
      { variant: 'icon', size: 'sm', class: 'w-[34px] px-0' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonBaseProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'className'>,
    VariantProps<typeof buttonVariants> {
  disabled?: boolean;
  /** Ícono a 20px (se fuerza el tamaño sin importar el que traiga el elemento). */
  icon?: ReactElement<{ size?: number }>;
  className?: string;
  /** Etiqueta visible (o nombre accesible si `variant="icon"`). Sin texto por defecto. */
  children: ReactNode;
}

type ButtonProps = ButtonBaseProps &
  (
    | { loading?: false; loadingLabel?: never }
    // Con loading=true, el gerundio es obligatorio: no hay texto por defecto
    // que el componente pueda inventar.
    | { loading: true; loadingLabel: string }
  );

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingLabel,
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isIconOnly = variant === 'icon';

  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon ? cloneElement(icon, { size: 20 }) : null}
      <span className={cn('relative inline-grid', isIconOnly && 'sr-only')}>
        <span
          className={cn('col-start-1 row-start-1', loading && 'invisible')}
          aria-hidden={loading}
        >
          {children}
        </span>
        <span
          className={cn('col-start-1 row-start-1', !loading && 'invisible')}
          aria-hidden={!loading}
        >
          {loading ? loadingLabel : null}
        </span>
      </span>
    </button>
  );
}
