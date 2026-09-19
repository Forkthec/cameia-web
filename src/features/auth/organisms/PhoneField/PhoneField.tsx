/**
 * Celular internacional (CM-34, seguimiento): Figma (`73:449`) dibuja un
 * solo campo de texto libre con placeholder "+57 300 000 0000" y el helper
 * "Formato internacional, por ejemplo +57 300 000 0000" — **diferencia
 * consciente con Figma** (`CLAUDE.md` §16, aprobada explícitamente): se
 * reemplaza por un selector de país (`Select`, opciones de
 * `libphonenumber-js`) + el número nacional (`Input`), para que la persona
 * no tenga que escribir el indicativo a mano y el cliente pueda validar el
 * formato E.164 real antes de enviarlo. Por defecto Colombia (`CO`, +57) —
 * único mercado del producto hoy (`CLAUDE.md` §1); el selector permite
 * cambiarlo a cualquiera de los ~245 países que conoce la librería.
 *
 * Sin bandera: el design system no tiene assets de bandera por país
 * (`CLAUDE.md` §13, se revisó antes de inventar un set de íconos nuevo). El
 * nombre del país sale de `Intl.DisplayNames` (API nativa del navegador, ya
 * usada en el proyecto para fechas — `CLAUDE.md` §7), no de un catálogo de
 * nombres a mano ni de una dependencia nueva.
 *
 * Vive en `features/auth/organisms/`, no en `design-system/`: es su primer
 * y único consumidor (`CLAUDE.md` §4, "sube a design-system cuando lo usa
 * una segunda feature").
 *
 * Vacío (país por defecto + número vacío) es válido — CA-1.1.1 no exige
 * celular. Renderiza su propio label/helper/error para cada control: es un
 * control compuesto de dos partes, y `FormField.cloneElement` solo clona un
 * hijo, así que no puede envolver esto directamente.
 */
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';
import { useId, useMemo, type ChangeEvent, type FocusEvent } from 'react';
import { Input, type InputState } from '@/design-system/atoms/Input';
import { Select } from '@/design-system/atoms/Select';
import { ErrorText } from '@/design-system/atoms/ErrorText';
import { HelperText } from '@/design-system/atoms/HelperText';
import { Label } from '@/design-system/atoms/Label';

function useCountryOptions(): { value: string; label: string }[] {
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

interface PhoneFieldProps {
  paisLabel: string;
  paisValue: string;
  onPaisChange: (value: string) => void;
  numeroLabel: string;
  numeroValue: string;
  onNumeroChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onNumeroBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  numeroPlaceholder: string;
  helperText?: string;
  errorMessage?: string;
  state?: InputState;
  className?: string;
}

export function PhoneField({
  paisLabel,
  paisValue,
  onPaisChange,
  numeroLabel,
  numeroValue,
  onNumeroChange,
  onNumeroBlur,
  numeroPlaceholder,
  helperText,
  errorMessage,
  state = 'default',
  className,
}: PhoneFieldProps) {
  const countryOptions = useCountryOptions();
  const dialCode = getCountryCallingCode(paisValue as CountryCode);
  const isError = state === 'error';
  const paisId = useId();
  const numeroId = useId();

  return (
    <div className={className}>
      <div className="gap-space-3 flex items-start">
        <div className="gap-space-1 flex w-38 shrink-0 flex-col">
          <Label htmlFor={paisId}>{paisLabel}</Label>
          <Select
            id={paisId}
            options={countryOptions}
            value={paisValue}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onPaisChange(event.target.value)}
            placeholder={paisLabel}
            state={state === 'error' ? 'default' : state}
          />
        </div>
        <div className="gap-space-1 flex flex-1 flex-col">
          <Label htmlFor={numeroId}>{numeroLabel}</Label>
          <Input
            id={numeroId}
            type="text"
            inputMode="numeric"
            autoComplete="tel-national"
            value={numeroValue}
            onChange={onNumeroChange}
            onBlur={onNumeroBlur}
            placeholder={`+${dialCode} ${numeroPlaceholder}`}
            state={state}
          />
        </div>
      </div>
      {isError && errorMessage ? (
        <ErrorText>{errorMessage}</ErrorText>
      ) : helperText ? (
        <HelperText>{helperText}</HelperText>
      ) : null}
    </div>
  );
}
