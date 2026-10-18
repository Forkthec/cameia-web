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
 *
 * **Respuesta de la acción primaria (CM-329, dirección «Amanecer»).** Vive en
 * el átomo y no en cada pantalla (ADR-0001): `primary` sube 1px con
 * `elevation-2` al pasar el cursor y se encoge levemente al presionar, y un
 * ícono final (`iconPosition="end"`, p. ej. una flecha) avanza 4px. Así
 * cambiarlo es editar este archivo y no los organismos que lo usan. Solo en
 * botones habilitados (`enabled:`), y con `prefers-reduced-motion` la regla
 * global de `styles/index.css` deja las transiciones en ~0.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-space-2 rounded-full font-body font-semibold',
    'transition-[background-color,color,border-color,translate,scale,box-shadow] duration-[var(--duration-quick)] ease-[var(--token-ease-out)]',
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
        primary: [
          'bg-action-primary text-action-on-primary hover:bg-action-primary-hover active:bg-action-primary-press',
          'enabled:hover:shadow-elevation-2 enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.98]',
        ],
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
  icon?: ReactElement<{ size?: number; className?: string }>;
  /** Lado del ícono respecto a la etiqueta. `end` para flechas de avance (el ícono avanza al pasar el cursor). */
  iconPosition?: 'start' | 'end';
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
  iconPosition = 'start',
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isIconOnly = variant === 'icon';

  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), 'group/button', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon && iconPosition === 'start' ? cloneElement(icon, { size: 20 }) : null}
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
      {icon && iconPosition === 'end'
        ? cloneElement(icon, {
            size: 20,
            className: cn(
              'transition-[translate] duration-[var(--duration-smooth)] ease-[var(--token-ease-out)] group-enabled/button:group-hover/button:translate-x-1',
              icon.props.className,
            ),
          })
        : null}
    </button>
  );
}
