/**
 * Campo de mes y año (CM-273, PR 1; `SPEC.md` §3.3 y D-K, D-N, D-O). Tiene dos partes: una entrada de texto
 * con máscara «mm/aaaa» —el átomo `Input`, sin modificarlo— y un panel flotante con las flechas de año y una
 * rejilla de 12 meses, sin días. No existe en Figma: el aspecto sale de los tokens y de `Combobox`.
 *
 * Entrega al formulario el TEXTO de la máscara, sin validarlo (D-K): validar «mm/aaaa» y transformar a
 * «AAAA-MM» es del esquema de Zod. Por eso deja teclear un mes futuro o «13/2024»; el panel, en cambio, no
 * deja elegir un mes posterior al mes actual (`currentMonth`) y llega hasta 110 años atrás (D-N).
 *
 * Patrón de `MenuUsuario`: el disparador es un `<button type="button">` con `aria-expanded` y
 * `aria-controls`; el panel es `role="dialog"`; `Escape` lo cierra devolviendo el foco al disparador, y
 * también se cierra cuando el foco sale del contenedor. Al elegir un mes el foco vuelve al disparador, porque
 * el botón del mes desaparece con el panel.
 *
 * Sin `useTranslation` (`CLAUDE.md` §14.7): todo texto entra por props. Los nombres de los meses salen de
 * `Intl` sobre `locale` (`CLAUDE.md` §7). `id` y `describedBy` los inyecta `FormField`.
 */
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type Ref } from 'react';
import { cn } from '@/utils/cn';
import { formatMonthValue, maskMonthInput, parseMonthText } from '@/utils/monthMask';
import { Input } from '../../atoms/Input';
import { Icon } from '../../icons/Icon';

/** Años hacia atrás que ofrece el panel desde el año actual (D-N). */
const YEARS_BACK = 110;
const MONTHS_PER_YEAR = 12;
const MONTH_INDEXES = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => index);

// Como en `Combobox`: sin esto, en Safari (que no enfoca un botón al hacer clic) el foco sale del
// contenedor y el blur cierra el panel antes de registrar el clic. Se usa en los meses y en las flechas de
// año; la acción sigue en `onClick`, no en `onMouseDown`, para que Enter y Espacio también funcionen.
function keepFocus(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

interface MonthFieldProps {
  /** Texto de la máscara «mm/aaaa»; cadena vacía si no hay nada escrito. */
  value: string;
  /** Recibe el texto ya enmascarado, sin validar. */
  onChange: (text: string) => void;
  onBlur?: () => void;
  id?: string;
  /** Id externo (p. ej. de FormField) del mensaje asociado al campo. */
  describedBy?: string;
  state?: 'default' | 'error' | 'disabled';
  /** Marcador de posición del campo de texto, ej. «mm/aaaa». */
  placeholder: string;
  /** Mes actual en UTC como «AAAA-MM»: define el último año y los meses apagados del panel. */
  currentMonth: string;
  /** Locale BCP-47 con el que se escriben los nombres de los meses. */
  locale: string;
  /** Nombre accesible del disparador del panel. */
  openPanelLabel: string;
  /** Nombre accesible del panel (`role="dialog"`). */
  panelLabel: string;
  previousYearLabel: string;
  nextYearLabel: string;
  /** Referencia al `<input>` de texto, para el foco automático al primer error. */
  ref?: Ref<HTMLInputElement>;
}

export function MonthField({
  value,
  onChange,
  onBlur,
  id,
  describedBy,
  state = 'default',
  placeholder,
  currentMonth,
  locale,
  openPanelLabel,
  panelLabel,
  previousYearLabel,
  nextYearLabel,
  ref,
}: MonthFieldProps) {
  const currentYear = Number(currentMonth.slice(0, 4));
  const currentMonthNumber = Number(currentMonth.slice(5, 7));
  const oldestYear = currentYear - YEARS_BACK;

  const [isOpen, setIsOpen] = useState(false);
  const [shownYear, setShownYear] = useState(currentYear);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const isDisabled = state === 'disabled';

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function togglePanel() {
    if (!isOpen) {
      const parsed = parseMonthText(value);
      const valueYear = parsed ? Number(parsed.slice(0, 4)) : currentYear;
      const isInRange = valueYear >= oldestYear && valueYear <= currentYear;
      setShownYear(isInRange ? valueYear : currentYear);
    }
    setIsOpen((current) => !current);
  }

  function selectMonth(monthIndex: number) {
    onChange(formatMonthValue(`${shownYear}-${String(monthIndex + 1).padStart(2, '0')}`));
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  const months = useMemo(() => {
    const longFormat = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
    const shortFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });

    return MONTH_INDEXES.map((monthIndex) => {
      const date = new Date(Date.UTC(2000, monthIndex, 1));
      return { monthIndex, longName: longFormat.format(date), shortName: shortFormat.format(date) };
    });
  }, [locale]);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        state={state}
        describedBy={describedBy}
        className="pr-touch-target"
        onChange={(event) => onChange(maskMonthInput(event.target.value))}
        onBlur={() => onBlur?.()}
      />
      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={openPanelLabel}
        onClick={togglePanel}
        className="text-text-muted focus-visible:shadow-focus-ring min-h-touch-target min-w-touch-target disabled:text-text-disabled absolute top-0 right-0 flex cursor-pointer items-center justify-center rounded-md focus-visible:outline-none disabled:cursor-not-allowed"
      >
        <Icon name="chevron-down" size={20} />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={panelLabel}
          className="border-border-subtle bg-bg-surface p-space-3 shadow-elevation-2 gap-space-3 absolute top-full right-0 z-10 mt-1 flex w-72 flex-col rounded-md border"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={shownYear <= oldestYear}
              aria-label={previousYearLabel}
              onMouseDown={keepFocus}
              onClick={() => setShownYear((year) => year - 1)}
              className="text-text-primary hover:bg-bg-surface-sunken focus-visible:shadow-focus-ring min-h-touch-target min-w-touch-target disabled:text-text-disabled flex cursor-pointer items-center justify-center rounded-md focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <span aria-live="polite" className="text-body text-text-primary font-medium">
              {shownYear}
            </span>
            <button
              type="button"
              disabled={shownYear >= currentYear}
              aria-label={nextYearLabel}
              onMouseDown={keepFocus}
              onClick={() => setShownYear((year) => year + 1)}
              className="text-text-primary hover:bg-bg-surface-sunken focus-visible:shadow-focus-ring min-h-touch-target min-w-touch-target disabled:text-text-disabled flex cursor-pointer items-center justify-center rounded-md focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
          <div className="gap-space-2 grid grid-cols-3">
            {months.map(({ monthIndex, longName, shortName }) => {
              return (
                <button
                  key={monthIndex}
                  type="button"
                  disabled={shownYear === currentYear && monthIndex + 1 > currentMonthNumber}
                  aria-label={longName}
                  onMouseDown={keepFocus}
                  onClick={() => selectMonth(monthIndex)}
                  className={cn(
                    'min-h-touch-target px-space-2 text-body text-text-primary cursor-pointer rounded-md capitalize',
                    'hover:bg-brand-tint focus-visible:shadow-focus-ring focus-visible:outline-none',
                    'disabled:text-text-disabled disabled:cursor-not-allowed disabled:hover:bg-transparent',
                  )}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
