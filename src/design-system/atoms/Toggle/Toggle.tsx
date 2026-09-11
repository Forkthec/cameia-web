/**
 * Switch on/off. Es un `<input type="checkbox">` con `role="switch"` (patrón
 * ARIA 1.2 soportado por los lectores de pantalla principales) para que se
 * anuncie como interruptor y no como casilla, conservando el comportamiento
 * de teclado nativo del checkbox.
 */
import { useId, type ChangeEvent } from 'react';
import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Texto visible junto al switch. Sin texto por defecto. */
  children: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  className,
  children,
}: ToggleProps) {
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
        role="switch"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          'peer-focus-visible:shadow-focus-ring peer-focus-visible:outline-none',
          disabled ? 'bg-bg-disabled' : checked ? 'bg-brand-base' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'bg-bg-surface absolute top-0.5 h-5 w-5 rounded-full transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="text-body">{children}</span>
    </label>
  );
}
