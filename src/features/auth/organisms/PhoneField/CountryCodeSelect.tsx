/**
 * Disparador compacto de país para `PhoneField` (auth, seguimiento de CM-34):
 * un `Select` nativo con el nombre completo del país se trunca en un ancho
 * angosto ("Colombia (+57)" no cabe en `w-38`, captura de pantalla que
 * originó este archivo) y ensancharlo para el nombre más largo del catálogo
 * ("Trinidad y Tobago") desperdicia espacio en el caso común. Este
 * disparador muestra solo `{ISO} +{indicativo}` — nunca se trunca, el
 * contenido siempre es corto — y abre un panel con buscador para elegir por
 * nombre completo.
 *
 * No se construye extendiendo `Combobox` (`design-system/molecules/`): ese
 * componente es multi-selección, con un `<input>` siempre visible como
 * disparador y los seleccionados como `Chip` removibles debajo — encaja con
 * "Roles Objetivo" (CM-69), no con una sola selección detrás de un botón
 * cerrado. El panel interno sí reutiliza su mismo patrón ARIA de
 * combobox+listbox para el buscador, ya probado en este código base.
 *
 * Vive junto a `PhoneField`, su único consumidor (`CLAUDE.md` §4: sube a
 * `design-system/` cuando lo use una segunda feature) — no se exporta desde
 * `PhoneField/index.ts`.
 *
 * Sin bandera (`CLAUDE.md` §13, ya revisado: el design system no tiene
 * assets de bandera por país) — el código ISO de 2 letras es el único
 * desambiguador barato para indicativos que comparten varios países
 * (`+1`: EE. UU., Canadá y ~20 países del Caribe).
 */
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/design-system/icons/Icon';
import type { InputState } from '@/design-system/atoms/Input';
import { cn } from '@/utils/cn';

interface CountryOption {
  value: string;
  label: string;
}

function useCountryOptions(): CountryOption[] {
  return useMemo(() => {
    const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return getCountries()
      .map((country) => ({
        value: country,
        label: `${displayNames.of(country) ?? country} (+${getCountryCallingCode(country)})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, []);
}

interface CountryCodeSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Nombre accesible del disparador. Obligatoria, sin valor por defecto (CLAUDE.md §14.7). */
  label: string;
  /** Placeholder y nombre accesible del buscador dentro del panel. */
  buscarLabel: string;
  /** Mensaje cuando el buscador no encuentra ningún país. */
  sinResultadosLabel: string;
  state?: InputState;
  className?: string;
}

export function CountryCodeSelect({
  id,
  value,
  onChange,
  label,
  buscarLabel,
  sinResultadosLabel,
  state = 'default',
  className,
}: CountryCodeSelectProps) {
  const options = useCountryOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;

  const isDisabled = state === 'disabled' || state === 'disabled-with-tooltip';
  const dialCode = getCountryCallingCode(value as CountryCode);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  function openPanel() {
    if (isDisabled) return;
    setQuery('');
    setActiveIndex(filteredOptions.findIndex((option) => option.value === value));
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function selectOption(option: CountryOption) {
    onChange(option.value);
    closePanel();
    triggerRef.current?.focus();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) selectOption(option);
    } else if (event.key === 'Escape') {
      closePanel();
      triggerRef.current?.focus();
    }
  }

  const activeOptionId =
    activeIndex >= 0 && filteredOptions[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closePanel();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label}
        disabled={isDisabled}
        onClick={() => (isOpen ? closePanel() : openPanel())}
        className={cn(
          'min-h-touch-target px-space-3 gap-space-1 text-body text-text-primary bg-bg-surface flex w-full items-center justify-between rounded-md border transition-colors',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          isDisabled
            ? 'border-border-subtle bg-bg-disabled text-text-disabled cursor-not-allowed'
            : 'border-border-strong',
        )}
      >
        <span>
          {value} +{dialCode}
        </span>
        <Icon name="chevron-down" size={16} className="text-text-muted shrink-0" />
      </button>

      {isOpen ? (
        <div className="mt-space-1 border-border-subtle bg-bg-surface shadow-elevation-2 p-space-2 absolute z-10 min-w-64 rounded-md border">
          <input
            ref={searchRef}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- el panel recién se abrió, el foco debe ir al buscador
            autoFocus
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-label={buscarLabel}
            value={query}
            placeholder={buscarLabel}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleSearchKeyDown}
            className="border-border-strong px-space-3 py-space-2 text-body mb-space-2 focus-visible:shadow-focus-ring w-full rounded-md border focus-visible:outline-none"
          />
          <ul id={listboxId} role="listbox" aria-label={label} className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <li className="px-space-3 py-space-2 text-small text-text-muted">
                {sinResultadosLabel}
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  // onMouseDown, no onClick: el blur del buscador dispara antes que el
                  // click y cerraría el panel antes de registrar la selección (mismo
                  // motivo que Combobox.tsx).
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option);
                  }}
                  className={cn(
                    'px-space-3 py-space-2 text-body text-text-primary cursor-pointer rounded-sm',
                    index === activeIndex ? 'bg-brand-tint' : 'hover:bg-bg-surface-sunken',
                  )}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
