/**
 * Campo de texto del design system. `type` incluye `'textarea'` (Figma lo
 * trata como una variante más de este mismo componente, no como un átomo
 * aparte), así que por dentro se decide entre `<textarea>` y `<input>`.
 *
 * El mensaje de error vive DENTRO de Input (no en una molécula aparte) para
 * poder generar el `id` con `useId()` y enlazarlo con `aria-describedby` en
 * el mismo lugar: así la asociación entre campo y error es responsabilidad
 * de una sola pieza, comprobable con una prueba de este mismo átomo.
 *
 * `describedBy` existe para cuando OTRO componente (p. ej. la molécula
 * FormField) ya renderiza su propio HelperText/ErrorText con su propio id:
 * se funde con el aria-describedby que Input calcula de su propio
 * errorMessage/helperText, en vez de que Input tenga que dejar de saber
 * generar el suyo.
 */
import { cva } from 'class-variance-authority';
import { useId, type ChangeEvent, type FocusEvent } from 'react';
import { cn } from '@/utils/cn';
import { ErrorText } from '../ErrorText';
import { HelperText } from '../HelperText';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'search' | 'textarea';
export type InputState = 'default' | 'focus' | 'error' | 'disabled' | 'disabled-with-tooltip';

const inputVariants = cva(
  [
    'w-full min-h-touch-target rounded-md border bg-bg-surface px-space-4 py-space-2 text-body text-text-primary',
    'placeholder:text-text-muted transition-colors',
    'focus-visible:outline-none focus-visible:shadow-focus-ring',
    'disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled',
  ],
  {
    variants: {
      state: {
        default: 'border-border-strong',
        // El foco real (:focus-visible) ya se cubre en las clases base. Este
        // valor existe para cuando el estado se fuerza explícitamente, tal
        // como lo enumera Figma.
        focus: 'border-border-focus shadow-focus-ring',
        error: 'border-danger-base',
        disabled: '',
        'disabled-with-tooltip': '',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  },
);

interface InputProps {
  type?: InputType;
  state?: InputState;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  /** Solo aplica cuando `type="textarea"`. */
  rows?: number;
  autoComplete?: string;
  className?: string;
  /** Contenido obligatorio cuando `state="error"`. */
  errorMessage?: string;
  helperText?: string;
  /** Contenido obligatorio cuando `state="disabled-with-tooltip"`. */
  disabledTooltip?: string;
  /** Id externo (p. ej. de FormField) a fundir con el aria-describedby propio de Input. */
  describedBy?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function Input({
  type = 'text',
  state = 'default',
  id,
  className,
  errorMessage,
  helperText,
  disabledTooltip,
  describedBy: externalDescribedBy,
  rows,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const isError = state === 'error';
  const isDisabled = state === 'disabled' || state === 'disabled-with-tooltip';
  const internalDescribedBy = isError && errorMessage ? errorId : helperText ? helperId : undefined;
  const describedBy =
    [externalDescribedBy, internalDescribedBy].filter(Boolean).join(' ') || undefined;

  const sharedClassName = cn(inputVariants({ state }), className);

  return (
    <div className="gap-space-1 flex flex-col">
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          rows={rows ?? 4}
          disabled={isDisabled}
          aria-invalid={isError}
          aria-describedby={describedBy}
          className={cn(sharedClassName, 'h-auto resize-y')}
          {...rest}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          disabled={isDisabled}
          aria-invalid={isError}
          aria-describedby={describedBy}
          className={sharedClassName}
          {...rest}
        />
      )}
      {isError && errorMessage ? (
        <ErrorText id={errorId}>{errorMessage}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
      {state === 'disabled-with-tooltip' && disabledTooltip ? (
        <span className="sr-only">{disabledTooltip}</span>
      ) : null}
    </div>
  );
}
