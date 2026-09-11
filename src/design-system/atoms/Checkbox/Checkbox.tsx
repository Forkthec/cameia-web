/**
 * El `<input type="checkbox">` real queda oculto visualmente (`sr-only`, no
 * `hidden`) para conservar teclado y lector de pantalla nativos; la casilla
 * que se ve es un `<span>` decorativo controlado por el prop `checked`. El
 * anillo de foco reacciona al foco del input real vía `peer-focus-visible`,
 * porque eso sí depende del navegador y no del estado que ya tenemos en JS.
 */
import { useId, type ChangeEvent } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

interface CheckboxProps {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Texto visible junto a la casilla. Sin texto por defecto. */
  children: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  className,
  children,
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'gap-space-2 py-space-2 min-h-touch-target inline-flex items-center',
        disabled ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary cursor-pointer',
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border',
          'peer-focus-visible:shadow-focus-ring peer-focus-visible:outline-none',
          disabled
            ? 'border-border-subtle bg-bg-disabled'
            : checked
              ? 'border-brand-base bg-brand-base'
              : 'border-border-strong bg-bg-surface',
        )}
      >
        {checked ? <Icon name="check-circle" size={14} className="text-text-on-inverse" /> : null}
      </span>
      <span className="text-body">{children}</span>
    </label>
  );
}
