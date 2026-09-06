/**
 * Selector múltiple con búsqueda, para roles objetivo (CM-69). El campo de
 * texto es un `<input>` propio, no el átomo Input: el patrón ARIA de
 * combobox (`role="combobox"`, `aria-expanded`, `aria-controls`,
 * `aria-activedescendant`) es un contrato de accesibilidad distinto al de un
 * campo de texto simple, así que se implementa aparte en vez de forzarlo
 * sobre Input. Los seleccionados se muestran como Chip (con acción de
 * quitar); el resto de la lista es markup propio del combobox.
 */
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { Chip } from '../../atoms/Chip';
import { Icon } from '../../icons/Icon';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  /** Nombre accesible del campo de búsqueda. */
  label: string;
  options: ComboboxOption[];
  selected: ComboboxOption[];
  onSelectionChange: (selected: ComboboxOption[]) => void;
  placeholder?: string;
  /** Mensaje cuando el filtro no encuentra coincidencias. Sin texto por defecto. */
  noResultsLabel: string;
  /** Arma el nombre accesible del botón de quitar por cada seleccionado. */
  getRemoveLabel: (option: ComboboxOption) => string;
  id?: string;
  describedBy?: string;
  className?: string;
}

export function Combobox({
  label,
  options,
  selected,
  onSelectionChange,
  placeholder,
  noResultsLabel,
  getRemoveLabel,
  id,
  describedBy,
  className,
}: ComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const filteredOptions = useMemo(() => {
    const selectedValues = new Set(selected.map((option) => option.value));
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        !selectedValues.has(option.value) && option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, selected, query]);

  function selectOption(option: ComboboxOption) {
    onSelectionChange([...selected, option]);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function removeOption(option: ComboboxOption) {
    onSelectionChange(selected.filter((item) => item.value !== option.value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      if (isOpen && activeIndex >= 0) {
        const option = filteredOptions[activeIndex];
        if (option) {
          event.preventDefault();
          selectOption(option);
        }
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0 && filteredOptions[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div className={cn('gap-space-2 flex flex-col', className)}>
      {selected.length > 0 ? (
        <div className="gap-space-2 flex flex-wrap">
          {selected.map((option) => (
            <Chip
              key={option.value}
              onRemove={() => removeOption(option)}
              removeLabel={getRemoveLabel(option)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-label={label}
          aria-describedby={describedBy}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          className="border-border-strong bg-bg-surface px-space-4 py-space-2 pr-space-8 text-body text-text-primary placeholder:text-text-muted focus-visible:shadow-focus-ring min-h-[44px] w-full rounded-md border focus-visible:outline-none"
        />
        <Icon
          name="chevron-down"
          size={20}
          className="right-space-2 text-text-muted pointer-events-none absolute top-1/2 -translate-y-1/2"
        />
        {isOpen ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="mt-space-1 border-border-subtle bg-bg-surface p-space-1 shadow-elevation-2 absolute z-10 max-h-60 w-full overflow-auto rounded-md border"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-space-3 py-space-2 text-small text-text-muted">{noResultsLabel}</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // onMouseDown, no onClick: el blur del input dispara antes que el
                  // click y cerraría la lista antes de registrar la selección.
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
        ) : null}
      </div>
    </div>
  );
}
