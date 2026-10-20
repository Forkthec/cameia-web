/**
 * Autocompletado de seleccion unica con grupos opcionales (HU-4.2, CA-4.2.5).
 * A diferencia de Combobox (multi-select con chips), este selecciona un unico
 * valor y muestra el texto de la opcion elegida en el campo. Soporta grupos
 * para separar "De tu perfil" del resto del catalogo (CA-4.2.20).
 *
 * ARIA: `role="combobox"` con `aria-autocomplete="list"`, igual que Combobox.
 * CLAUDE.md §3.7/§14.7: no llama a `useTranslation`; todo texto visible
 * entra como prop.
 */
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';
import { ErrorText } from '../../atoms/ErrorText';

export interface AutocompleteOption {
  value: string;
  label: string;
}

export interface AutocompleteGroup {
  label: string;
  options: AutocompleteOption[];
}

interface AutocompleteProps {
  label: string;
  options: AutocompleteOption[];
  groups?: AutocompleteGroup[];
  selected: AutocompleteOption | null;
  onSelect: (option: AutocompleteOption | null) => void;
  placeholder?: string;
  noResultsLabel: string;
  id?: string;
  describedBy?: string;
  className?: string;
  errorMessage?: string;
}

export function Autocomplete({
  label,
  options,
  groups,
  selected,
  onSelect,
  placeholder,
  noResultsLabel,
  id,
  describedBy: externalDescribedBy,
  className,
  errorMessage,
}: AutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [externalDescribedBy, errorMessage ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined;

  const allOptions = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((g) => g.options);
    }
    return options;
  }, [options, groups]);

  const filteredFlat = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allOptions;
    return allOptions.filter((o) => o.label.toLowerCase().includes(normalizedQuery));
  }, [allOptions, query]);

  const filteredGroups = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return groups;
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter((o) => o.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  function selectOption(option: AutocompleteOption) {
    onSelect(option);
    setQuery(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((c) => Math.min(c + 1, filteredFlat.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((c) => Math.max(c - 1, 0));
    } else if (event.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && filteredFlat[activeIndex]) {
        event.preventDefault();
        selectOption(filteredFlat[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleBlur() {
    setIsOpen(false);
    setActiveIndex(-1);
    if (selected && query !== selected.label) {
      onSelect(null);
      setQuery('');
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0 && filteredFlat[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  let flatIndex = 0;

  return (
    <div className={cn('gap-space-1 flex flex-col', className)}>
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
          aria-invalid={!!errorMessage}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
            if (selected) {
              onSelect(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'border-border-strong bg-bg-surface px-space-4 py-space-2 pr-space-8 text-body text-text-primary placeholder:text-text-muted focus-visible:shadow-focus-ring min-h-touch-target w-full rounded-md border focus-visible:outline-none',
            errorMessage && 'border-danger-base',
          )}
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
            {filteredFlat.length === 0 ? (
              <li className="px-space-3 py-space-2 text-small text-text-muted">{noResultsLabel}</li>
            ) : filteredGroups ? (
              filteredGroups.map((group) => {
                const groupItems = group.options.map((option) => {
                  const currentFlatIndex = flatIndex++;
                  return (
                    <li
                      key={option.value}
                      id={`${listboxId}-option-${currentFlatIndex}`}
                      role="option"
                      aria-selected={currentFlatIndex === activeIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectOption(option);
                      }}
                      className={cn(
                        'px-space-3 py-space-2 text-body text-text-primary cursor-pointer rounded-sm',
                        currentFlatIndex === activeIndex
                          ? 'bg-brand-tint'
                          : 'hover:bg-bg-surface-sunken',
                      )}
                    >
                      {option.label}
                    </li>
                  );
                });
                return (
                  <li key={group.label} role="presentation">
                    <div className="px-space-3 py-space-1 text-small text-text-muted font-semibold">
                      {group.label}
                    </div>
                    <ul role="group" aria-label={group.label}>
                      {groupItems}
                    </ul>
                  </li>
                );
              })
            ) : (
              filteredFlat.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
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
      {errorMessage ? <ErrorText id={errorId}>{errorMessage}</ErrorText> : null}
    </div>
  );
}
