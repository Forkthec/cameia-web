/** Mismo patrón que {@link ../Checkbox}: input nativo `sr-only` + visual controlado por props. */
import { useId, type ChangeEvent } from 'react';
import { cn } from '@/utils/cn';

interface RadioProps {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  value: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Texto visible junto al radio. Sin texto por defecto. */
  children: string;
}

export function Radio({
  checked,
  onChange,
  name,
  value,
  disabled = false,
  id,
  className,
  children,
}: RadioProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'gap-space-2 py-space-2 inline-flex min-h-[44px] items-center',
        disabled ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary cursor-pointer',
        className,
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          'peer-focus-visible:shadow-focus-ring peer-focus-visible:outline-none',
          disabled
            ? 'border-border-subtle bg-bg-disabled'
            : checked
              ? 'border-brand-base'
              : 'border-border-strong bg-bg-surface',
        )}
      >
        {checked ? (
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              disabled ? 'bg-text-disabled' : 'bg-brand-base',
            )}
          />
        ) : null}
      </span>
      <span className="text-body">{children}</span>
    </label>
  );
}
