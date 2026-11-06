/**
 * Select nativo del design system (SPEC.md §9, decisión D-B): no existía
 * ningún átomo de selección única — `Input` no tiene `type="select"` y
 * `Combobox` es multi-selección con su propio patrón ARIA, no sirve para
 * "Nivel educativo" (CM-61). Envuelve un `<select>` nativo (teclado y
 * accesibilidad del navegador, sin ARIA manual que mantener) con la misma
 * forma que `Input`, para que `FormField` lo inyecte por `cloneElement` sin
 * cambios.
 *
 * Verificado en vivo contra Figma antes de crearlo (CLAUDE.md §13): el nodo
 * `32:150` ("select") es un componente real del design system de Figma, con
 * sus 5 estados (closed/open/selected/error/disabled) — no es una
 * invención de este ticket.
 *
 * `placeholder` es obligatorio, sin valor por defecto (CLAUDE.md §14.7): se
 * renderiza como la primera `<option>`, deshabilitada. Así un envío sin
 * elegir nada sigue mandando `""`, que el schema de validación rechaza
 * igual que cualquier campo vacío, y el usuario nunca puede volver a esa
 * opción una vez elige un valor real.
 *
 * `forwardRef` (CM-34 seguimiento): mismo motivo que `Input` — habilita el
 * foco automático de `react-hook-form` en el primer campo con error.
 */
import { cva } from 'class-variance-authority';
import { forwardRef, useId, type ChangeEvent, type FocusEvent } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';
import { ErrorText } from '../ErrorText';
import { HelperText } from '../HelperText';
import type { InputState } from '../Input';

const selectVariants = cva(
  [
    'w-full min-h-touch-target rounded-md border bg-bg-surface px-space-4 py-space-2 pr-space-7 text-body text-text-primary',
    // El chevron propio (abajo) reemplaza la flecha nativa del navegador.
    'appearance-none transition-colors',
    'focus-visible:outline-none focus-visible:shadow-focus-ring',
    'disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled',
  ],
  {
    variants: {
      state: {
        default: 'border-border-strong',
        focus: 'border-border-focus shadow-focus-ring',
        error: 'border-danger-base',
        disabled: '',
        'disabled-with-tooltip': '',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  /** Texto de la opción "sin elegir". Obligatoria, sin valor por defecto. */
  placeholder: string;
  state?: InputState;
  id?: string;
  name?: string;
  className?: string;
  /** Contenido obligatorio cuando `state="error"` y el Select se usa fuera de `FormField`. */
  errorMessage?: string;
  helperText?: string;
  /** Id externo (p. ej. de `FormField`) a fundir con el `aria-describedby` propio. */
  describedBy?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    onBlur,
    placeholder,
    state = 'default',
    id,
    name,
    className,
    errorMessage,
    helperText,
    describedBy: externalDescribedBy,
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const isError = state === 'error';
  const isDisabled = state === 'disabled' || state === 'disabled-with-tooltip';
  const internalDescribedBy = isError && errorMessage ? errorId : helperText ? helperId : undefined;
  const describedBy =
    [externalDescribedBy, internalDescribedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div className="gap-space-1 flex flex-col">
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
          aria-invalid={isError}
          aria-describedby={describedBy}
          className={cn(selectVariants({ state }), className)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={20}
          className="text-text-muted right-space-4 pointer-events-none absolute top-1/2 -translate-y-1/2"
        />
      </div>
      {isError && errorMessage ? (
        <ErrorText id={errorId}>{errorMessage}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
    </div>
  );
});
